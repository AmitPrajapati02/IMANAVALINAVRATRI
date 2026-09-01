/**
 * reg_session JWT bundle shape — used at setRegSession and regression tests.
 * Storing `fee` on bundle lines is the signature of stale pre-fix server code.
 */

function bundlePaymentsForRegSession(normalizedBundle) {
  return normalizedBundle.map(({ playerId, tempNo, playerType }) => ({
    playerId,
    tempNo,
    playerType,
  }));
}

function assertRegSessionBundleShape(bundlePayments, label = 'bundlePayments') {
  if (!Array.isArray(bundlePayments)) {
    throw new Error(`${label}: expected array`);
  }
  for (let i = 0; i < bundlePayments.length; i++) {
    const line = bundlePayments[i];
    if (!line || typeof line !== 'object') {
      throw new Error(`${label}[${i}]: expected object`);
    }
    if ('fee' in line) {
      throw new Error(
        `${label}[${i}]: stale session shape — cached fee field present (old server code)`
      );
    }
    const type = (line.playerType || '').trim();
    if (!type) {
      throw new Error(`${label}[${i}]: missing playerType`);
    }
  }
}

module.exports = { bundlePaymentsForRegSession, assertRegSessionBundleShape };
