const TABLES = {
  servicios: 'gm_services',
  motos: 'gm_motorcycles',
  productos: 'gm_products',
  gale: 'gm_gallery',
  reviews: 'gm_reviews',
  settings: 'gm_settings',
};

const BUCKET = 'gorila-media';

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

function supabaseUrl() {
  return env('SUPABASE_URL', 'https://mevhpeylehpewgugxwfb.supabase.co').replace(/\/$/, '');
}

function secretKey() {
  return env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY');
}

function adminPassword() {
  return env('ADMIN_PASSWORD', 'gorilla2024');
}

function assertConfig() {
  if (!secretKey()) {
    const err = new Error('Falta SUPABASE_SECRET_KEY en Vercel.');
    err.status = 500;
    throw err;
  }
}

function headers(extra = {}) {
  assertConfig();
  return {
    apikey: secretKey(),
    Authorization: `Bearer ${secretKey()}`,
    ...extra,
  };
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function fail(res, err) {
  send(res, err.status || 500, { ok: false, error: err.message || 'Error interno' });
}

async function rest(path, opts = {}) {
  const response = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...opts,
    headers: {
      ...headers({
        'Content-Type': 'application/json',
        Prefer: opts.prefer || 'return=representation',
      }),
      ...(opts.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const err = new Error((data && (data.message || data.error)) || response.statusText);
    err.status = response.status;
    throw err;
  }
  return data;
}

async function listTable(table, extraQuery = '') {
  return rest(`${table}?select=*&order=sort_order.asc,created_at.desc${extraQuery ? `&${extraQuery}` : ''}`, {
    method: 'GET',
    prefer: 'return=minimal',
  });
}

async function getMaxSort(table) {
  const rows = await rest(`${table}?select=sort_order&order=sort_order.desc&limit=1`, {
    method: 'GET',
    prefer: 'return=minimal',
  });
  return rows && rows[0] && Number.isFinite(rows[0].sort_order) ? rows[0].sort_order : 0;
}

function decodeDataUrl(dataUrl) {
  const match = /^data:(.+?);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function extFromMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

async function uploadImage(dataUrl, folder) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl || null;
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) return null;
  const ext = extFromMime(decoded.mime);
  const name = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const response = await fetch(`${supabaseUrl()}/storage/v1/object/${BUCKET}/${name}`, {
    method: 'POST',
    headers: headers({
      'Content-Type': decoded.mime,
      'x-upsert': 'false',
    }),
    body: decoded.buffer,
  });
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(text || 'No se pudo subir la imagen');
    err.status = response.status;
    throw err;
  }
  return `${supabaseUrl()}/storage/v1/object/public/${BUCKET}/${name}`;
}

function storagePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

async function deleteStoragePaths(paths) {
  const unique = [...new Set((paths || []).filter(Boolean))];
  if (!unique.length) return;
  const response = await fetch(`${supabaseUrl()}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefixes: unique }),
  });
  if (!response.ok) {
    console.warn('No se pudieron borrar algunos archivos del storage:', await response.text());
  }
}

function normalizeProduct(row) {
  return {
    id: row.id,
    nombre: row.title,
    precio: row.price,
    desc: row.description,
    foto: row.image_url,
    sort_order: row.sort_order,
  };
}

function normalizeService(row) {
  return {
    id: row.id,
    nombre: row.title,
    precio: row.price,
    desc: row.description,
    foto: row.image_url,
    sort_order: row.sort_order,
  };
}

function normalizeMoto(row) {
  return {
    id: row.id,
    marca: row.title,
    anio: row.year,
    precio: row.price,
    km: row.mileage,
    desc: row.description,
    fotos: row.image_urls && row.image_urls.length ? row.image_urls : (row.image_url ? [row.image_url] : []),
    sort_order: row.sort_order,
  };
}

function normalizeGallery(row) {
  return {
    id: row.id,
    title: row.title,
    cat: row.category,
    foto: row.image_url,
    sort_order: row.sort_order,
  };
}

function normalizeReview(row) {
  return {
    id: row.id,
    nombre: row.name,
    estrellas: row.stars,
    comentario: row.comment,
    foto: row.image_url,
    approved: row.approved,
    ts: row.created_at,
  };
}

function normalizeSettings(rows) {
  const settings = {};
  for (const row of rows || []) {
    settings[row.key] = row.value;
  }
  return settings;
}

module.exports = {
  TABLES,
  BUCKET,
  adminPassword,
  fail,
  getMaxSort,
  listTable,
  normalizeGallery,
  normalizeMoto,
  normalizeProduct,
  normalizeService,
  normalizeReview,
  normalizeSettings,
  readJson,
  rest,
  send,
  supabaseUrl,
  deleteStoragePaths,
  storagePathFromUrl,
  uploadImage,
};
