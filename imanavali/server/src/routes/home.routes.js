const express = require('express');
const { setRegSession, clearRegSession } = require('../middleware/auth');
const { getBookNowSession } = require('../services/fees');
const { sendContactEmail } = require('../services/mail');
const { insertErrorLog } = require('../services/db');

const router = express.Router();

router.post('/book-now', (req, res) => {
  const { mobile, type } = req.body;
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Valid 10-digit mobile required.' });
  }
  const session = getBookNowSession(type);
  if (!session) return res.status(400).json({ error: 'Invalid player type.' });
  setRegSession(res, { mobile, passType: session.passType, price: session.price });
  res.json({ success: true, redirect: '/account/register' });
});

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ status: 'All fields are required.' });
  }
  try {
    await sendContactEmail({ name, email, message });
    res.json({ status: '✅ Your message has been sent successfully!' });
  } catch (err) {
    await insertErrorLog(err.message, err.stack);
    res.status(500).json({ status: `❌ Error sending message: ${err.message}` });
  }
});

module.exports = router;
