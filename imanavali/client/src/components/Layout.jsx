import { Link, Outlet } from 'react-router-dom';
import { useSiteScripts } from '../hooks/useSiteScripts';
import logo from '../assets/img/logo.png';
import fb from '../assets/img/fb.png';
import insta from '../assets/img/insta.png';

export default function Layout() {
  useSiteScripts();

  return (
    <>
      <header className="site-header">
        <nav className="site-nav" aria-label="Main">
          <div className="container-fluid nav-container">
            <Link className="logo" to="/">
              <img src={logo} alt="IMA Navratri" className="logo-img" />
            </Link>
            <button className="nav-toggle" aria-expanded="false" aria-controls="primary-menu" aria-label="Toggle menu" type="button">
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </button>
            <ul id="primary-menu" className="menu">
              <li className="menu-item"><Link to="/">Home</Link></li>
              <li className="menu-item has-submenu">
                <button className="submenu-toggle" aria-expanded="false" type="button">About Us</button>
                <ul className="submenu" aria-label="About Us">
                  <li><Link to="/about-ima">About IMA</Link></li>
                  <li><Link to="/committee">Committee</Link></li>
                  <li><Link to="/vision">Vision / Mission</Link></li>
                </ul>
              </li>
              <li className="menu-item"><Link to="/navratri">Navratri</Link></li>
              <li className="menu-item"><Link to="/about-singer">Artist</Link></li>
              <li className="menu-item"><Link to="/gallery">Gallery</Link></li>
              <li className="menu-item"><Link to="/donation">Donation</Link></li>
              <li className="menu-item"><Link to="/contact">Contact</Link></li>
              <li className="menu-item registration-item">
                <Link className="btn btn-primary" to="/register">Registration</Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h4>Venue</h4>
            <p>Venus Pahel - IMA Garba ground,<br />Behind Reliance Mall,<br /> Old Padra Road, Vadodara</p>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>Email: imanavlinavratri@gmail.com</li>
              <li>Phone: +91 79844 41521</li>
            </ul>
            <h4>Follow Us</h4>
            <p className="social-links">
              <a href="https://www.facebook.com/imanavlinavratri" target="_blank" rel="noreferrer" aria-label="Facebook">
                <img src={fb} alt="Facebook" className="social-icon" />
              </a>
              <a href="https://www.instagram.com/imanavlinavratri_official" target="_blank" rel="noreferrer" aria-label="Instagram">
                <img src={insta} alt="Instagram" className="social-icon" />
              </a>
            </p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/refund-policy">Refund Policy</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/terms-condition">Terms and Condition</Link></li>
              <li><Link to="/cancellation-policy">Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="container footer-bottom">
          <p className="footer-copy">
            © <span id="year">{new Date().getFullYear()}</span> IMA Navli Navratri. All rights reserved.
          </p>
          <nav className="footer-legal" aria-label="Legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/refund-policy">Refund Policy</Link>
            <Link to="/terms-condition">Terms &amp; Conditions</Link>
          </nav>
        </div>
      </footer>
      <div className="lightbox" id="lightbox" aria-hidden="true" role="dialog" aria-label="Image viewer">
        <button className="lightbox-close" aria-label="Close" type="button">×</button>
        <img alt="Expanded view" />
      </div>
    </>
  );
}
