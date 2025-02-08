const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;

        console.log('Auth Middleware - Headers:', req.headers);

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('Auth Middleware - Token:', token);
        }

        if (!token) {
            console.log('Auth Middleware - Token bulunamadı');
            return res.status(401).json({
                success: false,
                message: 'Bu işlem için giriş yapmanız gerekiyor'
            });
        }

        try {
            // Token'ı doğrula
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Auth Middleware - Decoded token:', decoded);

            // Kullanıcıyı bul
            const user = await User.findById(decoded.id);
            console.log('Auth Middleware - Bulunan kullanıcı:', user);
            
            if (!user) {
                console.log('Auth Middleware - Kullanıcı bulunamadı');
                return res.status(401).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            // Admin kontrolü
            console.log('Auth Middleware - Admin kontrolü:', user.isAdmin);
            console.log('Auth Middleware - Kullanıcı rolü:', user.role);
            if (!user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Bu alana erişim yetkiniz yok'
                });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz bulunmamaktadır'
            });
        }
        next();
    };
}; 