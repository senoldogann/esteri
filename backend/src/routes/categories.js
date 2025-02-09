const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
} = require('../controllers/categories');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const categoryValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Kategori adı 2-50 karakter arasında olmalıdır'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Sıralama değeri pozitif bir sayı olmalıdır')
];

const reorderValidation = [
    body('categories')
        .isArray()
        .withMessage('Kategoriler dizisi gereklidir')
        .custom((categories) => {
            return categories.every(cat => 
                cat.id && typeof cat.order === 'number' && cat.order >= 0
            );
        })
        .withMessage('Geçersiz kategori sıralaması')
];

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

// Reorder route should come before :id routes
router.put('/reorder',
    reorderValidation,
    reorderCategories
);

router.post('/', 
    categoryValidation,
    createCategory
);

router.put('/:id', 
    categoryValidation,
    updateCategory
);

router.delete('/:id',
    deleteCategory
);

module.exports = router; 