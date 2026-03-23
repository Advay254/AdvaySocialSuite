/**
 * License enforcement middleware — no cache, instant lock/unlock.
 * Checks the license worker on every request (fast — CF global edge).
 * Reports actual lock status back to the worker after each check.
 * Owner bypass: set OWNER=1 on your own Render deployment.
 */

const { getPool } = require('../db/init');
const crypto = require('crypto');

const _c = Buffer.from('aHR0cHM6Ly9zdWl0ZS1sYy5jaHVyY2hpbGxtd2VnaS53b3JrZXJzLmRldg==', 'base64').toString();
const _p = Buffer.from('aHR0cHM6Ly9wYXlzdGFjay5zaG9wL3BheS9hZHZheXNvY2lhbHN1aXRl', 'base64').toString();

// ── Generate raw key ──────────────────────────────────────────────────────────
function genRawKey() {
  const a = crypto.randomBytes(24).toString('hex');
  const b = Date.now().toString(36);
  const c = crypto.randomBytes(8).toString('hex');
  return `${a}${b}${c}`.slice(0, 64);
}

// ── Call license worker ───────────────────────────────────────────────────────
async function callWorker(endpoint, body) {
  try {
    const res = await fetch(`${_c}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // fail open — worker unreachable
  }
}

// ── Fire-and-forget status report back to worker ──────────────────────────────
function reportStatus(rk, locked) {
  // Non-blocking — never delays the response
  callWorker('/api/status', { k: rk, locked }).catch(() => {});
}

// ── Get or create keys in DB ──────────────────────────────────────────────────
async function getOrInitKeys() {
  const db = getPool();
  let { rows: rkRows } = await db.query("SELECT value FROM site_settings WHERE key='_rk'");
  let rk = rkRows[0]?.value;
  if (!rk) {
    rk = genRawKey();
    await db.query(
      "INSERT INTO site_settings (key,value) VALUES ('_rk',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [rk]
    );
  }
  let { rows: pidRows } = await db.query("SELECT value FROM site_settings WHERE key='_pid'");
  let pid = pidRows[0]?.value;
  let { rows: purlRows } = await db.query("SELECT value FROM site_settings WHERE key='_purl'");
  let payUrl = purlRows[0]?.value || _p;
  return { rk, pid, payUrl };
}

async function savePID(pid, payUrl) {
  const db = getPool();
  await db.query(
    "INSERT INTO site_settings (key,value) VALUES ('_pid',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [pid]
  );
  if (payUrl) {
    await db.query(
      "INSERT INTO site_settings (key,value) VALUES ('_purl',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [payUrl]
    );
  }
}

// ── Check license — no cache, checks worker every time ───────────────────────
async function checkLicense() {
  const { rk, pid, payUrl } = await getOrInitKeys();

  if (!pid) {
    // First boot — register with worker
    const reg = await callWorker('/api/r', { k: rk });
    if (reg && reg.p) {
      await savePID(reg.p, reg.pay_url);
      reportStatus(rk, reg.s !== 1);
      return { licensed: reg.s === 1, pid: reg.p, payUrl: reg.pay_url || payUrl };
    }
    // Worker unreachable on first boot → fail open
    return { licensed: true, pid: null, payUrl };
  }

  const check = await callWorker('/api/c', { k: rk });
  if (check === null) {
    // Worker unreachable → fail open
    return { licensed: true, pid, payUrl };
  }

  const licensed = check.s === 1;
  const activePayUrl = check.pay_url || payUrl;

  // Report actual status back — fire and forget
  reportStatus(rk, !licensed);

  // Update stored pay_url if worker returned a different one
  if (check.pay_url && check.pay_url !== payUrl) await savePID(pid, check.pay_url);

  return { licensed, pid, payUrl: activePayUrl };
}

// ── Lock screen HTML ──────────────────────────────────────────────────────────
function lockHTML(pid, payUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Activate Your Site</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--c:#00e5ff;--v:#8b5cf6;--bg:#050813}
body{background:var(--bg);color:#e8edf8;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.orb{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;}
.orb1{width:400px;height:400px;background:rgba(139,92,246,.15);top:-100px;right:-100px;}
.orb2{width:300px;height:300px;background:rgba(0,229,255,.1);bottom:-50px;left:-80px;}
.box{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:40px 36px;width:100%;max-width:420px;position:relative;z-index:10;text-align:center;}
.lock-icon{font-size:48px;margin-bottom:20px;}
h1{font-size:1.5rem;font-weight:800;color:#fff;margin-bottom:8px;}
.sub{color:rgba(255,255,255,.45);font-size:14px;line-height:1.6;margin-bottom:28px;}
.price-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:#10b981;padding:8px 18px;border-radius:999px;font-size:15px;font-weight:700;margin-bottom:28px;}
.pid-block{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;margin-bottom:24px;}
.pid-label{font-size:11px;color:#7a8499;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;}
.pid-row{display:flex;align-items:center;justify-content:center;gap:10px;}
.pid-val{font-family:'Courier New',monospace;font-size:22px;font-weight:800;letter-spacing:4px;color:var(--c);}
.copy-btn{background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.25);color:var(--c);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}
.copy-btn:hover{background:rgba(0,229,255,.2);}
.copy-btn.copied{background:rgba(16,185,129,.15);border-color:rgba(16,185,129,.3);color:#10b981;}
.pid-hint{font-size:11px;color:#7a8499;margin-top:8px;line-height:1.5;}
.pay-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:linear-gradient(135deg,var(--v),var(--c));border:none;border-radius:14px;padding:14px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;margin-bottom:12px;transition:all .2s;}
.pay-btn:hover{filter:brightness(1.08);transform:translateY(-1px);}
.status-row{display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;color:#7a8499;margin-top:16px;}
.dot{width:7px;height:7px;border-radius:50%;background:#f59e0b;animation:pulse 1.5s ease infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
</style>
</head>
<body>
<div class="orb orb1"></div>
<div class="orb orb2"></div>
<div class="box">
  <div class="lock-icon">🔒</div>
  <h1>Activate Your Site</h1>
  <p class="sub">This deployment requires a one-time payment to unlock. Your site activates instantly after payment.</p>
  <div class="price-badge">💳 One-time · $19 USD</div>

  <div class="pid-block">
    <div class="pid-label">Your Payment ID</div>
    <div class="pid-row">
      <span class="pid-val">${pid || '———'}</span>
      <button class="copy-btn" id="copy-btn" onclick="copyPID()">Copy</button>
    </div>
    <p class="pid-hint">Copy this ID → open the payment page → paste it in the <strong style="color:#e8edf8;">"Paste your Payment ID"</strong> field → complete payment.</p>
  </div>

  <a href="${payUrl}" target="_blank" rel="noopener" class="pay-btn">
    💳 Pay $19 to Activate
  </a>

  <div class="status-row">
    <div class="dot"></div>
    <span>Waiting for payment confirmation...</span>
  </div>
</div>

<script>
const PID = '${pid || ''}';
function copyPID() {
  if (!PID) return;
  navigator.clipboard.writeText(PID).catch(() => {
    const el = document.createElement('textarea');
    el.value = PID; document.body.appendChild(el);
    el.select(); document.execCommand('copy');
    document.body.removeChild(el);
  });
  const btn = document.getElementById('copy-btn');
  btn.textContent = 'Copied!'; btn.classList.add('copied');
  setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
}
async function poll() {
  try {
    const r = await fetch('/api/_', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
    if (r.ok) { const d = await r.json(); if (d.s === 1) { setTimeout(() => location.reload(), 800); return; } }
  } catch {}
  setTimeout(poll, 5000);
}
setTimeout(poll, 5000);
</script>
</body>
</html>`;
}

// ── Middleware ────────────────────────────────────────────────────────────────
async function licenseMiddleware(req, res, next) {
  if (req.path === '/health' || req.path === '/api/_') return next();
  if (process.env.OWNER === '1') return next();

  try {
    const { licensed, pid, payUrl } = await checkLicense();
    if (licensed) return next();
    return res.status(402).send(lockHTML(pid || '', payUrl));
  } catch {
    return next(); // fail open on any unexpected error
  }
}

// ── Poll endpoint (called by lock screen every 5 seconds) ─────────────────────
async function licenseStatusEndpoint(req, res) {
  try {
    const { licensed } = await checkLicense();
    return res.json({ s: licensed ? 1 : 0 });
  } catch {
    return res.json({ s: 0 });
  }
}

module.exports = { licenseMiddleware, licenseStatusEndpoint };
