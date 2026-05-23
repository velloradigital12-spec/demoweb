/* ============================================================
   PIXELNEST v4 — Lean motion layer
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 1024px)').matches;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAVE_DATA = (navigator.connection && navigator.connection.saveData) || false;
const IS_SLOW = (navigator.connection && /(2g|slow-2g)/i.test(navigator.connection.effectiveType)) || false;

/* ────── LAZY-LOAD BACKGROUND IMAGES ────── */
function initLazyBg() {
  const targets = document.querySelectorAll('[data-bg]');
  if (!targets.length) return;

  // Pick smaller width param when on mobile/slow network — saves 50-70% data
  const VW = window.innerWidth;
  function pickSrc(url) {
    if (!url) return url;
    // Already has w= param? Resize it.
    if (VW <= 480 && (SAVE_DATA || IS_SLOW)) {
      return url.replace(/w=\d+/, 'w=300');
    } else if (VW <= 480) {
      return url.replace(/w=\d+/, 'w=400');
    } else if (VW <= 900) {
      return url.replace(/w=\d+/, 'w=600');
    }
    return url; // desktop: use original
  }

  const load = (el) => {
    const src = pickSrc(el.dataset.bg);
    if (!src || el.classList.contains('bg-loaded')) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      el.style.backgroundImage = `url("${src}")`;
      el.classList.add('bg-loaded');
      el.removeAttribute('data-bg');
    };
    img.onerror = () => el.classList.add('bg-loaded');
    img.src = src;
  };

  if (!('IntersectionObserver' in window)) {
    targets.forEach(load);
    return;
  }

  const rootMargin = (SAVE_DATA || IS_SLOW) ? '50px 0px' : '400px 0px';

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { load(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin, threshold: 0.01 });

  targets.forEach((el) => io.observe(el));

  const eagerCount = (SAVE_DATA || IS_SLOW) ? 1 : 3;
  Array.from(targets).slice(0, eagerCount).forEach(load);
}

/* ────── LOADER ────── */
function runLoader() {
  const loader = document.getElementById('loader');
  const loaderNum = document.getElementById('loaderNum');
  const loaderBar = document.getElementById('loaderBarFill');
  const loaderLogoFinal = document.getElementById('loaderLogoFinal');
  const loaderContent = document.querySelector('.loader-content');
  const curtainTop = document.querySelector('.loader-curtain-top');
  const curtainBot = document.querySelector('.loader-curtain-bot');

  const tl = gsap.timeline({
    onComplete: () => {
      document.body.classList.add('is-loaded');
      initHeroEntry();
    }
  });

  const counter = { v: 0 };
  tl.to(counter, {
    v: 100,
    duration: 1.6,
    ease: 'power2.inOut',
    onUpdate: () => {
      const v = Math.floor(counter.v);
      loaderNum.textContent = v;
      loaderBar.style.width = v + '%';
    }
  })
  .to(loaderContent, { opacity: 0, duration: 0.35, ease: 'power2.out' }, '+=0.1')
  .fromTo(loaderLogoFinal,
    { opacity: 0, scale: 0.85 },
    { opacity: 1, scale: 1, duration: 0.55, ease: 'expo.out' },
    '-=0.15'
  )
  .to(loaderLogoFinal, { opacity: 0, scale: 0.95, duration: 0.4, ease: 'power2.in' }, '+=0.35')
  .to(curtainTop, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '-=0.15')
  .to(curtainBot, { yPercent: 100, duration: 0.85, ease: 'expo.inOut' }, '<')
  .set(loader, { display: 'none' });
}

/* ────── LENIS ────── */
function initLenis() {
  if (typeof Lenis === 'undefined' || IS_TOUCH) return;
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  lenis.on('scroll', ScrollTrigger.update);
}

/* ────── CURSOR (snappy) ────── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const cursorText = document.getElementById('cursorText');
  if (!cursor || IS_TOUCH) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;

  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

  function loop() {
    // fast lerp = 0.5 (was 0.22 — too slow)
    cx += (mx - cx) * 0.5;
    cy += (my - cy) * 0.5;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  document.querySelectorAll('[data-cursor]').forEach((el) => {
    const type = el.dataset.cursor;
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('is-' + type);
      if (type === 'view') cursorText.textContent = 'VIEW';
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-' + type);
      cursorText.textContent = '';
    });
  });
}

/* ────── MAGNETIC BUTTONS ────── */
function initMagnetic() {
  if (IS_TOUCH) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = 0.3;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

/* ────── NAV ────── */
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  document.querySelectorAll('.impact, .work, .awards, .cta, .foot').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 60px',
      end: 'bottom 60px',
      onEnter:     () => nav.classList.add('is-dark'),
      onEnterBack: () => nav.classList.add('is-dark'),
      onLeave:     () => nav.classList.remove('is-dark'),
      onLeaveBack: () => nav.classList.remove('is-dark'),
    });
  });

  const burger = document.getElementById('navBurger');
  const mobile = document.getElementById('mobileMenu');
  if (burger && mobile) {
    burger.addEventListener('click', () => {
      mobile.classList.toggle('is-open');
      burger.classList.toggle('is-open');
    });
    mobile.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobile.classList.remove('is-open');
        burger.classList.remove('is-open');
      });
    });
  }
}

