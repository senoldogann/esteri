const express = require('express');
const router = express.Router();
const { getFooter, updateFooter } = require('../controllers/footerController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getFooter);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

router.put('/', updateFooter);

module.exports = router; 