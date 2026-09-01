const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const { ensureDirs } = require('./services/upload');
const { insertErrorLog } = require('./services/db');

const homeRoutes = require('./routes/home.routes');
const accountRoutes = require('./routes/account.routes');
const paymentRoutes = require('./routes/payment.routes');
const registerRoutes = require('./routes/register.routes');
const playerRoutes = require('./routes/player.routes');
const adminRoutes = require('./routes/admin.routes');

ensureDirs();

const app = express();

if (!config.databaseUrl) {
  console.error('ERROR: DATABASE_URL is not set. Expected .env at:', config.envPath);
} else {
  console.log('Database configured (server:', config.databaseUrl.split(';')[0], ')');
}

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(config.uploadDir)));
app.use('/Uploads', express.static(path.join(config.uploadDir)));

app.use('/api/home', homeRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use(async (err, req, res, next) => {
  await insertErrorLog(err.message, err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const clientDist = path.join(__dirname, '../../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api)(?!\/uploads)(?!\/Uploads).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`IMA Navratri API running on port ${config.port}`);
});

module.exports = app;
