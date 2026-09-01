const FEE_MAP = {
  'Male IMA Member': 500,
  'Female IMA Member': 400,
  'Male Donor Player': 1500,
  'Female Donor Player': 400,
  'Male MSN Member': 500,
  'Female MSN Member': 400,
  'Male Player': 1500,
  'Female Player': 400,
};

function resolveFeeAmount(playerType, submittedFee = 0) {
  const t = (playerType || '').trim();
  if (FEE_MAP[t] !== undefined) return FEE_MAP[t];
  return Number(submittedFee) || 0;
}

function resolveBulkFee(playerType) {
  return playerType === 'Female Player' ? 400 : 1500;
}

/** Main player is an IMA Member — bundle uses gender-based fees for every line. */
function isImaBundleRegistration(playerType) {
  return (playerType || '').trim().includes('IMA Member');
}

/**
 * IMA Member registration bundle only: Male = ₹500, Female = ₹400 (member or donor label).
 * Never consults FEE_MAP — standalone MG Male Donor (₹1,500) uses resolveFeeAmount instead.
 */
function resolveImaRegistrationFee(playerType) {
  const t = (playerType || '').trim();
  if (t.startsWith('Female')) return 400;
  if (t.startsWith('Male')) return 500;
  return 0;
}

/** @deprecated Use resolveImaRegistrationFee — kept for callers; same gender-based rule. */
function resolveImaBundleDonorFee(playerType) {
  return resolveImaRegistrationFee(playerType);
}

/** Fee for one line in a registration bundle; IMA bundles use gender rule only. */
function resolveBundleLineFee(playerType, imaBundle) {
  if (imaBundle) return resolveImaRegistrationFee(playerType);
  return resolveFeeAmount(playerType, 0);
}

/** Normalize bundle line fees from playerType; never reuse stale stored fees when type is known. */
function normalizeBundlePayments(bundlePayments, imaBundle) {
  if (!bundlePayments?.length) return [];
  return bundlePayments.map((line, i) => {
    const type = (line.playerType || '').trim();
    if (!type) {
      if (imaBundle) return { ...line, fee: 0 };
      return { ...line, fee: i === 0 ? Number(line.fee) || 0 : 0 };
    }
    return {
      ...line,
      playerType: type,
      fee: resolveBundleLineFee(type, imaBundle),
    };
  });
}

/** IMA bundle only — gender-prefix fees for member + donor lines. */
function normalizeImaBundlePayments(bundlePayments) {
  return normalizeBundlePayments(bundlePayments, true);
}

function computeBundleTotal(bundlePayments, imaBundle) {
  return normalizeBundlePayments(bundlePayments, imaBundle).reduce((sum, line) => sum + line.fee, 0);
}

/** Sum payable total for an IMA registration bundle. */
function computeImaBundleTotal(bundlePayments) {
  return computeBundleTotal(bundlePayments, true);
}

function getBookNowSession(typeCode) {
  const map = {
    FG: { passType: 'Female Donor Player', price: 400 },
    MG: { passType: 'Male Donor Player', price: 1500 },
    FS: { passType: 'Male IMA Member', price: 500 },
    MS: { passType: 'Male MSN Member', price: 500 },
  };
  return map[typeCode] || null;
}

function getMobileLimit(typeCode) {
  return typeCode === 'FS' ? 4 : 1;
}

module.exports = {
  resolveFeeAmount,
  resolveBulkFee,
  isImaBundleRegistration,
  resolveImaRegistrationFee,
  resolveImaBundleDonorFee,
  resolveBundleLineFee,
  computeBundleTotal,
  computeImaBundleTotal,
  normalizeBundlePayments,
  normalizeImaBundlePayments,
  getBookNowSession,
  getMobileLimit,
  FEE_MAP,
};
