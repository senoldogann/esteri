const express = require('express');
const router = express.Router();
const {
    getHeroSection,
    updateHeroSection,
    createHeroSection
} = require('../controllers/heroSectionController');

const { protect } = require('../middleware/auth');

// Hero Section rotaları
router.route('/').get(getHeroSection).post(protect, createHeroSection);
router.route('/:id').put(protect, updateHeroSection);

module.exports = router; 