/* ────── HERO ENTRY ────── */
function initHeroEntry() {
  const tl = gsap.timeline();
  tl.to('.hero-title .mask .word', {
    y: 0,
    duration: 1.3,
    stagger: 0.09,
    ease: 'expo.out',
  })
  .from('.hero-sub p, .hero-actions > *', {
    opacity: 0, y: 24,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power3.out',
  }, '-=0.8')
  .from('.kinetic', {
    opacity: 0, y: 40, scale: 0.94,
    duration: 1.1, ease: 'expo.out',
  }, '-=1.2');
}

/* ────── KINETIC LOGO ────── */
function initKineticLogo() {
  const root = document.getElementById('kineticLogo');
  const word = document.getElementById('kineticWord');
  const counter = document.getElementById('kineticCounter');
  const nameLines = document.querySelectorAll('#kineticName .kn-inner');
  if (!root || !word) return;

  // smaller orbit on mobile (proportional)
  const w = root.clientWidth;
  const radiusScale = w < 420 ? 0.5 : (w < 640 ? 0.62 : 1);

  const r = (v) => v * radiusScale;

  const compositions = [
    { label: 'Branding',
      square:   { x: r(-180), y: r(-130), rotation: -8,  scale: 1 },
      circle:   { x: r( 190), y: r(-110), rotation: 0,   scale: 1 },
      ring:     { x: r(-200), y: r( 130), rotation: 0,   scale: 1 },
      triangle: { x: r( 180), y: r( 140), rotation: 12,  scale: 1 },
    },
    { label: 'CGI Advertising',
      square:   { x: r( 160), y: r( 150), rotation: 18,  scale: 0.95 },
      circle:   { x: r(-190), y: r(   0), rotation: 0,   scale: 1.1 },
      ring:     { x: r( 210), y: r(-110), rotation: 0,   scale: 0.9 },
      triangle: { x: r(-180), y: r(-140), rotation: -25, scale: 1 },
    },
    { label: 'Social Media',
      square:   { x: r(-210), y: r( 120), rotation: 14,  scale: 1 },
      circle:   { x: r( 200), y: r( 130), rotation: 0,   scale: 0.95 },
      ring:     { x: r(-200), y: r(-130), rotation: 0,   scale: 1.05 },
      triangle: { x: r( 170), y: r(-150), rotation: 22,  scale: 0.95 },
    },
    { label: 'Production',
      square:   { x: r( 210), y: r( -50), rotation: -12, scale: 1.1 },
      circle:   { x: r(-160), y: r( 160), rotation: 0,   scale: 0.9 },
      ring:     { x: r(   0), y: r(-180), rotation: 0,   scale: 1 },
      triangle: { x: r( 160), y: r( 150), rotation: -18, scale: 0.95 },
    },
    { label: 'Art Direction',
      square:   { x: r( 180), y: r(-160), rotation: 22,  scale: 0.95 },
      circle:   { x: r(-200), y: r( 110), rotation: 0,   scale: 1.05 },
      ring:     { x: r( 200), y: r( 130), rotation: 0,   scale: 0.9 },
      triangle: { x: r(-180), y: r(-130), rotation: -30, scale: 1 },
    },
    { label: 'Campaigns',
      square:   { x: r(-200), y: r( -30), rotation: -8,  scale: 1.05 },
      circle:   { x: r( 200), y: r(-130), rotation: 0,   scale: 1 },
      ring:     { x: r( 150), y: r( 150), rotation: 0,   scale: 0.95 },
      triangle: { x: r(-170), y: r( 150), rotation: 20,  scale: 1.05 },
    },
  ];

  const centerProps = { xPercent: -50, yPercent: -50 };
  const first = compositions[0];

  gsap.set('.k-square',   { ...centerProps, ...first.square });
  gsap.set('.k-circle',   { ...centerProps, ...first.circle });
  gsap.set('.k-ring',     { ...centerProps, ...first.ring });
  gsap.set('.k-triangle', { ...centerProps, ...first.triangle });

  // Intro: blast outward
  gsap.from(['.k-square','.k-circle','.k-ring','.k-triangle'], {
    scale: 0, x: 0, y: 0, rotation: 0,
    duration: 1.2,
    stagger: 0.06,
    ease: 'expo.out',
    delay: 1.4,
  });

  if (nameLines.length) {
    gsap.set(nameLines, { y: '110%' });
    gsap.to(nameLines, {
      y: '0%',
      duration: 1.2,
      stagger: 0.1,
      ease: 'expo.out',
      delay: 1.6,
    });
  }
  gsap.from('.kinetic-words, .kinetic-meta', {
    opacity: 0, y: 12,
    duration: 0.7,
    stagger: 0.08,
    ease: 'power3.out',
    delay: 2.1,
  });

  // Idle floats
  gsap.to('.k-square',   { y: '+=10', rotation: '+=3', duration: 4.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.8 });
  gsap.to('.k-circle',   { y: '-=10', rotation: '+=4', duration: 5.0, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3.0 });
  gsap.to('.k-ring',     { y: '+=8',  rotation: '-=4', duration: 4.7, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.9 });
  gsap.to('.k-triangle', { y: '-=12', rotation: '+=4', duration: 5.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3.1 });

  let idx = 0;
  let cycleTimeout = null;

  function cycle() {
    idx = (idx + 1) % compositions.length;
    const next = compositions[idx];

    if (counter) counter.textContent = String(idx + 1).padStart(2, '0') + ' / 0' + compositions.length;

    const tl = gsap.timeline({
      onComplete: () => { cycleTimeout = setTimeout(cycle, 2200); }
    });

    tl.to('.k-shape', {
      x: 0, y: 0, scale: 0.12, rotation: 0,
      duration: 0.5, ease: 'power2.in',
      stagger: { each: 0.04, from: 'random' }
    }, 0);

    if (nameLines.length) {
      tl.to(nameLines, {
        scale: 0.94,
        duration: 0.4,
        ease: 'power2.in',
        stagger: 0.03,
      }, 0);
    }

    tl.to(word, { y: -20, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.05);
    tl.call(() => { word.textContent = next.label; });
    tl.set(word, { y: 20 });

    tl.to('.k-square',   { ...next.square,   duration: 1.0, ease: 'expo.out' }, '+=0.05');
    tl.to('.k-circle',   { ...next.circle,   duration: 1.0, ease: 'expo.out' }, '<0.05');
    tl.to('.k-ring',     { ...next.ring,     duration: 1.0, ease: 'expo.out' }, '<0.05');
    tl.to('.k-triangle', { ...next.triangle, duration: 1.0, ease: 'expo.out' }, '<0.05');

    if (nameLines.length) {
      tl.to(nameLines, {
        scale: 1,
        duration: 0.8,
        ease: 'elastic.out(1, 0.55)',
        stagger: 0.04,
      }, '-=0.85');
    }
    tl.to(word, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out' }, '-=0.55');
  }

  // Skip cycle on reduced-motion or save-data / slow connections (battery/perf)
  if (REDUCED_MOTION || SAVE_DATA || IS_SLOW) {
    return;
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !cycleTimeout) {
          cycleTimeout = setTimeout(cycle, 2600);
        } else if (!e.isIntersecting && cycleTimeout) {
          clearTimeout(cycleTimeout);
          cycleTimeout = null;
        }
      });
    }, { threshold: 0.2 });
    io.observe(root);
  } else {
    cycleTimeout = setTimeout(cycle, 2600);
  }
}

