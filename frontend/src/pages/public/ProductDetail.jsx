import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress, 
  Alert,
  IconButton,
  useTheme,
  Grid,
  alpha,
  AppBar,
  Toolbar,
  Button,
  Link,
  useMediaQuery,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Fab,
  Tooltip,
  Zoom
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  YouTube, 
  LinkedIn, 
  WhatsApp, 
  Pinterest, 
  Telegram,
  LocalPizza as PizzaIcon,
  Fastfood as FastfoodIcon,
  Restaurant as RestaurantIcon,
  LocalDrink as DrinkIcon,
  LocalDining as SaladIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  Phone as PhoneIcon,
  Info as InfoIcon,
  Language as LanguageIcon,
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  EventSeat as EventSeatIcon,
  Timer as TimerIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import TikTokIcon from "../admin/components/icons/TikTokIcon";
import api from '../../utils/api';
import { ColorModeContext } from '../../contexts/ColorModeContext';
import ReservationDialog from './ReservationDialog';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const isDarkMode = mode === 'dark';
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);

  // Eğer slug yoksa ana sayfaya yönlendir
  React.useEffect(() => {
    if (!slug) {
      navigate('/');
    }
  }, [slug, navigate]);

  // Ürün verilerini getir
  const { data: productResponse, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Ürün bulunamadı');
      const response = await api.get(`/api/products/${slug}`);
      return response.data;
    },
    enabled: !!slug
  });

  // Footer verilerini getir
  const { data: footerResponse, isLoading: footerLoading } = useQuery({
    queryKey: ['footer'],
    queryFn: async () => {
      const response = await api.get('/api/footer');
      console.log('Footer verileri:', response.data); // Debug için eklendi
      return response.data;
    }
  });

  // Header menü verilerini getir
  const { data: menuResponse, isLoading: menuLoading } = useQuery({
    queryKey: ['headerMenu'],
    queryFn: async () => {
      const response = await api.get('/api/header-menu');
      return response.data;
    }
  });

  // Site ayarlarını getir
  const { data: siteSettingsResponse } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const response = await api.get('/api/site-settings');
      return response.data;
    }
  });

  const product = productResponse?.data;
  const footer = footerResponse?.data;
  const menuItems = menuResponse?.data || [];
  const siteSettings = siteSettingsResponse?.data || {};

  // Scroll to top fonksiyonu
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Scroll pozisyonunu kontrol et
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (productLoading || footerLoading || menuLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (productError || !product) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          {productError?.message || 'Ürün bulunamadı.'}
        </Alert>
      </Container>
    );
  }

  // API'den gelen resim URL'sini düzgün formata çevir
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return imagePath.startsWith('http') 
        ? imagePath 
        : `${baseUrl}/${imagePath.startsWith('uploads/') ? imagePath : `uploads/products/${imagePath}`}`;
  };

  // Scroll to section function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // İçeriği kısaltmak için yardımcı fonksiyon
  const truncateText = (text, maxLength = 60) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <>
      {/* Header Menu */}
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: `${theme.palette.mode === 'dark' ? '#1b1b26' : '#ffffff'} !important`,
          transition: 'all 0.3s ease-in-out',
          boxShadow: theme.palette.mode === 'dark' ? 1 : '0 2px 12px rgba(0,0,0,0.08)'
        }}
      >
        <Toolbar
          sx={{
            backgroundColor: `${theme.palette.mode === 'dark' ? '#1b1b26' : '#f5f5f5'} !important`
          }}
        >
          {isMobile && (
            <IconButton 
              edge="start" 
              aria-label="menu" 
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo veya Site Adı */}
          <Box sx={{ flexGrow: 0, mr: 4, display: 'flex', alignItems: 'center' }}>
            {siteSettings?.logo && siteSettings.logo !== '' && siteSettings.logo !== null && siteSettings.logo !== 'null' ? (
              <Box
                component="img"
                src={getImageUrl(siteSettings.logo)}
                alt={siteSettings?.siteName || 'Esteri'}
                sx={{
                  height: 40,
                  width: 'auto',
                  display: 'block'
                }}
              />
            ) : (
              <Typography
                variant="h6"
                component={RouterLink}
                to="/"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  textDecoration: 'none'
                }}
              >
                {siteSettings?.siteName || 'Esteri'}
              </Typography>
            )}
          </Box>

          {/* Menü Öğeleri */}
          <Box sx={{ 
            flexGrow: 1, 
            display: { xs: 'none', md: 'flex' }, 
            gap: 0.5
          }}>
            {menuItems.map((item) => (
              <Link
                key={item._id}
                href={item.link}
                underline="none"
                sx={{
                  color: 'text.primary',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': { 
                    color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B',
                    '& svg': {
                      color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B'
                    }
                  },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.3,
                  py: 0.3,
                  px: 0.8,
                  textDecoration: 'none',
                  '& svg': {
                    color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B',
                    transition: 'none'
                  }
                }}
              >
                {(() => {
                  const Icon = (() => {
                    const name = item.name.toLowerCase();
                    if (name.includes('pizza')) {
                      return PizzaIcon;
                    } else if (name.includes('kebab')) {
                      return FastfoodIcon;
                    } else if (name.includes('salaatti') || name.includes('salat') || name.includes('salad')) {
                      return SaladIcon;
                    } else if (name.includes('juoma') || name.includes('drink') || name.includes('icecek')) {
                      return DrinkIcon;
                    } else if (name.includes('grilli') || name.includes('grill')) {
                      return RestaurantIcon;
                    } else if (name.includes('anasayfa') || name.includes('home')) {
                      return HomeIcon;
                    } else if (name.includes('menü') || name.includes('menu')) {
                      return MenuIcon;
                    } else if (name.includes('iletişim') || name.includes('contact')) {
                      return PhoneIcon;
                    } else if (name.includes('hakkında') || name.includes('about')) {
                      return InfoIcon;
                    } else if (name.includes('fi') || name.includes('en') || name.includes('sv')) {
                      return LanguageIcon;
                    }
                    return RestaurantIcon;
                  })();
                  return <Icon sx={{ 
                    fontSize: 16, 
                    mr: 1.5,
                    color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B'
                  }} />;
                })()}
                {item.name}
              </Link>
            ))}
          </Box>

          {/* Sağ taraftaki ikonlar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            {/* Masaüstü görünümü */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Tooltip title={isDarkMode ? "Açık Mod" : "Koyu Mod"}>
                <IconButton
                  onClick={toggleColorMode}
                  sx={{ color: 'text.primary' }}
                >
                  {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title={footer?.phone || "İletişim"}>
                <IconButton
                  component="a"
                  href={`tel:${footer?.phone}`}
                  sx={{ color: 'text.primary' }}
                >
                  <PhoneIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Ara">
                <IconButton
                  onClick={() => navigate('/#menu')}
                  sx={{ color: 'text.primary' }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Mobil görünüm için sağ alt köşe butonları */}
            <Box
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                display: { xs: 'flex', md: 'none' },
                flexDirection: 'column',
                gap: 1,
                zIndex: 1000
              }}
            >
              <Fab
                size="small"
                onClick={toggleColorMode}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? '#0f0f1a' : '#f5f5f5',
                  color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#1b1b26' : '#ffffff'
                  }
                }}
              >
                {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </Fab>
              <Fab
                size="small"
                href={`tel:${footer?.phone}`}
                component="a"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? '#0f0f1a' : '#f5f5f5',
                  color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#1b1b26' : '#ffffff'
                  }
                }}
              >
                <PhoneIcon />
              </Fab>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobil Menü */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.mode === 'dark' ? '#0f0f1a' : '#f5f5f5',
            color: 'text.primary',
            width: 220
          }
        }}
      >
        <Box sx={{ 
          width: '100%',
          backgroundColor: theme.palette.mode === 'dark' ? '#0f0f1a' : '#f5f5f5',
          height: '100%'
        }}>
          <List sx={{ py: 1 }}>
            {menuItems.map((item) => (
              <ListItem 
                key={item._id}
                component="a"
                href={item.link}
                onClick={() => setMobileMenuOpen(false)}
                sx={{ 
                  py: 0.5,
                  minHeight: 40,
                  textDecoration: 'none',
                  color: 'inherit',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.3s ease-in-out',
                  backgroundColor: theme.palette.mode === 'dark' ? '#0f0f1a' : '#f5f5f5',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    color: '#ECBC4B',
                    '& .MuiListItemText-primary': {
                      color: '#ECBC4B'
                    },
                    '& svg': {
                      color: '#ECBC4B'
                    }
                  }
                }}
              >
                {(() => {
                  const Icon = (() => {
                    const name = item.name.toLowerCase();
                    if (name.includes('pizza')) {
                      return PizzaIcon;
                    } else if (name.includes('kebab')) {
                      return FastfoodIcon;
                    } else if (name.includes('salaatti') || name.includes('salat') || name.includes('salad')) {
                      return SaladIcon;
                    } else if (name.includes('juoma') || name.includes('drink') || name.includes('icecek')) {
                      return DrinkIcon;
                    } else if (name.includes('grilli') || name.includes('grill')) {
                      return RestaurantIcon;
                    } else if (name.includes('anasayfa') || name.includes('home')) {
                      return HomeIcon;
                    } else if (name.includes('menü') || name.includes('menu')) {
                      return MenuIcon;
                    } else if (name.includes('iletişim') || name.includes('contact')) {
                      return PhoneIcon;
                    } else if (name.includes('hakkında') || name.includes('about')) {
                      return InfoIcon;
                    } else if (name.includes('fi') || name.includes('en') || name.includes('sv')) {
                      return LanguageIcon;
                    }
                    return RestaurantIcon;
                  })();
                  return <Icon sx={{ 
                    fontSize: 16, 
                    mr: 1.5,
                    color: '#ECBC4B',
                    transition: 'color 0.3s ease-in-out'
                  }} />;
                })()}
                <ListItemText 
                  primary={item.name}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      fontFamily: "'Poppins', sans-serif",
                      transition: 'color 0.3s ease-in-out'
                    }
                  }}
                />
              </ListItem>
            ))}

            {/* Mobil Rezervasyon Butonu */}
          <ListItem 
                sx={{ 
                  mt: 2,
                  px: 2
                }}
              >
                <Button
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsReservationDialogOpen(true);
                  }}
                  startIcon={<EventSeatIcon />}
                  sx={{
                    bgcolor: '#ECBC4B',
                    color: '#000000',
                    '&:hover': {
                      bgcolor: '#d4a73d'
                    },
                    py: 1,
                    borderRadius: 2,
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  Rezervasyon Yap
                </Button>
              </ListItem>
            
          </List>
        </Box>
      </Drawer>

      <Toolbar /> {/* Spacing for fixed AppBar */}

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ 
        py: 4, 
        minHeight: 'calc(100vh - 200px)',
        bgcolor: theme.palette.mode === 'dark' ? 'transparent' : '#f8f9fa'
      }}>
        <Box sx={{ mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/')}
            sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {product.image && (
            <Box sx={{ flex: '0 0 50%', maxWidth: '500px' }}>
              <img 
                src={getImageUrl(product.image)} 
                alt={product.name} 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }} 
              />
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                color: '#ECBC4B',
                fontWeight: 600,
                fontFamily: "'Poppins', sans-serif",
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}
            >
              {product.name}
            </Typography>
            {product.description && (
              <Box
                sx={{
                  position: 'relative',
                  mb: 3,
                  p: 2,
                  borderLeft: '2px solid #ECBC4B',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(236, 188, 75, 0.03)' 
                    : 'rgba(236, 188, 75, 0.04)',
                  borderRadius: '0 6px 6px 0',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? 'none' 
                    : '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <Typography 
                  variant="body1" 
                  paragraph
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
                    fontFamily: "'Poppins', sans-serif",
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                    mb: 0,
                    fontStyle: 'italic'
                  }}
                >
                  {product.description}
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 1.5,
                mb: 2,
                p: 1.5,
                borderRadius: 1.5,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(45deg, rgba(236, 188, 75, 0.1), transparent)' 
                  : 'linear-gradient(45deg, rgba(236, 188, 75, 0.08), rgba(236, 188, 75, 0.02))',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' 
                  ? 'rgba(236, 188, 75, 0.1)' 
                  : 'rgba(236, 188, 75, 0.15)',
                boxShadow: theme.palette.mode === 'dark'
                  ? 'none'
                  : '0 2px 12px rgba(236, 188, 75, 0.08)'
              }}
            >
              <Typography 
                variant="h5" 
                sx={{
                  color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a',
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: { xs: '1.3rem', md: '1.5rem' },
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    width: '100%',
                    height: '1px',
                    background: '#ECBC4B',
                    opacity: 0.5
                  }
                }}
              >
                {product.price} €
              </Typography>
              {product.familyPrice && (
                <Typography 
                  variant="h6" 
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: { xs: '1rem', md: '1.2rem' }
                  }}
                >
                  Aile Boy: {product.familyPrice} €
                </Typography>
              )}
            </Box>
            {product.ingredients && product.ingredients.length > 0 && (
              <Box
                sx={{
                  mt: 1.5,
                  mb: 1,
                  p: 2,
                  borderRadius: 1.5,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(236, 188, 75, 0.1)' 
                    : 'rgba(236, 188, 75, 0.03)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(236, 188, 75, 0.2)' 
                    : 'rgba(236, 188, 75, 0.15)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 8px rgba(0,0,0,0.05)'
                    : '0 4px 16px rgba(236, 188, 75, 0.08)',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(45deg, ${
                      theme.palette.mode === 'dark' 
                        ? 'rgba(236, 188, 75, 0.05)' 
                        : 'rgba(236, 188, 75, 0.08)'
                    } 0%, transparent 100%)`,
                    zIndex: 0
                  }
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    position: 'relative',
                    zIndex: 1,
                    color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '1rem',
                    mb: 0.5
                  }}
                >
                  ✦ İçindekiler
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    position: 'relative',
                    zIndex: 1,
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
                    fontFamily: "'Poppins', sans-serif",
                    lineHeight: 1.5,
                    fontSize: '0.9rem'
                  }}
                >
                  {product.ingredients.join(' • ')}
                </Typography>
              </Box>
            )}
            {product.category && (
              <Box
                sx={{
                  mt: 1,
                  mb: 1,
                  p: 2,
                  borderRadius: 1.5,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(236, 188, 75, 0.1)' 
                    : 'rgba(236, 188, 75, 0.03)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(236, 188, 75, 0.2)' 
                    : 'rgba(236, 188, 75, 0.15)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 8px rgba(0,0,0,0.05)'
                    : '0 4px 16px rgba(236, 188, 75, 0.08)',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(45deg, ${
                      theme.palette.mode === 'dark' 
                        ? 'rgba(236, 188, 75, 0.05)' 
                        : 'rgba(236, 188, 75, 0.08)'
                    } 0%, transparent 100%)`,
                    zIndex: 0
                  }
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    position: 'relative',
                    zIndex: 1,
                    color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '1rem',
                    mb: 0.5
                  }}
                >
                  ✦ Kategori
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    position: 'relative',
                    zIndex: 1,
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
                    fontFamily: "'Poppins', sans-serif",
                    lineHeight: 1.5,
                    fontSize: '0.9rem'
                  }}
                >
                  {product.category.name}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              startIcon={<PhoneIcon />}
              href={`tel:${footer?.phone}`}
              sx={{
                mt: 3,
                bgcolor: '#ECBC4B',
                color: '#000',
                py: 1.5,
                px: 4,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: theme.shadows[3],
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  bgcolor: '#d4a73d',
                  boxShadow: theme.shadows[5]
                }
              }}
            >
              Sipariş Ver
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Yukarı Çık Butonu */}
      <Zoom in={showScrollTop}>
        <Box
          onClick={scrollToTop}
          role="presentation"
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 80 },
            right: 16,
            zIndex: 1000,
            display: { xs: showScrollTop ? 'block' : 'none', md: 'block' }
          }}
        >
          <Fab
            color="primary"
            size="small"
            aria-label="scroll back to top"
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? '#0f0f1a' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? '#1b1b26' : '#ffffff'
              }
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Box>
      </Zoom>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.mode === 'dark' 
            ? '#1b1b26' 
            : '#ffffff !important',
          borderTop: `1px solid ${theme.palette.mode === 'dark' 
            ? theme.palette.divider 
            : 'rgba(0,0,0,0.08)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? 'none'
            : '0 -2px 12px rgba(0,0,0,0.03)'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between">
            <Grid item xs={12} sm={3}>
              <Typography 
                variant="h6" 
                sx={{
                  mb: 3,
                  pb: 2,
                  borderBottom: `2px solid ${theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a'}`,
                  color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <RestaurantIcon sx={{ fontSize: 24, color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a' }} />
                Ravintola Esteri
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {footer?.description || 'Lezzetin ve kalitenin buluştuğu adres.'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Typography 
                variant="h6" 
                sx={{
                  mb: 3,
                  pb: 2,
                  borderBottom: `2px solid ${theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a'}`,
                  color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <PhoneIcon sx={{ fontSize: 24, color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a' }} />
                İletişim
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adres: {footer?.address || 'Örnek Mahallesi, Örnek Sokak No:1'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tel: {footer?.phone || '+90 123 456 7890'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                E-posta: {footer?.email || 'info@esteri.com'}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Typography 
                variant="h6" 
                sx={{
                  mb: 3,
                  pb: 2,
                  borderBottom: `2px solid ${theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a'}`,
                  color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <TimerIcon sx={{ fontSize: 24, color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a' }} />
                Çalışma Saatleri
              </Typography>
              {footer?.workingHours && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {footer.workingHours.split(',').map((hours, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      {hours.trim()}
                    </Typography>
                  ))}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={3}>
              <Typography 
                variant="h6" 
                sx={{
                  mb: 3,
                  pb: 2,
                  borderBottom: `2px solid ${theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a'}`,
                  color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <ShareIcon sx={{ fontSize: 24, color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a' }} />
                Sosyal Medya
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {footer?.socialMedia?.facebook && (
                  <IconButton
                    component="a"
                    href={footer.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        color: '#1877F2'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Facebook />
                  </IconButton>
                )}
                {footer?.socialMedia?.instagram && (
                  <IconButton
                    component="a"
                    href={footer.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        color: '#E4405F'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Instagram />
                  </IconButton>
                )}
                {footer?.socialMedia?.twitter && (
                  <IconButton
                    component="a"
                    href={footer.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        color: '#1DA1F2'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Twitter />
                  </IconButton>
                )}
                {footer?.socialMedia?.youtube && (
                  <IconButton
                    component="a"
                    href={footer.socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        color: '#FF0000'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <YouTube />
                  </IconButton>
                )}
                {footer?.socialMedia?.linkedin && (
                  <IconButton
                    component="a"
                    href={footer.socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        color: '#0A66C2'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <LinkedIn />
                  </IconButton>
                )}
                {footer?.socialMedia?.whatsapp && (
                  <IconButton
                    component="a"
                    href={`https://wa.me/${footer.socialMedia.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        color: '#25D366'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <WhatsApp />
                  </IconButton>
                )}
                {footer?.socialMedia?.pinterest && (
                  <IconButton
                    component="a"
                    href={footer.socialMedia.pinterest}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        color: '#E60023'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Pinterest />
                  </IconButton>
                )}
                {footer?.socialMedia?.tiktok && (
                  <IconButton
                    component="a"
                    href={footer.socialMedia.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        color: '#000000'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <TikTokIcon />
                  </IconButton>
                )}
                {footer?.socialMedia?.telegram && (
                  <IconButton
                    component="a"
                    href={footer.socialMedia.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        color: '#0088cc'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Telegram />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, borderTop: `1px solid ${theme.palette.divider}`, pt: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              {footer?.copyright || `© ${new Date().getFullYear()} Esteri. Tüm hakları saklıdır.`}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Rezervasyon Dialog */}
      <ReservationDialog
        open={isReservationDialogOpen}
        onClose={() => setIsReservationDialogOpen(false)}
      />

      {/* Sol Alt Köşe Rezervasyon Butonu */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          display: { xs: 'none', md: 'block' }
        }}
      >
        <Tooltip title="Rezervasyon Yap" placement="right">
          <Fab
            size="medium"
            onClick={() => setIsReservationDialogOpen(true)}
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? '#0f0f1a' : '#f5f5f5',
              color: '#ECBC4B',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? '#1b1b26' : '#ffffff',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease-in-out',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <EventSeatIcon />
          </Fab>
        </Tooltip>
      </Box>
    </>
  );
};

export default ProductDetail;