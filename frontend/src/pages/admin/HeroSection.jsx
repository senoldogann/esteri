import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Typography,
    TextField,
    Grid,
    Alert,
    Slide,
    Container
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api from '../../utils/api';
import ImageDropzone from './components/ImageDropzone';

const HeroSection = () => {
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        buttonText: '',
        buttonLink: '',
        image: null
    });
    const [successMessage, setSuccessMessage] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Başarı mesajını göster ve 3 saniye sonra kaldır
    const showSuccessMessage = useCallback((message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    }, []);

    // Hero section verilerini getir
    const { data: heroSection, isLoading } = useQuery({
        queryKey: ['heroSection'],
        queryFn: async () => {
            const response = await api.get('api/hero-section');
            return response.data.data;
        }
    });

    // Mevcut verileri form alanlarına yerleştir
    useEffect(() => {
        if (heroSection) {
            setFormData({
                title: heroSection.title || '',
                subtitle: heroSection.subtitle || '',
                description: heroSection.description || '',
                buttonText: heroSection.buttonText || '',
                buttonLink: heroSection.buttonLink || '',
                image: null
            });
        }
    }, [heroSection]);

    // Hero section güncelle veya oluştur
    const updateMutation = useMutation({
        mutationFn: async (data) => {
            console.log('Hero section güncelleme isteği gönderiliyor:', data);
            
            const formDataToSend = new FormData();
            
            // Tüm form verilerini FormData'ya ekle
            Object.keys(data).forEach(key => {
                if (key === 'image' && data[key] instanceof File) {
                    formDataToSend.append('image', data[key]);
                } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
                    formDataToSend.append(key, data[key]);
                }
            });

            // Debug için FormData içeriğini kontrol et
            console.log('FormData içeriği:');
            for (const [key, value] of formDataToSend.entries()) {
                console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
            }

            if (heroSection?._id) {
                const response = await api.put(`api/hero-section/${heroSection._id}`, formDataToSend, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json'
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                    transformRequest: [(data) => data]
                });
                return response.data;
            } else {
                const response = await api.post('api/hero-section', formDataToSend, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json'
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                    transformRequest: [(data) => data]
                });
                return response.data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['heroSection']);
            queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
            showSuccessMessage('Hero section başarıyla güncellendi');
        },
        onError: (error) => {
            console.error('Hero section güncelleme hatası:', error);
            const message = error.response?.data?.error || error.message || 'Bir hata oluştu';
            enqueueSnackbar(message, { variant: 'error' });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Gönderilen veriler:', formData);
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return <Typography>Yükleniyor...</Typography>;
    }

    // Resim URL'sini oluşturan yardımcı fonksiyon
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        return imagePath.startsWith('http') 
            ? imagePath 
            : `${baseUrl}/${imagePath}`;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Başarı mesajı */}
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

            <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                    Hero Section
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Başlık"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Alt Başlık"
                                        value={formData.subtitle}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Açıklama"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        multiline
                                        rows={3}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Buton Metni"
                                        value={formData.buttonText}
                                        onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Buton Linki"
                                        value={formData.buttonLink}
                                        onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <ImageDropzone
                                        onDrop={(file) => setFormData({ ...formData, image: file })}
                                        currentImage={formData.image}
                                        imageUrl={heroSection?.backgroundImage ? getImageUrl(heroSection.backgroundImage) : null}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={updateMutation.isLoading}
                        >
                            {updateMutation.isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Container>
    );
};

export default HeroSection; 