const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Yükleme dizinini oluştur
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage yapılandırması
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Dosya adını oluştur: timestamp-orijinal_ad
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
    // İzin verilen dosya tipleri
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Geçersiz dosya tipi. Sadece JPEG, JPG, PNG ve WEBP formatları kabul edilir.'), false);
    }
};

// Multer yapılandırması
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1 // Tek seferde maksimum dosya sayısı
    }
});

// Hata yakalama middleware'i
const handleUpload = (req, res, next) => {
    const uploadSingle = upload.single('image');

    uploadSingle(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Multer hatası
            logger.error('Multer upload error:', err);
            return res.status(400).json({
                success: false,
                message: 'Dosya yükleme hatası',
                error: err.message
            });
        } else if (err) {
            // Diğer hatalar
            logger.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        // Başarılı
        next();
    });
};

module.exports = {
    upload: handleUpload,
    uploadDir
}; 