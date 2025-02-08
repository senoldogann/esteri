const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    workingHours: {
        type: String,
        required: false
    },
    socialMedia: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        validate: {
            validator: function(value) {
                return typeof value === 'object';
            },
            message: 'socialMedia bir obje olmalıdır'
        }
    },
    copyright: {
        type: String,
        required: false
    },
    items: [{
        title: {
            type: String,
            required: true
        },
        link: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: false
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Footer', footerSchema); 