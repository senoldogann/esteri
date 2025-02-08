const Reservation = require('../models/Reservation');
const cron = require('node-cron');

// Otomatik rezervasyon tamamlama fonksiyonu
const autoCompleteReservations = async () => {
  try {
    // Bugünün başlangıcı ve sonu
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Bugünün rezervasyonlarını bul ve tamamlanmamış olanları güncelle
    const result = await Reservation.updateMany(
      {
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: {
          $nin: ['tamamlandı', 'iptal edildi'] // İptal edilmiş olanları hariç tut
        }
      },
      {
        $set: { status: 'tamamlandı' }
      }
    );

    console.log(`${result.modifiedCount} rezervasyon otomatik olarak tamamlandı.`);
  } catch (error) {
    console.error('Otomatik rezervasyon tamamlama hatası:', error);
  }
};

// Her gün gece yarısı çalışacak cron job
cron.schedule('0 0 * * *', async () => {
  console.log('Otomatik rezervasyon tamamlama başlatılıyor...');
  await autoCompleteReservations();
});

// Yeni rezervasyon oluşturma
exports.createReservation = async (req, res) => {
  try {
    const { date, time, numberOfPeople } = req.body;

    // Gelen tarihi başlangıç saatine ayarla
    const reservationDate = new Date(date);
    reservationDate.setHours(0, 0, 0, 0);

    console.log('Kontrol edilen tarih:', reservationDate);
    console.log('Kontrol edilen saat:', time);
    console.log('İstenen kişi sayısı:', numberOfPeople);

    // Seçilen tarih ve saatteki toplam rezervasyon sayısını kontrol et
    // Sadece beklemede ve onaylanmış rezervasyonları kontrol et
    const existingReservations = await Reservation.find({
      date: reservationDate,
      time: time,
      status: { $in: ['beklemede', 'onaylandı'] }
    });

    console.log('Mevcut rezervasyonlar:', existingReservations);

    // O saatteki toplam kişi sayısını hesapla
    const totalPeopleAtTime = existingReservations.reduce((total, reservation) => {
      return total + (reservation.numberOfPeople || 0);
    }, 0);

    console.log('Mevcut toplam kişi sayısı:', totalPeopleAtTime);

    // Saatlik kapasite kontrolü
    const HOURLY_CAPACITY = 5;
    const requestedPeople = parseInt(numberOfPeople) || 0;
    
    if (totalPeopleAtTime + requestedPeople > HOURLY_CAPACITY) {
      return res.status(400).json({
        success: false,
        error: `Üzgünüz, seçtiğiniz saat için yeterli kapasite bulunmamaktadır. Mevcut doluluk: ${totalPeopleAtTime} kişi, Kalan kapasite: ${HOURLY_CAPACITY - totalPeopleAtTime} kişi.`
      });
    }

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
      error: error.message
    });
  }
};

// Tüm rezervasyonları getirme
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: reservations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Rezervasyon durumunu güncelleme
exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Önce mevcut rezervasyonu bul
    const existingReservation = await Reservation.findById(id);

    if (!existingReservation) {
      return res.status(404).json({
        success: false,
        error: 'Rezervasyon bulunamadı'
      });
    }

    // Eğer rezervasyon zaten tamamlandı olarak işaretlendiyse, durumu değiştirmeye izin verme
    if (existingReservation.status === 'tamamlandı') {
      return res.status(400).json({
        success: false,
        error: 'Tamamlanmış rezervasyonların durumu değiştirilemez.'
      });
    }
    
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Rezervasyon silme
exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Önce rezervasyonu bul
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Rezervasyon bulunamadı'
      });
    }

    // Tamamlanmış rezervasyonlar silinemez
    if (reservation.status === 'tamamlandı') {
      return res.status(400).json({
        success: false,
        error: 'Tamamlanmış rezervasyonlar silinemez.'
      });
    }

    await Reservation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Rezervasyon başarıyla silindi'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 