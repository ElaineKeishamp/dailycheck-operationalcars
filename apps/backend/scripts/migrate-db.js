const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/db');

async function migrateDatabase(client, { initialize = false, log = console.log } = {}) {
  await client.query('SELECT pg_advisory_lock(724502695)');
  try {
    const existing = await client.query(`SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`);
    if (initialize) {
      if (existing.rows.length > 0) throw new Error('Database tidak kosong. Gunakan npm run db:migrate untuk database yang sudah ada.');
      const schema = fs.readFileSync(path.resolve(__dirname, '../../../deploy/staging/postgres/001-schema.sql'), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(schema);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      log('Schema awal berhasil dibuat. Tidak ada akun demo yang ditambahkan.');
    } else {
      const tables = new Set(existing.rows.map(row => row.table_name));
      if (!['users', 'vehicles', 'daily_checks', 'check_photos'].every(name => tables.has(name))) {
        throw new Error('Schema belum lengkap. Database kosong: gunakan npm run db:init. Database sebagian terisi: periksa schema sebelum migrasi.');
      }
    }
    for (const file of ['2026-07-29-add-check-photos-part-index.sql', '2026-11-23-add-user-session-version.sql']) {
      const sql = fs.readFileSync(path.resolve(__dirname, '../db', file), 'utf8');
      await client.query(sql);
      log(`Migrasi tersedia: ${file}`);
    }
    log('Database siap untuk versi aplikasi ini.');
  } catch (error) {
    // A failed multi-statement migration can leave an explicit transaction open.
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.query('SELECT pg_advisory_unlock(724502695)');
  }
}

if (require.main === module) {
  (async () => {
    let client;
    try {
      const args = process.argv.slice(2);
      if (args.some(arg => arg !== '--init')) throw new Error('Argumen tidak dikenal. Gunakan db:init atau db:migrate.');
      client = await pool.connect();
      await migrateDatabase(client, { initialize: args.includes('--init') });
    } catch (error) {
      console.error(`Persiapan database gagal: ${error.message}`);
      process.exitCode = 1;
    } finally {
      client?.release();
      await pool.end();
    }
  })();
}

module.exports = { migrateDatabase };
