import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHero } from '../hooks/useSiteScripts';
import { homeApi, accountApi } from '../api/client';
import '../styles/register-landing.css';

const playerTypeByCode = {
  MG: 'Male Donor Player',
  FG: 'Female Donor Player',
  FS: 'Male IMA Member',
  MS: 'Male MSN Member',
};

const IMG_VERSION = '3';

const REG_CARDS = [
  {
    typeCode: 'MG',
    gate: 'non-ima',
    image: `/images/register/male-donor.png?v=${IMG_VERSION}`,
    label: 'Male Donor Player — Book Now',
  },
  {
    typeCode: 'FG',
    gate: 'non-ima',
    image: `/images/register/female-donor.png?v=${IMG_VERSION}`,
    label: 'Female Donor Player — Book Now',
  },
  {
    typeCode: 'FS',
    gate: 'ima',
    image: `/images/register/ima-member.png?v=${IMG_VERSION}`,
    label: 'IMA Member — Book Now',
  },
  {
    typeCode: 'MS',
    gate: 'non-ima',
    image: `/images/register/msn-member.png?v=${IMG_VERSION}`,
    label: 'MSN Member — Book Now',
  },
];

function isGateEnabled(orgType, gate) {
  return (orgType === 'ima' && gate === 'ima') || (orgType === 'non-ima' && gate === 'non-ima');
}

export default function RegisterLanding() {
  const navigate = useNavigate();
  const [orgType, setOrgType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');

  function openModal(typeCode) {
    setSelectedType(typeCode);
    setMobile('');
    setError('');
    setModalOpen(true);
  }

  function handleCardClick(typeCode, gate) {
    if (!isGateEnabled(orgType, gate)) return;
    openModal(typeCode);
  }

  async function handleUseNumber() {
    if (!/^\d{10}$/.test(mobile)) {
      setError('Enter exactly 10 digits.');
      return;
    }
    const playerType = playerTypeByCode[selectedType];
    const limit = selectedType === 'FS' ? 4 : 1;
    try {
      const res = await accountApi.checkMobile(`${mobile}|${playerType}`);
      if (res.data.regCount >= limit) {
        setError(`Maximum ${limit} registration(s) allowed for ${playerType} on this mobile number.`);
        return;
      }
      await homeApi.bookNow(mobile, selectedType);
      navigate('/account/register');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to proceed. Try again.');
    }
  }

  return (
    <>
      <PageHero title="Player Registration 2026" />
      <section className="section register-landing-section">
        <div className="container register-landing__container">
          <div className="reg-org-toggle" role="radiogroup" aria-label="Registration category">
            <label className="reg-org-option">
              <input type="radio" name="regOrgType" value="ima" checked={orgType === 'ima'} onChange={() => setOrgType('ima')} />
              <span>IMA Member</span>
            </label>
            <label className="reg-org-option">
              <input type="radio" name="regOrgType" value="non-ima" checked={orgType === 'non-ima'} onChange={() => setOrgType('non-ima')} />
              <span>Others</span>
            </label>
          </div>

          <div className="reg-image-grid">
            {REG_CARDS.map((card) => {
              const enabled = isGateEnabled(orgType, card.gate);
              return (
                <button
                  key={card.typeCode}
                  type="button"
                  className={`reg-image-card reg-gated${enabled ? '' : ' is-disabled'}`}
                  data-reg-gate={card.gate}
                  aria-label={card.label}
                  disabled={!enabled}
                  onClick={() => handleCardClick(card.typeCode, card.gate)}
                >
                  <img src={card.image} alt="" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="gov-id-banner-wrap">
          <div className="gov-id-banner" role="note">
            <span className="gov-id-banner-text"><span className="gov-id-star">*</span> Valid Government Photo ID is mandatory for registration.</span>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Enter Mobile Number</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
              </div>
              <div className="modal-body">
                <label className="form-label">10-digit WhatsApp number</label>
                <input className="form-control" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} />
                {error && <div className="text-danger mt-2">{error}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleUseNumber}>Use Number</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
