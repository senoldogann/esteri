const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async (email, password) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const adminUser = new User({
            email,
            password,
            isAdmin: true,
            name: 'Admin'
        });

        await adminUser.save();
        console.log('Admin kullanıcısı başarıyla oluşturuldu');
        process.exit(0);
    } catch (error) {
        console.error('Hata:', error.message);
        process.exit(1);
    }
};

const [,, email, password] = process.argv;

if (!email || !password) {
    console.error('Kullanım: node createAdmin.js <email> <password>');
    process.exit(1);
}

// Email formatı kontrolü
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
if (!emailRegex.test(email)) {
    console.error('Geçerli bir email adresi giriniz');
    process.exit(1);
}

createAdmin(email, password);