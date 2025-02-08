const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');

async function updateCategorySlugs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB\'ye bağlandı');

        const categories = await Category.find({});
        console.log(`${categories.length} kategori bulundu`);

        for (const category of categories) {
            // Kategoriyi kaydet (pre-save hook slug'ı otomatik oluşturacak)
            await category.save();
            console.log(`"${category.name}" kategorisinin slug'ı güncellendi: ${category.slug}`);
        }

        console.log('Tüm kategorilerin slug\'ları güncellendi');
        process.exit(0);
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
}

updateCategorySlugs(); 