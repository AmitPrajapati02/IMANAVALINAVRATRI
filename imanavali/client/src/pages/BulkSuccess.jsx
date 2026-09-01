import { useLocation } from 'react-router-dom';

export default function BulkSuccess() {
  const { state } = useLocation();
  return (
    <section className="section">
      <div className="container text-center">
        <h2>Bulk Registration Successful</h2>
        <p>Bulk Registration ID: <strong>{state?.bulkRegId}</strong></p>
        <p>Payment: <strong>{state?.paymentId || 'Pay-at-IMA'}</strong></p>
      </div>
    </section>
  );
}
