import { useState, useCallback } from 'react';
import {
    Box,
    Button,
    IconButton,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Grid,
    Avatar,
    Container,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    InputAdornment,
    Tabs,
    Tab,
    Snackbar,
    Alert,
    Card,
    CardMedia,
    CardContent,
    Slide,
    FormHelperText,
    CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import CloseIcon from '@mui/icons-material/Close';

// Third party
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Local imports
import api from '../../utils/api';
import ImageDropzone from './components/ImageDropzone';

// Yardımcı fonksiyon
const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    // API URL'ini al
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    // Eğer tam URL ise direkt döndür
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Dosya adını al (yoldan veya tam dosya adından)
    const fileName = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;

    // Tam URL'i oluştur
    return `${baseUrl}/uploads/products/${fileName}`;
};

// Validasyon şeması ekle
const ProductSchema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .min(2, 'Ürün adı en az 2 karakter olmalıdır')
        .max(100, 'Ürün adı en fazla 100 karakter olabilir')
        .required('Ürün adı gereklidir'),
    description: Yup.string()
        .max(500, 'Açıklama en fazla 500 karakter olabilir')
        .nullable(),
    price: Yup.number()
        .typeError('Geçerli bir fiyat giriniz')
        .min(0, 'Fiyat 0\'dan küçük olamaz')
        .required('Fiyat gereklidir'),
    familyPrice: Yup.number()
        .typeError('Geçerli bir fiyat giriniz')
        .min(0, 'Aile boy fiyatı 0\'dan küçük olamaz')
        .nullable(),
    category: Yup.string()
        .required('Kategori seçimi gereklidir'),
    ingredients: Yup.string()
        .max(200, 'İçindekiler en fazla 200 karakter olabilir')
        .nullable()
});

