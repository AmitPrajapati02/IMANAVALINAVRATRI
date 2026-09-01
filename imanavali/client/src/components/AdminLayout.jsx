import { Link, Outlet, useNavigate } from 'react-router-dom';
import '../assets/css/adminstyle.css';
import { adminApi } from '../api/client';

export default function AdminLayout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await adminApi.logout().catch(() => {});
    navigate('/admin/login');
  }

  return (
    <>
      <header className="site-header">
        <nav className="site-nav admin-nav" aria-label="Admin">
          <div className="container-fluid nav-container">
            <Link className="logo" to="/admin/dashboard">IMA Admin</Link>
            <ul className="menu">
              <li className="menu-item"><Link to="/admin/dashboard">Dashboard</Link></li>
              <li className="menu-item"><Link to="/admin/registrations">Registration List</Link></li>
              <li className="menu-item"><Link to="/admin/bulk-links">Bulk Registration Links</Link></li>
              <li className="menu-item"><button type="button" className="btn btn-link" onClick={handleLogout}>Logout</button></li>
            </ul>
          </div>
        </nav>
      </header>
      <main className="admin-main"><Outlet /></main>
      <footer className="site-footer admin-footer">
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} IMA Navli Navratri Admin</p>
        </div>
      </footer>
    </>
  );
}
