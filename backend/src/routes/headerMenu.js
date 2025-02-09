const express = require('express');
const router = express.Router();
const { 
    getHeaderMenuItems,
    createHeaderMenuItem,
    updateHeaderMenuItem,
    deleteHeaderMenuItem,
    reorderHeaderMenuItems
} = require('../controllers/headerMenu');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getHeaderMenuItems);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', createHeaderMenuItem);
router.put('/reorder', reorderHeaderMenuItems);
router.put('/:id', updateHeaderMenuItem);
router.delete('/:id', deleteHeaderMenuItem);

module.exports = router; 