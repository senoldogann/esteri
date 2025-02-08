const mongoose = require('mongoose');

const heroSectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String
    },
    description: {
        type: String
    },
    buttonText: {
        type: String
    },
    buttonLink: {
        type: String
    },
    backgroundImage: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('HeroSection', heroSectionSchema); 