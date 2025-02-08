const Activity = require('../models/Activity');
const asyncHandler = require('../middleware/async');

// Tüm aktiviteleri getir
exports.getActivities = asyncHandler(async (req, res) => {
    const activities = await Activity.find()
        .sort({ createdAt: -1 }) // En son aktiviteler önce
        .limit(10); // Son 10 aktivite

    res.status(200).json({
        success: true,
        data: activities
    });
});

// Yeni aktivite oluştur
exports.createActivity = async (activityData) => {
    try {
        const activity = await Activity.create(activityData);
        return activity;
    } catch (error) {
        console.error('Aktivite oluşturulurken hata:', error);
        return null;
    }
}; 