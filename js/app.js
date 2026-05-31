/* ================================================================
   GORILLA MOTORS — APLICACIÓN PRINCIPAL (app.js)
   Menú móvil, lightbox, selector de estrellas, formularios, init
   ================================================================ */

/* ─────────────────────────────────────────────
   MENÚ MÓVIL
   ───────────────────────────────────────────── */
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

/* ─────────────────────────────────────────────
   LIGHTBOX
   ───────────────────────────────────────────── */
function openLbSrc(src, cap) {
  var lb    = document.getElementById('lb');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  if (!lb || !lbImg) return;
  lbImg.src = src;
  if (lbCap) lbCap.textContent = cap || '';
  lb.classList.add('open');
  gsap.from(lbImg, { scale: 0.8, opacity: 0, duration: 0.4, ease: 'back.out(1.5)' });
}
function closeLb() {
  var lb = document.getElementById('lb');
  if (lb) lb.classList.remove('open');
}

/* ─────────────────────────────────────────────
   SELECTOR DE ESTRELLAS
   ───────────────────────────────────────────── */
function setStar(n) {
  var hidden = document.getElementById('revEstrellas');
  if (hidden) hidden.value = n;
  document.querySelectorAll('.star-pick').forEach(function (s) {
    s.style.color = parseInt(s.dataset.v, 10) <= n ? '#fbbf24' : '#222222';
  });
}
/* Inicializar con 5 estrellas */
setStar(5);

/* ─────────────────────────────────────────────
   FORMULARIO DE CONTACTO → WHATSAPP
   ───────────────────────────────────────────── */
var contactoForm = document.getElementById('contactoForm');
if (contactoForm) {
  contactoForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var n   = document.getElementById('fNombre').value;
    var t   = document.getElementById('fTelefono').value;
    var m   = document.getElementById('fMoto').value;
    var s   = document.getElementById('fServicio').value;
    var msg = document.getElementById('fMensaje').value;
    var txt = 'Hola!+Soy+' + encodeURIComponent(n)
      + '.%0AServicio:+' + encodeURIComponent(s || 'Consulta general')
      + '%0AMoto:+'      + encodeURIComponent(m)
      + '%0AMensaje:+'   + encodeURIComponent(msg)
      + '%0ATel:+'       + encodeURIComponent(t);
    window.open('https://wa.me/593098083436?text=' + txt, '_blank');
    showOk('fSuccess');
    this.reset();
    setTimeout(function () { hideEl('fSuccess'); }, 5000);
  });
}

/* ─────────────────────────────────────────────
   FORMULARIO DE RESEÑAS
   ───────────────────────────────────────────── */
var reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
  reviewForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var nombre     = document.getElementById('revNombre').value.trim();
    var estrellas  = parseInt(document.getElementById('revEstrellas').value, 10) || 5;
    var comentario = document.getElementById('revComentario').value.trim();
    if (!nombre || !comentario) return;

    var item = { id: Date.now(), nombre: nombre, estrellas: estrellas, comentario: comentario, ts: Date.now() };
    saveReview(item, function () {
      showOk('revSuccess');
      setTimeout(function () { hideEl('revSuccess'); }, 4000);
    });

    this.reset();
    setStar(5);
  });
}

/* ─────────────────────────────────────────────
   HELPERS DE UI
   ───────────────────────────────────────────── */
function showOk(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'block';
  gsap.from(el, { y: 8, opacity: 0, duration: 0.4 });
}
function hideEl(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/* ─────────────────────────────────────────────
   INICIALIZACIÓN AL CARGAR EL DOM
   ───────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', function () {
  gmInitDB(function () {
    /* Precargar fotos reales si no hay datos aún */
    preloadDefaultData(function () {
      renderVentasGrid();
      renderGaleriaAdmin();
      renderProductosGrid();
      renderPublicReviews();
    });
  });
});

/* ── Carga datos reales (motos en venta + artículos) con control de versión ── */
function preloadDefaultData(cb) {
  var DATA_VER = 'gm_v3';

  if (localStorage.getItem('gm_data_ver') === DATA_VER) {
    cb();
    return;
  }
  localStorage.setItem('gm_data_ver', DATA_VER);

  var pending = 3;
  function done() { pending--; if (pending <= 0) cb(); }

  /* Galería ahora es estática en el HTML — limpiar datos viejos del store */
  gmClearAll('gale', done);

  /* Motos en venta: fotos reales de la carpeta "motos en venta" */
  gmClearAll('motos', function () {
    var motos = [
      { id: 20001, marca: 'Varias Marcas',  anio: '2023', precio: 'Consultar',
        km: 'Varios modelos',
        desc: 'Variedad de motos disponibles. Todas inspeccionadas y certificadas por nuestro taller.',
        fotos: ['fotos/venta-varias.png'] },
      { id: 20002, marca: 'KRG',            anio: '2022', precio: 'Consultar',
        km: 'Bajo kilometraje',
        desc: 'Motos KRG en excelente estado. Revisadas y certificadas por Gorila Motos.',
        fotos: ['fotos/venta-krg.png'] },
      { id: 20003, marca: 'Royal Enfield',  anio: '2021', precio: 'Consultar',
        km: 'Motor perfecto',
        desc: 'Royal Enfield clásica negra. Motor en perfecto estado, papeles al día.',
        fotos: ['fotos/venta-royal.png'] },
    ];
    var saved = 0;
    motos.forEach(function (m) {
      gmSave('motos', m, function () { saved++; if (saved === motos.length) done(); });
    });
  });

  /* Productos / artículos: fotos reales de la carpeta "articulos" */
  gmClearAll('productos', function () {
    var prods = [
      { id: 30001, nombre: 'Pastillas de Freno', precio: 'Consultar',
        desc: 'Para todas las marcas. Originales y alternativas de calidad.',
        foto: 'fotos/prod-pastillas.png' },
      { id: 30002, nombre: 'Partes para Motor',  precio: 'Consultar',
        desc: 'Pistones, segmentos, cojinetes y más. Originales y alternativas.',
        foto: 'fotos/prod-partes.png' },
    ];
    var saved = 0;
    prods.forEach(function (p) {
      gmSave('productos', p, function () { saved++; if (saved === prods.length) done(); });
    });
  });
}
