const mongoose = require('mongoose');
const { MONGODB_URI } = require('../src/config/config');

const clearDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB\'ye bağlanıldı');

        await mongoose.connection.dropDatabase();
        console.log('Veritabanı başarıyla temizlendi');

        process.exit(0);
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
};

clearDatabase(); 