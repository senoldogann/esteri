const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const { protect, authorize } = require('../middleware/auth');

// Public endpoint'ler (auth gerektirmeyen)
router.get('/available-dates', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const reservations = await Reservation.find({
      date: {
        $gte: start,
        $lte: end
      },
      status: { 
        $nin: ['iptal edildi', 'tamamlandı'] 
      }
    }).select('date time numberOfPeople status');

    const MAX_DAILY_CAPACITY = 100; // Günlük toplam kapasiteyi artırıyoruz
    const MAX_TIME_SLOT_CAPACITY = 20; // Her saat dilimi için maksimum kapasite

    const availability = {};
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayReservations = reservations.filter(r => {
        const reservationDate = new Date(r.date);
        return reservationDate.toISOString().split('T')[0] === dateStr &&
               ['beklemede', 'onaylandı'].includes(r.status);
      });

      const totalReservations = dayReservations.reduce((sum, r) => sum + r.numberOfPeople, 0);
      
      const timeSlots = {};
      dayReservations.forEach(r => {
        if (!timeSlots[r.time]) timeSlots[r.time] = 0;
        timeSlots[r.time] += r.numberOfPeople;
      });

      // Her saat diliminin doluluk durumunu kontrol et
      const availableTimeSlots = ['12:00', '14:00', '16:00', '18:00', '20:00'].reduce((acc, time) => {
        acc[time] = {
          capacity: timeSlots[time] || 0,
          isAvailable: (timeSlots[time] || 0) < MAX_TIME_SLOT_CAPACITY
        };
        return acc;
      }, {});

      // En az bir saat dilimi müsaitse gün müsait demektir
      const hasAvailableSlot = Object.values(availableTimeSlots).some(slot => slot.isAvailable);

      availability[dateStr] = {
        isAvailable: hasAvailableSlot && totalReservations < MAX_DAILY_CAPACITY,
        remainingCapacity: Math.max(0, MAX_DAILY_CAPACITY - totalReservations),
        totalReservations,
        timeSlots: availableTimeSlots,
        isFull: totalReservations >= MAX_DAILY_CAPACITY
      };

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Müsait günler kontrol hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Müsait günler kontrol edilirken bir hata oluştu'
    });
  }
});

// Yeni rezervasyon oluştur (public)
router.post('/', async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();
    res.status(201).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Rezervasyon oluşturma hatası:', error);
    res.status(400).json({
      success: false,
      message: 'Rezervasyon oluşturulurken bir hata oluştu'
    });
  }
});

// Tüm rezervasyonları getir (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Rezervasyon listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyonlar listelenirken bir hata oluştu'
    });
  }
});

// Rezervasyon durumunu güncelle (admin)
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['beklemede', 'onaylandı', 'iptal edildi', 'tamamlandı'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri'
      });
    }

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

// Rezervasyon sil (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndDelete(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Rezervasyon başarıyla silindi'
    });
  } catch (error) {
    console.error('Rezervasyon silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyon silinirken bir hata oluştu'
    });
  }
});

module.exports = router;