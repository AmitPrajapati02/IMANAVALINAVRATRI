(function () {
  const body = document.body;
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header scroll effect
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe elements for animation
  document.querySelectorAll('.section, .feature, .card, .media-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const submenuToggle = document.querySelectorAll('.submenu-toggle');
  const menu = document.getElementById('primary-menu');
  if (navToggle && menu) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = body.classList.toggle('menu-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    
    // Close menu when clicking on menu links (except submenu toggles)
    menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && !e.target.closest('.submenu-toggle')) {
        body.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (body.classList.contains('menu-open') && !menu.contains(e.target) && !navToggle.contains(e.target)) {
        body.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) {
        body.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Submenu logic
  submenuToggle.forEach((btn) => {
    const parent = btn.closest('.has-submenu');
    btn.addEventListener('click', () => {
      const isOpen = parent.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!parent.contains(e.target)) {
        parent.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Simple hero slider
  function initHeroSlider(root) {
    const slidesRoot = root.querySelector('.slides');
    const slides = Array.from(root.querySelectorAll('.slide'));
    const prev = root.querySelector('.slider-control.prev');
    const next = root.querySelector('.slider-control.next');
    const dotsRoot = root.querySelector('.dots');
    if (!slides.length) return;

    let index = 0;
    let timerId = null;

    const createDots = () => {
      dotsRoot.innerHTML = '';
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Go to slide ${i + 1}`);
        b.addEventListener('click', () => goTo(i));
        dotsRoot.appendChild(b);
      });
    };

    const setActive = (i) => {
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
      const dots = dotsRoot.querySelectorAll('button');
      dots.forEach((d, idx) => d.setAttribute('aria-current', idx === i ? 'true' : 'false'));
    };

    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      setActive(index);
      restart();
    };

    const prevSlide = () => goTo(index - 1);
    const nextSlide = () => goTo(index + 1);

    const start = () => {
      timerId = setInterval(nextSlide, 5000);
    };
    const stop = () => timerId && clearInterval(timerId);
    const restart = () => {
      stop();
      start();
    };

    createDots();
    setActive(0);
    start();

    prev && prev.addEventListener('click', prevSlide);
    next && next.addEventListener('click', nextSlide);

    // pause on hover
    slidesRoot.addEventListener('mouseenter', stop);
    slidesRoot.addEventListener('mouseleave', start);
  }

  document.querySelectorAll('[data-slider="hero"]').forEach(initHeroSlider);

  // Photo carousel controls with auto-play
  document.querySelectorAll('[data-slider="photos"]').forEach((root) => {
    const track = root.querySelector('.track');
    const cards = track ? track.querySelectorAll('.card') : [];
    const prev = root.querySelector('.carousel-control.prev');
    const next = root.querySelector('.carousel-control.next');
    
    if (!track || cards.length === 0) return;
    
    let currentIndex = 0;
    const totalCards = cards.length;
    const cardsPerView = window.innerWidth <= 600 ? 2 : 4;
    const maxIndex = Math.max(0, totalCards - cardsPerView);
    
    const showCards = (startIndex) => {
      cards.forEach((card, index) => {
        if (index >= startIndex && index < startIndex + cardsPerView) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    };
    
    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % (maxIndex + 1);
      showCards(currentIndex);
    };
    
    const prevSlide = () => {
      currentIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
      showCards(currentIndex);
    };
    
    // Auto-play functionality
    let autoPlayTimer;
    const startAutoPlay = () => {
      autoPlayTimer = setInterval(nextSlide, 4000);
    };
    
    const stopAutoPlay = () => {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    };
    
    // Initialize
    showCards(0);
    startAutoPlay();
    
    // Event listeners
    prev && prev.addEventListener('click', () => {
      prevSlide();
      stopAutoPlay();
      startAutoPlay();
    });
    
    next && next.addEventListener('click', () => {
      nextSlide();
      stopAutoPlay();
      startAutoPlay();
    });
    
    // Pause on hover
    track.addEventListener('mouseenter', stopAutoPlay);
    track.addEventListener('mouseleave', startAutoPlay);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      const newCardsPerView = window.innerWidth <= 600 ? 2 : 4;
      if (newCardsPerView !== cardsPerView) {
        location.reload(); // Simple solution to reinitialize
      }
    });
  });

  // Lightbox (for gallery and photo slider)
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  lightboxClose && lightboxClose.addEventListener('click', closeLightbox);
  lightbox && lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.querySelectorAll('[data-lightbox]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const img = a.querySelector('img');
      if (img) openLightbox(img.src, img.alt);
    });
  });

  // Forms: basic validation & fake submit
  function handleForm(form, statusSelector) {
    const status = form.querySelector(statusSelector);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('.form-field').forEach((field) => {
        const input = field.querySelector('input, textarea, select');
        const error = field.querySelector('.error');
        if (input) {
          if (!input.checkValidity()) {
            valid = false;
            if (error) error.textContent = input.validationMessage || 'Please fill this field correctly.';
          } else {
            if (error) error.textContent = '';
          }
        }
      });
      if (!valid) return;

      // Simulate success
      if (status) status.textContent = 'Submitted! We will contact you shortly.';
      form.reset();
    });
  }

  const regForm = document.getElementById('registrationForm');
  if (regForm) handleForm(regForm, '#formStatus');
  const contactForm = document.getElementById('contactForm');
  if (contactForm) handleForm(contactForm, '#contactStatus');

  // Home page floating registration button — hide near footer
  const floatingRegister = document.querySelector('.home-floating-register');
  const siteFooter = document.querySelector('.site-footer');
  if (floatingRegister && siteFooter) {
    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          floatingRegister.classList.toggle('is-hidden', entry.isIntersecting);
        });
      },
      { root: null, threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    footerObserver.observe(siteFooter);
  }
})();

