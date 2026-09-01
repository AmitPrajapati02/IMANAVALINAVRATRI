import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';

export default function AdminBulkLinks() {
  const [links, setLinks] = useState([]);

  function load() {
    adminApi.bulkLinks().then((res) => setLinks(res.data)).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function generate() {
    await adminApi.generateBulkLink();
    load();
  }

  async function expire(id) {
    await adminApi.expireBulkLink(id);
    load();
  }

  async function remove(id) {
    await adminApi.deleteBulkLink(id);
    load();
  }

  return (
    <div className="admin-card container py-4">
      <div className="d-flex justify-content-between mb-3">
        <h2>Bulk Registration Links</h2>
        <button type="button" className="btn btn-primary" onClick={generate}>Generate Link</button>
      </div>
      <table className="table table-bordered">
        <thead>
          <tr><th>Token</th><th>Link</th><th>Expiry</th><th>Used</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.Id}>
              <td>{l.Token}</td>
              <td><a href={l.Link}>{l.Link}</a></td>
              <td>{new Date(l.ExpiryDate).toLocaleString()}</td>
              <td>{l.IsUsed ? 'Yes' : 'No'}</td>
              <td>
                <button type="button" className="btn btn-sm btn-warning me-1" onClick={() => expire(l.Id)}>Expire</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(l.Id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
