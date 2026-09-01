import { useLocation } from 'react-router-dom';
import successBg from '../assets/img/navratri-success-bg.png';

export default function AccountSuccess() {
  const { state } = useLocation();
  const payAtIma = state?.paymentId === 'Pay-at-IMA' || state?.payAtIma;

  return (
    <div className="reg-success-page" style={{ backgroundImage: `url(${successBg})`, backgroundColor: '#f6efe4', minHeight: 'calc(100vh - 72px)' }}>
      <section className="section reg-success-section">
        <div className="container reg-success-wrap">
          {payAtIma ? (
            <div className="reg-success-card">
              <h2>Registration Complete</h2>
              <div className="reg-success-body">
                <p>Your registration is successful.</p>
                <p>Please visit the IMA office to complete your payment.</p>
              </div>
              <div className="reg-success-id-badge">
                <span className="reg-success-id-label">Registration ID</span>
                <span className="reg-success-id-value">{state?.tempPlayerNo}</span>
              </div>
            </div>
          ) : (
            <div className="reg-success-card">
              <h2>Registration Received Successfully!</h2>
              <div className="reg-success-body">
                <p>Thank you for registering for <strong>VENUS PAHEL NAVLI NAVRATRI 2026!</strong></p>
                <p>Your registration has been successfully received and is currently subject to verification by our backend team.</p>
                <p>Once your registration is approved, your Festival Entry ID will be couriered to your registered address.</p>
                <p><strong>Get Ready to Garba!</strong></p>
                <p>ગાથા શરૂ થઈ ગઈ છે….✨</p>
              </div>
              <div className="reg-success-id-badge">
                <span className="reg-success-id-label">Registration ID</span>
                <span className="reg-success-id-value">{state?.tempPlayerNo}</span>
              </div>
              {state?.paymentId && (
                <div className="reg-success-meta">Payment ID: <strong>{state.paymentId}</strong></div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
