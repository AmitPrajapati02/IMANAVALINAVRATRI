import { Link } from 'react-router-dom';
import { useSiteScripts } from '../hooks/useSiteScripts';
import banner1 from '../assets/img/Banner01.png';
import banner2 from '../assets/img/Banner02.jpg';
import banner3 from '../assets/img/Banner03.jpg';
import navLogo from '../assets/img/navratri_logo_transparent.png';
import img1 from '../assets/img/Img1.jpeg';
import img2 from '../assets/img/IMG_02.JPG';
import img3 from '../assets/img/Img2.jpeg';
import img4 from '../assets/img/Img3.jpeg';
import img5 from '../assets/img/Img4.jpeg';
import img6 from '../assets/img/IMG_04.JPG';

export default function Home() {
  useSiteScripts();
  const memories = [img1, img2, img3, img4, img5, img6];

  return (
    <>
      <section className="hero-slider" data-slider="hero">
        <div className="slides">
          <div className="slide is-active"><img src={banner1} alt="IMA Navratri Slider 1" /></div>
          <div className="slide"><img src={banner2} alt="IMA Navratri Slider 2" /></div>
          <div className="slide"><img src={banner3} alt="IMA Navratri Slider 3" /></div>
        </div>
        <button className="slider-control prev" aria-label="Previous slide" type="button">&#10094;</button>
        <button className="slider-control next" aria-label="Next slide" type="button">&#10095;</button>
        <div className="dots" aria-label="Hero slider pagination" />
      </section>

      <section className="section about-navratri" id="about-navratri">
        <div className="container grid grid-2">
          <div>
            <h2>About Navratri</h2>
            <p>
              Navratri is a vibrant nine-night festival celebrating the triumph of good over evil.
              Each night brings devotional music, energetic Garba and Dandiya, and a spirit of unity.
            </p>
            <br />
            <div><strong>Date: </strong>Sun 11 Oct – Tue 20 Oct 2026</div>
            <br /><br />
            <div className="actions">
              <Link to="/navratri" className="btn btn-primary">Explore Navratri</Link>
              <Link to="/about-ima" className="btn btn-outline">About IMA</Link>
            </div>
          </div>
          <div className="media-card">
            <img src={navLogo} alt="Navratri celebration" />
          </div>
        </div>
      </section>

      <section className="section photo-slider" id="memories" data-slider="photos">
        <div className="container">
          <div className="section-head">
            <h2>Navratri Memories</h2>
            <p>Relive the magic from past celebrations.</p>
          </div>
        </div>
        <div className="carousel">
          <button className="carousel-control prev" aria-label="Previous" type="button">&#10094;</button>
          <div className="track">
            {memories.map((src, i) => (
              <a key={i} className="card" href="#" data-lightbox onClick={(e) => e.preventDefault()}>
                <img src={src} alt={`Memory ${i + 1}`} />
              </a>
            ))}
          </div>
          <button className="carousel-control next" aria-label="Next" type="button">&#10095;</button>
        </div>
      </section>

      <section className="section why-ima">
        <div className="container">
          <h2>Why IMA Navratri?</h2>
          <div className="grid grid-3 features">
            <div className="feature">
              <div className="icon">🎵</div>
              <h3>Top Artists</h3>
              <p>Experience electrifying performances from renowned singers and bands.</p>
            </div>
            <div className="feature">
              <div className="icon">👨‍👩‍👧‍👦</div>
              <h3>Family Friendly</h3>
              <p>Safe, inclusive, and welcoming environment for all ages.</p>
            </div>
            <div className="feature">
              <div className="icon">✨</div>
              <h3>Authentic Garba</h3>
              <p>Traditional rhythms, vibrant decor, and the true spirit of Navratri.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
