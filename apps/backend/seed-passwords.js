const pool = require('./src/config/db');
const bcrypt = require('bcrypt');

async function resetPasswords() {
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const driverHash = await bcrypt.hash('driver123', 10);

    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [adminHash, 'admin@test.com']);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [driverHash, 'budi@test.com']);

    console.log('SUCCESS: Reset passwords!');
    console.log('Admin login  : admin@test.com  / admin123');
    console.log('Driver login : budi@test.com   / driver123');
  } catch (err) {
    console.error('Error resetting passwords:', err);
  } finally {
    await pool.end();
  }
}

resetPasswords();
