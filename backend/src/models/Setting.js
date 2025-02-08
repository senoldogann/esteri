const mongoose = require('mongoose');

const openingHoursSchema = new mongoose.Schema({
    day: {
        fi: String,
        en: String,
        sv: String
    },
    open: String,
    close: String,
    isClosed: {
        type: Boolean,
        default: false
    }
});

const settingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    openingHours: [openingHoursSchema],
    address: {
        street: {
            fi: String,
            en: String,
            sv: String
        },
        city: {
            fi: String,
            en: String,
            sv: String
        },
        postalCode: String,
        country: {
            fi: String,
            en: String,
            sv: String
        }
    },
    contact: {
        phone: String,
        email: String,
        facebook: String,
        instagram: String
    },
    extraInfo: {
        fi: String,
        en: String,
        sv: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema); 