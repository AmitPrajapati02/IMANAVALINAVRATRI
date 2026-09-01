import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHero } from '../hooks/useSiteScripts';
import { registerApi, accountApi } from '../api/client';

const emptyPlayer = () => ({ firstName: '', lastName: '', dob: '', playerType: 'Male Player', photo: null, idProof: null });

export default function BulkRegister() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [valid, setValid] = useState(null);
  const [areas, setAreas] = useState([]);
  const [common, setCommon] = useState({ mobileNo: '', emailAddress: '', areaId: '', pincode: '', address: '' });
  const [players, setPlayers] = useState([emptyPlayer()]);
  const [error, setError] = useState('');

  useEffect(() => {
    registerApi.validateBulk(token)
      .then((res) => {
        setValid(res.data.valid);
        setAreas(res.data.areas || []);
      })
      .catch(() => setValid(false));
  }, [token]);

  async function onAreaChange(areaId) {
    setCommon((c) => ({ ...c, areaId }));
    if (areaId) {
      const res = await accountApi.getPincode(areaId);
      setCommon((c) => ({ ...c, areaId, pincode: res.data.pincode || '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    Object.entries(common).forEach(([k, v]) => fd.append(k, v));
    fd.append('playerCount', String(players.length));
    players.forEach((p, i) => {
      fd.append(`firstName${i}`, p.firstName);
      fd.append(`lastName${i}`, p.lastName);
      fd.append(`dob${i}`, p.dob);
      fd.append(`playerType${i}`, p.playerType);
      if (p.photo) fd.append(`playerPhoto${i}`, p.photo);
      if (p.idProof) fd.append(`playerIdProof${i}`, p.idProof);
    });
    try {
      const res = await registerApi.submitBulk(token, fd);
      navigate('/register/success', { state: res.data });
    } catch (err) {
      setError(err.response?.data?.error || 'Bulk registration failed');
    }
  }

  if (valid === false) {
    return (
      <section className="section">
        <div className="container text-center">
          <h2>Invalid or Expired Token</h2>
          <p>This bulk registration link is no longer valid.</p>
        </div>
      </section>
    );
  }
  if (valid === null) return null;

  return (
    <>
      <PageHero title="Bulk Registration" />
      <section className="section">
        <div className="container form-container">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <h3>Common Details</h3>
            <div className="grid grid-2">
              <input className="form-control mb-2" placeholder="Mobile" required pattern="\d{10}" value={common.mobileNo} onChange={(e) => setCommon({ ...common, mobileNo: e.target.value.replace(/\D/g, '') })} />
              <input type="email" className="form-control mb-2" placeholder="Email" required value={common.emailAddress} onChange={(e) => setCommon({ ...common, emailAddress: e.target.value })} />
              <select className="form-control mb-2" required value={common.areaId} onChange={(e) => onAreaChange(e.target.value)}>
                <option value="">Select Area</option>
                {areas.map((a) => <option key={a.AreaId} value={a.AreaId}>{a.AreaName}</option>)}
              </select>
              <input className="form-control mb-2" readOnly placeholder="Pincode" required value={common.pincode} />
              <textarea className="form-control mb-2 full" placeholder="Address" required value={common.address} onChange={(e) => setCommon({ ...common, address: e.target.value })} />
            </div>
            <h3 className="mt-4">Players (max 50)</h3>
            {players.map((p, i) => (
              <div key={i} className="border p-3 mb-2 rounded">
                <div className="grid grid-2">
                  <input className="form-control mb-2" placeholder="First Name" required value={p.firstName} onChange={(e) => { const np = [...players]; np[i].firstName = e.target.value; setPlayers(np); }} />
                  <input className="form-control mb-2" placeholder="Last Name" required value={p.lastName} onChange={(e) => { const np = [...players]; np[i].lastName = e.target.value; setPlayers(np); }} />
                  <input type="date" className="form-control mb-2" required value={p.dob} onChange={(e) => { const np = [...players]; np[i].dob = e.target.value; setPlayers(np); }} />
                  <select className="form-control mb-2" value={p.playerType} onChange={(e) => { const np = [...players]; np[i].playerType = e.target.value; setPlayers(np); }}>
                    <option value="Male Player">Male Player (₹1500)</option>
                    <option value="Female Player">Female Player (₹400)</option>
                  </select>
                  <input type="file" accept="image/*" required onChange={(e) => { const np = [...players]; np[i].photo = e.target.files[0]; setPlayers(np); }} />
                  <input type="file" accept="image/*" required onChange={(e) => { const np = [...players]; np[i].idProof = e.target.files[0]; setPlayers(np); }} />
                </div>
                {players.length > 1 && (
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => setPlayers(players.filter((_, j) => j !== i))}>Remove</button>
                )}
              </div>
            ))}
            {players.length < 50 && (
              <button type="button" className="btn btn-outline mb-3" onClick={() => setPlayers([...players, emptyPlayer()])}>Add Player</button>
            )}
            <button type="submit" className="btn btn-primary">Submit (Pay at IMA)</button>
          </form>
        </div>
      </section>
    </>
  );
}
