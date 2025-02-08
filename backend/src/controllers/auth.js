const User = require('../models/User');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Email kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Bu email adresi zaten kullanılıyor'
        });
    }

    // Kullanıcı oluştur
    const user = await User.create({
        name,
        email,
        password,
        role: role || 'editor'
    });

    res.status(201).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        }
    });
});

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Lütfen email ve şifre giriniz'
        });
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
                token: generateToken(user._id)
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Geçersiz email veya şifre'
        });
    }
});

// @desc    Mevcut kullanıcı bilgilerini getir
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    
    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Çıkış yap
// @route   GET /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Çıkış yapıldı'
    });
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = {
    register,
    login,
    getMe,
    logout
}; 