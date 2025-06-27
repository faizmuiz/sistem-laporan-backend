const jwt = require('jsonwebtoken');

const invalidTokens = new Set();

exports.checkAuth = function(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ data: {}, message: 'Silakan login terlebih dahulu', code: 401 });
    }

    const token = authHeader.split(' ')[1];

    if (invalidTokens.has(token)) {
        return res.status(401).json({ data: {}, message: 'Token tidak valid, Silakan login kembali', code: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.penggunaId = decoded.id_pengguna;
        req.jabatanId = decoded.id_jabatan;
        req.levelData = decoded.level;
        next();
    } catch (err) {
        console.error('Error saat memeriksa token:', err);
        return res.status(401).json({ data: {}, message: 'Token tidak valid', code: 401 });
    }
};

exports.addToInvalidTokens = function(token) {
    invalidTokens.add(token);
};

exports.removeFromInvalidTokens = function(token) {
    invalidTokens.delete(token);
};
