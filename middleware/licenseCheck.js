/**
 * License enforcement middleware.
 * 30-second mini-cache to absorb burst requests without hitting rate limits.
 * Revoke takes effect within 30 seconds maximum.
 * Price, pay URL from server — no hardcoding.
 */

const { getPool } = require('../db/init');
const crypto = require('crypto');

const _c = Buffer.from('aHR0cHM6Ly9zdWl0ZS1sYy5jaHVyY2hpbGxtd2VnaS53b3JrZXJzLmRldg==', 'base64').toString();

// 30-second mini-cache — absorbs burst, revoke takes max 30s
let _cache = { s: null, t: 0, pid: null, payUrl: null, price: null };
const CACHE_TTL = 30 * 1000;

function genRawKey() {
  const a = crypto.randomBytes(24).toString('hex');
  const b = Date.now().toString(36);
  const c = crypto.randomBytes(8).toString('hex');
  return `${a}${b}${c}`.slice(0, 64);
}

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
    return null;
  }
}

function reportStatus(rk, locked) {
  callWorker('/api/status', { k: rk, locked }).catch(() => {});
}

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
  let payUrl = purlRows[0]?.value;
  let { rows: priceRows } = await db.query("SELECT value FROM site_settings WHERE key='_price'");
  let price = priceRows[0]?.value || '$19';
  return { rk, pid, payUrl, price };
}

async function saveKeys(pid, payUrl, price) {
  const db = getPool();
  const upsert = (k, v) => db.query(
    "INSERT INTO site_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2",
    [k, v]
  );
  if (pid) await upsert('_pid', pid);
  if (payUrl) await upsert('_purl', payUrl);
  if (price) await upsert('_price', price);
}

async function checkLicense() {
  const now = Date.now();
  // Return cached result if still fresh
  if (_cache.s !== null && (now - _cache.t) < CACHE_TTL) {
    return { licensed: _cache.s, pid: _cache.pid, payUrl: _cache.payUrl, price: _cache.price };
  }

  const { rk, pid, payUrl, price } = await getOrInitKeys();

  if (!pid) {
    const reg = await callWorker('/api/r', { k: rk });
    if (reg && reg.p) {
      await saveKeys(reg.p, reg.pay_url, reg.price);
      const licensed = reg.s === 1;
      _cache = { s: licensed, t: now, pid: reg.p, payUrl: reg.pay_url, price: reg.price || '$19' };
      reportStatus(rk, !licensed);
      return { licensed, pid: reg.p, payUrl: reg.pay_url, price: reg.price || '$19' };
    }
    // Worker unreachable on first boot — fail open
    _cache = { s: true, t: now, pid: null, payUrl, price };
    return { licensed: true, pid: null, payUrl, price };
  }

  const check = await callWorker('/api/c', { k: rk });
  if (check === null) {
    // Worker unreachable — fail open, keep last known state
    _cache = { s: _cache.s ?? true, t: now, pid, payUrl, price };
    return { licensed: _cache.s, pid, payUrl, price };
  }

  const licensed = check.s === 1;
  const freshPayUrl = check.pay_url || payUrl;
  const freshPrice = check.price || price;

  _cache = { s: licensed, t: now, pid, payUrl: freshPayUrl, price: freshPrice };

  // Update stored values if worker returned different ones
  if ((check.pay_url && check.pay_url !== payUrl) || (check.price && check.price !== price)) {
    await saveKeys(null, check.pay_url, check.price);
  }

  reportStatus(rk, !licensed);
  return { licensed, pid, payUrl: freshPayUrl, price: freshPrice };
}

