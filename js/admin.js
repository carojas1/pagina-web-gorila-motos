/* ================================================================
   GORILA MOTOS - ADMIN SYSTEM
   Panel conectado a Supabase mediante API segura de Vercel.
   ================================================================ */

var PASS = 'gorilla2024';
var motosFotos = [];
var galeFoto = null;
var prodFotoData = null;

function $id(id) { return document.getElementById(id); }
function $val(id, v) { var e = $id(id); if (e) e.value = v; }
function $html(id, h) { var e = $id(id); if (e) e.innerHTML = h; }
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function emptyMsg(msg) {
  return '<p class="admin-empty">' + esc(msg) + '</p>';
}

function readImg(file, cb) {
  var reader = new FileReader();
  reader.onload = function (ev) {
    var img = new Image();
    img.onload = function () {
      var max = 1600;
      var scale = Math.min(1, max / Math.max(img.width, img.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', 0.84));
    };
    img.onerror = function () { cb(ev.target.result); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function adminItem(opts) {
  var actions = opts.actions || '';
  return '<div class="admin-item">'
    + (opts.thumb
      ? '<img class="admin-thumb" src="' + opts.thumb + '" alt="' + esc(opts.thumbAlt) + '" onclick="' + opts.thumbClick + '">'
      : '<div class="admin-thumb-ph"><span class="material-symbols-outlined" style="font-size:20px;color:#3a3a3a">' + opts.thumbIcon + '</span></div>')
    + '<div class="admin-item-info">'
    + '<div class="admin-item-name">' + esc(opts.name) + '</div>'
    + '<div class="admin-item-sub">' + esc(opts.sub) + '</div>'
    + '</div>'
    + '<div class="admin-actions">'
    + actions
    + '<button class="admin-del" onclick="' + opts.delFn + '">ELIMINAR</button>'
    + '</div>'
    + '</div>';
}

function orderButtons(store, id) {
  return '<button class="admin-mini" onclick="moveItem(\'' + store + '\',' + id + ',-1)" title="Subir">↑</button>'
    + '<button class="admin-mini" onclick="moveItem(\'' + store + '\',' + id + ',1)" title="Bajar">↓</button>';
}

function moveItem(store, id, direction) {
  gmMove(store, id, direction, function () {
    renderAdminMotos();
    renderAdminGale();
    renderAdminProductos();
    renderVentasGrid();
    renderGaleriaAdmin();
    renderProductosGrid();
  });
}

function openAdminModal() {
  $id('adminModal').classList.add('open');
  gsap.from('#adminBox', { scale: 0.88, opacity: 0, duration: 0.4, ease: 'back.out(1.5)' });
  setTimeout(function () { var p = $id('adminPass'); if (p) p.focus(); }, 100);
}

function closeAdminModal(e) {
  if (e && e.target !== $id('adminModal')) return;
  $id('adminModal').classList.remove('open');
  var err = $id('adminErr'); if (err) err.style.display = 'none';
  $val('adminPass', '');
}

function checkAdmin() {
  var pass = ($id('adminPass') || {}).value || '';
  gmAuthAdmin(pass, function (ok) {
    if (ok || pass === PASS) {
      gmSetAdminPassword(pass);
      $id('adminModal').classList.remove('open');
      openAdminPanel();
      return;
    }
    var err = $id('adminErr'); if (err) err.style.display = 'block';
    gsap.to('#adminBox', {
      x: -9, duration: 0.06, repeat: 5, yoyo: true,
      onComplete: function () { gsap.set('#adminBox', { x: 0 }); }
    });
  });
}

function openAdminPanel() {
  $id('adminPanel').classList.add('open');
  gsap.from($id('adminPanel'), { opacity: 0, y: 20, duration: 0.4 });
  renderAdminMotos();
  renderAdminGale();
  renderAdminProductos();
  renderAdminReviews();
}

function closeAdminPanel() {
  $id('adminPanel').classList.remove('open');
  renderVentasGrid();
  renderGaleriaAdmin();
  renderProductosGrid();
  renderPublicReviews();
}

function switchAdminTab(tab, btn) {
  document.querySelectorAll('.a-tab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.a-content').forEach(function (c) { c.classList.remove('active'); });
  btn.classList.add('active');
  $id('a-' + tab).classList.add('active');
}

function prevMotoFotos(input) {
  motosFotos = [];
  $html('mPrev', '');
  Array.from(input.files).slice(0, 5).forEach(function (f) {
    readImg(f, function (d) {
      motosFotos.push(d);
      var prev = $id('mPrev'); if (!prev) return;
      var img = document.createElement('img');
      img.src = d;
      img.style.cssText = 'width:72px;height:54px;object-fit:cover;border:1px solid #222;flex-shrink:0';
      prev.appendChild(img);
    });
  });
}

function addMoto() {
  var marca = ($id('mMarca') || {}).value && $id('mMarca').value.trim();
  var precio = ($id('mPrecio') || {}).value && $id('mPrecio').value.trim();
  if (!marca || !precio) { alert('Completa Marca/Modelo y Precio'); return; }
  gmSave('motos', {
    marca: marca,
    precio: precio,
    anio: $id('mAnio').value.trim(),
    km: $id('mKm').value.trim(),
    desc: $id('mDesc').value.trim(),
    fotos: motosFotos.slice()
  }, function () {
    ['mMarca', 'mAnio', 'mPrecio', 'mKm', 'mDesc'].forEach(function (id) { $val(id, ''); });
    $html('mPrev', ''); $val('mFotos', '');
    motosFotos = [];
    renderAdminMotos();
    renderVentasGrid();
  });
}

function deleteMoto(id) {
  if (!confirm('Eliminar esta moto?')) return;
  gmDelete('motos', id, function () {
    renderAdminMotos();
    renderVentasGrid();
  });
}

function renderAdminMotos() {
  var c = $id('aMotos'); if (!c) return;
  gmGetAll('motos', function (motos) {
    if (!motos.length) { c.innerHTML = emptyMsg('No hay motos publicadas.'); return; }
    c.innerHTML = motos.map(function (m) {
      var img = m.fotos && m.fotos[0] ? m.fotos[0] : null;
      return adminItem({
        thumb: img,
        thumbAlt: m.marca,
        thumbIcon: 'two_wheeler',
        thumbClick: img ? 'openLbSrc(\'' + img + '\',\'' + esc(m.marca) + '\')' : '',
        name: m.marca + (m.anio ? ' ' + m.anio : ''),
        sub: m.precio + (m.km ? ' - ' + m.km : ''),
        actions: orderButtons('motos', m.id),
        delFn: 'deleteMoto(' + m.id + ')'
      });
    }).join('');
  });
}

function renderVentasGrid() {
  var grid = $id('ventasGrid'); if (!grid) return;
  var noEl = $id('noMotos');
  grid.querySelectorAll('.moto-card').forEach(function (c) { c.remove(); });
  gmGetAll('motos', function (motos) {
    if (!motos.length) { if (noEl) noEl.style.display = ''; return; }
    if (noEl) noEl.style.display = 'none';
    motos.forEach(function (m) {
      var card = document.createElement('div');
      card.className = 'moto-card fi';
      var img = m.fotos && m.fotos[0] ? m.fotos[0] : null;
      var wa = encodeURIComponent('Hola! Me interesa la ' + m.marca + (m.anio ? ' ' + m.anio : '') + ' a ' + m.precio);
      card.innerHTML =
        '<div class="moto-img-wrap"' + (img ? ' onclick="openLbSrc(\'' + img + '\',\'' + esc(m.marca) + '\')" style="cursor:zoom-in"' : '') + '>'
        + (img ? '<img class="moto-img" src="' + img + '" alt="' + esc(m.marca) + '">'
          : '<div class="moto-no-img"><span class="material-symbols-outlined" style="font-size:56px;color:#2a2a2a">two_wheeler</span></div>')
        + '<div class="moto-badge"><span>EN VENTA</span></div></div>'
        + '<div class="moto-body">'
        + '<div class="moto-name">' + esc(m.marca) + (m.anio ? ' ' + esc(m.anio) : '') + '</div>'
        + '<div class="moto-meta">' + (m.km ? '<span>' + esc(m.km) + '</span>' : '') + (m.anio ? '<span>' + esc(m.anio) + '</span>' : '') + '</div>'
        + (m.desc ? '<p class="moto-desc">' + esc(m.desc) + '</p>' : '')
        + '<div class="moto-footer">'
        + '<div class="moto-price">' + esc(m.precio) + '</div>'
        + '<button class="moto-cta" onclick="window.open(\'https://wa.me/593980834367?text=' + wa + '\',\'_blank\')">CONSULTAR</button>'
        + '</div></div>';
      grid.appendChild(card);
      if (typeof io !== 'undefined') io.observe(card);
    });
  });
}

function prevGaleFoto(input) {
  galeFoto = null; $html('gPrev', '');
  if (!input.files[0]) return;
  readImg(input.files[0], function (d) {
    galeFoto = d;
    var prev = $id('gPrev'); if (!prev) return;
    var img = document.createElement('img');
    img.src = d;
    img.style.cssText = 'width:80px;height:60px;object-fit:cover;border:1px solid #222';
    prev.appendChild(img);
  });
}

function addGaleFoto() {
  if (!galeFoto) { alert('Selecciona una foto'); return; }
  gmSave('gale', {
    title: ($id('gTitulo').value.trim() || 'Trabajo'),
    cat: $id('gCat').value,
    foto: galeFoto
  }, function () {
    $val('gTitulo', ''); $html('gPrev', ''); $val('gFoto', '');
    galeFoto = null;
    renderAdminGale();
    renderGaleriaAdmin();
  });
}

function deleteGale(id) {
  if (!confirm('Eliminar esta foto?')) return;
  gmDelete('gale', id, function () {
    renderAdminGale();
    renderGaleriaAdmin();
  });
}

function renderAdminGale() {
  var c = $id('aGale'); if (!c) return;
  gmGetAll('gale', function (gale) {
    if (!gale.length) { c.innerHTML = emptyMsg('No hay fotos adicionales.'); return; }
    c.innerHTML = gale.map(function (g) {
      return adminItem({
        thumb: g.foto,
        thumbAlt: g.title,
        thumbIcon: 'image',
        thumbClick: 'openLbSrc(\'' + g.foto + '\',\'' + esc(g.title) + '\')',
        name: g.title,
        sub: (g.cat || 'galeria').toUpperCase(),
        actions: orderButtons('gale', g.id),
        delFn: 'deleteGale(' + g.id + ')'
      });
    }).join('');
  });
}

function renderGaleriaAdmin() {
  var c = $id('galeriaAdmin'); if (!c) return;
  gmGetAll('gale', function (gale) {
    if (!gale.length) { c.innerHTML = ''; return; }
    c.innerHTML = '<div class="gale-admin-grid">'
      + gale.map(function (g) {
        return '<div class="gale-item" onclick="openLbSrc(\'' + g.foto + '\',\'' + esc(g.title) + '\')" style="cursor:zoom-in">'
          + '<img src="' + g.foto + '" alt="' + esc(g.title) + '" style="width:100%;height:100%;object-fit:cover;display:block">'
          + '<div class="gale-item-overlay">'
          + '<span class="gale-item-cat">' + esc((g.cat || 'galeria').toUpperCase()) + '</span>'
          + '<span class="gale-item-name">' + esc(g.title) + '</span>'
          + '</div></div>';
      }).join('')
      + '</div>';
    gsap.from('#galeriaAdmin .gale-item', { scale: 0.9, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'back.out(1.3)' });
  });
}

function prevProdFoto(input) {
  prodFotoData = null; $html('pPrev', '');
  if (!input.files[0]) return;
  readImg(input.files[0], function (d) {
    prodFotoData = d;
    var prev = $id('pPrev'); if (!prev) return;
    var img = document.createElement('img');
    img.src = d;
    img.style.cssText = 'width:80px;height:60px;object-fit:cover;border:1px solid #222';
    prev.appendChild(img);
  });
}

function addProducto() {
  var nombre = $id('pNombre').value.trim();
  var precio = $id('pPrecio').value.trim();
  if (!nombre || !precio) { alert('Completa Nombre y Precio'); return; }
  gmSave('productos', {
    nombre: nombre,
    precio: precio,
    desc: $id('pDesc').value.trim(),
    foto: prodFotoData
  }, function () {
    ['pNombre', 'pPrecio', 'pDesc'].forEach(function (id) { $val(id, ''); });
    $html('pPrev', ''); $val('pFoto', '');
    prodFotoData = null;
    renderAdminProductos();
    renderProductosGrid();
  });
}

function deleteProducto(id) {
  if (!confirm('Eliminar este producto?')) return;
  gmDelete('productos', id, function () {
    renderAdminProductos();
    renderProductosGrid();
  });
}

function renderAdminProductos() {
  var c = $id('aProductos'); if (!c) return;
  gmGetAll('productos', function (prods) {
    if (!prods.length) { c.innerHTML = emptyMsg('No hay productos publicados.'); return; }
    c.innerHTML = prods.map(function (p) {
      return adminItem({
        thumb: p.foto,
        thumbAlt: p.nombre,
        thumbIcon: 'inventory_2',
        thumbClick: p.foto ? 'openLbSrc(\'' + p.foto + '\',\'' + esc(p.nombre) + '\')' : '',
        name: p.nombre,
        sub: p.precio,
        actions: orderButtons('productos', p.id),
        delFn: 'deleteProducto(' + p.id + ')'
      });
    }).join('');
  });
}

function renderProductosGrid() {
  var grid = $id('productosGrid'); if (!grid) return;
  var noEl = $id('noProductos');
  grid.querySelectorAll('.prod-card').forEach(function (c) { c.remove(); });
  gmGetAll('productos', function (prods) {
    if (!prods.length) { if (noEl) noEl.style.display = ''; return; }
    if (noEl) noEl.style.display = 'none';
    prods.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'prod-card fi';
      var wa = encodeURIComponent('Hola! Consulto por ' + p.nombre + ' a ' + p.precio);
      card.innerHTML =
        '<div class="prod-img-wrap">'
        + (p.foto ? '<img class="prod-img" src="' + p.foto + '" alt="' + esc(p.nombre) + '" onclick="openLbSrc(\'' + p.foto + '\',\'' + esc(p.nombre) + '\')">'
          : '<div class="prod-no-img"><span class="material-symbols-outlined" style="font-size:56px;color:#2a2a2a">inventory_2</span></div>')
        + '<div class="prod-badge"><span>NUEVO</span></div></div>'
        + '<div class="prod-body">'
        + '<div class="prod-name">' + esc(p.nombre) + '</div>'
        + (p.desc ? '<p class="prod-desc">' + esc(p.desc) + '</p>' : '')
        + '<div class="prod-footer">'
        + '<div class="prod-price">' + esc(p.precio) + '</div>'
        + '<button class="prod-buy" onclick="window.open(\'https://wa.me/593980834367?text=' + wa + '\',\'_blank\')">COMPRAR</button>'
        + '</div></div>';
      grid.appendChild(card);
      if (typeof io !== 'undefined') io.observe(card);
    });
  });
}

function approveReview(id) {
  gmApproveReview(id, true, function () {
    renderPublicReviews();
    renderAdminReviews();
  });
}

function deleteAdminReview(id) {
  if (!confirm('Eliminar esta resena?')) return;
  gmDelete('reviews', id, function () {
    renderPublicReviews();
    renderAdminReviews();
  });
}

function renderPublicReviews() {
  var grid = $id('adminReviewsGrid'); if (!grid) return;
  gmGetAll('reviews', function (reviews) {
    if (!reviews.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = reviews.map(function (r) {
      var stars = '★'.repeat(r.estrellas) + '☆'.repeat(5 - r.estrellas);
      return '<div class="rev-card fi">'
        + '<div class="rev-header">'
        + '<div class="rev-avatar">' + esc(r.nombre.charAt(0).toUpperCase()) + '</div>'
        + '<div><p class="rev-name">' + esc(r.nombre) + '</p><p class="stars">' + stars + '</p></div>'
        + '</div>'
        + (r.foto ? '<img class="rev-user-img" src="' + r.foto + '" alt="Foto de resena de ' + esc(r.nombre) + '" onclick="openLbSrc(\'' + r.foto + '\',\'Resena de ' + esc(r.nombre) + '\')">' : '')
        + '<p class="rev-text">"' + esc(r.comentario) + '"</p>'
        + '<p class="rev-via">- RESENA DE CLIENTE</p>'
        + '</div>';
    }).join('');
    grid.querySelectorAll('.fi').forEach(function (el) { if (typeof io !== 'undefined') io.observe(el); });
  });
}

function renderAdminReviews() {
  var c = $id('aResenas'); if (!c) return;
  gmApi('/api/admin', { method: 'POST', body: { action: 'listReviews', password: gmAdminPass } })
    .then(function (data) {
      var reviews = data.reviews || [];
      if (!reviews.length) { c.innerHTML = emptyMsg('No hay resenas de clientes aun.'); return; }
      c.innerHTML = reviews.map(function (r) {
        var stars = '★'.repeat(r.estrellas) + '☆'.repeat(5 - r.estrellas);
        var date = r.ts ? new Date(r.ts).toLocaleDateString('es-EC') : '';
        var approve = r.approved ? '<span class="admin-approved">APROBADA</span>' : '<button class="admin-ok" onclick="approveReview(' + r.id + ')">APROBAR</button>';
        return '<div class="admin-item" style="align-items:flex-start">'
          + (r.foto ? '<img class="admin-thumb" src="' + r.foto + '" alt="Resena" onclick="openLbSrc(\'' + r.foto + '\',\'Resena\')">' : '<div class="admin-thumb-ph"><span class="material-symbols-outlined" style="font-size:20px;color:#3a3a3a">reviews</span></div>')
          + '<div class="admin-item-info">'
          + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px">'
          + '<span class="admin-item-name">' + esc(r.nombre) + '</span>'
          + '<span style="color:#fbbf24;font-size:.9rem">' + stars + '</span>'
          + '</div>'
          + '<p style="color:#a0a0a0;font-size:.85rem;margin-bottom:4px">' + esc(r.comentario) + '</p>'
          + '<span class="admin-item-sub">' + date + '</span>'
          + '</div>'
          + '<div class="admin-actions">' + approve + '<button class="admin-del" onclick="deleteAdminReview(' + r.id + ')">ELIMINAR</button></div>'
          + '</div>';
      }).join('');
    })
    .catch(function (err) {
      c.innerHTML = emptyMsg(err.message || 'No se pudieron cargar las resenas.');
    });
}

function saveReview(item, cb) {
  gmSavePublicReview(item, function () {
    if (cb) cb();
  });
}
