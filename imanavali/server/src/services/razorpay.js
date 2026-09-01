const crypto = require('crypto');
const Razorpay = require('razorpay');
const config = require('../config/env');

function getClient() {
  return new Razorpay({
    key_id: config.razorpayKey,
    key_secret: config.razorpaySecret,
  });
}

async function createOrder(amountInr, receipt) {
  const client = getClient();
  const order = await client.orders.create({
    amount: Math.round(amountInr * 100),
    currency: 'INR',
    receipt: `rcpt_${receipt}`,
    payment_capture: 1,
  });
  return order;
}

function verifySignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', config.razorpaySecret)
    .update(body)
    .digest('hex');
  return expected === signature;
}

module.exports = { createOrder, verifySignature, getClient };