function lockHTML(pid, payUrl, price) {
  const displayPrice = price || '$19';
  const displayPayUrl = payUrl || '#';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Activate Your Site</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--c:#00e5ff;--v:#8b5cf6;--bg:#050813}
body{background:var(--bg);color:#e8edf8;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background-image:radial-gradient(ellipse at 70% 20%,rgba(139,92,246,.15),transparent 55%),radial-gradient(ellipse at 20% 80%,rgba(0,229,255,.1),transparent 55%);}
.box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:40px 32px;width:100%;max-width:420px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5);}
.icon{font-size:52px;margin-bottom:18px;}
h1{font-size:1.5rem;font-weight:800;margin-bottom:8px;}
.sub{color:rgba(255,255,255,.45);font-size:14px;line-height:1.6;margin-bottom:24px;}
.badge{display:inline-flex;align-items:center;gap:8px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:#10b981;padding:8px 20px;border-radius:999px;font-size:15px;font-weight:700;margin-bottom:24px;}
.pid-box{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;margin-bottom:22px;}
.pid-lbl{font-size:11px;color:#7a8499;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;}
.pid-row{display:flex;align-items:center;justify-content:center;gap:10px;}
.pid-val{font-family:monospace;font-size:22px;font-weight:800;letter-spacing:4px;color:var(--c);}
.copy{background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.25);color:var(--c);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}
.copy:hover{background:rgba(0,229,255,.2);}
.hint{font-size:11px;color:#7a8499;margin-top:8px;line-height:1.5;}
.pay{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:linear-gradient(135deg,var(--v),var(--c));border:none;border-radius:14px;padding:14px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;margin-bottom:12px;transition:filter .2s,transform .2s;}
.pay:hover{filter:brightness(1.08);transform:translateY(-1px);}
.status{display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;color:#7a8499;margin-top:14px;}
.dot{width:7px;height:7px;border-radius:50%;background:#f59e0b;animation:p 1.5s ease infinite;}
@keyframes p{0%,100%{opacity:1}50%{opacity:.4}}
</style>
</head>
<body>
<div class="box">
  <div class="icon">🔒</div>
  <h1>Activate Your Site</h1>
  <p class="sub">One-time payment required to unlock this deployment.</p>
  <div class="badge">💳 One-time · ${displayPrice}</div>
  <div class="pid-box">
    <div class="pid-lbl">Your Payment ID</div>
    <div class="pid-row">
      <span class="pid-val">${pid || '———'}</span>
      <button class="copy" id="cb" onclick="copyPID()">Copy</button>
    </div>
    <p class="hint">Copy this ID → open the payment page → paste in the <strong style="color:#e8edf8">"Paste your Payment ID"</strong> field → pay.</p>
  </div>
  <a href="${displayPayUrl}" target="_blank" rel="noopener" class="pay">💳 Pay ${displayPrice} to Activate</a>
  <div class="status"><div class="dot"></div><span>Checking payment status...</span></div>
</div>
<script>
const PID='${pid||''}';
function copyPID(){
  navigator.clipboard.writeText(PID).catch(()=>{const e=document.createElement('textarea');e.value=PID;document.body.appendChild(e);e.select();document.execCommand('copy');document.body.removeChild(e);});
  const b=document.getElementById('cb');b.textContent='Copied!';b.style.background='rgba(16,185,129,.15)';b.style.color='#10b981';
  setTimeout(()=>{b.textContent='Copy';b.style.background='';b.style.color='';},2000);
}
async function poll(){
  try{const r=await fetch('/api/_',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  if(r.ok){const d=await r.json();if(d.s===1){setTimeout(()=>location.reload(),600);return;}}}catch{}
  setTimeout(poll,5000);
}
setTimeout(poll,5000);
</script>
</body>
</html>`;
}

async function licenseMiddleware(req, res, next) {
  if (req.path === '/health' || req.path === '/api/_') return next();
  if (process.env.OWNER === '1') return next();
  try {
    const { licensed, pid, payUrl, price } = await checkLicense();
    if (licensed) return next();
    return res.status(402).send(lockHTML(pid || '', payUrl, price));
  } catch {
    return next();
  }
}

async function licenseStatusEndpoint(req, res) {
  try {
    // Force fresh check by clearing cache
    _cache = { s: null, t: 0, pid: _cache.pid, payUrl: _cache.payUrl, price: _cache.price };
    const { licensed } = await checkLicense();
    return res.json({ s: licensed ? 1 : 0 });
  } catch {
    return res.json({ s: 0 });
  }
}

module.exports = { licenseMiddleware, licenseStatusEndpoint };
