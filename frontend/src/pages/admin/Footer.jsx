import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    Grid, 
    TextField, 
    Button, 
    CircularProgress,
    IconButton,
    Card,
    CardContent,
    Divider,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Alert,
    Slide
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api from '../../utils/api';
import TikTokIcon from "./components/icons/TikTokIcon";

// Desteklenen sosyal medya platformları
const SOCIAL_PLATFORMS = [
    { value: 'facebook', label: 'Facebook', color: '#1877F2' },
    { value: 'instagram', label: 'Instagram', color: '#E4405F' },
    { value: 'twitter', label: 'Twitter', color: '#1DA1F2' },
    { value: 'youtube', label: 'YouTube', color: '#FF0000' },
    { value: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
    { value: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
    { value: 'pinterest', label: 'Pinterest', color: '#E60023' },
    { value: 'tiktok', label: 'TikTok', color: '#000000' },
    { value: 'telegram', label: 'Telegram', color: '#0088cc' }
];

const Footer = () => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [successMessage, setSuccessMessage] = useState('');
    
    const [formData, setFormData] = useState({
        companyName: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        workingHours: '',
        socialMedia: [],
        copyright: ''
    });

    // Başarı mesajını göster ve 3 saniye sonra kaldır
    const showSuccessMessage = useCallback((message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    }, []);

    // Footer verilerini çek
    const { data: footerData, isLoading } = useQuery({
        queryKey: ['footer'],
        queryFn: async () => {
            const response = await api.get('/api/footer');
            return response.data;
        }
    });

    // Veriler geldiğinde form alanlarını doldur
    useEffect(() => {
        if (footerData?.data) {
            const socialMediaArray = footerData.data.socialMedia ? 
                Object.entries(footerData.data.socialMedia).map(([platform, url]) => ({
                    platform,
                    url
                })) : [];

            setFormData({
                companyName: footerData.data.companyName || '',
                description: footerData.data.description || '',
                address: footerData.data.address || '',
                phone: footerData.data.phone || '',
                email: footerData.data.email || '',
                workingHours: footerData.data.workingHours || '',
                socialMedia: socialMediaArray,
                copyright: footerData.data.copyright || ''
            });
        }
    }, [footerData]);

    // Footer güncelleme mutation'ı
    const { mutate: updateFooter, isLoading: isUpdating } = useMutation({
        mutationFn: async (data) => {
            const socialMediaObject = data.socialMedia.reduce((acc, item) => {
                if (item.platform && item.url) {
                    acc[item.platform] = item.url;
                }
                return acc;
            }, {});

            const updatedData = {
                ...data,
                socialMedia: socialMediaObject
            };

            const response = await api.put('/api/footer', updatedData);
            return response.data;
        },
        onMutate: async (newData) => {
            // Mevcut sorguları durdur
            await queryClient.cancelQueries(['footer']);
            await queryClient.cancelQueries(['publicFooter']);
            await queryClient.cancelQueries(['activities']);

            // Mevcut verileri yedekle
            const previousFooter = queryClient.getQueryData(['footer']);
            const previousPublicFooter = queryClient.getQueryData(['publicFooter']);

            // Optimistik güncelleme
            queryClient.setQueryData(['footer'], old => ({
                ...old,
                data: newData
            }));

            queryClient.setQueryData(['publicFooter'], old => ({
                ...old,
                data: newData
            }));

            return { previousFooter, previousPublicFooter };
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['footer']);
            queryClient.invalidateQueries(['publicFooter']);
            queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
            showSuccessMessage('Footer başarıyla güncellendi');
        },
        onError: (error, variables, context) => {
            // Hata durumunda eski verileri geri yükle
            if (context?.previousFooter) {
                queryClient.setQueryData(['footer'], context.previousFooter);
            }
            if (context?.previousPublicFooter) {
                queryClient.setQueryData(['publicFooter'], context.previousPublicFooter);
            }
            enqueueSnackbar(error.message || 'Footer güncellenirken bir hata oluştu', { variant: 'error' });
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Yeni sosyal medya alanı ekle
    const handleAddSocialMedia = () => {
        setFormData(prev => ({
            ...prev,
            socialMedia: [...prev.socialMedia, { platform: '', url: '' }]
        }));
    };

    // Sosyal medya alanını sil
    const handleRemoveSocialMedia = (index) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: prev.socialMedia.filter((_, i) => i !== index)
        }));
    };

    // Sosyal medya alanını güncelle
    const handleSocialMediaChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: prev.socialMedia.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateFooter(formData);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Container maxWidth="lg">
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

                <Typography variant="h5" gutterBottom>
                    Footer Ayarları
                </Typography>

                <Grid container spacing={3}>
                    {/* Şirket Bilgileri */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Şirket Bilgileri
                        </Typography>
                        <TextField
                            fullWidth
                            name="companyName"
                            label="Şirket Adı"
                            value={formData.companyName}
                            onChange={handleChange}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            name="description"
                            label="Açıklama"
                            value={formData.description}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={3}
                        />
                    </Grid>

                    {/* İletişim Bilgileri */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            İletişim Bilgileri
                        </Typography>
                        <TextField
                            fullWidth
                            name="address"
                            label="Adres"
                            value={formData.address}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={2}
                        />
                        <TextField
                            fullWidth
                            name="phone"
                            label="Telefon"
                            value={formData.phone}
                            onChange={handleChange}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            name="email"
                            label="E-posta"
                            value={formData.email}
                            onChange={handleChange}
                            margin="normal"
                            type="email"
                        />
                    </Grid>

                    {/* Çalışma Saatleri */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Çalışma Saatleri
                        </Typography>
                        <TextField
                            fullWidth
                            name="workingHours"
                            label="Çalışma Saatleri"
                            value={formData.workingHours}
                            onChange={handleChange}
                            margin="normal"
                            placeholder="Örn: Pazartesi-Cuma: 09:00-18:00"
                        />
                    </Grid>

                    {/* Sosyal Medya Linkleri */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Sosyal Medya Linkleri
                            </Typography>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={handleAddSocialMedia}
                                variant="contained"
                                color="primary"
                            >
                                Yeni Ekle
                            </Button>
                        </Box>
                        
                        {formData.socialMedia.map((social, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={5}>
                                            <FormControl fullWidth>
                                                <InputLabel>Platform</InputLabel>
                                                <Select
                                                    value={social.platform}
                                                    onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                                                    label="Platform"
                                                >
                                                    {SOCIAL_PLATFORMS.map((platform) => (
                                                        <MenuItem 
                                                            key={platform.value} 
                                                            value={platform.value}
                                                            sx={{
                                                                '&:hover': {
                                                                    color: platform.color
                                                                }
                                                            }}
                                                        >
                                                            {platform.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="URL"
                                                value={social.url}
                                                onChange={(e) => handleSocialMediaChange(index, 'url', e.target.value)}
                                                placeholder={`${social.platform ? SOCIAL_PLATFORMS.find(p => p.value === social.platform)?.label : 'Platform'} URL'si`}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={1}>
                                            <IconButton 
                                                onClick={() => handleRemoveSocialMedia(index)}
                                                color="error"
                                                sx={{ mt: { xs: 1, sm: 0 } }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>

                    {/* Telif Hakkı */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Telif Hakkı
                        </Typography>
                        <TextField
                            fullWidth
                            name="copyright"
                            label="Telif Hakkı Metni"
                            value={formData.copyright}
                            onChange={handleChange}
                            margin="normal"
                            placeholder="© 2024 Esteri. Tüm hakları saklıdır."
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isUpdating}
                        sx={{ minWidth: 200 }}
                    >
                        {isUpdating ? <CircularProgress size={24} /> : 'Kaydet'}
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer; 