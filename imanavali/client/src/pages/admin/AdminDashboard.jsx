import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.dashboard().then((res) => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return null;

  const cards = [
    ['Total Registrations', stats.TotalRegistration],
    ['Paid', stats.PaidRegistration],
    ['Pending', stats.PendingRegistration],
    ['Cancelled', stats.CancelledRegistration],
    ['Male General', stats.TotalMaleGeneral],
    ['Female General', stats.TotalFemaleGeneral],
    ['Male Medical', stats.TotalMaleMedical],
    ['Female Medical', stats.TotalFemaleMedical],
    ['Male Bulk', stats.TotalMaleBulk],
    ['Female Bulk', stats.TotalFemaleBulk],
    ['QR Assigned', stats.TotalApproved],
    ['QR Not Assigned', stats.TotalPending],
  ];

  return (
    <div className="admin-card container py-4">
      <h2>Dashboard</h2>
      <div className="grid grid-3">
        {cards.map(([label, val]) => (
          <div key={label} className="card p-3">
            <h4>{label}</h4>
            <p className="display-6">{val ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
