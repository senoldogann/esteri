const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSiteSettings, updateSiteSettings } = require('../controllers/siteSettings');
const { clearCache } = require('../middleware/cache');

// Public route
router.get('/', getSiteSettings);

// Admin route
router.put('/', protect, authorize('admin'), clearCache('cache:*'), updateSiteSettings);

module.exports = router; 