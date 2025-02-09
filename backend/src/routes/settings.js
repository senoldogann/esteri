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
router.get('/', getSettings);
router.get('/:name', getSetting);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', settingValidation, createSetting);
router.put('/:name', settingValidation, updateSetting);
router.delete('/:name', deleteSetting);

module.exports = router; 