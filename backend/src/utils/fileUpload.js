const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

/**
 * Dosya yükleme işlemini gerçekleştirir
 * @param {Object} file - Express-fileupload file nesnesi
 * @param {string} [directory=''] - Yüklenecek dizin (uploads altında)
 * @returns {Promise<{filename: string}>}
 */
exports.uploadFile = async (file, directory = '') => {
    try {
        // Dosya adını benzersiz yap
        const timestamp = Date.now();
        const originalName = path.parse(file.name).name;
        const extension = path.parse(file.name).ext;
        const filename = `${originalName}-${timestamp}${extension}`;

        // Hedef dizini oluştur
        const targetDir = path.join(__dirname, '../../uploads', directory);
        await fs.mkdir(targetDir, { recursive: true });

        // Dosyayı taşı
        const targetPath = path.join(targetDir, filename);
        await file.mv(targetPath);

        logger.info(`Dosya başarıyla yüklendi: ${filename}`);
        return { filename: path.join(directory, filename).replace(/\\/g, '/') };
    } catch (error) {
        logger.error('Dosya yükleme hatası:', error);
        throw new Error('Dosya yüklenirken bir hata oluştu');
    }
}; 