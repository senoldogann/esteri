const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Kategori adı zorunludur'],
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true // null değerlere izin ver
    },
    description: {
        type: String,
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Kaydetmeden önce slug oluştur
categorySchema.pre('save', function(next) {
    // Her zaman slug oluştur (güncelleme durumunda da)
    // Türkçe karakterleri değiştir ve küçük harfe çevir
    this.slug = this.name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '') // Sadece harf ve rakamları tut
        .trim();
    
    next();
});

// Ürünler için virtual populate
categorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category'
});

module.exports = mongoose.model('Category', categorySchema); 