import { PageHero, useSiteScripts } from '../hooks/useSiteScripts';
import g1 from '../assets/img/IMG_01.JPG';
import g2 from '../assets/img/IMG_02.JPG';
import g3 from '../assets/img/IMG_03.JPG';
import g4 from '../assets/img/IMG_04.JPG';
import g5 from '../assets/img/IMG_05.JPG';
import g6 from '../assets/img/IMG_06.JPG';
import g7 from '../assets/img/IMG_07.JPG';
import g8 from '../assets/img/IMG_08.JPG';

const images = [g1, g2, g3, g4, g5, g6, g7, g8];

export default function Gallery() {
  useSiteScripts();
  return (
    <>
      <PageHero title="Gallery" />
      <section className="section">
        <div className="container grid grid-3">
          {images.map((src, i) => (
            <a key={i} className="card" href="#" data-lightbox onClick={(e) => e.preventDefault()}>
              <img src={src} alt={`Gallery ${i + 1}`} />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
