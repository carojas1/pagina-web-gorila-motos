const {
  fail,
  listTable,
  normalizeGallery,
  normalizeMoto,
  normalizeProduct,
  normalizeReview,
  normalizeService,
  normalizeSettings,
  send,
} = require('./_supabase');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'Metodo no permitido' });

    const [servicios, motos, productos, gale, reviews, settingsRows] = await Promise.all([
      listTable('gm_services', 'active=eq.true'),
      listTable('gm_motorcycles', 'active=eq.true'),
      listTable('gm_products', 'active=eq.true'),
      listTable('gm_gallery', 'active=eq.true'),
      listTable('gm_reviews', 'approved=eq.true'),
      listTable('gm_settings'),
    ]);

    send(res, 200, {
      ok: true,
      servicios: servicios.map(normalizeService),
      motos: motos.map(normalizeMoto),
      productos: productos.map(normalizeProduct),
      gale: gale.map(normalizeGallery),
      reviews: reviews.map(normalizeReview),
      settings: normalizeSettings(settingsRows),
    });
  } catch (err) {
    fail(res, err);
  }
};
