const Product = require('../models/Product');
const asyncHandler = require('../middleware/async');
const { createActivity } = require('./activityController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Upload dizini
const UPLOAD_PATH = path.join(__dirname, '../..', 'uploads/products');

// Multer ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(UPLOAD_PATH)) {
            fs.mkdirSync(UPLOAD_PATH, { recursive: true });
        }
        cb(null, UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('image');

// Tüm ürünleri getir
exports.getProducts = asyncHandler(async (req, res) => {
    // MongoDB bağlantısını kontrol et
    if (mongoose.connection.readyState !== 1) {
        logger.error('MongoDB bağlantısı yok');
        return res.status(500).json({
            success: false,
            message: 'Veritabanı bağlantısı kurulamadı'
        });
    }

    const products = await Product.find()
        .sort('order')
        .populate('category')
        .lean();

    if (!products) {
        return res.status(404).json({
            success: false,
            message: 'Ürün bulunamadı'
        });
    }

    logger.info(`${products.length} ürün başarıyla getirildi`);

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
});

// Tekil ürün getir
exports.getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category');

    if (!product) {
        return res.status(404).json({
            success: false,
            error: 'Ürün bulunamadı'
        });
    }

    res.status(200).json({
        success: true,
        data: product
    });
});

// Ürün oluştur
exports.createProduct = asyncHandler(async (req, res) => {
    try {
        const { name, description, price, familyPrice, category, ingredients } = req.body;

        // Zorunlu alan kontrolü
        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                error: 'Ürün adı, fiyat ve kategori zorunludur'
            });
        }

        // Sayısal değer kontrolleri
        const numPrice = Number(price);
        const numFamilyPrice = familyPrice ? Number(familyPrice) : undefined;

        if (isNaN(numPrice) || numPrice < 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir fiyat giriniz'
            });
        }

        if (numFamilyPrice !== undefined && (isNaN(numFamilyPrice) || numFamilyPrice < 0)) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir aile boy fiyatı giriniz'
            });
        }

        const productData = {
            name: name.trim(),
            description: description ? description.trim() : '',
            price: numPrice,
            category
        };

        if (numFamilyPrice !== undefined) {
            productData.familyPrice = numFamilyPrice;
        }

        if (ingredients) {
            productData.ingredients = Array.isArray(ingredients) 
                ? ingredients.map(item => String(item).trim()).filter(Boolean)
                : ingredients.split(',').map(item => item.trim()).filter(Boolean);
        }

        const product = await Product.create(productData);

        await createActivity({
            type: 'create',
            module: 'product',
            description: `${product.name} ürünü oluşturuldu`,
            user: req.user?.name || 'Admin'
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Ürün oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Ürün oluşturulurken bir hata oluştu'
        });
    }
});

// Ürün güncelle
exports.updateProduct = asyncHandler(async (req, res) => {
    try {
        const { name, description, price, familyPrice, category, ingredients } = req.body;

        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Ürün bulunamadı'
            });
        }

        // Zorunlu alan kontrolü
        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                error: 'Ürün adı, fiyat ve kategori zorunludur'
            });
        }

        // Sayısal değer kontrolleri
        const numPrice = Number(price);
        const numFamilyPrice = familyPrice ? Number(familyPrice) : undefined;

        if (isNaN(numPrice) || numPrice < 0) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir fiyat giriniz'
            });
        }

        if (numFamilyPrice !== undefined && (isNaN(numFamilyPrice) || numFamilyPrice < 0)) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir aile boy fiyatı giriniz'
            });
        }

        // Yeni slug oluştur
        let baseSlug = name.trim()
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .trim();

        // Benzersiz slug oluştur
        let slug = baseSlug;
        let counter = 1;
        let slugExists = true;

        while (slugExists) {
            const existingProduct = await Product.findOne({ 
                slug, 
                _id: { $ne: req.params.id } 
            });
            
            if (!existingProduct) {
                slugExists = false;
            } else {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
        }

        const updateData = {
            name: name.trim(),
            description: description ? description.trim() : '',
            price: numPrice,
            category,
            slug: slug
        };

        if (numFamilyPrice !== undefined) {
            updateData.familyPrice = numFamilyPrice;
        }

        if (ingredients) {
            updateData.ingredients = Array.isArray(ingredients) 
                ? ingredients.map(item => String(item).trim()).filter(Boolean)
                : ingredients.split(',').map(item => item.trim()).filter(Boolean);
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate('category');

        await createActivity({
            type: 'update',
            module: 'product',
            description: `${product.name} ürünü güncellendi`,
            user: req.user?.name || 'Admin'
        });

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Ürün güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Ürün güncellenirken bir hata oluştu'
        });
    }
});

// Ürün resmi yükle
exports.uploadProductImage = asyncHandler(async (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            console.error('Resim yükleme hatası:', err);
            return res.status(400).json({
                success: false,
                error: err.message || 'Resim yüklenirken bir hata oluştu'
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Lütfen bir resim seçin'
                });
            }

            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Ürün bulunamadı'
                });
            }

            // Eski resmi sil
            if (product.image) {
                const oldImagePath = path.join(UPLOAD_PATH, product.image.replace('uploads/products/', ''));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Yeni resim yolunu kaydet
            const imagePath = `uploads/products/${req.file.filename}`;
            
            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                { image: imagePath },
                { new: true }
            );

            res.status(200).json({
                success: true,
                data: updatedProduct
            });
        } catch (error) {
            console.error('Resim güncelleme hatası:', error);
            // Hata durumunda yüklenen resmi sil
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            res.status(500).json({
                success: false,
                error: error.message || 'Resim güncellenirken bir hata oluştu'
            });
        }
    });
});

// Ürün sil
exports.deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            error: 'Ürün bulunamadı'
        });
    }

    // Ürüne ait resmi sil
    if (product.image) {
        const imagePath = path.join(UPLOAD_PATH, product.image.replace('uploads/products/', ''));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await product.deleteOne();

    await createActivity({
        type: 'delete',
        module: 'product',
        description: `${product.name} ürünü silindi`,
        user: req.user?.name || 'Admin'
    });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// Ürünleri yeniden sırala
exports.reorderProducts = asyncHandler(async (req, res) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({
                success: false,
                error: 'Geçersiz ürün listesi'
            });
        }

        await Promise.all(
            products.map(async (item) => {
                if (!item.productId || typeof item.order !== 'number') {
                    throw new Error('Geçersiz ürün verisi');
                }

                await Product.findByIdAndUpdate(
                    item.productId,
                    { 
                        order: item.order,
                        category: item.category 
                    },
                    { 
                        new: true,
                        runValidators: true 
                    }
                );
            })
        );

        const updatedProducts = await Product.find()
            .populate('category')
            .sort('order');

        await createActivity({
            type: 'update',
            module: 'product',
            description: 'Ürün sıralaması güncellendi',
            user: req.user?.name || 'Admin'
        });

        res.status(200).json({
            success: true,
            data: updatedProducts
        });
    } catch (error) {
        console.error('Sıralama hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Ürünler yeniden sıralanamadı'
        });
    }
});

// Tüm ürünleri güncelle ve slug oluştur
exports.updateAllProducts = asyncHandler(async (req, res) => {
    try {
        const products = await Product.find();
        
        for (const product of products) {
            product.slug = null; // Slug'ı sıfırla
            await product.save(); // Pre-save hook yeni slug oluşturacak
        }

        res.status(200).json({
            success: true,
            message: 'Tüm ürünler güncellendi ve slug\'lar oluşturuldu'
        });
    } catch (error) {
        console.error('Toplu güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Ürünler güncellenirken bir hata oluştu'
        });
    }
}); 