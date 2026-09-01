/**
 * E2E regression: Male IMA Member + Male Donor → ₹1,000 total, donor FeeAmount=500.
 * Requires API on PORT (default 3001). Run via: npm run test:e2e
 */
const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const { getPool } = require('../services/db');
const { assertRegSessionBundleShape } = require('../lib/regSession');

const BASE = process.env.API_BASE || `http://localhost:${process.env.PORT || 3001}/api`;
const mobile = `9${String(Date.now()).slice(-9)}`;

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

const client = axios.create({ baseURL: BASE, validateStatus: () => true });
client.interceptors.response.use((res) => { captureCookies(res); return res; });
client.interceptors.request.use((config) => {
  if (cookieJar) config.headers.Cookie = cookieJar;
  return config;
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const book = await client.post('/home/book-now', { mobile, type: 'FS' });
  assert(book.status === 200, `book-now failed: ${book.status} ${JSON.stringify(book.data)}`);

  const areas = await client.get('/account/areas');
  const areaId = areas.data?.[0]?.AreaId;
  assert(areaId, 'No areas from API');

  const fd = new FormData();
  fd.append('firstName', 'John');
  fd.append('lastName', 'Doe');
  fd.append('mobileNo', mobile);
  fd.append('emailAddress', `e2e${Date.now()}@example.com`);
  fd.append('dob', '2010-01-15');
  fd.append('areaId', String(areaId));
  fd.append('pincode', '390001');
  fd.append('address', 'E2E IMA donor fee test');
  fd.append('playerType', 'Male IMA Member');
  fd.append('feeAmount', '500');
  fd.append('paymentOption', 'Online');
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

  const reg = await client.post('/account/register', fd, { headers: fd.getHeaders() });
  assert(reg.status === 200 && reg.data?.playerId, `register failed: ${reg.status} ${JSON.stringify(reg.data)}`);
  assert(reg.data.fee === 1000, `register fee expected 1000, got ${reg.data.fee}`);

  const pay = await client.get('/payment/payment', {
    params: { id: reg.data.playerId, tempNo: reg.data.tempNo, fee: reg.data.fee },
  });
  assert(pay.status === 200, `payment init failed: ${pay.status}`);
  assert(pay.data.amount === 1000, `payment amount expected 1000, got ${pay.data.amount}`);

  const token = (cookieJar.match(/reg_session=([^;]+)/) || [])[1];
  assert(token, 'reg_session cookie missing');
  const decoded = jwt.decode(token);
  assert(decoded?.totalFee === 1000, `JWT totalFee expected 1000, got ${decoded?.totalFee}`);
  assertRegSessionBundleShape(decoded.bundlePayments);

  const donorLine = decoded.bundlePayments.find((l) => l.playerType === 'Male Donor Player');
  assert(donorLine, 'Male Donor Player missing from bundlePayments');

  const pool = await getPool();
  const ids = decoded.bundlePayments.map((l) => l.playerId).join(',');
  const rows = await pool.request().query(
    `SELECT PlayerId, PlayerType, FeeAmount, TempPlayerNo, MobileNo FROM Registration WHERE PlayerId IN (${ids}) ORDER BY PlayerId`
  );
  const donorRow = rows.recordset.find((r) => r.PlayerType === 'Male Donor Player');
  assert(donorRow, 'Male Donor row missing in DB');
  assert(donorRow.FeeAmount === 500, `donor FeeAmount expected 500, got ${donorRow.FeeAmount}`);

  console.log('E2E IMA donor fee: all checks passed');
  console.log(`  mobile=${mobile} main=${reg.data.tempNo} donor=${donorRow.TempPlayerNo}`);
}

main().catch((err) => {
  console.error('E2E IMA donor fee FAILED:', err.message);
  process.exit(1);
});
