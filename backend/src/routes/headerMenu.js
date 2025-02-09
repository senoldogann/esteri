const express = require('express');
const router = express.Router();
const { getHeaderMenu, updateHeaderMenu } = require('../controllers/headerMenu');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getHeaderMenu);

router.use(protect);
router.use(authorize('admin'));

router.put('/', updateHeaderMenu);

module.exports = router; 