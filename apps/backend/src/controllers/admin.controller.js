const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/db');

async function resetPassword(req, res) {
  const { id } = req.params;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE users_id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      `UPDATE users 
       SET password_hash = $1, must_change_password = TRUE 
       WHERE users_id = $2`,
      [hash, id]
    );

    res.json({
      message: 'Password berhasil direset',
      temporary_password: tempPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = { resetPassword };