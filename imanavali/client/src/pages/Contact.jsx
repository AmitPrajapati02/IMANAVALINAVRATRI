import { useState } from 'react';
import { PageHero } from '../hooks/useSiteScripts';
import { homeApi } from '../api/client';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await homeApi.contact(form);
      setStatus(res.data.status);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus(err.response?.data?.status || '❌ Error sending message.');
    }
  }

  return (
    <>
      <PageHero title="Contact" />
      <section className="section">
        <div className="container form-container">
          <form onSubmit={handleSubmit} className="grid grid-2">
            <div className="form-field">
              <label>Name</label>
              <input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input type="email" className="form-control" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-field full">
              <label>Message</label>
              <textarea className="form-control" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div className="actions full">
              <button type="submit" className="btn btn-primary">Send Message</button>
            </div>
          </form>
          {status && <p className="form-status" role="status">{status}</p>}
        </div>
      </section>
    </>
  );
}
