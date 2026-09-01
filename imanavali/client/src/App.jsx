import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Navratri from './pages/Navratri';
import AboutSinger from './pages/AboutSinger';
import AboutIMA from './pages/AboutIMA';
import Committee from './pages/Committee';
import Vision from './pages/Vision';
import Gallery from './pages/Gallery';
import Donation from './pages/Donation';
import Contact from './pages/Contact';
import { PrivacyPolicy, RefundPolicy, FAQ, TermsCondition, CancellationPolicy } from './pages/Policies';
import RegisterLanding from './pages/RegisterLanding';
import AccountRegister from './pages/AccountRegister';
import AccountPayment from './pages/AccountPayment';
import AccountSuccess from './pages/AccountSuccess';
import AccountCancel from './pages/AccountCancel';
import BulkRegister from './pages/BulkRegister';
import BulkSuccess from './pages/BulkSuccess';
import PlayerDetailsByCode from './pages/PlayerDetailsByCode';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRegistrationList from './pages/admin/AdminRegistrationList';
import AdminBulkLinks from './pages/admin/AdminBulkLinks';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/navratri" element={<Navratri />} />
          <Route path="/about-singer" element={<AboutSinger />} />
          <Route path="/about-ima" element={<AboutIMA />} />
          <Route path="/committee" element={<Committee />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/donation" element={<Donation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms-condition" element={<TermsCondition />} />
          <Route path="/cancellation-policy" element={<CancellationPolicy />} />
          <Route path="/register" element={<RegisterLanding />} />
          <Route path="/account/register" element={<AccountRegister />} />
          <Route path="/account/payment" element={<AccountPayment />} />
          <Route path="/account/success" element={<AccountSuccess />} />
          <Route path="/account/cancel" element={<AccountCancel />} />
          <Route path="/register/bulk/:token" element={<BulkRegister />} />
          <Route path="/register/bulk/invalid" element={<BulkRegister />} />
          <Route path="/register/success" element={<BulkSuccess />} />
          <Route path="/player/details/:codeValue" element={<PlayerDetailsByCode />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/registrations" element={<AdminRegistrationList />} />
          <Route path="/admin/bulk-links" element={<AdminBulkLinks />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
