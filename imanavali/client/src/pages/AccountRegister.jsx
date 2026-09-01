import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHero } from '../hooks/useSiteScripts';
import { accountApi } from '../api/client';
import '../styles/account-register.css';

const FEE_MAP = {
  'Male IMA Member': 500,
  'Female IMA Member': 400,
  'Male Donor Player': 1500,
  'Female Donor Player': 400,
  'Male MSN Member': 500,
  'Female MSN Member': 400,
};

/** IMA Member bundle: gender prefix only — never FEE_MAP (MG standalone Male Donor is ₹1,500). */
function imaRegistrationFee(playerType) {
  const t = (playerType || '').trim();
  if (t.startsWith('Female')) return 400;
  if (t.startsWith('Male')) return 500;
  return 0;
}

const emptyDonor = () => ({ firstName: '', lastName: '', dob: '', playerType: 'Male Donor Player', photo: null, idProof: null });

export default function AccountRegister() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', emailAddress: '', dob: '', areaId: '', pincode: '', address: '',
    playerType: '', paymentOption: 'Online', referral: '', agreeTerms: false,
    photo: null, idProof: null,
  });
  const [donors, setDonors] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([accountApi.getSession(), accountApi.getAreas()])
      .then(([sess, areaRes]) => {
        setSession(sess.data);
        setAreas(areaRes.data);
        setForm((f) => ({ ...f, playerType: sess.data.passType }));
      })
      .catch(() => navigate('/register'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const isIma = form.playerType?.includes('IMA Member');
  const isMsn = form.playerType?.includes('MSN Member');
  const showPayAtIma = form.playerType === 'Male IMA Member';

  function updatePlayerType(val) {
    setForm((f) => ({ ...f, playerType: val }));
  }

  function totalFee() {
    if (isIma) {
      let t = imaRegistrationFee(form.playerType);
      donors.forEach((d) => { t += imaRegistrationFee(d.playerType); });
      return t;
    }
    return FEE_MAP[form.playerType] || 0;
  }

  async function handleAreaChange(areaId) {
    setForm((f) => ({ ...f, areaId }));
    if (areaId) {
      const res = await accountApi.getPincode(areaId);
      setForm((f) => ({ ...f, areaId, pincode: res.data.pincode || '' }));
    }
  }

  function addDonor() {
    if (donors.length >= 3) return;
    setDonors([...donors, emptyDonor()]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    const fd = new FormData();
    fd.append('firstName', form.firstName);
    fd.append('lastName', form.lastName);
    fd.append('mobileNo', session.mobile);
    fd.append('emailAddress', form.emailAddress);
    fd.append('dob', form.dob);
    fd.append('areaId', form.areaId);
    fd.append('pincode', form.pincode);
    fd.append('address', form.address);
    fd.append('playerType', form.playerType);
    fd.append('feeAmount', String(isIma ? imaRegistrationFee(form.playerType) : (FEE_MAP[form.playerType] || 0)));
    fd.append('paymentOption', showPayAtIma ? form.paymentOption : 'Online');
    fd.append('referral', form.referral);
    fd.append('agreeTerms', form.agreeTerms ? 'true' : 'false');
    if (form.photo) fd.append('photo', form.photo);
    if (form.idProof) fd.append('idProof', form.idProof);
    fd.append('donorCount', String(donors.length));
    donors.forEach((d, i) => {
      fd.append(`donorFirstName${i}`, d.firstName);
      fd.append(`donorLastName${i}`, d.lastName);
      fd.append(`donorDob${i}`, d.dob);
      fd.append(`donorPlayerType${i}`, d.playerType);
      if (d.photo) fd.append(`donorPhoto${i}`, d.photo);
      if (d.idProof) fd.append(`donorIdProof${i}`, d.idProof);
    });

    try {
      const res = await accountApi.register(fd);
      if (res.data.payAtIma) {
        navigate('/account/success', { state: res.data });
        return;
      }
      navigate(`/account/payment?id=${res.data.playerId}&tempNo=${res.data.tempNo}&fee=${res.data.fee}`);
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors.map((x) => x.message));
      else setErrors([err.response?.data?.error || 'Registration failed']);
    }
  }

  if (loading) return null;

  return (
    <>
      <PageHero title="Registration" />
      <section className="section account-register">
        <div className="container account-register__inner">
          <form onSubmit={handleSubmit} className="needs-validation account-register__form">
            {errors.length > 0 && (
              <div className="alert alert-danger account-register__alert">
                {errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}

            <div className="reg-form-grid">
              <div className="form-field">
                <label htmlFor="reg-firstName">First Name *</label>
                <input
                  id="reg-firstName"
                  className="form-control"
                  required
                  maxLength={50}
                  pattern="[A-Za-z]+"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="reg-lastName">Last Name *</label>
                <input
                  id="reg-lastName"
                  className="form-control"
                  required
                  maxLength={50}
                  pattern="[A-Za-z]+"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="reg-mobile">WhatsApp Mobile No *</label>
                <input id="reg-mobile" className="form-control" readOnly value={session.mobile} />
              </div>
              <div className="form-field">
                <label htmlFor="reg-email">Email Address *</label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-control"
                  required
                  maxLength={100}
                  value={form.emailAddress}
                  onChange={(e) => setForm({ ...form, emailAddress: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="reg-dob">Date Of Birth *</label>
                <input
                  id="reg-dob"
                  type="date"
                  className="form-control"
                  required
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                />
                <small className="text-muted">Player must be at least 8 years old</small>
              </div>
              <div className="form-field">
                <label htmlFor="reg-playerType">Player Type</label>
                {isIma ? (
                  <select
                    id="reg-playerType"
                    className="form-control"
                    value={form.playerType}
                    onChange={(e) => updatePlayerType(e.target.value)}
                  >
                    <option value="Male IMA Member">Male IMA Member</option>
                    <option value="Female IMA Member">Female IMA Member</option>
                  </select>
                ) : isMsn ? (
                  <select
                    id="reg-playerType"
                    className="form-control"
                    value={form.playerType}
                    onChange={(e) => updatePlayerType(e.target.value)}
                  >
                    <option value="Male MSN Member">Male MSN Member</option>
                    <option value="Female MSN Member">Female MSN Member</option>
                  </select>
                ) : (
                  <input id="reg-playerType" className="form-control" readOnly value={form.playerType} />
                )}
              </div>
              <div className="form-field">
                <label htmlFor="reg-area">Area Name *</label>
                <select
                  id="reg-area"
                  className="form-control"
                  required
                  value={form.areaId}
                  onChange={(e) => handleAreaChange(e.target.value)}
                >
                  <option value="">Select Area</option>
                  {areas.map((a) => (
                    <option key={a.AreaId} value={a.AreaId}>{a.AreaName}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="reg-pincode">Pincode *</label>
                <input id="reg-pincode" className="form-control" readOnly required value={form.pincode} />
              </div>
              <div className="form-field full">
                <label htmlFor="reg-address">Address *</label>
                <textarea
                  id="reg-address"
                  className="form-control"
                  required
                  maxLength={200}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="reg-photo">Upload Photo * (Max 2MB)</label>
                <input
                  id="reg-photo"
                  type="file"
                  className="form-control"
                  accept="image/jpeg,image/png"
                  required
                  onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="reg-idProof">Upload ID Proof * (Max 2MB)</label>
                <input
                  id="reg-idProof"
                  type="file"
                  className="form-control"
                  accept="image/jpeg,image/png"
                  required
                  onChange={(e) => setForm({ ...form, idProof: e.target.files[0] })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="reg-referral">Referral (if any)</label>
                <input
                  id="reg-referral"
                  className="form-control"
                  maxLength={100}
                  value={form.referral}
                  onChange={(e) => setForm({ ...form, referral: e.target.value })}
                />
              </div>
            </div>

            {isIma && (
              <div className="donor-section">
                <h3 className="donor-section__title">Donor Players</h3>
                <p className="donor-section__hint">Optional — you may add up to 3 donor players.</p>
                <button
                  type="button"
                  className="btn btn-outline donor-section__add"
                  onClick={addDonor}
                  disabled={donors.length >= 3}
                >
                  Add Donor Player
                </button>
                {donors.map((d, i) => (
                  <div key={i} className="donor-card">
                    <div className="donor-card__header">
                      <p className="donor-card__label">Donor Player {i + 1}</p>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => setDonors(donors.filter((_, j) => j !== i))}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="reg-form-grid">
                      <div className="form-field">
                        <label htmlFor={`donor-firstName-${i}`}>First Name *</label>
                        <input
                          id={`donor-firstName-${i}`}
                          className="form-control"
                          maxLength={50}
                          value={d.firstName}
                          onChange={(e) => { const nd = [...donors]; nd[i].firstName = e.target.value; setDonors(nd); }}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`donor-lastName-${i}`}>Last Name *</label>
                        <input
                          id={`donor-lastName-${i}`}
                          className="form-control"
                          maxLength={50}
                          value={d.lastName}
                          onChange={(e) => { const nd = [...donors]; nd[i].lastName = e.target.value; setDonors(nd); }}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`donor-dob-${i}`}>Date Of Birth *</label>
                        <input
                          id={`donor-dob-${i}`}
                          type="date"
                          className="form-control"
                          value={d.dob}
                          onChange={(e) => { const nd = [...donors]; nd[i].dob = e.target.value; setDonors(nd); }}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`donor-type-${i}`}>Player Type *</label>
                        <select
                          id={`donor-type-${i}`}
                          className="form-control"
                          value={d.playerType}
                          onChange={(e) => { const nd = [...donors]; nd[i].playerType = e.target.value; setDonors(nd); }}
                        >
                          <option value="Male Donor Player">Male Donor Player (₹500)</option>
                          <option value="Female Donor Player">Female Donor Player (₹400)</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label htmlFor={`donor-photo-${i}`}>Upload Photo * (Max 2MB)</label>
                        <input
                          id={`donor-photo-${i}`}
                          type="file"
                          className="form-control"
                          accept="image/jpeg,image/png"
                          onChange={(e) => { const nd = [...donors]; nd[i].photo = e.target.files[0]; setDonors(nd); }}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`donor-idProof-${i}`}>Upload ID Proof * (Max 2MB)</label>
                        <input
                          id={`donor-idProof-${i}`}
                          type="file"
                          className="form-control"
                          accept="image/jpeg,image/png"
                          onChange={(e) => { const nd = [...donors]; nd[i].idProof = e.target.files[0]; setDonors(nd); }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-footer-block">
              {showPayAtIma && (
                <div className="form-field full">
                  <label>Payment Option *</label>
                  <div className="payment-options">
                    <label>
                      <input
                        type="radio"
                        name="pay"
                        checked={form.paymentOption === 'Online'}
                        onChange={() => setForm({ ...form, paymentOption: 'Online' })}
                      />
                      Online
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="pay"
                        checked={form.paymentOption === 'IMA'}
                        onChange={() => setForm({ ...form, paymentOption: 'IMA' })}
                      />
                      Pay at IMA
                    </label>
                  </div>
                </div>
              )}

              <div className="form-field full total-fee">
                <strong>Total Fee: ₹{totalFee()}</strong>
              </div>

              <div className="form-field full terms-field">
                <label>
                  <input
                    type="checkbox"
                    required
                    checked={form.agreeTerms}
                    onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                  />
                  <span>
                    I agree to the <Link to="/terms-condition" target="_blank">Terms and Conditions</Link>
                  </span>
                </label>
              </div>

              <div className="actions account-register__actions">
                <button type="submit" className="btn btn-primary">Submit and Pay Now</button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
