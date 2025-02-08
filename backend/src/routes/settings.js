const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
    getSettings,
    getSetting,
    createSetting,
    updateSetting,
    deleteSetting
} = require('../controllers/settings');
const { protect, authorize } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');

// Validation middleware
const settingValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Ayar adı 2-50 karakter arasında olmalıdır'),
    body('openingHours')
        .optional()
        .isArray()
        .withMessage('Çalışma saatleri bir dizi olmalıdır'),
    body('openingHours.*.day')
        .optional()
        .isObject()
        .withMessage('Gün çevirileri bir nesne olmalıdır'),
    body('openingHours.*.open')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Açılış saati geçerli bir saat olmalıdır (HH:MM)'),
    body('openingHours.*.close')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Kapanış saati geçerli bir saat olmalıdır (HH:MM)'),
    body('address')
        .optional()
        .isObject()
        .withMessage('Adres bir nesne olmalıdır'),
    body('contact')
        .optional()
        .isObject()
        .withMessage('İletişim bilgileri bir nesne olmalıdır'),
    body('contact.phone')
        .optional()
        .matches(/^\+?[0-9\s-()]{8,}$/)
        .withMessage('Geçerli bir telefon numarası giriniz'),
    body('contact.email')
        .optional()
        .isEmail()
        .withMessage('Geçerli bir e-posta adresi giriniz')
];

// Public routes
router.get('/', cache(300), getSettings);
router.get('/:name', cache(300), getSetting);

// Admin routes
router.post('/', protect, authorize('admin'), settingValidation, clearCache, createSetting);
router.put('/:name', protect, authorize('admin'), settingValidation, clearCache, updateSetting);
router.delete('/:name', protect, authorize('admin'), clearCache, deleteSetting);

module.exports = router; 