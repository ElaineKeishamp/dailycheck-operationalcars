const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

async function authenticateSession(req, res, next, allowPasswordChange) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token tidak ditemukan', code: 'SESSION_EXPIRED' });

    const bearer = /^Bearer ([^\s]+)$/i.exec(authHeader);
    if (!bearer) return res.status(401).json({ error: 'Token tidak valid', code: 'SESSION_EXPIRED' });

    let decoded;
    try {
        decoded = jwt.verify(bearer[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        return res.status(401).json({ error: 'Token tidak valid', code: 'SESSION_EXPIRED' });
    }

    if (typeof decoded?.id !== 'string'
        || !Number.isInteger(decoded.session_version)
        || decoded.session_version < 0) {
        return res.status(401).json({ error: 'Sesi tidak valid. Silakan login kembali.', code: 'SESSION_EXPIRED' });
    }

    let user;
    try {
        user = await userModel.findSessionById(decoded.id);
    } catch {
        console.error('Authentication database lookup failed');
        return res.status(503).json({ error: 'Layanan autentikasi belum tersedia. Silakan coba lagi.' });
    }

    if (!user
        || user.status !== 'active'
        || !['admin', 'driver'].includes(user.role)
        || user.session_version !== decoded.session_version) {
        return res.status(401).json({ error: 'Sesi tidak berlaku lagi. Silakan login kembali.', code: 'SESSION_EXPIRED' });
    }

    if (user.must_change_password && !allowPasswordChange) {
        return res.status(403).json({
            error: 'Ganti password sementara sebelum menggunakan aplikasi.',
            code: 'PASSWORD_CHANGE_REQUIRED',
        });
    }

    req.user = {
        id: user.users_id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_shared_account: user.is_shared_account,
        must_change_password: user.must_change_password,
        session_version: user.session_version,
    };
    return next();
}

function verifyToken(req, res, next) {
    return authenticateSession(req, res, next, false);
}

function verifyPasswordChangeToken(req, res, next) {
    return authenticateSession(req, res, next, true);
}

function requireAdmin(req,res,next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Khusus admin' });
    }
    next();
}

function requireDriver(req, res, next) {
    if (req.user.role !== 'driver') {
        return res.status(403).json({ error: 'Khusus driver' });
    }
    next();
}

module.exports = { verifyToken, verifyPasswordChangeToken, requireAdmin, requireDriver };
