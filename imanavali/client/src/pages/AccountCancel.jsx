import { useLocation, Link } from 'react-router-dom';

export default function AccountCancel() {
  const { state } = useLocation();
  return (
    <section className="section">
      <div className="container text-center">
        <h2>Payment Cancelled</h2>
        <p>Registration ID: {state?.tempNo || '—'}</p>
        <Link to="/register" className="btn btn-primary">Register Again</Link>
      </div>
    </section>
  );
}
