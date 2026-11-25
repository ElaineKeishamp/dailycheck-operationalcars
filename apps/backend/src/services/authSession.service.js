const jwt = require('jsonwebtoken');

function createSession(user) {
  if (!Number.isInteger(user.session_version) || user.session_version < 0) {
    throw new Error('User session version is unavailable');
  }

  const token = jwt.sign(
    {
      id: user.users_id,
      role: user.role,
      email: user.email,
      session_version: user.session_version,
    },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '12h' }
  );

  return {
    token,
    user: {
      id: user.users_id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_shared_account: user.is_shared_account,
      must_change_password: user.must_change_password,
    },
  };
}

module.exports = { createSession };
