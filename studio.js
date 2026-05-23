/* ============================================================
   STUDIO PAGE — watch animation, parallax, reveals
   ============================================================ */

(function() {

  // Adaptive perf flags
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SAVE_DATA = (navigator.connection && navigator.connection.saveData) || false;
  const IS_SLOW = (navigator.connection && /(2g|slow-2g)/i.test(navigator.connection.effectiveType)) || false;
  const IS_MOBILE = window.matchMedia('(max-width: 700px)').matches;

  /* ────── REAL-TIME WATCH HANDS ────── */
  function initWatch() {
    const hourHand = document.querySelector('.watch-hand-hour');
    const minuteHand = document.querySelector('.watch-hand-minute');
    const secondHand = document.querySelector('.watch-hand-second');
    if (!hourHand || !minuteHand || !secondHand) return;

    function updateHands() {
      const now = new Date();
      const sec = now.getSeconds() + now.getMilliseconds() / 1000;
      const min = now.getMinutes() + sec / 60;
      const hr = (now.getHours() % 12) + min / 60;

      const sDeg = sec * 6;          // 360 / 60
      const mDeg = min * 6;
      const hDeg = hr * 30;          // 360 / 12

      secondHand.style.transform = `rotate(${sDeg}deg)`;
      minuteHand.style.transform = `rotate(${mDeg}deg)`;
      hourHand.style.transform = `rotate(${hDeg}deg)`;
    }

    updateHands();
    // Adaptive update rate: 30fps desktop, 15fps mobile/save-data (battery)
    const updateRate = (IS_MOBILE || SAVE_DATA) ? 1000 / 15 : 1000 / 30;
    setInterval(updateHands, updateRate);
  }


  /* ────── PARALLAX (mouse-based on watch & perfume) ────── */
  function initParallax() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const stage = document.querySelector('.st-3d-stage');
    if (!stage) return;

    const els = stage.querySelectorAll('[data-parallax]');
    if (!els.length) return;

    let bounds;
    function refresh() { bounds = stage.getBoundingClientRect(); }
    refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, { passive: true });

    stage.addEventListener('mousemove', (e) => {
      const x = (e.clientX - bounds.left) / bounds.width - 0.5;
      const y = (e.clientY - bounds.top) / bounds.height - 0.5;
      els.forEach((el) => {
        const depth = parseFloat(el.dataset.parallax) || 0;
        const baseY = el.classList.contains('watch') ? 'translateY(-50%)' : 'translateY(0)';
        gsap.to(el, {
          x: x * depth * 1.4,
          y: y * depth * 1.4,
          duration: 0.7,
          ease: 'power2.out',
        });
      });
    });

    stage.addEventListener('mouseleave', () => {
      els.forEach((el) => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'expo.out' }));
    });
  }


  /* ────── HERO SHAPES (float in + idle loop) ────── */
  function initHeroShapes() {
    if (typeof gsap === 'undefined') return;
    gsap.from('.sh', {
      scale: 0,
      opacity: 0,
      duration: 1.1,
      stagger: 0.08,
      ease: 'back.out(1.6)',
      delay: 1.7,
    });
    // Idle floats
    gsap.to('.sh-square',   { y: -10, rotation: 4,  duration: 4.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3 });
    gsap.to('.sh-circle',   { y: 12,  rotation: -4, duration: 4.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3.2 });
    gsap.to('.sh-ring',     { y: -8,  rotation: 6,  duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3.4 });
    gsap.to('.sh-triangle', { y: 10,  rotation: -6, duration: 5.0, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3.6 });
  }


  /* ────── FRAMES COLLAGE — random tile shimmer ────── */
  function initFramesShimmer() {
    if (REDUCED_MOTION || SAVE_DATA || IS_SLOW || IS_MOBILE) return;
    const tiles = document.querySelectorAll('.ff-tile');
    if (!tiles.length || typeof gsap === 'undefined') return;
    setInterval(() => {
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      gsap.fromTo(tile, { filter: 'brightness(1)' }, {
        filter: 'brightness(1.4)',
        duration: 0.4,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      });
    }, 800);
  }


  /* ────── SCROLL REVEALS ────── */
  function initReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Hero title (mask reveal)
    gsap.set('.st-hero-title .mask .word', { y: '110%' });
    gsap.to('.st-hero-title .mask .word', {
      y: '0%',
      duration: 1.3,
      stagger: 0.09,
      ease: 'expo.out',
      delay: 1.4,
    });

    // Generic title reveals
    document.querySelectorAll('.st-section-title, .st-3d-title, .quick-title, .reach-num').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    // Film hero
    gsap.from('.film-hero', {
      opacity: 0, y: 40, scale: 0.98,
      duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.film-hero', start: 'top 80%' }
    });

    // Film grid stagger
    gsap.from('.film-card', {
      opacity: 0, y: 40,
      duration: 0.8, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: '.film-grid', start: 'top 80%' }
    });

    // Frames collage
    gsap.from('.ff-tile', {
      opacity: 0, scale: 0.85,
      duration: 0.6, stagger: { each: 0.03, from: 'random' }, ease: 'expo.out',
      scrollTrigger: { trigger: '.frames-collage', start: 'top 80%' }
    });
    gsap.from('.ff-click', {
      opacity: 0, scale: 0.7,
      duration: 0.8, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: '.ff-click', start: 'top 80%' }
    });

    // 3D stage entrance
    gsap.from('.watch', {
      opacity: 0, x: -80, scale: 0.85, rotation: -8,
      duration: 1.5, ease: 'expo.out',
      scrollTrigger: { trigger: '.st-3d-stage', start: 'top 75%' }
    });
    gsap.from('.perfume', {
      opacity: 0, x: 60, y: -30, rotation: 8,
      duration: 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: '.st-3d-stage', start: 'top 75%' }
    });
    gsap.from('.st-3d-text', {
      opacity: 0, y: 30,
      duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: '.st-3d-text', start: 'top 80%' }
    });

    // Subtle continual watch tilt while in view
    ScrollTrigger.create({
      trigger: '.st-3d-stage',
      start: 'top center',
      end: 'bottom center',
      onUpdate: (self) => {
        const t = self.progress;
        const watch = document.getElementById('watch');
        if (watch) {
          watch.style.setProperty('--tilt', `${(t - 0.5) * 6}deg`);
        }
      }
    });

    // Explore feature stagger
    gsap.from('.explore-features li', {
      opacity: 0, x: -20,
      duration: 0.8, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.explore-features', start: 'top 80%' }
    });
    gsap.from('.explore-cta', {
      opacity: 0, y: 30,
      duration: 0.9, ease: 'expo.out',
      scrollTrigger: { trigger: '.explore-cta', start: 'top 80%' }
    });

    // Reach banner
    gsap.from('.reach-inner > *', {
      opacity: 0, y: 20,
      duration: 0.8, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: '.st-reach', start: 'top 85%' }
    });

    // Reels
    gsap.from('.reel', {
      opacity: 0, y: 40,
      duration: 0.9, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: '.reels-grid', start: 'top 80%' }
    });

    // Quick cards
    gsap.from('.quick-card', {
      opacity: 0, y: 30,
      duration: 0.8, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: '.quick-grid', start: 'top 85%' }
    });
  }


  /* ────── BOOT ────── */
  function boot() {
    initWatch();
    initParallax();
    initHeroShapes();
    initFramesShimmer();
    initReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();