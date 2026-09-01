const jwt = require('jsonwebtoken');
const config = require('../config/env');

const REG_COOKIE = 'reg_session';
const ADMIN_COOKIE = 'admin_session';

const isProd = config.nodeEnv === 'production';

function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}

function signRegSession(payload) {
  return jwt.sign(payload, config.sessionSecret, { expiresIn: '30m' });
}

function signAdminSession(payload) {
  return jwt.sign(payload, config.sessionSecret, { expiresIn: '8h' });
}

function verifyToken(token) {
  return jwt.verify(token, config.sessionSecret);
}

function setRegSession(res, payload) {
  const token = signRegSession(payload);
  res.cookie(REG_COOKIE, token, cookieOptions(30 * 60 * 1000));
}

function setAdminSession(res, payload) {
  const token = signAdminSession(payload);
  res.cookie(ADMIN_COOKIE, token, cookieOptions(8 * 60 * 60 * 1000));
}

function clearRegSession(res) {
  res.clearCookie(REG_COOKIE, { path: '/' });
}

function clearAdminSession(res) {
  res.clearCookie(ADMIN_COOKIE, { path: '/' });
}

function getRegSession(req) {
  const token = req.cookies?.[REG_COOKIE];
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

function requireRegSession(req, res, next) {
  const session = getRegSession(req);
  if (!session?.mobile) {
    return res.status(401).json({ error: 'Registration session expired. Please start again.' });
  }
  req.regSession = session;
  next();
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyToken(token);
    if (!payload.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
    req.adminSession = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
}

module.exports = {
  REG_COOKIE,
  ADMIN_COOKIE,
  setRegSession,
  setAdminSession,
  clearRegSession,
  clearAdminSession,
  getRegSession,
  requireRegSession,
  requireAdmin,
};
