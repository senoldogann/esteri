const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// Validation middleware
const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('İsim 2-50 karakter arasında olmalıdır'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Geçerli bir email adresi giriniz'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Şifre en az 6 karakter olmalıdır')
];

const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Geçerli bir email adresi giriniz'),
    body('password')
        .exists()
        .withMessage('Şifre zorunludur')
];

router.post('/register', strictLimiter, registerValidation, register);
router.post('/login', strictLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router; 