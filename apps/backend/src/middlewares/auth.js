const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token tidak ditemukan' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded =jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token tidak valid' });
    }
}

function requireAdmin(req,res,next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Khusus admin' });
    }
    next();
}
module.exports = { verifyToken, requireAdmin };