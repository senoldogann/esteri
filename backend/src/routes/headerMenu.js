const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { clearCache } = require('../middleware/cache');

const {
    getHeaderMenuItems,
    createHeaderMenuItem,
    updateHeaderMenuItem,
    deleteHeaderMenuItem,
    reorderHeaderMenuItems
} = require('../controllers/headerMenu');

router.route('/')
    .get(getHeaderMenuItems)
    .post(protect, authorize('admin'), clearCache('cache:*'), createHeaderMenuItem);

// Reorder route should come before :id routes
router.put('/reorder', protect, authorize('admin'), clearCache('cache:*'), reorderHeaderMenuItems);

router.route('/:id')
    .put(protect, authorize('admin'), clearCache('cache:*'), updateHeaderMenuItem)
    .delete(protect, authorize('admin'), clearCache('cache:*'), deleteHeaderMenuItem);

module.exports = router; 