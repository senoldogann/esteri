const Footer = require('../models/Footer');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

// @desc    Get footer
// @route   GET /api/footer
// @access  Public
exports.getFooter = asyncHandler(async (req, res, next) => {
    const footer = await Footer.findOne();
    res.status(200).json({
        success: true,
        data: footer
    });
});

// @desc    Update footer
// @route   PUT /api/footer
// @access  Private
exports.updateFooter = asyncHandler(async (req, res, next) => {
    logger.info('Footer güncelleme isteği alındı:', req.body);

    let footer = await Footer.findOne();

    if (!footer) {
        footer = await Footer.create(req.body);
        logger.info('Yeni footer oluşturuldu:', footer);
    } else {
        // Mevcut footer'ı güncelle
        const updateData = { ...req.body };
        logger.info('Güncellenecek footer verisi:', updateData);

        footer = await Footer.findOneAndUpdate(
            {},
            { $set: updateData },
            { new: true, runValidators: true }
        );

        logger.info('Footer güncellendi:', footer);
    }

    res.status(200).json({
        success: true,
        data: footer,
        message: 'Footer başarıyla güncellendi'
    });
});

// Yeni Footer oluştur
exports.createFooter = asyncHandler(async (req, res) => {
    const footer = await Footer.create(req.body);

    res.status(201).json({
        success: true,
        data: footer
    });
}); 