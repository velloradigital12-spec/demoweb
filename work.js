/* ============================================================
   WORK PAGE — carousels, feed parallax, reveals
   ============================================================ */

(function() {

  /* ────── LAZY LOAD BACKGROUND IMAGES ──────
     Loads each [data-bg] only when it enters viewport (rootMargin gives headroom).
     Preloads in a hidden Image first so paint is smooth, no flicker. */
  function initLazyBg() {
    const targets = document.querySelectorAll('[data-bg]');
    if (!targets.length) return;

    const load = (el) => {
      const src = el.dataset.bg;
      if (!src || el.classList.contains('bg-loaded')) return;
      const img = new Image();
      img.onload = () => {
        el.style.backgroundImage = `url("${src}")`;
        el.classList.add('bg-loaded');
        el.removeAttribute('data-bg');
      };
      img.onerror = () => {
        // graceful: just mark loaded so skeleton stops
        el.classList.add('bg-loaded');
      };
      img.src = src;
    };

    if (!('IntersectionObserver' in window)) {
      // Fallback: load everything immediately
      targets.forEach(load);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          load(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '300px 0px',  // start loading 300px before entering view
      threshold: 0.01
    });

    targets.forEach((el) => io.observe(el));

    // Eagerly load the first 6 images (above fold) right away — no waiting
    Array.from(targets).slice(0, 6).forEach(load);
  }

  initLazyBg();


  /* ────── CAROUSEL ────── */
  function initCarousel(root) {
    const track = root.querySelector('.carousel-track');
    const dotsHost = root.querySelector('[data-dots]');
    if (!track) return;

    const cards = track.children;
    const total = cards.length;

    // Compute slides per view based on first card width
    function slidesPerView() {
      const w = window.innerWidth;
      if (w >= 1080) return root.classList.contains('uiux-context') ? 3 : 4;
      if (w >= 640) return 2;
      return 1;
    }

    // Detect uiux carousel
    if (root.querySelector('.uiux-card')) root.classList.add('uiux-context');

    let perView = slidesPerView();
    let pages = Math.max(1, Math.ceil(total - perView + 1));
    let idx = 0;

    // Build dots
    function buildDots() {
      dotsHost.innerHTML = '';
      perView = slidesPerView();
      pages = Math.max(1, total - perView + 1);
      for (let i = 0; i < pages; i++) {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Slide ' + (i + 1));
        b.addEventListener('click', () => { idx = i; render(); restartAuto(); });
        dotsHost.appendChild(b);
      }
      updateDots();
    }
    function updateDots() {
      dotsHost.querySelectorAll('button').forEach((b, i) => {
        b.classList.toggle('is-active', i === idx);
      });
    }
    function render() {
      const card = cards[0];
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const cardW = card.getBoundingClientRect().width + gap;
      track.style.transform = `translateX(${-idx * cardW}px)`;
      updateDots();
    }

    let autoTimer = null;
    function nextAuto() {
      idx = (idx + 1) % pages;
      render();
    }
    function restartAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(nextAuto, 3800);
    }

    // Touch swipe
    let touchStartX = 0;
    let touchDx = 0;
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      clearInterval(autoTimer);
    }, { passive: true });
    track.addEventListener('touchmove', (e) => {
      touchDx = e.touches[0].clientX - touchStartX;
    }, { passive: true });
    track.addEventListener('touchend', () => {
      if (Math.abs(touchDx) > 50) {
        if (touchDx < 0) idx = Math.min(pages - 1, idx + 1);
        else idx = Math.max(0, idx - 1);
        render();
      }
      touchDx = 0;
      restartAuto();
    });

    // Arrow buttons
    root.querySelectorAll('[data-arrow]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.arrow;
        if (dir === 'next') idx = (idx + 1) % pages;
        else                idx = (idx - 1 + pages) % pages;
        render();
        restartAuto();
      });
    });

    buildDots();
    render();
    restartAuto();

    // Pause on hover
    root.addEventListener('mouseenter', () => clearInterval(autoTimer));
    root.addEventListener('mouseleave', () => restartAuto());

    window.addEventListener('resize', () => {
      const newPerView = slidesPerView();
      if (newPerView !== perView) {
        idx = 0;
        buildDots();
      }
      render();
    });
  }

  document.querySelectorAll('[data-carousel]').forEach(initCarousel);


  /* ────── FEED ROW PARALLAX (rows scroll opposite ways) ────── */
  if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
    document.querySelectorAll('.feed-row').forEach((row) => {
      const direction = row.classList.contains('feed-row-down') ? -1 : 1;
      gsap.fromTo(row,
        { x: direction === 1 ? -100 : 100 },
        {
          x: direction === 1 ? -400 : 400,
          ease: 'none',
          scrollTrigger: {
            trigger: row.closest('.wsec-feed'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          }
        }
      );
    });

    /* ────── REVEAL ANIMATIONS ────── */
    gsap.from('.wsec-branding .wsec-title, .wsec-branding .wsec-count', {
      opacity: 0, y: 28,
      duration: 0.9, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.wsec-branding', start: 'top 80%' }
    });
    gsap.from('.wsec-branding .brand-card', {
      opacity: 0, y: 50,
      duration: 1, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: '.wsec-branding .carousel-track', start: 'top 85%' }
    });

    gsap.from('.wsec-projects .wsec-title', {
      opacity: 0, y: 28,
      duration: 0.9, ease: 'expo.out',
      scrollTrigger: { trigger: '.wsec-projects', start: 'top 85%' }
    });
    gsap.from('.m-card', {
      opacity: 0, y: 40, scale: 0.96,
      duration: 0.8, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: '.masonry', start: 'top 80%' }
    });

    gsap.from('.wsec-feed .wsec-pill', {
      opacity: 0, y: 20, scale: 0.9,
      duration: 0.8, ease: 'back.out(1.4)',
      scrollTrigger: { trigger: '.wsec-feed', start: 'top 80%' }
    });

    gsap.from('.wsec-uiux .wsec-title', {
      opacity: 0, y: 28,
      duration: 0.9, ease: 'expo.out',
      scrollTrigger: { trigger: '.wsec-uiux', start: 'top 85%' }
    });
    gsap.from('.uiux-card', {
      opacity: 0, y: 50,
      duration: 1, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.wsec-uiux .carousel-track', start: 'top 85%' }
    });
  }

})();