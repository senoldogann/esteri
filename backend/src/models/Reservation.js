const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  numberOfPeople: {
    type: Number,
    required: true,
    min: [1, 'Kişi sayısı en az 1 olmalıdır'],
    max: [15, 'Kişi sayısı en fazla 15 olabilir'],
    validate: {
      validator: Number.isInteger,
      message: 'Kişi sayısı tam sayı olmalıdır'
    }
  },
  status: {
    type: String,
    enum: ['beklemede', 'onaylandı', 'iptal edildi', 'tamamlandı'],
    default: 'beklemede'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Rezervasyon oluşturulmadan önce çalışacak middleware
reservationSchema.pre('save', async function(next) {
  try {
    // Aynı tarih ve saatte olan rezervasyonları bul
    const existingReservations = await this.constructor.find({
      date: this.date,
      time: this.time,
      status: { $in: ['beklemede', 'onaylandı'] },
      _id: { $ne: this._id } // Kendisi hariç
    });

    // Toplam kişi sayısını hesapla
    const totalPeople = existingReservations.reduce((sum, reservation) => {
      return sum + reservation.numberOfPeople;
    }, 0);

    // Yeni rezervasyonla birlikte toplam kişi sayısı
    const totalWithNew = totalPeople + this.numberOfPeople;

    // Kapasite kontrolü
    if (totalWithNew > 15) {
      throw new Error(`Bu saat için kapasite dolu. Mevcut doluluk: ${totalPeople} kişi, Kalan kapasite: ${15 - totalPeople} kişi.`);
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Reservation', reservationSchema); 