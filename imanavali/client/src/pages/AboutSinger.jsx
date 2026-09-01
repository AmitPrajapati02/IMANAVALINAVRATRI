import StaticPage from './StaticPage';
import artist from '../assets/img/RavinNaik.jpg';

export default function AboutSinger() {
  return (
    <StaticPage title="Artist">
      <div className="grid grid-2">
        <div>
          <p>Experience live performances from renowned artists who bring energy and devotion to every Garba night.</p>
        </div>
        <div className="media-card">
          <img src={artist} alt="Performing artist" />
        </div>
      </div>
    </StaticPage>
  );
}
