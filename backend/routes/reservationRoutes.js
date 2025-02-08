const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

// Rezervasyon durumu güncelleme
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rezervasyon bulunamadı' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Rezervasyon durumu güncellendi',
      data: reservation 
    });
  } catch (error) {
    console.error('Rezervasyon güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Rezervasyon durumu güncellenirken bir hata oluştu' 
    });
  }
});

module.exports = router; 