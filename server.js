require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db/init');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const chatRoute = require('./routes/chat');
const { licenseMiddleware, licenseStatusEndpoint } = require('./middleware/licenseCheck');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PATH = (process.env.ADMIN_PATH || 'secret-panel').replace(/^\//, '');

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ─── License check — runs before everything ───────────────────────────────────
// Skipped automatically if LC_URL env var is not set
app.use(licenseMiddleware);

// ─── Local license poll endpoint (called by lock screen) ──────────────────────
// Rate limited: 10 req/min per IP to prevent abuse
const pollLimit = rateLimit({ windowMs: 60 * 1000, max: 10, message: { s: 0 } });
app.post('/api/_', pollLimit, licenseStatusEndpoint);

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Health Endpoint ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AdvaySocialSuite',
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

app.post('/api/admin/auth/login', loginLimit, (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoute);

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path === `/${ADMIN_PATH}`) return;
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
