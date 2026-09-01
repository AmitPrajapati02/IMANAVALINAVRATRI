const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^\d{10}$/;
const ALPHA_RE = /^[A-Za-z]+$/;

function validateRegistration(data, files = {}) {
  const errors = [];
  if (!data.firstName?.trim()) errors.push({ field: 'firstName', message: 'First name is required.' });
  else if (!ALPHA_RE.test(data.firstName.trim()) || data.firstName.length > 50) {
    errors.push({ field: 'firstName', message: 'First name must be alphabets only, max 50 chars.' });
  }
  if (!data.lastName?.trim()) errors.push({ field: 'lastName', message: 'Last name is required.' });
  else if (!ALPHA_RE.test(data.lastName.trim()) || data.lastName.length > 50) {
    errors.push({ field: 'lastName', message: 'Last name must be alphabets only, max 50 chars.' });
  }
  if (!data.emailAddress?.trim() || !EMAIL_RE.test(data.emailAddress.trim()) || data.emailAddress.length > 100) {
    errors.push({ field: 'emailAddress', message: 'Please enter a valid email address.' });
  }
  if (!data.mobileNo?.trim() || !MOBILE_RE.test(data.mobileNo.trim())) {
    errors.push({ field: 'mobileNo', message: 'Mobile number must be exactly 10 digits.' });
  }
  if (!data.dob) errors.push({ field: 'dob', message: 'Date of birth is required.' });
  else {
    const dob = new Date(data.dob);
    const minDob = new Date();
    minDob.setFullYear(minDob.getFullYear() - 8);
    if (dob > minDob) errors.push({ field: 'dob', message: 'Player must be at least 8 years old.' });
  }
  if (!data.areaId || Number(data.areaId) <= 0) errors.push({ field: 'areaId', message: 'Please select an area.' });
  if (!data.pincode?.trim()) errors.push({ field: 'pincode', message: 'Pincode is required.' });
  if (!data.address?.trim()) errors.push({ field: 'address', message: 'Address is required.' });
  else if (data.address.length > 200) errors.push({ field: 'address', message: 'Address max 200 chars.' });
  if (!files.photo) errors.push({ field: 'photo', message: 'Photo is required.' });
  if (!files.idProof) errors.push({ field: 'idProof', message: 'ID Proof is required.' });
  if (data.agreeTerms !== 'true' && data.agreeTerms !== true) {
    errors.push({ field: 'agreeTerms', message: 'You must agree to terms.' });
  }
  return errors;
}

function validateDonor(data, files, index) {
  const errors = [];
  const prefix = `donor${index}`;
  if (!data.firstName?.trim()) errors.push({ field: `${prefix}.firstName`, message: 'Donor first name required.' });
  if (!data.lastName?.trim()) errors.push({ field: `${prefix}.lastName`, message: 'Donor last name required.' });
  if (!data.dob) errors.push({ field: `${prefix}.dob`, message: 'Donor DOB required.' });
  if (!data.playerType) errors.push({ field: `${prefix}.playerType`, message: 'Donor type required.' });
  if (!files.photo) errors.push({ field: `${prefix}.photo`, message: 'Donor photo required.' });
  if (!files.idProof) errors.push({ field: `${prefix}.idProof`, message: 'Donor ID proof required.' });
  return errors;
}

module.exports = { validateRegistration, validateDonor, EMAIL_RE, MOBILE_RE };
