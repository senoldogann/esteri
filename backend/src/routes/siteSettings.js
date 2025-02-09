const express = require('express');
const router = express.Router();
const { getSiteSettings, updateSiteSettings } = require('../controllers/siteSettings');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getSiteSettings);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

router.put('/', updateSiteSettings);

module.exports = router; 