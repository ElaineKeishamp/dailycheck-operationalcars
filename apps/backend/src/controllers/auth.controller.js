const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const { createSession } = require('../services/authSession.service');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  try {
    const user = await userModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Email tidak ditemukan' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Password salah' });
    }

    res.json(createSession(user));
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
    const user = await userModel.findById(userId);

    if (!user || user.status !== 'active' || user.session_version !== req.user.session_version) {
      return res.status(401).json({ error: 'Sesi tidak berlaku lagi. Silakan login kembali.', code: 'SESSION_EXPIRED' });
    }

    const validOldPassword = await bcrypt.compare(old_password, user.password_hash);
    if (!validOldPassword) {
      return res.status(401).json({ error: 'Password lama salah' });
    }

    const newHash = await bcrypt.hash(new_password, 10);

    const updatedUser = await userModel.updatePassword(userId, newHash, false, req.user.session_version);

    if (!updatedUser) {
      return res.status(401).json({ error: 'Sesi tidak berlaku lagi. Silakan login kembali.', code: 'SESSION_EXPIRED' });
    }

    res.json({ message: 'Password berhasil diganti', ...createSession(updatedUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = { login, changePassword };
