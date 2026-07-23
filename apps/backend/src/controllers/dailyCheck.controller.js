const pool = require('../config/db');

async function startDailyCheck(req, res) {
  const { vehicle_id, actual_driver_name, gps_lat, gps_long, gps_address } = req.body;
  const userId = req.user.id;

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id wajib diisi' });
  }

  try {
    // Cek apakah user ini akun shared (driver pengganti)
    const userResult = await pool.query('SELECT * FROM users WHERE users_id = $1', [userId]);
    const user = userResult.rows[0];

    if (user.is_shared_account && !actual_driver_name) {
      return res.status(400).json({ error: 'Nama driver wajib diisi untuk akun ini' });
    }

    // Cek apakah mobil ada & aktif
    const vehicleResult = await pool.query(
      'SELECT * FROM vehicles WHERE vehicle_id = $1 AND status = $2',
      [vehicle_id, 'active']
    );
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mobil tidak ditemukan atau tidak aktif' });
    }

    // Cek apakah MOBIL ini sudah di-checking hari ini (bukan cek per user)
    const existingCheck = await pool.query(
      'SELECT * FROM daily_checks WHERE vehicle_id = $1 AND check_date = CURRENT_DATE',
      [vehicle_id]
    );
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Mobil ini sudah di-checking hari ini' });
    }

    const result = await pool.query(
  `INSERT INTO daily_checks (users_id, vehicle_id, actual_driver_name, gps_lat, gps_long, gps_address)
   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
  [userId, vehicle_id, actual_driver_name || null, gps_lat || null, gps_long || null, gps_address || null]
);

    res.status(201).json({ daily_check: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}


async function uploadPhoto(req, res) {
  const { dailyCheckId } = req.params;
  const { part_type, note } = req.body;

  const validPartTypes = ['odo', 'body_kiri', 'body_kanan', 'kap', 'depan', 'belakang', 'interior', 'ban', 'lainnya'];

  if (!part_type || !validPartTypes.includes(part_type)) {
    return res.status(400).json({ error: 'part_type tidak valid' });
  }

  try {
    // Cek daily_check-nya ada & milik user ini
    const dcResult = await pool.query(
      'SELECT * FROM daily_checks WHERE daily_id = $1 AND users_id = $2',
      [dailyCheckId, req.user.id]
    );
    if (dcResult.rows.length === 0) {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    // SEMENTARA: path dummy, belum upload beneran ke storage
    const timestamp = Date.now();
    const dummyKey = `dummy/${req.user.id}/${part_type}_${timestamp}.webp`;
    const dummyThumbKey = `dummy/${req.user.id}/thumb_${part_type}_${timestamp}.webp`;

    const result = await pool.query(
      `INSERT INTO check_photos (daily_id, part_type, r2_key, thumbnail_key, note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dailyCheckId, part_type, dummyKey, dummyThumbKey, note || null]
    );

    res.status(201).json({ photo: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}



async function submitDailyCheck(req, res) {
  const { dailyCheckId } = req.params;

  try {
    const dcResult = await pool.query(
      'SELECT * FROM daily_checks WHERE daily_id = $1 AND users_id = $2',
      [dailyCheckId, req.user.id]
    );
    if (dcResult.rows.length === 0) {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    // Ambil semua foto yang udah diupload buat sesi ini
    const photosResult = await pool.query(
      'SELECT part_type FROM check_photos WHERE daily_id = $1',
      [dailyCheckId]
    );
    const uploadedParts = photosResult.rows.map(p => p.part_type);

    // Bagian yang wajib ada minimal 1 foto
    const requiredSingle = ['odo', 'kap', 'depan', 'belakang', 'interior'];
    // Bagian yang boleh lebih dari 1, tapi minimal 1
    const requiredMulti = ['body_kiri', 'body_kanan'];
    // Ban wajib minimal 4 foto
    const banCount = uploadedParts.filter(p => p === 'ban').length;

    const missing = [];

    for (const part of requiredSingle) {
      if (!uploadedParts.includes(part)) missing.push(part);
    }
    for (const part of requiredMulti) {
      if (!uploadedParts.includes(part)) missing.push(part);
    }
    if (banCount < 4) {
      missing.push(`ban (baru ${banCount}/4 foto)`);
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Laporan belum lengkap',
        missing_parts: missing,
      });
    }

    const result = await pool.query(
      `UPDATE daily_checks SET status = 'submitted' WHERE daily_id = $1 RETURNING *`,
      [dailyCheckId]
    );

    res.json({ message: 'Laporan berhasil disubmit', daily_check: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = { startDailyCheck, uploadPhoto, submitDailyCheck };
