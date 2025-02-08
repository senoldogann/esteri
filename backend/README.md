# Esteri Restaurant Backend API

Modern ve güvenli bir restoran yönetim sistemi API'si.

## Özellikler

- JWT tabanlı kimlik doğrulama
- Role dayalı yetkilendirme (admin/editor)
- Redis önbellekleme
- Rate limiting ve DDoS koruması
- Resim yükleme ve optimizasyon
- Loglama sistemi
- Güvenli veritabanı işlemleri
- API dokümantasyonu

## Gereksinimler

- Node.js >= 18.0.0
- MongoDB
- Redis

## Kurulum

1. Depoyu klonlayın:
```bash
git clone https://github.com/yourusername/esteri-backend.git
cd esteri-backend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyasını oluşturun ve gerekli değişkenleri ayarlayın:
```bash
cp .env.example .env
```

4. MongoDB ve Redis servislerinin çalıştığından emin olun

5. Uygulamayı başlatın:
```bash
# Geliştirme modu
npm run dev

# Prodüksiyon modu
npm run prod
```

## API Endpoints

### Auth Routes
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Mevcut kullanıcı bilgileri
- `GET /api/auth/logout` - Çıkış yap

### Category Routes
- `GET /api/categories` - Tüm kategorileri listele
- `GET /api/categories/:id` - Tek kategori detayı
- `POST /api/categories` - Yeni kategori oluştur (Admin)
- `PUT /api/categories/:id` - Kategori güncelle (Admin)
- `DELETE /api/categories/:id` - Kategori sil (Admin)
- `PUT /api/categories/reorder` - Kategori sıralamasını güncelle (Admin)

### Product Routes
- `GET /api/products` - Tüm ürünleri listele
- `GET /api/products/:id` - Tek ürün detayı
- `POST /api/products` - Yeni ürün oluştur (Admin)
- `PUT /api/products/:id` - Ürün güncelle (Admin)
- `DELETE /api/products/:id` - Ürün sil (Admin)
- `PUT /api/products/reorder` - Ürün sıralamasını güncelle (Admin)

## Güvenlik

- Helmet.js ile güvenlik başlıkları
- Rate limiting ile DDoS koruması
- JWT ile güvenli kimlik doğrulama
- Şifrelerin güvenli hashlenme
- Input validasyonu
- CORS koruması
- MongoDB injection koruması

## Performans

- Redis önbellekleme
- MongoDB indexleme
- Response compression
- Statik dosya optimizasyonu
- Rate limiting

## Lisans

MIT 