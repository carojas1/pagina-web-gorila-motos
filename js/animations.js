/* ================================================================
   GORILLA MOTORS — ANIMACIONES (animations.js)
   GSAP, ScrollTrigger, cursor, loader, glitch, contadores, telemetría
   ================================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   CURSOR PERSONALIZADO
   ───────────────────────────────────────────── */
(function () {
  var cur  = document.getElementById('cur');
  var curR = document.getElementById('curR');
  if (!cur || !curR) return;

  document.addEventListener('mousemove', function (e) {
    gsap.to(cur,  { x: e.clientX, y: e.clientY, duration: 0 });
    gsap.to(curR, { x: e.clientX, y: e.clientY, duration: 0.16 });
  });

  document.querySelectorAll('a, button, [onclick], .srv-card, .prod-card, .moto-card, .gale-item').forEach(function (el) {
    el.addEventListener('mouseenter', function () { gsap.to(curR, { scale: 2.2, duration: 0.2 }); });
    el.addEventListener('mouseleave', function () { gsap.to(curR, { scale: 1,   duration: 0.2 }); });
  });
}());

/* ─────────────────────────────────────────────
   LOADER
   ───────────────────────────────────────────── */
(function () {
  var loaderEl = document.getElementById('loader');
  var ldFill   = document.getElementById('ldFill');
  var ldTxt    = document.getElementById('ldTxt');
  if (!loaderEl) return;

  /* Si ya se mostró antes en esta sesión, saltar el loader */
  var skipLoader = sessionStorage.getItem('gm_loaded');
  if (skipLoader) {
    loaderEl.style.display = 'none';
    bootHero();
    return;
  }

  var pct = 0;
  var iv = setInterval(function () {
    pct += Math.random() * 22 + 8;   /* más rápido */
    if (pct >= 100) {
      pct = 100;
      clearInterval(iv);
      if (ldFill) ldFill.style.width = '100%';
      if (ldTxt)  ldTxt.textContent  = 'SISTEMA LISTO // 100%';
      sessionStorage.setItem('gm_loaded', '1');
      setTimeout(function () {
        gsap.to(loaderEl, {
          yPercent: -100, duration: 0.7, ease: 'power3.inOut',
          onComplete: function () {
            loaderEl.style.display = 'none';
            bootHero();
          }
        });
      }, 280);
      return;
    }
    if (ldFill) ldFill.style.width = Math.min(pct, 100) + '%';
    if (ldTxt)  ldTxt.textContent  = 'INICIANDO // ' + Math.round(pct) + '%';
  }, 70);
}());

/* ─────────────────────────────────────────────
   ANIMACIONES DEL HÉROE (se dispara cuando el loader termina)
   ───────────────────────────────────────────── */
