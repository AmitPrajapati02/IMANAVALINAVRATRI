/**
 * E2E capture: IMA Member + 1 Male Donor fee flow.
 * Run: node server/src/tests/e2e-ima-donor-fee-run.js
 */
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../services/db');

const BASE = process.env.API_BASE || 'http://localhost:3001/api';
const mobile = `9${String(Date.now()).slice(-9)}`;

// Minimal valid 1x1 JPEG
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  'base64'
);

let cookieJar = '';

function captureCookies(res) {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return;
  const parts = setCookie.map((c) => c.split(';')[0]);
  const map = new Map();
  if (cookieJar) {
    cookieJar.split('; ').forEach((p) => {
      const [k, v] = p.split('=');
      if (k) map.set(k, v);
    });
  }
  parts.forEach((p) => {
    const [k, v] = p.split('=');
    if (k) map.set(k, v);
  });
  cookieJar = [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

const client = axios.create({
  baseURL: BASE,
  validateStatus: () => true,
});

client.interceptors.response.use((res) => {
  captureCookies(res);
  return res;
});

client.interceptors.request.use((config) => {
  if (cookieJar) config.headers.Cookie = cookieJar;
  return config;
});

function imaRegistrationFee(playerType) {
  const t = (playerType || '').trim();
  if (t.startsWith('Female')) return 400;
  if (t.startsWith('Male')) return 500;
  return 0;
}

async function main() {
  const out = { mobile };

  // Book-now FS (IMA Member flow entry)
  const book = await client.post('/home/book-now', { mobile, type: 'FS' });
  out.bookNowStatus = book.status;
  out.bookNowBody = book.data;

  const areas = await client.get('/account/areas');
  const areaId = areas.data?.[0]?.AreaId;
  if (!areaId) throw new Error('No areas returned from API');

  const fd = new FormData();
  fd.append('firstName', 'Test');
  fd.append('lastName', 'DonorFee');
  fd.append('mobileNo', mobile);
  fd.append('emailAddress', `test${Date.now()}@example.com`);
  fd.append('dob', '2010-01-15');
  fd.append('areaId', String(areaId));
  fd.append('pincode', '390001');
  fd.append('address', 'E2E test address');
  fd.append('playerType', 'Male IMA Member');
  fd.append('feeAmount', String(imaRegistrationFee('Male IMA Member')));
  fd.append('paymentOption', 'Online');
  fd.append('referral', '');
  fd.append('agreeTerms', 'true');
  fd.append('donorCount', '1');
  fd.append('donorFirstName0', 'Donor');
  fd.append('donorLastName0', 'One');
  fd.append('donorDob0', '2012-03-20');
  fd.append('donorPlayerType0', 'Male Donor Player');
  fd.append('photo', JPEG, { filename: 'photo.jpg', contentType: 'image/jpeg' });
  fd.append('idProof', JPEG, { filename: 'id.jpg', contentType: 'image/jpeg' });
  fd.append('donorPhoto0', JPEG, { filename: 'donor-photo.jpg', contentType: 'image/jpeg' });
  fd.append('donorIdProof0', JPEG, { filename: 'donor-id.jpg', contentType: 'image/jpeg' });

  out.clientTotalFee = imaRegistrationFee('Male IMA Member') + imaRegistrationFee('Male Donor Player');

  const reg = await client.post('/account/register', fd, { headers: fd.getHeaders() });
  out.registerStatus = reg.status;
  out.registerResponse = reg.data;

  if (reg.status !== 200 || !reg.data?.playerId) {
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const { playerId, tempNo, fee } = reg.data;

  const pay = await client.get('/payment/payment', {
    params: { id: playerId, tempNo, fee },
  });
  out.paymentStatus = pay.status;
  out.paymentResponse = pay.data;

  const regSessionRaw = (cookieJar.match(/reg_session=([^;]+)/) || [])[1];
  out.reg_session_cookie_value = regSessionRaw || null;
  if (regSessionRaw) {
    try {
      out.reg_session_decoded = jwt.decode(regSessionRaw);
    } catch (e) {
      out.reg_session_decode_error = e.message;
    }
  }

  // SQL by PlayerIds from bundle
  const bundle = out.reg_session_decoded?.bundlePayments || [];
  const playerIds = bundle.map((b) => b.playerId).filter(Boolean);
  if (playerIds.length) {
    const pool = await getPool();
    const idList = playerIds.join(',');
    const result = await pool.request().query(
      `SELECT PlayerId, PlayerType, FeeAmount, TempPlayerNo FROM Registration WHERE PlayerId IN (${idList}) ORDER BY PlayerId`
    );
    out.sqlRegistrationRows = result.recordset;
  }

  out.razorpayModalAmountNote =
    'Razorpay checkout displays order amount in INR; equals paymentResponse.amount when only order_id is passed (no client amount override).';

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
