import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { playerApi } from '../api/client';

export default function PlayerDetailsByCode() {
  const { codeValue } = useParams();
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    playerApi.getByQr(codeValue)
      .then((res) => setPlayer(res.data))
      .catch(() => setError(true));
  }, [codeValue]);

  if (error) {
    return (
      <section className="section">
        <div className="container text-center">
          <p>Invalid QR code.</p>
          <Link to="/register" className="btn btn-primary">Register</Link>
        </div>
      </section>
    );
  }
  if (!player) return null;

  return (
    <section className="section">
      <div className="container text-center">
        <h2>Player Details</h2>
        {player.photoPath && <img src={player.photoPath} alt={player.fullName} style={{ maxWidth: 200, borderRadius: 8 }} />}
        <p><strong>{player.fullName}</strong></p>
        <p>{player.playerType}</p>
      </div>
    </section>
  );
}