function bootHero() {
  var hc = document.querySelector('.hero-content');
  if (!hc) return;

  var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  var logoImg   = hc.querySelector('.hero-logo-img');
  var gorilaT   = hc.querySelector('.hero-gorila-txt');
  var heroTitle = hc.querySelector('.hero-title');

  if (logoImg) {
    tl.fromTo(logoImg,
      { scale: 0.5, opacity: 0, rotation: -15 },
      { scale: 1,   opacity: 1, rotation: 0,   duration: 0.85, ease: 'back.out(1.4)' }
    );
  }
  if (gorilaT) {
    tl.fromTo(gorilaT,
      { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
      { clipPath: 'inset(0 0% 0 0)',   opacity: 1, duration: 0.75, ease: 'power3.out' },
      '-=0.35'
    );
  }
  tl.from(hc.querySelector('.hero-badge'), { y: 22, opacity: 0, duration: 0.45 }, '-=0.35')
    .fromTo(heroTitle || '.hero-title',
      { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out' }, '-=0.2')
    .from(hc.querySelector('.hero-sub'),   { y: 32, opacity: 0, duration: 0.55 }, '-=0.4')
    .from(hc.querySelectorAll('.btn'),     { y: 22, opacity: 0, stagger: 0.13, duration: 0.48 }, '-=0.3')
    .from('.stats-bar .stat-item',         { y: 18, opacity: 0, stagger: 0.1, duration: 0.4 }, '-=0.15');
}

/* ─────────────────────────────────────────────
   EFECTO GLITCH
   ───────────────────────────────────────────── */
function glitchEl(el) {
  if (!el) return;
  gsap.to(el, {
    skewX: 7, x: 5, duration: 0.06, repeat: 4, yoyo: true, ease: 'none',
    onComplete: function () { gsap.set(el, { skewX: 0, x: 0 }); }
  });
}
setInterval(function () {
  var els = document.querySelectorAll('h1, .sec-title');
  if (els.length) glitchEl(els[Math.floor(Math.random() * els.length)]);
}, 5500);

/* ─────────────────────────────────────────────
   PARALLAX HÉROE
   ───────────────────────────────────────────── */
var heroBg = document.getElementById('heroBg');
if (heroBg) {
  gsap.to(heroBg, {
    yPercent: 30,
    ease: "none",
    scrollTrigger: {
      trigger: "#inicio",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });
}

/* ─────────────────────────────────────────────
   BARRA DE PROGRESO DE SCROLL
   ───────────────────────────────────────────── */
var scrollProg = document.getElementById('scrollProg');
window.addEventListener('scroll', function () {
  var st = window.scrollY;
  var dh = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollProg && dh > 0) scrollProg.style.width = (st / dh * 100) + '%';

  /* Navbar shadow */
  if (navbar) {
    navbar.style.boxShadow = st > 60 ? '0 4px 28px rgba(0,0,0,.9)' : 'none';
  }
}, { passive: true });

/* ─────────────────────────────────────────────
   NAVBAR — sombra al hacer scroll (manejado arriba)
   ───────────────────────────────────────────── */
var navbar = document.getElementById('navbar');

/* ─────────────────────────────────────────────
   FADE-IN (IntersectionObserver global — usado también por admin.js)
   ───────────────────────────────────────────── */
var io = new IntersectionObserver(function (entries, obs) {
  entries.forEach(function (e) {
    if (e.isIntersecting) { e.target.classList.add('show'); obs.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.fi, .fi-l, .fi-r').forEach(function (el) { io.observe(el); });

/* ─────────────────────────────────────────────
   CONTADORES ANIMADOS (.cnt con data-t)
   ───────────────────────────────────────────── */
var cntObs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (!e.isIntersecting) return;
    cntObs.unobserve(e.target);
    var target = parseInt(e.target.dataset.t, 10);
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 2.2, ease: 'power2.out',
      onUpdate: function () { e.target.textContent = Math.round(obj.v); }
    });
  });
}, { threshold: 0.5 });
document.querySelectorAll('.cnt').forEach(function (el) { cntObs.observe(el); });

/* ─────────────────────────────────────────────
   TELEMETRÍA FLUCTUANTE (.tlm con data-b y data-v)
   ───────────────────────────────────────────── */
setInterval(function () {
  document.querySelectorAll('.tlm').forEach(function (el) {
    var b = parseFloat(el.dataset.b), v = parseFloat(el.dataset.v);
    el.textContent = Math.round(b + Math.random() * v * 2 - v);
    gsap.to(el, {
      color: '#ff5555', duration: 0.1,
      onComplete: function () { gsap.to(el, { color: '#c00000', duration: 0.3 }); }
    });
  });
}, 2200);

/* ─────────────────────────────────────────────
   SCROLL TRIGGERS POR SECCIÓN
   Usamos gsap.fromTo() con destino EXPLÍCITO para evitar
   conflicto con la clase .fi (que tiene opacity:0 por defecto).
   ───────────────────────────────────────────── */
var secTriggers = [
  {
    trigger: '#servicios', target: '.srv-card',
    from: { y: 50, opacity: 0 },
    to:   { y: 0,  opacity: 1, stagger: 0.09, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' }
  },
  {
    trigger: '#galeria', target: '#galeriaFixed > .gale-item',
    from: { scale: 0.88, opacity: 0 },
    to:   { scale: 1,    opacity: 1, stagger: 0.1, duration: 0.65, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }
  },
  {
    trigger: '#productos', target: '.prod-card',
    from: { y: 40, opacity: 0 },
    to:   { y: 0,  opacity: 1, stagger: 0.09, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' }
  },
  {
    trigger: '#ventas', target: '.moto-card',
    from: { y: 40, opacity: 0 },
    to:   { y: 0,  opacity: 1, stagger: 0.1, duration: 0.65, ease: 'power3.out', clearProps: 'transform,opacity' }
  },
  {
    trigger: '#reseñas', target: '#reviewsGrid .rev-card',
    from: { y: 30, opacity: 0 },
    to:   { y: 0,  opacity: 1, stagger: 0.09, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' }
  },
];
secTriggers.forEach(function (cfg) {
  ScrollTrigger.create({
    trigger: cfg.trigger, start: 'top 84%', once: true,
    onEnter: function () {
      /* Primero mostramos con CSS para que el clearProps quede limpio */
      document.querySelectorAll(cfg.target).forEach(function (el) { el.classList.add('show'); });
      gsap.fromTo(cfg.target, cfg.from, cfg.to);
    }
  });
});

ScrollTrigger.create({
  trigger: '#contacto', start: 'top 80%', once: true,
  onEnter: function () {
    document.querySelectorAll('.fi-l,.fi-r').forEach(function(el){ el.classList.add('show'); });
    gsap.fromTo('.fi-l', { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' });
    gsap.fromTo('.fi-r', { x:  60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.15, clearProps: 'transform,opacity' });
  }
});
ScrollTrigger.create({
  trigger: 'footer', start: 'top 90%', once: true,
  onEnter: function () {
    gsap.fromTo('.footer-grid > *',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity' }
    );
  }
});

/* ─────────────────────────────────────────────
   CLIP-PATH REVEAL — TÍTULOS DE SECCIÓN
   Efecto de barrido horizontal al aparecer en pantalla
   ───────────────────────────────────────────── */
document.querySelectorAll('.sec-title').forEach(function (el) {
  gsap.fromTo(el,
    { clipPath: 'inset(0 100% 0 0)', opacity: 0.6 },
    { clipPath: 'inset(0 0% 0 0)',   opacity: 1,
      duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    }
  );
});

/* ─────────────────────────────────────────────
   PARALLAX SUAVE — IMÁGENES DE GALERÍA
   Cada imagen se desplaza verticalmente con el scroll (scrub)
   ───────────────────────────────────────────── */
gsap.utils.toArray('#galeriaFixed .gale-item img').forEach(function (img) {
  gsap.fromTo(img,
    { yPercent: 8 },
    { yPercent: -8, ease: 'none',
      scrollTrigger: {
        trigger: img.closest('.gale-item'),
        start: 'top bottom', end: 'bottom top',
        scrub: 0.8
      }
    }
  );
});

/* ─────────────────────────────────────────────
   REVELACIÓN DE DIVISORES
   ───────────────────────────────────────────── */
document.querySelectorAll('.sec-divider').forEach(function (el) {
  gsap.fromTo(el,
    { scaleX: 0, transformOrigin: 'left center' },
    { scaleX: 1, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    }
  );
});

/* ─────────────────────────────────────────────
   SPOTLIGHT EN TARJETAS DE SERVICIOS
   ───────────────────────────────────────────── */
document.querySelectorAll('.srv-card').forEach(function (card) {
  card.addEventListener('mousemove', function (e) {
    var r = card.getBoundingClientRect();
    card.style.setProperty('--sx', ((e.clientX - r.left) / r.width  * 100) + '%');
    card.style.setProperty('--sy', ((e.clientY - r.top)  / r.height * 100) + '%');
  });
});
