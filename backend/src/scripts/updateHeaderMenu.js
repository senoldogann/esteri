const mongoose = require('mongoose');
require('dotenv').config();

const HeaderMenu = require('../models/HeaderMenu');

async function updateHeaderMenu() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB\'ye bağlandı');

        // Tüm menü öğelerini getir
        const menuItems = await HeaderMenu.find({});
        console.log(`${menuItems.length} menü öğesi bulundu`);

        // Hakkımızda linkini kaldır
        for (const item of menuItems) {
            if (item.link === '#about') {
                await HeaderMenu.deleteOne({ _id: item._id });
                console.log('Hakkımızda menü öğesi silindi');
            }
        }

        console.log('Header menü güncellendi');
        process.exit(0);
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
}

updateHeaderMenu(); 