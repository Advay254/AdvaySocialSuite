require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { initDB, getPool } = require('./db/init');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const chatRoute = require('./routes/chat');
const { licenseMiddleware, licenseStatusEndpoint } = require('./middleware/licenseCheck');
const { version: APP_VERSION } = require('./package.json');
const { corsPolicy } = require('./middleware/corsPolicy');
const { createSecurity } = require('./middleware/security');
const compress = require('./middleware/compress');
const limiters = require('./middleware/limiters');
const { requestId, notFoundApi, errorHandler } = require('./middleware/errorHandler');
const { login: adminLogin } = require('./middleware/adminLogin');
const { createShell, NOT_APP } = require('./lib/shell');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3000;
const ADMIN_PATH = (process.env.ADMIN_PATH || 'secret-panel').replace(/^\//, '');

app.set('trust proxy', 1);
app.use(corsPolicy());
app.use(express.json({ limit: '1mb' }));

// ─── License check - runs before everything ───────────────────────────────────
// Skipped automatically if LC_URL env var is not set
app.use(licenseMiddleware);

// ─── Local license poll endpoint (called by lock screen) ──────────────────────
// Rate limited: 10 req/min per IP to prevent abuse
const pollLimit = rateLimit({ windowMs: 60 * 1000, max: 10, message: { s: 0 } });
app.post('/api/_', pollLimit, licenseStatusEndpoint);

// ─── Security, compression, cache rules and request limits ─────────────────────
app.use(requestId);
app.use(compress());
app.use(...createSecurity({ adminPath: ADMIN_PATH, adminHtmlFile: path.join(__dirname, 'views', 'admin.html') }));

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Health Endpoint ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AdvaySocialSuite',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── Admin Panel (served at secret path) ──────────────────────────────────────
app.get(`/${ADMIN_PATH}`, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// ─── Admin Auth ───────────────────────────────────────────────────────────────
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again later.' },
});

app.post('/api/admin/auth/login', loginLimit, (req, res, next) => adminLogin(req, res).catch(next));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', limiters.publicMount, publicRoutes);
app.use('/api/admin', limiters.admin, adminRoutes);
app.use('/api/chat', chatRoute);
app.use('/api', notFoundApi);

// ─── Search engine files ──────────────────────────────────────────────────────
const shell = createShell({ templateFile: path.join(__dirname, 'views', 'app.html'), publicDir: path.join(__dirname, 'public'), getDb: getPool });

app.get('/sitemap.xml', async (req, res, next) => {
  try { res.type('application/xml').set('Cache-Control', 'no-cache').send(await shell.sitemap(req)); } catch (err) { next(err); }
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'no-cache').send(shell.robots(req));
});

// ─── App shell for every page address ─────────────────────────────────────────
// Every page of the site is the same HTML file with the active theme, title and description filled in
// for this request. It is never cached. Files and API paths never get the shell, a missing file is a 404.
app.get('*', async (req, res, next) => {
  const p = req.path;
  if (p === `/${ADMIN_PATH}` || p.startsWith(`/${ADMIN_PATH}/`)) return next();
  if (NOT_APP.test(p) || /\.[A-Za-z0-9]{1,8}$/.test(p)) return res.status(404).type('text/plain').send('Not found');
  let out;
  try { out = await shell.render(req, Date.now()); }
  catch (err) {
    // The page still opens when the database is unreachable: the site script shows its own error state.
    console.error(`[${req.id}] page shell rendered without settings:`, err && err.message);
    try { out = await shell.render(req, Date.now(), { map: {}, profile: null }); } catch (e2) { return next(e2); }
  }
  res.status(out.status).set({ 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=utf-8' }).send(out.html);
});

// ─── Errors: one handler, nothing internal is ever sent to a client ───────────
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  ╔══════════════════════════════════════╗`);
      console.log(`  ║   AdvaySocialSuite  ·  Port ${PORT}     ║`);
      console.log(`  ║   Admin path: /${ADMIN_PATH.padEnd(22)}║`);
      console.log(`  ╚══════════════════════════════════════╝\n`);
    });
  })
  .catch(err => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
