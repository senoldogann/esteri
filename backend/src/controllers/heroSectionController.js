const HeroSection = require('../models/HeroSection');
const asyncHandler = require('../middleware/async');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploads klasörü yolu
const UPLOAD_PATH = path.join(__dirname, '../..', 'uploads/hero');

// Multer konfigürasyonu
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Klasör yoksa oluştur
        if (!fs.existsSync(UPLOAD_PATH)) {
            fs.mkdirSync(UPLOAD_PATH, { recursive: true });
        }
        cb(null, UPLOAD_PATH);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now();
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Dosya tipi kontrolü
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('image');

// Hero Section'ı getir
exports.getHeroSection = asyncHandler(async (req, res) => {
    let heroSection = await HeroSection.findOne({ isActive: true });

    // Eğer hero section yoksa, varsayılan bir tane oluştur
    if (!heroSection) {
        heroSection = await HeroSection.create({
            title: 'Hoş Geldiniz',
            subtitle: 'Esteri\'ye Hoş Geldiniz',
            description: 'Sizin için en iyi hizmeti sunuyoruz',
            buttonText: 'Daha Fazla',
            buttonLink: '/hakkimizda',
            isActive: true
        });
    }

    res.status(200).json({
        success: true,
        data: heroSection
    });
});

// Hero Section'ı güncelle
exports.updateHeroSection = asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer hatası:', err);
            return res.status(400).json({
                success: false,
                error: `Dosya yükleme hatası: ${err.message}`
            });
        } else if (err) {
            console.error('Beklenmeyen hata:', err);
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        try {
            let heroSection = await HeroSection.findById(req.params.id);

            if (!heroSection) {
                return res.status(404).json({
                    success: false,
                    error: 'Hero section bulunamadı'
                });
            }

            const updateData = { ...req.body };

            // Yeni resim varsa ekle ve eski resmi sil
            if (req.file) {
                if (heroSection.backgroundImage) {
                    const oldImagePath = path.join(UPLOAD_PATH, heroSection.backgroundImage.replace('uploads/hero/', ''));
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                updateData.backgroundImage = `uploads/hero/${req.file.filename}`;
            }

            heroSection = await HeroSection.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );

            res.status(200).json({
                success: true,
                data: heroSection
            });
        } catch (error) {
            console.error('Hero section güncelleme hatası:', error);
            if (req.file) {
                fs.unlink(path.join(UPLOAD_PATH, req.file.filename), (err) => {
                    if (err) console.error('Resim silinirken hata:', err);
                });
            }
            res.status(500).json({
                success: false,
                error: error.message || 'Hero section güncellenirken bir hata oluştu'
            });
        }
    });
});

// Yeni Hero Section oluştur
exports.createHeroSection = asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                error: `Dosya yükleme hatası: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        try {
            const data = { ...req.body };
            if (req.file) {
                data.backgroundImage = `uploads/hero/${req.file.filename}`;
            }

            const heroSection = await HeroSection.create(data);

            res.status(201).json({
                success: true,
                data: heroSection
            });
        } catch (error) {
            if (req.file) {
                fs.unlink(path.join(UPLOAD_PATH, req.file.filename), (err) => {
                    if (err) console.error('Resim silinirken hata:', err);
                });
            }
            res.status(500).json({
                success: false,
                error: error.message || 'Hero section oluşturulurken bir hata oluştu'
            });
        }
    });
}); 