import StaticPage from './StaticPage';
import bhupendra from '../assets/IMATeam/Bhupendra_Kapadiya.png';
import ketan from '../assets/IMATeam/Ketan_Mehta.png';
import mehul from '../assets/IMATeam/Mehul_Desai.png';
import mitesh from '../assets/IMATeam/Mitesh_Shah.png';
import pragnesh from '../assets/IMATeam/Pragnesh_Shah.png';
import shravan from '../assets/IMATeam/Shravan_Dave.png';

const members = [
  { name: 'Bhupendra Kapadiya', img: bhupendra },
  { name: 'Ketan Mehta', img: ketan },
  { name: 'Mehul Desai', img: mehul },
  { name: 'Mitesh Shah', img: mitesh },
  { name: 'Pragnesh Shah', img: pragnesh },
  { name: 'Shravan Dave', img: shravan },
];

export default function Committee() {
  return (
    <StaticPage title="Committee">
      <div className="grid grid-3">
        {members.map((m) => (
          <div key={m.name} className="card person">
            <img src={m.img} alt={m.name} />
            <h3>{m.name}</h3>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
