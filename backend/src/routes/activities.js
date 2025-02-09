const express = require('express');
const router = express.Router();
const { getActivities, createActivity, deleteActivity } = require('../controllers/activities');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getActivities);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', createActivity);
router.delete('/:id', deleteActivity);

module.exports = router; 