const nodemailer = require('nodemailer');
const config = require('../config/env');

function createTransport() {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
}

async function sendContactEmail({ name, email, message }) {
  const transport = createTransport();
  await transport.sendMail({
    from: config.smtp.user,
    to: config.contactTo,
    subject: 'New Contact Form Message',
    text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
  });
}

module.exports = { sendContactEmail };
