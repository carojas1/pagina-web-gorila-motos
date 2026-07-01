const {
  TABLES,
  adminPassword,
  fail,
  getMaxSort,
  listTable,
  normalizeReview,
  readJson,
  rest,
  send,
  uploadImage,
} = require('./_supabase');

function checkPassword(body) {
  if (body.password !== adminPassword()) {
    const err = new Error('Contrasena de administrador incorrecta.');
    err.status = 401;
    throw err;
  }
}

async function createPayload(store, item) {
  const sortOrder = await getMaxSort(TABLES[store]) + 10;
  if (store === 'motos') {
    const urls = [];
    const fotos = Array.isArray(item.fotos) ? item.fotos : [];
    for (const foto of fotos) urls.push(await uploadImage(foto, 'motorcycles'));
    return {
      title: String(item.marca || '').trim(),
      year: String(item.anio || '').trim(),
      price: String(item.precio || '').trim(),
      mileage: String(item.km || '').trim(),
      description: String(item.desc || '').trim(),
      image_url: urls[0] || null,
      image_urls: urls,
      sort_order: sortOrder,
      active: true,
    };
  }
  if (store === 'productos') {
    return {
      title: String(item.nombre || '').trim(),
      price: String(item.precio || '').trim(),
      description: String(item.desc || '').trim(),
      image_url: item.foto ? await uploadImage(item.foto, 'products') : null,
      sort_order: sortOrder,
      active: true,
    };
  }
  if (store === 'gale') {
    return {
      title: String(item.title || 'Trabajo').trim(),
      category: String(item.cat || 'galeria').trim(),
      image_url: await uploadImage(item.foto, 'gallery'),
      sort_order: sortOrder,
      active: true,
    };
  }
  throw Object.assign(new Error('Store no valido.'), { status: 400 });
}

async function saveItem(body) {
  const { store, item } = body;
  if (!TABLES[store] || store === 'reviews') throw Object.assign(new Error('Store no valido.'), { status: 400 });
  const payload = await createPayload(store, item || {});
  if ((store === 'motos' || store === 'productos') && (!payload.title || !payload.price)) {
    throw Object.assign(new Error('Faltan nombre y precio.'), { status: 400 });
  }
  if (store === 'gale' && !payload.image_url) {
    throw Object.assign(new Error('Falta la imagen.'), { status: 400 });
  }
  await rest(TABLES[store], { method: 'POST', body: JSON.stringify([payload]) });
}

async function deleteItem(body) {
  const table = TABLES[body.store];
  if (!table) throw Object.assign(new Error('Store no valido.'), { status: 400 });
  await rest(`${table}?id=eq.${encodeURIComponent(body.id)}`, {
    method: 'DELETE',
    prefer: 'return=minimal',
  });
}

async function moveItem(body) {
  const table = TABLES[body.store];
  if (!table || body.store === 'reviews') throw Object.assign(new Error('Store no valido.'), { status: 400 });
  const direction = Number(body.direction) < 0 ? -1 : 1;
  const rows = await listTable(table, 'active=eq.true');
  const idx = rows.findIndex((row) => Number(row.id) === Number(body.id));
  if (idx < 0) return;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= rows.length) return;
  const current = rows[idx];
  const target = rows[targetIdx];
  await Promise.all([
    rest(`${table}?id=eq.${current.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ sort_order: target.sort_order }),
    }),
    rest(`${table}?id=eq.${target.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ sort_order: current.sort_order }),
    }),
  ]);
}

async function approveReview(body) {
  await rest(`gm_reviews?id=eq.${encodeURIComponent(body.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ approved: !!body.approved }),
  });
}

async function listReviews() {
  const rows = await listTable('gm_reviews');
  return rows.map(normalizeReview);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Metodo no permitido' });
    const body = await readJson(req);
    checkPassword(body);

    if (body.action === 'auth') return send(res, 200, { ok: true });
    if (body.action === 'save') await saveItem(body);
    else if (body.action === 'delete') await deleteItem(body);
    else if (body.action === 'move') await moveItem(body);
    else if (body.action === 'approveReview') await approveReview(body);
    else if (body.action === 'listReviews') return send(res, 200, { ok: true, reviews: await listReviews() });
    else return send(res, 400, { ok: false, error: 'Accion no valida.' });

    send(res, 200, { ok: true });
  } catch (err) {
    fail(res, err);
  }
};
