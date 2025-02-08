const mongoose = require('mongoose');

const importantNoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Başlık gereklidir'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'İçerik gereklidir'],
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ImportantNote', importantNoteSchema); 