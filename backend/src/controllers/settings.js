const Setting = require('../models/Setting');
const logger = require('../utils/logger');

// @desc    Tüm ayarları getir
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.find();

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        logger.error('Get Settings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayarlar alınamadı'
        });
    }
};

// @desc    Tek ayar getir
// @route   GET /api/settings/:name
// @access  Public
exports.getSetting = async (req, res) => {
    try {
        const setting = await Setting.findOne({ name: req.params.name });

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Ayar bulunamadı'
            });
        }

        res.status(200).json({
            success: true,
            data: setting
        });
    } catch (error) {
        logger.error('Get Setting Error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayar alınamadı'
        });
    }
};

// @desc    Ayar oluştur
// @route   POST /api/settings
// @access  Private/Admin
exports.createSetting = async (req, res) => {
    try {
        const setting = await Setting.create(req.body);

        res.status(201).json({
            success: true,
            data: setting
        });
    } catch (error) {
        logger.error('Create Setting Error:', error);
        res.status(500).json({
            success: false,
            message: error.code === 11000 
                ? 'Bu isimde bir ayar zaten var' 
                : error.message || 'Ayar oluşturulamadı'
        });
    }
};

// @desc    Ayar güncelle
// @route   PUT /api/settings/:name
// @access  Private/Admin
exports.updateSetting = async (req, res) => {
    try {
        const setting = await Setting.findOneAndUpdate(
            { name: req.params.name },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Ayar bulunamadı'
            });
        }

        res.status(200).json({
            success: true,
            data: setting
        });
    } catch (error) {
        logger.error('Update Setting Error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayar güncellenemedi'
        });
    }
};

// @desc    Ayar sil
// @route   DELETE /api/settings/:name
// @access  Private/Admin
exports.deleteSetting = async (req, res) => {
    try {
        const setting = await Setting.findOneAndDelete({ name: req.params.name });

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Ayar bulunamadı'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Ayar silindi'
        });
    } catch (error) {
        logger.error('Delete Setting Error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayar silinemedi'
        });
    }
}; 