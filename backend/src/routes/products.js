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
    deleteProductImage
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Validation middleware
const productValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Ürün adı 2-100 karakter arasında olmalıdır'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Açıklama en fazla 1000 karakter olabilir'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Fiyat pozitif bir sayı olmalıdır'),
    body('category')
        .isMongoId()
        .withMessage('Geçerli bir kategori ID\'si gereklidir'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Sıralama değeri pozitif bir sayı olmalıdır')
];

const reorderValidation = [
    body('products')
        .isArray()
        .withMessage('Ürünler dizisi gereklidir')
        .custom((products) => {
            return products.every(prod => 
                prod.id && typeof prod.order === 'number' && prod.order >= 0
            );
        })
        .withMessage('Geçersiz ürün sıralaması')
];

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

// Reorder route should come before :id routes
router.put('/reorder',
    reorderValidation,
    reorderProducts
);

router.post('/', 
    upload,
    productValidation,
    createProduct
);

router.put('/:id', 
    upload,
    productValidation,
    updateProduct
);

router.delete('/:id', deleteProduct);

// Image routes
router.post('/:id/image',
    upload,
    uploadProductImage
);

router.delete('/:id/image',
    deleteProductImage
);

module.exports = router; 