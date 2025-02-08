const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');
const { cache } = require('../middleware/cache');

// Activities rotaları
router.get('/', protect, cache(1), getActivities);

module.exports = router; 