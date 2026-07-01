const {
  fail,
  getMaxSort,
  readJson,
  rest,
  send,
  uploadImage,
} = require('./_supabase');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Metodo no permitido' });
    const body = await readJson(req);
    const name = String(body.nombre || '').trim();
    const comment = String(body.comentario || '').trim();
    const stars = Math.max(1, Math.min(5, Number(body.estrellas) || 5));
    if (!name || !comment) return send(res, 400, { ok: false, error: 'Nombre y comentario son obligatorios.' });

    const imageUrl = body.foto ? await uploadImage(body.foto, 'reviews') : null;
    const sortOrder = await getMaxSort('gm_reviews') + 10;
    const rows = await rest('gm_reviews', {
      method: 'POST',
      body: JSON.stringify([{
        name,
        stars,
        comment,
        image_url: imageUrl,
        approved: false,
        sort_order: sortOrder,
      }]),
    });

    send(res, 200, { ok: true, review: rows[0] });
  } catch (err) {
    fail(res, err);
  }
};
