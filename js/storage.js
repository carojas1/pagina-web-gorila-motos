/* ================================================================
   GORILA MOTOS — STORAGE (storage.js)
   IndexedDB: guarda fotos grandes sin límite de tamaño.
   localStorage tenía límite de ~5MB y las fotos lo llenaban.
   ================================================================ */

var GM_DB_NAME    = 'gorila_motos';
var GM_DB_VERSION = 1;
var gmDB          = null;

/* ── Inicializar base de datos ── */
function gmInitDB(cb) {
  if (gmDB) { cb(gmDB); return; }

  var req = indexedDB.open(GM_DB_NAME, GM_DB_VERSION);

  req.onupgradeneeded = function (e) {
    var d = e.target.result;
    ['motos', 'gale', 'productos', 'reviews'].forEach(function (name) {
      if (!d.objectStoreNames.contains(name)) {
        d.createObjectStore(name, { keyPath: 'id' });
      }
    });
  };

  req.onsuccess = function (e) {
    gmDB = e.target.result;
    cb(gmDB);
  };

  req.onerror = function (e) {
    console.error('IndexedDB error:', e.target.error);
  };
}

/* ── Guardar / actualizar un item ── */
function gmSave(store, item, cb) {
  gmInitDB(function (db) {
    var tx  = db.transaction(store, 'readwrite');
    var st  = tx.objectStore(store);
    st.put(item);
    tx.oncomplete = function () { if (cb) cb(); };
    tx.onerror    = function (e) { console.error('gmSave error', e.target.error); };
  });
}

/* ── Obtener todos los items (más nuevo primero) ── */
function gmGetAll(store, cb) {
  gmInitDB(function (db) {
    var tx  = db.transaction(store, 'readonly');
    var st  = tx.objectStore(store);
    var req = st.getAll();
    req.onsuccess = function () {
      var items = req.result || [];
      /* Ordenar más nuevo primero (id es timestamp) */
      items.sort(function (a, b) { return b.id - a.id; });
      cb(items);
    };
  });
}

/* ── Eliminar un item por id ── */
function gmDelete(store, id, cb) {
  gmInitDB(function (db) {
    var tx = db.transaction(store, 'readwrite');
    var st = tx.objectStore(store);
    st.delete(id);
    tx.oncomplete = function () { if (cb) cb(); };
  });
}

/* ── Vaciar un store completo ── */
function gmClearAll(store, cb) {
  gmInitDB(function (db) {
    var tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = function () { if (cb) cb(); };
    tx.onerror    = function (e) { console.error('gmClearAll error', e.target.error); if (cb) cb(); };
  });
}
