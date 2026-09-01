import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/client';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await adminApi.login(username, password);
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid username or password.');
    }
  }

  return (
    <section className="section">
      <div className="container form-container" style={{ maxWidth: 400 }}>
        <h2>Admin Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input className="form-control mb-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" className="form-control mb-3" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
      </div>
    </section>
  );
}
