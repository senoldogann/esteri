const ImportantNote = require('../models/ImportantNote');
const asyncHandler = require('../middleware/async');

// @desc    Tüm önemli notları getir
// @route   GET /api/important-notes
// @access  Public
exports.getImportantNotes = asyncHandler(async (req, res) => {
    const notes = await ImportantNote.find({ isActive: true }).sort('order');
    
    res.status(200).json({
        success: true,
        count: notes.length,
        data: notes
    });
});

// @desc    Yeni önemli not ekle
// @route   POST /api/important-notes
// @access  Private
exports.createImportantNote = asyncHandler(async (req, res) => {
    const note = await ImportantNote.create(req.body);
    
    res.status(201).json({
        success: true,
        data: note
    });
});

// @desc    Önemli notu güncelle
// @route   PUT /api/important-notes/:id
// @access  Private
exports.updateImportantNote = asyncHandler(async (req, res) => {
    let note = await ImportantNote.findById(req.params.id);
    
    if (!note) {
        return res.status(404).json({
            success: false,
            message: 'Not bulunamadı'
        });
    }
    
    note = await ImportantNote.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json({
        success: true,
        data: note
    });
});

// @desc    Önemli notu sil
// @route   DELETE /api/important-notes/:id
// @access  Private
exports.deleteImportantNote = asyncHandler(async (req, res) => {
    const note = await ImportantNote.findById(req.params.id);
    
    if (!note) {
        return res.status(404).json({
            success: false,
            message: 'Not bulunamadı'
        });
    }
    
    await note.deleteOne();
    
    res.status(200).json({
        success: true,
        data: {}
    });
}); 