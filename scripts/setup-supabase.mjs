import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const bucket = 'gorila-media';

const required = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_DB_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Falta ${key}`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/$/, '');
const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
const dbUrl = process.env.SUPABASE_DB_URL
  || `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

function apiHeaders(extra = {}) {
  return {
    apikey: process.env.SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
    ...extra,
  };
}

async function ensureBucket() {
  const listRes = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
    headers: apiHeaders(),
  });
  if (listRes.ok) return;
  const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true,
      file_size_limit: 5242880,
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    }),
  });
  if (!createRes.ok) throw new Error(await createRes.text());
}

async function upload(localFile, remotePath) {
  const file = await fs.readFile(path.join(root, localFile));
  const ext = path.extname(localFile).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${remotePath}`, {
    method: 'POST',
    headers: apiHeaders({ 'Content-Type': mime, 'x-upsert': 'true' }),
    body: file,
  });
  if (!res.ok) throw new Error(await res.text());
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${remotePath}`;
}

async function seed() {
  const count = await client.query(`
    select
      (select count(*) from public.gm_products) as products,
      (select count(*) from public.gm_motorcycles) as motorcycles,
      (select count(*) from public.gm_gallery) as gallery
  `);
  const row = count.rows[0];
  if (Number(row.products) || Number(row.motorcycles) || Number(row.gallery)) {
    console.log('Las tablas ya tienen datos. No se vuelve a sembrar.');
    return;
  }

  const [ventaVarias, ventaKrg, ventaRoyal, prodPastillas, prodPartes] = await Promise.all([
    upload('fotos/venta-varias.png', 'seed/venta-varias.png'),
    upload('fotos/venta-krg.png', 'seed/venta-krg.png'),
    upload('fotos/venta-royal.png', 'seed/venta-royal.png'),
    upload('fotos/prod-pastillas.png', 'seed/prod-pastillas.png'),
    upload('fotos/prod-partes.png', 'seed/prod-partes.png'),
  ]);

  await client.query(
    `insert into public.gm_motorcycles
      (title, year, price, mileage, description, image_url, image_urls, sort_order, active)
     values
      ($1,$2,$3,$4,$5,$6,$7,10,true),
      ($8,$9,$10,$11,$12,$13,$14,20,true),
      ($15,$16,$17,$18,$19,$20,$21,30,true)`,
    [
      'Varias Marcas', '2023', 'Consultar', 'Varios modelos',
      'Variedad de motos disponibles. Todas inspeccionadas y certificadas por nuestro taller.',
      ventaVarias, JSON.stringify([ventaVarias]),
      'KRG', '2022', 'Consultar', 'Bajo kilometraje',
      'Motos KRG en excelente estado. Revisadas y certificadas por Gorila Motos.',
      ventaKrg, JSON.stringify([ventaKrg]),
      'Royal Enfield', '2021', 'Consultar', 'Motor perfecto',
      'Royal Enfield clasica negra. Motor en perfecto estado, papeles al dia.',
      ventaRoyal, JSON.stringify([ventaRoyal]),
    ],
  );

  await client.query(
    `insert into public.gm_products
      (title, price, description, image_url, sort_order, active)
     values
      ($1,$2,$3,$4,10,true),
      ($5,$6,$7,$8,20,true)`,
    [
      'Pastillas de Freno', 'Consultar',
      'Para todas las marcas. Originales y alternativas de calidad.',
      prodPastillas,
      'Partes para Motor', 'Consultar',
      'Pistones, segmentos, cojinetes y mas. Originales y alternativas.',
      prodPartes,
    ],
  );

  const galleryFiles = [
    ['Moto restaurada', 'restauracion', 'fotos/galeria1.png'],
    ['Trabajo en motor', 'reparacion', 'fotos/galeria2.png'],
    ['Diagnostico y revision', 'diagnostico', 'fotos/galeria3.png'],
    ['Mantenimiento', 'mantenimiento', 'fotos/galeria4.png'],
    ['Taller Gorila Motos', 'taller', 'fotos/galeria5.png'],
    ['Proyecto especial', 'custom', 'fotos/galeria6.png'],
  ];
  for (let i = 0; i < galleryFiles.length; i++) {
    const [title, category, file] = galleryFiles[i];
    const url = await upload(file, `seed/galeria-${i + 1}${path.extname(file)}`);
    await client.query(
      `insert into public.gm_gallery (title, category, image_url, sort_order, active)
       values ($1,$2,$3,$4,true)`,
      [title, category, url, (i + 1) * 10],
    );
  }

  console.log('Supabase listo: tablas, bucket y datos iniciales creados.');
}

await client.connect();
try {
  const schema = await fs.readFile(path.join(root, 'supabase/schema.sql'), 'utf8');
  await client.query(schema);
  await ensureBucket();
  await seed();
} finally {
  await client.end();
}
