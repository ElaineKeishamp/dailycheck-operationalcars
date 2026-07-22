const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Email tidak ditemukan' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Password salah' });
    }

    const token = jwt.sign(
      { id: user.users_id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user.users_id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_shared_account: user.is_shared_account,
        must_change_password: user.must_change_password,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function changePassword(req, res) {
  const { old_password, new_password } = req.body;
  const userId = req.user.id;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE users_id = $1', [userId]);
    const user = result.rows[0];

    const validOldPassword = await bcrypt.compare(old_password, user.password_hash);
    if (!validOldPassword) {
      return res.status(401).json({ error: 'Password lama salah' });
    }

    const newHash = await bcrypt.hash(new_password, 10);

    await pool.query(
      `UPDATE users 
       SET password_hash = $1, must_change_password = FALSE 
       WHERE users_id = $2`,
      [newHash, userId]
    );

    res.json({ message: 'Password berhasil diganti' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = { login, changePassword };