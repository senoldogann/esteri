const Category = require('../models/Category');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/async');

// @desc    Tüm kategorileri getir
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
    // MongoDB bağlantısını kontrol et
    if (mongoose.connection.readyState !== 1) {
        logger.error('MongoDB bağlantısı yok');
        return res.status(500).json({
            success: false,
            message: 'Veritabanı bağlantısı kurulamadı'
        });
    }

    const categories = await Category.find({ isActive: true })
        .sort('order')
        .populate('products')
        .lean();

    if (!categories) {
        return res.status(404).json({
            success: false,
            message: 'Kategori bulunamadı'
        });
    }

    logger.info(`${categories.length} kategori başarıyla getirildi`);

    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
});

// @desc    Tek kategori getir
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('products');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori bulunamadı'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        logger.error('Get Category Error:', error);
        res.status(500).json({
            success: false,
            message: 'Kategori alınamadı'
        });
    }
};

// @desc    Kategori oluştur
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        logger.error('Create Category Error:', error);
        res.status(500).json({
            success: false,
            message: error.code === 11000 
                ? 'Bu isimde bir kategori zaten var' 
                : error.message || 'Kategori oluşturulamadı'
        });
    }
};

// @desc    Kategori güncelle
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori bulunamadı'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        logger.error('Update Category Error:', error);
        res.status(500).json({
            success: false,
            message: 'Kategori güncellenemedi'
        });
    }
};

// @desc    Kategori sil
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori bulunamadı'
            });
        }

        // Soft delete
        category.isActive = false;
        await category.save();

        res.status(200).json({
            success: true,
            message: 'Kategori silindi'
        });
    } catch (error) {
        logger.error('Delete Category Error:', error);
        res.status(500).json({
            success: false,
            message: 'Kategori silinemedi'
        });
    }
};

// @desc    Kategori sırasını güncelle
// @route   PUT /api/categories/reorder
// @access  Private/Admin
exports.reorderCategories = async (req, res) => {
    try {
        const { categories } = req.body;

        if (!categories || !Array.isArray(categories)) {
            throw new Error('Geçersiz kategori listesi');
        }

        logger.info('Reorder request data:', categories);

        // Sıralama güncelleme işlemleri
        const updates = await Promise.all(
            categories.map(async (item) => {
                logger.info('Processing category:', item);
                
                if (!item.categoryId) {
                    throw new Error('categoryId eksik');
                }

                const result = await Category.findByIdAndUpdate(
                    item.categoryId,
                    { order: item.order },
                    { 
                        new: true,
                        runValidators: true
                    }
                );
                
                if (!result) {
                    throw new Error(`Kategori bulunamadı: ${item.categoryId}`);
                }

                return result;
            })
        );

        logger.info('Updated categories:', updates);

        res.status(200).json({
            success: true,
            message: 'Kategoriler yeniden sıralandı',
            data: updates
        });
    } catch (error) {
        logger.error('Reorder Categories Error:', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        
        res.status(500).json({
            success: false,
            message: `Kategoriler yeniden sıralanamadı: ${error.message}`
        });
    }
}; 