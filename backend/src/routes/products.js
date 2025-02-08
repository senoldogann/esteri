const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    reorderProducts,
    uploadProductImage,
    updateAllProducts
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');

// Validation middleware
const productValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Ürün adı 2-100 karakter arasında olmalıdır'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Fiyat 0\'dan büyük olmalıdır'),
    body('familyPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Aile boy fiyatı 0\'dan büyük olmalıdır'),
    body('category')
        .notEmpty()
        .withMessage('Kategori seçimi zorunludur'),
    body('ingredients')
        .optional()
        .custom((value) => {
            if (value) {
                if (Array.isArray(value)) {
                    return value.every(item => typeof item === 'string');
                }
                return typeof value === 'string';
            }
            return true;
        })
        .withMessage('Malzemeler dizi veya virgülle ayrılmış metin olmalıdır')
];

// Public routes
router.get('/', cache(300), getProducts);
router.get('/:slug', cache(300), getProduct);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

// Tüm ürünleri güncelle ve slug oluştur
router.post('/update-all', clearCache('cache:*'), updateAllProducts);

// Reorder route'u ID route'larından önce gelmeli
router.put('/reorder', clearCache('cache:*'), reorderProducts);

// ID'ye bağlı route'lar
router.post('/', productValidation, clearCache('cache:*'), createProduct);
router.put('/:id', productValidation, clearCache('cache:*'), updateProduct);
router.delete('/:id', clearCache('cache:*'), deleteProduct);
router.post('/:id/image', clearCache('cache:*'), uploadProductImage);

module.exports = router; 