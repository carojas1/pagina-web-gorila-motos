/* ================================================================
   GORILA MOTOS - CLOUD STORAGE CLIENT
   Lee y escribe datos en Supabase por medio de API segura en Vercel.
   ================================================================ */

var GM_CACHE = {
  servicios: [],
  motos: [],
  gale: [],
  productos: [],
  reviews: [],
  settings: {}
};

var GM_DEFAULT_SETTINGS = {
  phone_display: '098 083 4367',
  phone_wa: '593980834367',
  email: 'gorilamotos2026@gmail.com',
  address_line1: 'Camilo Ponce, Medardo A. Silva y Angel Silva 1-666',
  address_city: 'Cuenca, Ecuador',
  maps_url: 'https://maps.app.goo.gl/QV1vPwvi9QBQDZM46',
  hours_week: '8:30-13:30 & 15:00-18:00',
  hours_sat: '9:00-14:00',
  portal_url: 'https://gmotors-frontend.vercel.app/'
};

var GM_DEFAULT_DATA = {
  servicios: [],
  motos: [],
  productos: [],
  gale: [],
  reviews: []
};

var gmAdminPass = sessionStorage.getItem('gm_admin_pass') || '';

function gmSetAdminPassword(pass) {
  gmAdminPass = pass || '';
  if (gmAdminPass) sessionStorage.setItem('gm_admin_pass', gmAdminPass);
}

function gmClearAdminPassword() {
  gmAdminPass = '';
  sessionStorage.removeItem('gm_admin_pass');
}

function gmApi(path, opts) {
  opts = opts || {};
  var headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  return fetch(path, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store'
  }).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (data) {
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || ('Error HTTP ' + res.status));
      }
      return data;
    });
  });
}

function gmUseDefaultsIfEmpty() {
  Object.keys(GM_DEFAULT_DATA).forEach(function (store) {
    if (!GM_CACHE[store] || !GM_CACHE[store].length) {
      GM_CACHE[store] = GM_DEFAULT_DATA[store].slice();
    }
  });
}

function gmRefresh(cb) {
  gmApi('/api/data')
    .then(function (data) {
      GM_CACHE.motos = data.motos || [];
      GM_CACHE.servicios = data.servicios || [];
      GM_CACHE.gale = data.gale || [];
      GM_CACHE.productos = data.productos || [];
      GM_CACHE.reviews = data.reviews || [];
      GM_CACHE.settings = Object.assign({}, GM_DEFAULT_SETTINGS, data.settings || {});
      if (cb) cb();
    })
    .catch(function (err) {
      console.warn('Usando datos locales de respaldo:', err.message);
      gmUseDefaultsIfEmpty();
      if (cb) cb();
    });
}

function gmInitDB(cb) {
  gmRefresh(cb);
}

function gmGetAll(store, cb) {
  cb((GM_CACHE[store] || []).slice());
}

function gmGetSettings() {
  return Object.assign({}, GM_DEFAULT_SETTINGS, GM_CACHE.settings || {});
}

function gmAdminRequest(action, payload, cb) {
  payload = payload || {};
  payload.action = action;
  payload.password = gmAdminPass;
  gmApi('/api/admin', { method: 'POST', body: payload })
    .then(function () {
      return gmRefresh(function () { if (cb) cb(); });
    })
    .catch(function (err) {
      alert(err.message || 'No se pudo guardar en la nube');
      if (cb) cb(err);
    });
}

function gmAuthAdmin(pass, cb) {
  gmApi('/api/admin', { method: 'POST', body: { action: 'auth', password: pass } })
    .then(function () {
      gmSetAdminPassword(pass);
      cb(true);
    })
    .catch(function () {
      cb(false);
    });
}

function gmSave(store, item, cb) {
  gmAdminRequest('save', { store: store, item: item }, cb);
}

function gmUpdate(store, id, item, cb) {
  gmAdminRequest('update', { store: store, id: id, item: item }, cb);
}

function gmDelete(store, id, cb) {
  gmAdminRequest('delete', { store: store, id: id }, cb);
}

function gmMove(store, id, direction, cb) {
  gmAdminRequest('move', { store: store, id: id, direction: direction }, cb);
}

function gmSaveSettings(settings, cb) {
  gmAdminRequest('settings', { settings: settings }, cb);
}

function gmApproveReview(id, approved, cb) {
  gmAdminRequest('approveReview', { id: id, approved: approved }, cb);
}

function gmSavePublicReview(item, cb) {
  gmApi('/api/reviews', { method: 'POST', body: item })
    .then(function () {
      if (cb) cb();
    })
    .catch(function (err) {
      alert(err.message || 'No se pudo enviar la resena');
    });
}

function gmClearAll(store, cb) {
  GM_CACHE[store] = [];
  if (cb) cb();
}
