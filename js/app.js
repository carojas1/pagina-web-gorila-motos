/* ================================================================
   GORILLA MOTORS - APP
   Menu movil, lightbox, estrellas, formularios e inicializacion.
   ================================================================ */

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

function closeMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

function openLbSrc(src, cap) {
  var lb = document.getElementById('lb');
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

function renderSiteSettings() {
  if (typeof gmGetSettings !== 'function') return;
  var s = gmGetSettings();
  var phoneDisplay = s.phone_display || '098 083 4367';
  var phoneWa = (s.phone_wa || '').replace(/\D/g, '') || '593980834367';
  var email = s.email || 'gorilamotos2026@gmail.com';
  var telHref = 'tel:' + phoneDisplay.replace(/\D/g, '');
  var waHref = 'https://wa.me/' + phoneWa;

  document.querySelectorAll('[data-gm-phone]').forEach(function (el) { el.textContent = phoneDisplay; });
  document.querySelectorAll('[data-gm-phone-link]').forEach(function (el) { el.href = telHref; });
  document.querySelectorAll('[data-gm-whatsapp-link]').forEach(function (el) { el.href = waHref; });
  document.querySelectorAll('[data-gm-email]').forEach(function (el) { el.textContent = email; });
  document.querySelectorAll('[data-gm-email-link]').forEach(function (el) { el.href = 'mailto:' + email; });
  document.querySelectorAll('[data-gm-address]').forEach(function (el) { el.textContent = s.address_line1 || ''; });
  document.querySelectorAll('[data-gm-city]').forEach(function (el) { el.textContent = s.address_city || 'Cuenca, Ecuador'; });
  document.querySelectorAll('[data-gm-maps-url]').forEach(function (el) { el.href = s.maps_url || '#'; });
  document.querySelectorAll('[data-gm-hours-week]').forEach(function (el) { el.textContent = s.hours_week || ''; });
  document.querySelectorAll('[data-gm-hours-sat]').forEach(function (el) { el.textContent = s.hours_sat || ''; });
  document.querySelectorAll('[data-gm-portal-url]').forEach(function (el) { el.href = s.portal_url || '#'; });
}

function setStar(n) {
  var hidden = document.getElementById('revEstrellas');
  if (hidden) hidden.value = n;
  document.querySelectorAll('.star-pick').forEach(function (s) {
    s.style.color = parseInt(s.dataset.v, 10) <= n ? '#fbbf24' : '#222222';
  });
}

setStar(5);

var contactoForm = document.getElementById('contactoForm');
if (contactoForm) {
  contactoForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = document.getElementById('fNombre').value;
    var t = document.getElementById('fTelefono').value;
    var m = document.getElementById('fMoto').value;
    var s = document.getElementById('fServicio').value;
    var msg = document.getElementById('fMensaje').value;
    var txt = 'Hola!+Soy+' + encodeURIComponent(n)
      + '.%0AServicio:+' + encodeURIComponent(s || 'Consulta general')
      + '%0AMoto:+' + encodeURIComponent(m)
      + '%0AMensaje:+' + encodeURIComponent(msg)
      + '%0ATel:+' + encodeURIComponent(t);
    var settings = typeof gmGetSettings === 'function' ? gmGetSettings() : {};
    var waPhone = ((settings.phone_wa || '') + '').replace(/\D/g, '') || '593980834367';
    window.open('https://wa.me/' + waPhone + '?text=' + txt, '_blank');
    showOk('fSuccess');
    this.reset();
    setTimeout(function () { hideEl('fSuccess'); }, 5000);
  });
}

var reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
  reviewForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var nombre = document.getElementById('revNombre').value.trim();
    var estrellas = parseInt(document.getElementById('revEstrellas').value, 10) || 5;
    var comentario = document.getElementById('revComentario').value.trim();
    var fotoInput = document.getElementById('revFoto');
    if (!nombre || !comentario) return;

    function finish(foto) {
      saveReview({
        nombre: nombre,
        estrellas: estrellas,
        comentario: comentario,
        foto: foto || null,
        ts: Date.now()
      }, function () {
        showOk('revSuccess');
        setTimeout(function () { hideEl('revSuccess'); }, 5000);
      });
      reviewForm.reset();
      setStar(5);
      var prev = document.getElementById('revFotoName');
      if (prev) prev.textContent = '';
    }

    if (fotoInput && fotoInput.files && fotoInput.files[0] && typeof readImg === 'function') {
      readImg(fotoInput.files[0], finish);
    } else {
      finish(null);
    }
  });
}

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

function showReviewFileName(input) {
  var el = document.getElementById('revFotoName');
  if (!el) return;
  el.textContent = input.files && input.files[0] ? input.files[0].name : '';
}

window.addEventListener('DOMContentLoaded', function () {
  gmInitDB(function () {
    renderSiteSettings();
    renderServiciosGrid();
    renderVentasGrid();
    renderGaleriaAdmin();
    renderProductosGrid();
    renderPublicReviews();
  });
});
