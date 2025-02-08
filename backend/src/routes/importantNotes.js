const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
    getImportantNotes,
    createImportantNote,
    updateImportantNote,
    deleteImportantNote
} = require('../controllers/importantNotes');

router.route('/')
    .get(getImportantNotes)
    .post(protect, authorize('admin'), createImportantNote);

router.route('/:id')
    .put(protect, authorize('admin'), updateImportantNote)
    .delete(protect, authorize('admin'), deleteImportantNote);

module.exports = router; 