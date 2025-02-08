# Esteri Restaurant Web Uygulaması

Bu proje, Esteri Restaurant için geliştirilmiş full-stack bir web uygulamasıdır.

## Özellikler

- 🍽️ Menü yönetimi
- 📱 Responsive tasarım
- 🌙 Karanlık/Aydınlık mod
- 🔍 SEO optimizasyonu
- 📊 Admin paneli
- 🎨 Özelleştirilebilir tema
- 🌍 Çoklu dil desteği
- 📅 Rezervasyon sistemi

## Teknolojiler

### Frontend
- React
- Material-UI
- React Query
- React Router
- Formik & Yup
- Jest & Testing Library
- Cypress

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication
- Multer
- Sharp

## Kurulum

1. Repoyu klonlayın:
```bash
git clone https://github.com/kullaniciadi/esteri.git
cd esteri
```

2. Backend için gerekli paketleri yükleyin:
```bash
cd backend
npm install
```

3. Frontend için gerekli paketleri yükleyin:
```bash
cd ../frontend
npm install
```

4. Backend için .env dosyası oluşturun:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/esteri
JWT_SECRET=your_jwt_secret
```

5. Frontend için .env dosyası oluşturun:
```env
VITE_API_URL=http://localhost:5001
```

## Geliştirme

Backend'i başlatmak için:
```bash
cd backend
npm run dev
```

Frontend'i başlatmak için:
```bash
cd frontend
npm run dev
```

## Test

Backend testlerini çalıştırmak için:
```bash
cd backend
npm test
```

Frontend testlerini çalıştırmak için:
```bash
cd frontend
npm test
```

## Deployment

1. Backend için production build:
```bash
cd backend
npm run build
```

2. Frontend için production build:
```bash
cd frontend
npm run build
```

## Katkıda Bulunma

1. Bu repoyu fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Proje Sahibi - [@senoldogann](https://github.com/senoldogann)

Proje Linki: [https://github.com/senoldogann/esteri](https://github.com/senoldogann/esteri) 