/* ────── SCROLL REVEALS ────── */
function initReveals() {
  // impact title
  gsap.from('.impact-title', {
    opacity: 0, y: 30,
    duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: '.impact-title', start: 'top 85%' }
  });

  // impact cards
  gsap.from('.impact-card', {
    opacity: 0, y: 50,
    duration: 0.9, stagger: 0.08,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.impact-grid', start: 'top 80%' }
  });

  // work title
  gsap.from('.work-title', {
    opacity: 0, y: 30,
    duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: '.work-title', start: 'top 85%' }
  });

  // work cards
  gsap.from('.work-card', {
    opacity: 0, y: 60,
    duration: 1, stagger: 0.07,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.work-grid', start: 'top 80%' }
  });

  // awards title + cards
  gsap.from('.awards-title', {
    opacity: 0, y: 30,
    duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: '.awards-title', start: 'top 85%' }
  });
  gsap.from('.award-card', {
    opacity: 0, y: 40,
    duration: 0.8, stagger: 0.08,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.awards-strip', start: 'top 85%' }
  });

  // CTA title mask reveal
  gsap.set('.cta-title .mask .word', { y: '110%' });
  ScrollTrigger.create({
    trigger: '.cta-title',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to('.cta-title .mask .word', {
        y: '0%',
        duration: 1.2, stagger: 0.12,
        ease: 'expo.out'
      });
    }
  });

  gsap.from('.cta-btn, .cta-foot', {
    opacity: 0, y: 20,
    duration: 0.8, stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.cta-btn', start: 'top 85%' }
  });

  // CTA orbs gentle drift
  gsap.to('.cta-orb-l', { x: 50, y: 30, duration: 10, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.cta-orb-r', { x: -40, y: -20, duration: 12, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}

/* ────── HERO PARALLAX ────── */
function initParallax() {
  gsap.to('.hero-glow-1', {
    y: 80,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero-glow-2', {
    y: -60,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ────── BOOT ────── */
function bootApp() {
  gsap.set('.mask .word', { y: '110%' });

  initLazyBg();
  initLenis();
  initCursor();
  initMagnetic();
  initNav();
  runLoader();
  initKineticLogo();
  initReveals();
  initParallax();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

// With defer, the script runs after the DOM is parsed.
// DOMContentLoaded may have already fired by the time this executes.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}

window.addEventListener('load', () => ScrollTrigger.refresh());