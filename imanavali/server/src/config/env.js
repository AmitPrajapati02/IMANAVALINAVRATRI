const path = require('path');
const dotenv = require('dotenv');

// Load imanavali/.env locally; on Render secrets come from Environment Variables.
const envPath = path.resolve(__dirname, '../../..', '.env');
dotenv.config({ path: envPath, override: false });

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  razorpayKey: process.env.RAZORPAY_KEY || '',
  razorpaySecret: process.env.RAZORPAY_SECRET || '',
  sessionSecret: process.env.ADMIN_SESSION_SECRET || 'dev-secret-change-me',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  smtp: {
    host: process.env.SMTP_HOST || 'webmail.imanavlinavratri.in',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || 'donotreply@imanavlinavratri.in',
    pass: process.env.SMTP_PASS || '',
  },
  contactTo: process.env.CONTACT_TO || 'imanavlinavratri@gmail.com',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  envPath,
};
