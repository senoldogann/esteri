require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const initializeData = async () => {
    try {
        // MongoDB'ye bağlan
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Veritabanı bağlantısı başarılı');

        // Modelleri yükle
        const HeroSection = require('../models/HeroSection');
        const Footer = require('../models/Footer');
        const HeaderMenu = require('../models/HeaderMenu');

        // HeaderMenu için varsayılan veri oluştur
        const headerMenu = await HeaderMenu.find();
        if (headerMenu.length === 0) {
            await HeaderMenu.create([
                {
                    name: 'Ana Sayfa',
                    link: '/',
                    order: 0,
                    isActive: true
                },
                {
                    name: 'Menü',
                    link: '#menu',
                    order: 1,
                    isActive: true
                },
                {
                    name: 'Hakkımızda',
                    link: '#about',
                    order: 2,
                    isActive: true
                },
                {
                    name: 'İletişim',
                    link: '#contact',
                    order: 3,
                    isActive: true
                }
            ]);
            logger.info('HeaderMenu varsayılan verileri oluşturuldu');
        }

        // HeroSection için varsayılan veri oluştur
        const heroSection = await HeroSection.findOne();
        if (!heroSection) {
            await HeroSection.create({
                title: 'Hoş Geldiniz',
                description: 'Lezzetli pizzalarımızı keşfedin',
                buttonText: 'Sipariş Ver',
                buttonLink: '/menu',
                isActive: true
            });
            logger.info('HeroSection varsayılan verisi oluşturuldu');
        }

        // Footer için varsayılan veri oluştur
        const footer = await Footer.findOne();
        if (!footer) {
            await Footer.create({
                address: 'Örnek Adres',
                phone: '+90 555 555 55 55',
                email: 'info@example.com',
                workingHours: 'Her gün 11:00 - 23:00',
                socialMedia: {
                    facebook: 'https://facebook.com',
                    instagram: 'https://instagram.com',
                    twitter: 'https://twitter.com'
                },
                isActive: true
            });
            logger.info('Footer varsayılan verisi oluşturuldu');
        }

        logger.info('Başlangıç verileri başarıyla oluşturuldu');
        process.exit(0);
    } catch (error) {
        logger.error('Hata:', error);
        process.exit(1);
    }
};

initializeData(); 