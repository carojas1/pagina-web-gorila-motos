const {
  fail,
  listTable,
  normalizeGallery,
  normalizeMoto,
  normalizeProduct,
  normalizeReview,
  send,
} = require('./_supabase');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'Metodo no permitido' });

    const [motos, productos, gale, reviews] = await Promise.all([
      listTable('gm_motorcycles', 'active=eq.true'),
      listTable('gm_products', 'active=eq.true'),
      listTable('gm_gallery', 'active=eq.true'),
      listTable('gm_reviews', 'approved=eq.true'),
    ]);

    send(res, 200, {
      ok: true,
      motos: motos.map(normalizeMoto),
      productos: productos.map(normalizeProduct),
      gale: gale.map(normalizeGallery),
      reviews: reviews.map(normalizeReview),
    });
  } catch (err) {
    fail(res, err);
  }
};
