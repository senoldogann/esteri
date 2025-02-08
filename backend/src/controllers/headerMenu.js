const HeaderMenu = require('../models/HeaderMenu');
const asyncHandler = require('../middleware/async');

// @desc    Tüm menü öğelerini getir
// @route   GET /api/header-menu
// @access  Public
exports.getHeaderMenuItems = asyncHandler(async (req, res) => {
    const menuItems = await HeaderMenu.find({ isActive: true }).sort('order');
    
    res.status(200).json({
        success: true,
        count: menuItems.length,
        data: menuItems
    });
});

// @desc    Yeni menü öğesi ekle
// @route   POST /api/header-menu
// @access  Private
exports.createHeaderMenuItem = asyncHandler(async (req, res) => {
    const menuItem = await HeaderMenu.create(req.body);
    
    res.status(201).json({
        success: true,
        data: menuItem
    });
});

// @desc    Menü öğesini güncelle
// @route   PUT /api/header-menu/:id
// @access  Private
exports.updateHeaderMenuItem = asyncHandler(async (req, res) => {
    let menuItem = await HeaderMenu.findById(req.params.id);
    
    if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: 'Menü öğesi bulunamadı'
        });
    }
    
    menuItem = await HeaderMenu.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json({
        success: true,
        data: menuItem
    });
});

// @desc    Menü öğesini sil
// @route   DELETE /api/header-menu/:id
// @access  Private
exports.deleteHeaderMenuItem = asyncHandler(async (req, res) => {
    const menuItem = await HeaderMenu.findById(req.params.id);
    
    if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: 'Menü öğesi bulunamadı'
        });
    }
    
    await menuItem.deleteOne();
    
    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Menü öğelerini yeniden sırala
// @route   PUT /api/header-menu/reorder
// @access  Private
exports.reorderHeaderMenuItems = asyncHandler(async (req, res) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({
            success: false,
            message: 'Geçerli bir sıralama listesi gönderilmedi'
        });
    }

    // Her bir öğeyi güncelle
    for (const item of items) {
        await HeaderMenu.findByIdAndUpdate(item.id, { order: item.order });
    }

    res.status(200).json({
        success: true,
        message: 'Menü öğeleri yeniden sıralandı'
    });
}); 