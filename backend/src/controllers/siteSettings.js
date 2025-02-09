const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('express-async-handler');
const { createActivity } = require('./activityController');

// @desc    Get site settings
// @route   GET /api/site-settings
// @access  Public
exports.getSiteSettings = asyncHandler(async (req, res) => {
    const settings = await SiteSettings.findOne();
    res.json({
        success: true,
        data: settings || {}
    });
});

// @desc    Update site settings
// @route   PUT /api/site-settings
// @access  Admin
exports.updateSiteSettings = asyncHandler(async (req, res) => {
    let settings = await SiteSettings.findOne();

    if (!settings) {
        settings = await SiteSettings.create(req.body);
    } else {
        settings = await SiteSettings.findOneAndUpdate(
            {},
            req.body,
            { new: true, runValidators: true }
        );
    }

    // Aktivite kaydı oluştur
    await createActivity({
      type: 'update',
      module: 'site-settings',
      description: 'Site ayarları güncellendi',
      user: req.user?.name || 'Admin'
    });
    
    res.json({
        success: true,
        data: settings
    });
}); 