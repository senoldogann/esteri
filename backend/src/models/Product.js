const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Ürün adı zorunludur'],
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Fiyat zorunludur'],
        min: [0, 'Fiyat 0\'dan küçük olamaz']
    },
    familyPrice: {
        type: Number,
        min: [0, 'Aile boy fiyatı 0\'dan küçük olamaz']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Kategori zorunludur']
    },
    ingredients: {
        type: [String],
        default: []
    },
    image: {
        type: String
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

// Kaydetmeden önce slug oluştur
productSchema.pre('save', async function(next) {
    if (!this.slug) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .trim();

        let slug = baseSlug;
        let counter = 1;
        
        // Benzersiz slug oluştur
        while (await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        
        this.slug = slug;
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);