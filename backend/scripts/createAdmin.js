const mongoose = require('mongoose');
const { MONGODB_URI } = require('../src/config/config');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB\'ye bağlanıldı');

        const adminData = {
            name: 'Admin',
            email: 'admin@esteri.com',
            password: 'admin123',
            role: 'admin',
            isActive: true
        };

        // Önce varsa eski admin kullanıcısını sil
        await User.deleteOne({ email: adminData.email });

        // Yeni admin kullanıcısını oluştur
        const admin = await User.create(adminData);
        
        console.log('Admin kullanıcısı başarıyla oluşturuldu:');
        console.log('Email:', adminData.email);
        console.log('Şifre:', adminData.password);

        process.exit(0);
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
};

createAdmin(); 