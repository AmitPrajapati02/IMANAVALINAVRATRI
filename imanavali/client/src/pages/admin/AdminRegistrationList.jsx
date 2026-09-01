import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/client';

export default function AdminRegistrationList() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [pageSize] = useState(10);
  const [editPlayer, setEditPlayer] = useState(null);
  const [qrPlayerId, setQrPlayerId] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const [selectedQr, setSelectedQr] = useState('');

  const load = useCallback(async () => {
    const body = {
      draw: 1,
      start: page * pageSize,
      length: pageSize,
      search: { value: search },
      order: [{ column: 0, dir: 'DESC' }],
      columns: [{ data: 'RegisterDate' }],
    };
    const res = await adminApi.registrationsPaged(body);
    setRows(res.data.data || []);
    setTotal(res.data.recordsFiltered || 0);
  }, [page, pageSize, search]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  async function openEdit(id) {
    const res = await adminApi.getPlayer(id);
    setEditPlayer(res.data);
  }

  async function saveEdit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await adminApi.updatePlayer(editPlayer.PlayerId, fd);
    setEditPlayer(null);
    load();
  }

  async function approve(id, status) {
    await adminApi.approve(id, status);
    load();
  }

  async function openQr(id) {
    setQrPlayerId(id);
    const res = await adminApi.qrUnassigned();
    setQrCodes(res.data);
  }

  async function assignQr(e) {
    e.preventDefault();
    await adminApi.qrAssign(Number(qrPlayerId), selectedQr);
    setQrPlayerId(null);
    load();
  }

  return (
    <div className="admin-card container py-4">
      <div className="d-flex justify-content-between mb-3">
        <h2>Player Registration List</h2>
        <a href={adminApi.exportCsv()} className="btn btn-primary">Export CSV</a>
      </div>
      <input className="form-control mb-3" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      <div className="table-responsive">
        <table className="table table-sm table-striped table-bordered">
          <thead>
            <tr>
              <th>Reg No</th><th>Type</th><th>Name</th><th>Mobile</th><th>Payment</th><th>Approval</th><th>QR</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.PlayerId}>
                <td>{r.RegistrationNo}</td>
                <td>{r.PlayerType}</td>
                <td>{r.FirstName} {r.LastName}</td>
                <td>{r.Mobileno}</td>
                <td>{r.PaymentStatus}</td>
                <td>{r.ApprovalStatus}</td>
                <td>{r.CodeValue}</td>
                <td>
                  <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(r.PlayerId)}>Edit</button>
                  <button type="button" className="btn btn-sm btn-success me-1" onClick={() => approve(r.PlayerId, 'Approved')}>Approve</button>
                  <button type="button" className="btn btn-sm btn-warning me-1" onClick={() => approve(r.PlayerId, 'Rejected')}>Reject</button>
                  <button type="button" className="btn btn-sm btn-info" onClick={() => openQr(r.PlayerId)}>QR</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span>
        <button type="button" className="btn btn-outline-secondary" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {editPlayer && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={saveEdit}>
              <div className="modal-header"><h5>Edit Player</h5><button type="button" className="btn-close" onClick={() => setEditPlayer(null)} /></div>
              <div className="modal-body">
                <input name="firstName" className="form-control mb-2" defaultValue={editPlayer.FirstName} />
                <input name="lastName" className="form-control mb-2" defaultValue={editPlayer.LastName} />
                <input name="mobileNo" className="form-control mb-2" defaultValue={editPlayer.MobileNo} />
                <textarea name="address" className="form-control mb-2" defaultValue={editPlayer.Address} />
                <input type="file" name="photo" className="form-control mb-2" />
                <input type="file" name="idProof" className="form-control mb-2" />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrPlayerId && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={assignQr}>
              <div className="modal-header"><h5>Assign QR</h5><button type="button" className="btn-close" onClick={() => setQrPlayerId(null)} /></div>
              <div className="modal-body">
                <select className="form-control" required value={selectedQr} onChange={(e) => setSelectedQr(e.target.value)}>
                  <option value="">Select QR Code</option>
                  {qrCodes.map((q) => <option key={q.CodeValue} value={q.CodeValue}>{q.CodeValue}</option>)}
                </select>
              </div>
              <div className="modal-footer"><button type="submit" className="btn btn-success">Assign</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
