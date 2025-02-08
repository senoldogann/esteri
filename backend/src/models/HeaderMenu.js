const mongoose = require('mongoose');

const headerMenuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Menü adı gereklidir'],
        trim: true
    },
    link: {
        type: String,
        required: [true, 'Menü linki gereklidir'],
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

module.exports = mongoose.model('HeaderMenu', headerMenuSchema); 