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
    window.open('https://wa.me/593980834367?text=' + txt, '_blank');
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
    renderVentasGrid();
    renderGaleriaAdmin();
    renderProductosGrid();
    renderPublicReviews();
  });
});