const Products = () => {
    const [open, setOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        familyPrice: '',
        category: '',
        ingredients: '',
        image: null
    });
    const [openModal, setOpenModal] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastSeverity, setToastSeverity] = useState('success');
    const [successMessage, setSuccessMessage] = useState('');

    const queryClient = useQueryClient();
    const theme = useTheme();
    const navigate = useNavigate();

    // Başarı mesajını göster ve 3 saniye sonra kaldır
    const showSuccessMessage = useCallback((message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    }, []);

    // Ürünleri getir
    const { data: productsResponse, isLoading: productsLoading } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/api/products');
            return response.data;
        },
        staleTime: 0,
        cacheTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
        refetchOnMount: true
    });

    // Kategorileri getir
    const { data: categories, isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/api/categories');
            return response.data.data;
        }
    });

    // Toast gösterme fonksiyonu
    const showNotification = (message, severity = 'success') => {
        setToastMessage(message);
        setToastSeverity(severity);
        setShowToast(true);
    };

    // Ürün ekleme başarılı olduğunda
    const handleProductAdded = () => {
        showSuccessMessage('Ürün başarıyla eklendi');
        setOpen(false);
        queryClient.invalidateQueries(['products']);
        queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
    };

    // Ürün güncelleme başarılı olduğunda
    const handleProductUpdated = () => {
        showNotification('Ürün başarıyla güncellendi');
        setOpen(false);
        queryClient.invalidateQueries(['products']);
    };

    // Ürün silme başarılı olduğunda
    const handleProductDeleted = () => {
        showNotification('Ürün başarıyla silindi');
    };

    // Form işlemleri
    const handleOpen = (product = null) => {
        setSelectedProduct(product);
        setFormData(product ? {
            name: product.name,
            description: product.description || '',
            price: product.price,
            familyPrice: product.familyPrice || '',
            category: product.category._id || product.category,
            ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : '',
            image: null
        } : {
            name: '',
            description: '',
            price: '',
            familyPrice: '',
            category: '',
            ingredients: '',
            image: null
        });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            familyPrice: '',
            category: '',
            ingredients: '',
            image: null
        });
    };

    const handleImageDrop = (file) => {
        if (file) {
            console.log('Seçilen dosya:', file);
            // Dosya adından özel karakterleri ve boşlukları temizle
            const timestamp = Date.now();
            const cleanFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const renamedFile = new File([file], cleanFileName, { type: file.type });
            console.log('Yeniden adlandırılan dosya:', renamedFile);
            
            setFormData(prev => ({
                ...prev,
                image: renamedFile
            }));
            return renamedFile;
        }
        return null;
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            console.log('Form değerleri:', values);
            console.log('FormData image:', formData.image);

            // Zorunlu alanları kontrol et
            if (!values.name || !values.price || !values.category) {
                throw new Error('Ürün adı, fiyat ve kategori zorunludur');
            }

            // Slug oluştur
            const slug = values.name.trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ş/g, 's')
                .replace(/ı/g, 'i')
                .replace(/ö/g, 'o')
                .replace(/ç/g, 'c')
                .replace(/Ğ/g, 'G')
                .replace(/Ü/g, 'U')
                .replace(/Ş/g, 'S')
                .replace(/İ/g, 'I')
                .replace(/Ö/g, 'O')
                .replace(/Ç/g, 'C');

            if (!slug) {
                throw new Error('Geçerli bir ürün adı giriniz');
            }

            // Ürün bilgilerini hazırla
            const jsonData = {
                name: values.name.trim(),
                price: Number(values.price),
                category: values.category,
                description: values.description?.trim() || '',
                familyPrice: values.familyPrice ? Number(values.familyPrice) : null,
                ingredients: values.ingredients ? values.ingredients.split(',').map(item => item.trim()).filter(Boolean) : [],
                slug: slug
            };

            let response;
            try {
                if (selectedProduct) {
                    response = await api.put(`/api/products/${selectedProduct._id}`, jsonData);
                } else {
                    response = await api.post('/api/products', jsonData);
                }
            } catch (error) {
                console.error('Ürün kaydetme hatası:', error);
                throw new Error(error.response?.data?.error || 'Ürün kaydedilirken bir hata oluştu');
            }

            // Eğer resim varsa, ayrı bir istek ile yükle
            if (formData.image instanceof File) {
                console.log('Resim yükleniyor:', formData.image);
                const imageFormData = new FormData();
                imageFormData.append('image', formData.image);

                const productId = response.data.data._id || selectedProduct._id;
                console.log('Ürün ID:', productId);

                try {
                    const imageResponse = await api.post(
                        `/api/products/${productId}/image`,
                        imageFormData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        }
                    );
                    console.log('Resim yükleme başarılı:', imageResponse);
                    
                    // Resim yüklendikten sonra ürünleri yeniden getir
                    await queryClient.invalidateQueries(['products']);
                } catch (imageError) {
                    console.error('Resim yükleme hatası:', imageError);
                    console.error('Hata detayları:', imageError.response?.data);
                    showNotification('Ürün kaydedildi fakat resim yüklenemedi: ' + (imageError.response?.data?.error || imageError.message), 'warning');
                }
            }

            showSuccessMessage(selectedProduct ? 'Ürün başarıyla güncellendi' : 'Ürün başarıyla eklendi');
            handleClose();
            await queryClient.invalidateQueries(['products']);
            await queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
            
        } catch (error) {
            console.error('Form gönderme hatası:', error);
            console.error('Hata detayları:', error.response?.data);
            const errorMessage = error.response?.data?.error || error.message || 'Bir hata oluştu';
            showNotification(errorMessage, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Ürün silme
    const handleDelete = async (id) => {
        if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await api.delete(`/api/products/${id}`);
            queryClient.invalidateQueries(['products']);
            showNotification('Ürün başarıyla silindi');
        } catch (error) {
            console.error('Silme hatası:', error);
            showNotification(error.response?.data?.error || 'Silme işlemi başarısız', 'error');
        }
    };

    // Sıralama işlemleri
    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(productsResponse.data);
        const categoryId = categories[selectedTab]._id;
        const categoryProducts = items.filter(product => {
            const productCategory = typeof product.category === 'object' 
                ? product.category._id 
                : product.category;
            return productCategory === categoryId;
        });

        const [reorderedItem] = categoryProducts.splice(result.source.index, 1);
        categoryProducts.splice(result.destination.index, 0, reorderedItem);

        const updatedProducts = categoryProducts.map((item, index) => ({
            productId: item._id,
            order: index,
            category: categoryId
        }));

        try {
            await api.put('/api/products/reorder', { products: updatedProducts });
            queryClient.invalidateQueries(['products']);
            showNotification('Ürün sırası başarıyla güncellendi', 'success');
        } catch (error) {
            console.error('Sıralama hatası:', error);
            showNotification('Ürün sırası güncellenirken bir hata oluştu', 'error');
        }
    };

    // Tab değişikliği
    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
        setPage(0);
    };

    // Sayfalama
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Arama
    const handleSearch = (event) => {
        setSearchQuery(event.target.value);
        setPage(0);
    };

    if (productsLoading || categoriesLoading) {
        return <Box sx={{ p: 3 }}><Typography>Yükleniyor...</Typography></Box>;
    }

    const products = productsResponse?.data || [];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {successMessage && (
                <Slide direction="down" in={Boolean(successMessage)} mountOnEnter unmountOnExit>
                    <Alert 
                        severity="success" 
                        sx={{ 
                            mb: 2,
                            position: 'fixed',
                            top: 20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 9999,
                            minWidth: 300,
                            boxShadow: 3
                        }}
                    >
                        {successMessage}
                    </Alert>
                </Slide>
            )}
            {/* Kategori tabları */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {categories?.map((category, index) => (
                        <Tab 
                            key={category._id} 
                            label={category.name}
                            id={`product-tab-${index}`}
                            aria-controls={`product-tabpanel-${index}`}
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Her kategori için içerik */}
            {categories?.map((category, index) => {
                const categoryProducts = products.filter(product => {
                    const productCategory = typeof product.category === 'object' 
                        ? product.category._id 
                        : product.category;
                    return productCategory === category._id;
                });

                const filteredProducts = categoryProducts.filter(product => 
                    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
                );

                return (
                    <div
                        key={category._id}
                        role="tabpanel"
                        hidden={selectedTab !== index}
                        id={`product-tabpanel-${index}`}
                        aria-labelledby={`product-tab-${index}`}
                    >
                        {selectedTab === index && (
                            <Box>
                                {/* Başlık ve Ekle butonu */}
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6" component="h2">
                                        {category.name} Ürünleri ({categoryProducts.length})
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleOpen(null)}
                                        sx={{
                                            bgcolor: 'background.paper',
                                            color: 'text.primary',
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                    >
                                        Yeni Ürün Ekle
                                    </Button>
                                </Box>

                                {/* Arama */}
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Ürün ara..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    sx={{ mb: 2 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                {/* Ürün tablosu */}
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId={`category-${category._id}`}>
                                        {(provided) => (
                                            <TableContainer 
                                                component={Paper} 
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                sx={{ 
                                                    boxShadow: 3,
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    '& .MuiTableCell-root': {
                                                        borderColor: 'divider',
                                                        py: 2
                                                    }
                                                }}
                                            >
                                                <Table>
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5' }}>
                                                            <TableCell padding="checkbox" />
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Resim</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Ürün Adı</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Açıklama</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>İçindekiler</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Fiyat</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Aile Boy</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {filteredProducts
                                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                            .map((product, index) => (
                                                                <Draggable
                                                                    key={product._id}
                                                                    draggableId={product._id}
                                                                    index={index}
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <TableRow
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            sx={{
                                                                                bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                                                                                transition: 'all 0.2s ease',
                                                                                '&:hover': {
                                                                                    bgcolor: 'action.hover',
                                                                                    '& .actions': {
                                                                                        opacity: 1
                                                                                    }
                                                                                }
                                                                            }}
                                                                        >
                                                                            <TableCell padding="checkbox">
                                                                                <IconButton {...provided.dragHandleProps} size="small">
                                                                                    <DragHandleIcon />
                                                                                </IconButton>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Box
                                                                                    sx={{
                                                                                        position: 'relative',
                                                                                        width: 120,
                                                                                        height: 80,
                                                                                        borderRadius: 1,
                                                                                        overflow: 'hidden',
                                                                                        boxShadow: 2,
                                                                                        flexShrink: 0,
                                                                                        bgcolor: 'background.paper'
                                                                                    }}
                                                                                >
                                                                                    <Avatar
                                                                                        src={getImageUrl(product.image)}
                                                                                        alt={product.name}
                                                                                        variant="square"
                                                                                        sx={{
                                                                                            width: '100%',
                                                                                            height: '100%',
                                                                                            objectFit: 'contain',
                                                                                            objectPosition: 'center',
                                                                                            backgroundColor: 'grey.50',
                                                                                            p: 0.5
                                                                                        }}
                                                                                    />
                                                                                </Box>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Typography variant="subtitle1" fontWeight="medium">
                                                                                    {product.name}
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    {product.description}
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    {product.ingredients?.join(', ')}
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Typography variant="subtitle2" fontWeight="medium" color="primary.main">
                                                                                    {product.price} €
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Typography variant="subtitle2" fontWeight="medium" color="primary.main">
                                                                                    {product.familyPrice ? `${product.familyPrice} €` : '-'}
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Box
                                                                                    className="actions"
                                                                                    sx={{
                                                                                        opacity: { xs: 1, sm: 0 },
                                                                                        transition: 'all 0.2s ease',
                                                                                        display: 'flex',
                                                                                        gap: 1
                                                                                    }}
                                                                                >
                                                                                    <IconButton
                                                                                        onClick={() => handleOpen(product)}
                                                                                        size="small"
                                                                                        sx={{
                                                                                            bgcolor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
                                                                                            color: theme.palette.mode === 'dark' ? '#fff' : '#1a1a1a',
                                                                                            '&:hover': {
                                                                                                bgcolor: theme.palette.mode === 'dark' ? '#444' : '#e0e0e0'
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <EditIcon fontSize="small" />
                                                                                    </IconButton>
                                                                                    <IconButton
                                                                                        onClick={() => handleDelete(product._id)}
                                                                                        size="small"
                                                                                        sx={{
                                                                                            bgcolor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
                                                                                            color: theme.palette.mode === 'dark' ? '#fff' : '#1a1a1a',
                                                                                            '&:hover': {
                                                                                                bgcolor: theme.palette.mode === 'dark' ? '#444' : '#e0e0e0'
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <DeleteIcon fontSize="small" />
                                                                                    </IconButton>
                                                                                </Box>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                        {provided.placeholder}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Droppable>
                                </DragDropContext>

                                {/* Sayfalama */}
                                <TablePagination
                                    component="div"
                                    count={filteredProducts.length}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                    labelRowsPerPage="Sayfa başına ürün:"
                                    labelDisplayedRows={({ from, to, count }) => 
                                        `${from}-${to} / ${count}`
                                    }
                                />
                            </Box>
                        )}
                    </div>
                );
            })}

            {/* Form Dialog */}
            <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <Formik
                    initialValues={{
                        name: selectedProduct?.name || '',
                        description: selectedProduct?.description || '',
                        price: selectedProduct?.price || '',
                        familyPrice: selectedProduct?.familyPrice || '',
                        category: selectedProduct?.category?._id || selectedProduct?.category || '',
                        ingredients: Array.isArray(selectedProduct?.ingredients) ? selectedProduct.ingredients.join(', ') : '',
                        image: null
                    }}
                    validationSchema={ProductSchema}
                    onSubmit={handleSubmit}
                >
                    {({ errors, touched, isSubmitting, setFieldValue }) => (
                        <Form>
                            <DialogTitle>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    {selectedProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}
                                    <IconButton onClick={handleClose} size="small">
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                            </DialogTitle>
                            <DialogContent dividers>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Field name="name">
                                            {({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Ürün Adı"
                                                    error={touched.name && Boolean(errors.name)}
                                                    helperText={touched.name && errors.name}
                                                />
                                            )}
                                        </Field>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Field name="description">
                                            {({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Açıklama"
                                                    multiline
                                                    rows={3}
                                                    error={touched.description && Boolean(errors.description)}
                                                    helperText={touched.description && errors.description}
                                                />
                                            )}
                                        </Field>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Field name="price">
                                            {({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Fiyat"
                                                    type="number"
                                                    error={touched.price && Boolean(errors.price)}
                                                    helperText={touched.price && errors.price}
                                                    inputProps={{ step: "0.01" }}
                                                />
                                            )}
                                        </Field>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Field name="familyPrice">
                                            {({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Aile Boy Fiyat"
                                                    type="number"
                                                    error={touched.familyPrice && Boolean(errors.familyPrice)}
                                                    helperText={touched.familyPrice && errors.familyPrice}
                                                    inputProps={{ step: "0.01" }}
                                                />
                                            )}
                                        </Field>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Field name="category">
                                            {({ field }) => (
                                                <FormControl fullWidth error={touched.category && Boolean(errors.category)}>
                                                    <InputLabel>Kategori</InputLabel>
                                                    <Select
                                                        {...field}
                                                        label="Kategori"
                                                    >
                                                        {categories?.map((category) => (
                                                            <MenuItem key={category._id} value={category._id}>
                                                                {category.name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {touched.category && errors.category && (
                                                        <FormHelperText>{errors.category}</FormHelperText>
                                                    )}
                                                </FormControl>
                                            )}
                                        </Field>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Field name="ingredients">
                                            {({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="İçindekiler"
                                                    error={touched.ingredients && Boolean(errors.ingredients)}
                                                    helperText={(touched.ingredients && errors.ingredients) || 'Virgülle ayırarak yazın (örn: domates, peynir, mantar)'}
                                                />
                                            )}
                                        </Field>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ mt: 2 }}>
                                            <ImageDropzone
                                                onDrop={(file) => {
                                                    const processedFile = handleImageDrop(file);
                                                    setFieldValue('image', processedFile);
                                                }}
                                                currentImage={formData.image}
                                                imageUrl={selectedProduct?.image ? getImageUrl(selectedProduct.image) : null}
                                            />
                                            {formData.image && (
                                                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                                    Seçilen dosya: {formData.image.name}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleClose}>İptal</Button>
                                <Button 
                                    type="submit"
                                    variant="contained"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <CircularProgress size={24} sx={{ mr: 1 }} />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        selectedProduct ? 'Güncelle' : 'Ekle'
                                    )}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </Dialog>

            <Snackbar
                open={showToast}
                autoHideDuration={3000}
                onClose={() => setShowToast(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setShowToast(false)} 
                    severity={toastSeverity}
                    sx={{ width: '100%' }}
                >
                    {toastMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Products; 