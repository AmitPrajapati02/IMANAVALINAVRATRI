import StaticPage from './StaticPage';
import aboutImg from '../assets/img/home-about.png';

export default function AboutIMA() {
  return (
    <StaticPage title="About IMA">
      <div className="grid grid-2">
        <div>
          <p>
            The Indian Medical Association (IMA) Vadodara organizes Navli Navratri as a community celebration
            bringing together members, families, and guests for Garba and cultural festivities.
          </p>
        </div>
        <div className="media-card">
          <img src={aboutImg} alt="About IMA" />
        </div>
      </div>
    </StaticPage>
  );
}
