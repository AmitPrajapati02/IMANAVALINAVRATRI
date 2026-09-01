/**
 * Unit tests for fee resolution and validation (no DB required).
 * Run: node server/src/tests/unit.test.js
 */

const {
  resolveFeeAmount,
  resolveBulkFee,
  resolveImaRegistrationFee,
  resolveImaBundleDonorFee,
  computeImaBundleTotal,
  computeBundleTotal,
  normalizeBundlePayments,
  getBookNowSession,
  getMobileLimit,
} = require('../services/fees');
const { validateRegistration } = require('../services/validation');
const {
  bundlePaymentsForRegSession,
  assertRegSessionBundleShape,
} = require('../lib/regSession');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; return; }
  failed++;
  console.error('FAIL:', msg);
}

assert(resolveFeeAmount('Male IMA Member', 0) === 500, 'Male IMA fee');
assert(resolveFeeAmount('Female Donor Player', 999) === 400, 'Female Donor fee ignores submitted');
assert(resolveFeeAmount('Male Donor Player', 0) === 1500, 'Standalone Male Donor fee unchanged');
assert(resolveImaRegistrationFee('Male IMA Member') === 500, 'IMA Male member');
assert(resolveImaRegistrationFee('Male Donor Player') === 500, 'IMA Male donor same as member');
assert(resolveImaRegistrationFee('Female Donor Player') === 400, 'IMA Female donor');
assert(resolveImaBundleDonorFee('Male Donor Player') === 500, 'IMA bundle Male fee');
assert(
  computeImaBundleTotal([
    { playerType: 'Female IMA Member' },
    { playerType: 'Male Donor Player' },
  ]) === 900,
  'Female + Male IMA registration total'
);
assert(
  computeImaBundleTotal([
    { playerType: 'Male IMA Member' },
    { playerType: 'Female Donor Player' },
    { playerType: 'Male Donor Player' },
    { playerType: 'Male Donor Player' },
  ]) === 1900,
  'Male IMA + Female Donor + 2 Male Donor total'
);
assert(
  computeImaBundleTotal([
    { playerType: 'Male IMA Member', fee: 500 },
    { playerType: 'Female Donor Player', fee: 400 },
    { playerType: 'Male Donor Player', fee: 1500 },
    { playerType: 'Male Donor Player', fee: 1500 },
  ]) === 1900,
  'Stale stored fees ignored when playerType is set'
);
assert(
  computeBundleTotal([{ playerType: 'Male Donor Player', fee: 1500 }], false) === 1500,
  'Standalone MG Male Donor unchanged (non-IMA bundle)'
);
assert(
  normalizeBundlePayments([{ playerType: 'Male Donor Player', fee: 999 }], true)[0].fee === 500,
  'IMA bundle normalizes Male Donor to gender fee not FEE_MAP'
);
assert(resolveImaRegistrationFee('Male Donor Player') === 500, 'IMA gender rule not FEE_MAP fallback');
assert(resolveImaRegistrationFee('Unknown Type') === 0, 'Unknown IMA type returns 0 not FEE_MAP');
assert(resolveBulkFee('Female Player') === 400, 'Bulk female fee');
assert(resolveBulkFee('Male Player') === 1500, 'Bulk male fee');
assert(getBookNowSession('FS')?.passType === 'Male IMA Member', 'BookNow FS');
assert(getMobileLimit('FS') === 4, 'FS limit 4');
assert(getMobileLimit('MG') === 1, 'MG limit 1');

const regErrors = validateRegistration({
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: 'john@example.com',
  mobileNo: '9876543210',
  dob: '2010-01-01',
  areaId: 1,
  pincode: '390001',
  address: 'Test address',
  agreeTerms: true,
}, { photo: { buffer: [1] }, idProof: { buffer: [1] } });
assert(regErrors.length === 0, 'Valid registration passes');

const badEmail = validateRegistration({
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: 'bad',
  mobileNo: '9876543210',
  dob: '2020-01-01',
  areaId: 1,
  pincode: '390001',
  address: 'Test',
  agreeTerms: true,
}, { photo: { buffer: [1] }, idProof: { buffer: [1] } });
assert(badEmail.length > 0, 'Invalid email fails');

// reg_session canary — stale code stores fee on bundle lines, not playerType
const normalized = normalizeBundlePayments([
  { playerId: 1, tempNo: 'T1', playerType: 'Male IMA Member', fee: 500 },
  { playerId: 2, tempNo: 'T2', playerType: 'Male Donor Player', fee: 500 },
], true);
const sessionBundle = bundlePaymentsForRegSession(normalized);
try {
  assertRegSessionBundleShape(sessionBundle);
  assert(true, 'reg_session bundle shape valid');
} catch (e) {
  assert(false, e.message);
}
try {
  assertRegSessionBundleShape([{ playerId: 1, tempNo: 'T1', fee: 500 }]);
  assert(false, 'stale fee in bundle should fail canary');
} catch (e) {
  assert(e.message.includes('stale session shape'), 'canary detects cached fee');
}

console.log(`Unit tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
