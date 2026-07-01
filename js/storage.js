/* ================================================================
   GORILA MOTOS - CLOUD STORAGE CLIENT
   Lee y escribe datos en Supabase por medio de API segura en Vercel.
   ================================================================ */

var GM_CACHE = {
  motos: [],
  gale: [],
  productos: [],
  reviews: []
};

var GM_DEFAULT_DATA = {
  motos: [
    {
      id: 20001,
      marca: 'Varias Marcas',
      anio: '2023',
      precio: 'Consultar',
      km: 'Varios modelos',
      desc: 'Variedad de motos disponibles. Todas inspeccionadas y certificadas por nuestro taller.',
      fotos: ['fotos/venta-varias.png']
    },
    {
      id: 20002,
      marca: 'KRG',
      anio: '2022',
      precio: 'Consultar',
      km: 'Bajo kilometraje',
      desc: 'Motos KRG en excelente estado. Revisadas y certificadas por Gorila Motos.',
      fotos: ['fotos/venta-krg.png']
    },
    {
      id: 20003,
      marca: 'Royal Enfield',
      anio: '2021',
      precio: 'Consultar',
      km: 'Motor perfecto',
      desc: 'Royal Enfield clasica negra. Motor en perfecto estado, papeles al dia.',
      fotos: ['fotos/venta-royal.png']
    }
  ],
  productos: [
    {
      id: 30001,
      nombre: 'Pastillas de Freno',
      precio: 'Consultar',
      desc: 'Para todas las marcas. Originales y alternativas de calidad.',
      foto: 'fotos/prod-pastillas.png'
    },
    {
      id: 30002,
      nombre: 'Partes para Motor',
      precio: 'Consultar',
      desc: 'Pistones, segmentos, cojinetes y mas. Originales y alternativas.',
      foto: 'fotos/prod-partes.png'
    }
  ],
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
      GM_CACHE.gale = data.gale || [];
      GM_CACHE.productos = data.productos || [];
      GM_CACHE.reviews = data.reviews || [];
      gmUseDefaultsIfEmpty();
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

function gmDelete(store, id, cb) {
  gmAdminRequest('delete', { store: store, id: id }, cb);
}

function gmMove(store, id, direction, cb) {
  gmAdminRequest('move', { store: store, id: id, direction: direction }, cb);
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
