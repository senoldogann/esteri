import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  Alert,
  useTheme,
  alpha,
  Skeleton,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Link,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  Fab,
  TextField,
  Slide,
  ClickAwayListener,
  InputAdornment,
  Tooltip,
  ListItemButton,
  Menu,
  MenuItem,
  CircularProgress,
  Zoom
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Search as SearchIcon, 
  Close as CloseIcon, 
  LightMode as LightModeIcon, 
  DarkMode as DarkModeIcon,
  LocalPizza as PizzaIcon,
  Fastfood as FastfoodIcon,
  Restaurant as RestaurantIcon,
  LocalDining as SaladIcon,
  LocalDrink as DrinkIcon,
  Euro as EuroIcon,
  Timer as TimerIcon,
  Info as InfoIcon,
  Home as HomeIcon,
  MenuBook as MenuBookIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Email as EmailIcon,
  MoreVert as MoreVertIcon,
  Menu as MenuIcon,
  WhatsApp,
  YouTube,
  LinkedIn,
  Pinterest,
  Telegram,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  EventSeat as EventSeatIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { ColorModeContext } from '../../contexts/ColorModeContext';
import { Helmet } from 'react-helmet';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import TikTokIcon from "../../pages/admin/components/icons/TikTokIcon";
import ReservationForm from './ReservationForm';
import ReservationDialog from './ReservationDialog';

// Yardımcı fonksiyonlar
const getImageUrl = (imagePath, type = 'default') => {
  if (!imagePath) return '';
  
  // Eğer tam URL ise doğrudan döndür
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // API URL'ini ortam değişkenlerinden al
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  
  // Eğer imagePath zaten uploads/ içeriyorsa, direkt olarak ekle
  if (imagePath.includes('uploads/')) {
    return `${apiUrl}/${imagePath}`;
  }

  // Resim türüne göre yolu oluştur
  let basePath = '';
  switch (type) {
    case 'product':
      basePath = 'uploads/products/';
      break;
    case 'category':
      basePath = 'uploads/categories/';
      break;
    case 'hero':
      basePath = 'uploads/hero/';
      break;
    case 'favicon':
      basePath = 'uploads/';
      break;
    default:
      basePath = 'uploads/';
  }

  return `${apiUrl}/${basePath}${imagePath}`;
};

// Ürünleri kategoriye göre filtrele
const getProductsForCategory = (products, categoryId, searchQuery = '') => {
    if (!products) return [];
    
    return products
        .filter(product => 
            product?.category?._id === categoryId && 
            product?.isActive &&
            (searchQuery === '' || 
                (product?.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product?.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product?.ingredients && Array.isArray(product.ingredients) && product.ingredients.some(ingredient => 
                    ingredient && ingredient.toLowerCase().includes(searchQuery.toLowerCase())
                ))
            )
        )
        .sort((a, b) => (a?.order || 0) - (b?.order || 0));
};

// Sayfa içi kaydırma fonksiyonu
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

const LoadingSkeleton = () => (
  <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 8 }, pb: { xs: 6, md: 12 } }}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ height: { xs: 40, md: 60 }, mb: 4 }}>
        <Skeleton 
          variant="text" 
          width="50%" 
          height="100%" 
          sx={{ 
            mx: 'auto',
            borderRadius: 2,
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 },
            },
          }} 
        />
      </Box>

      {[1, 2].map((category) => (
        <Box key={category} sx={{ mb: { xs: 4, md: 8 } }}>
          <Box sx={{ height: { xs: 30, md: 40 }, mb: 3 }}>
            <Skeleton 
              variant="text" 
              width="20%" 
              height="100%" 
              sx={{ 
                borderRadius: 2,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} 
            />
          </Box>
          <Grid container spacing={{ xs: 2, md: 4 }}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={6} sm={6} md={3} key={item}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: item * 0.1 }}
                >
                  <Box sx={{ 
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 1,
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    }
                  }}>
                    <Skeleton 
                      variant="rectangular" 
                      height={200}
                      sx={{ 
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                    <Box sx={{ p: 2 }}>
                      <Skeleton variant="text" width="80%" sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </motion.div>
  </Container>
);

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const isDarkMode = mode === 'dark';
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterQuery, setFilterQuery] = useState('');
  const queryClient = useQueryClient();
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);

  // Tüm verileri çek
  const { data: headerMenuResponse, error: headerMenuError } = useQuery({
    queryKey: ['headerMenu'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/header-menu');
        return response.data;
      } catch (error) {
        console.error('Header menu yüklenirken hata:', error);
        throw error;
      }
    },
    retry: 3,
    refetchOnWindowFocus: false
  });

  const { data: heroSectionResponse, error: heroSectionError } = useQuery({
    queryKey: ['heroSection'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/hero-section');
        return response.data;
      } catch (error) {
        console.error('Hero section yüklenirken hata:', error);
        throw error;
      }
    },
    retry: 3,
    refetchOnWindowFocus: false
  });

  const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/categories');
        return response.data;
      } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        throw error;
      }
    },
    retry: 3,
    refetchOnWindowFocus: false
  });

  const { data: productsResponse, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['publicProducts'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/products');
        return response.data;
      } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
        throw error;
      }
    },
    retry: 3,
    refetchOnWindowFocus: false
  });

  const { data: footerResponse } = useQuery({
    queryKey: ['publicFooter'],
    queryFn: async () => {
      const response = await api.get('/api/footer');
      return response.data;
    },
    refetchInterval: 1000 * 10
  });

  const { data: importantNotesResponse } = useQuery({
    queryKey: ['importantNotes'],
    queryFn: async () => {
      const response = await api.get('/api/important-notes');
      return response.data;
    },
    refetchInterval: 1000 * 10
  });

  const { data: siteSettingsResponse } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const response = await api.get('/api/site-settings');
      return response.data;
    },
    refetchInterval: 1000 * 10
  });

  // Manuel yenileme fonksiyonu
  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries(['categories']),
      queryClient.invalidateQueries(['products'])
    ]);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Arama işlemi
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults(null);
      return;
    }
    
    const results = getProductsForCategory(productsResponse?.data?.data, selectedCategory, query);
    setSearchResults(results);

    // Arama sonuçlarına scroll yap
    setTimeout(() => {
      const firstResult = document.querySelector('.MuiCard-root');
      if (firstResult) {
        firstResult.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

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

  // Yükleme ve hata durumları
  if (categoriesLoading || productsLoading) {
    return <LoadingSkeleton />;
  }

  if (categoriesError || productsError || headerMenuError || heroSectionError) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Sayfayı Yenile
        </Button>
      </Container>
    );
  }

  // Verileri hazırla
  const headerMenu = headerMenuResponse?.data || [];
  const heroSection = heroSectionResponse?.data || {};
  const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];
  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : [];
  const importantNotes = importantNotesResponse?.data || [];
  const footer = footerResponse?.data || {};
  const siteSettings = siteSettingsResponse?.data || {};
  

  // Bakım modu kontrolü
  const content = siteSettings.maintenanceMode ? (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        p: 3,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.1, 1],
          rotate: [0, 360]
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,188,75,0.1) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(40px)',
          zIndex: 0
        }}
      />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Paper 
            elevation={24}
            sx={{ 
              p: 4, 
              textAlign: 'center',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(26, 26, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.3
              }}
            >
              <Box 
                sx={{ 
                  width: 120,
                  height: 120,
                  margin: '0 auto',
                  mb: 3,
                  position: 'relative'
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    borderRadius: '50%',
                    border: '3px solid #ECBC4B',
                    borderTopColor: 'transparent',
                    borderRightColor: 'transparent'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '3rem'
                  }}
                >
                  🛠️
                </Box>
              </Box>
            </motion.div>

            <Typography
              variant="h3"
              sx={{
                mb: 3,
                fontWeight: 600,
                background: 'linear-gradient(45deg, #ECBC4B 30%, #f1c40f 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.8rem', sm: '2.5rem' }
              }}
            >
              Bakım Modu
            </Typography>

            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
                lineHeight: 1.6
              }}
            >
              {siteSettings.maintenanceMessage || 'Sitemiz şu anda bakımda. Daha iyi bir deneyim için çalışıyoruz. Lütfen daha sonra tekrar deneyin.'}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              {footer?.socialMedia?.email && (
                <IconButton
                  component="a"
                  href={`mailto:${footer.socialMedia.email}`}
                  sx={{ 
                    color: '#ECBC4B',
                    '&:hover': { 
                      transform: 'translateY(-3px)',
                      color: '#d4a73d'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <EmailIcon />
                </IconButton>
              )}
              {footer?.socialMedia?.whatsapp && (
                <IconButton
                  component="a"
                  href={`https://wa.me/${footer.socialMedia.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: '#ECBC4B',
                    '&:hover': { 
                      transform: 'translateY(-3px)',
                      color: '#d4a73d'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <WhatsApp />
                </IconButton>
              )}
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        {/* Header */}
        <AppBar 
          position="fixed" 
          sx={{ 
            backgroundColor: `${theme.palette.mode === 'dark' ? '#1b1b26' : '#f5f5f5'} !important`,
            transition: 'all 0.3s ease-in-out',
            boxShadow: 1
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
              gap: 0.5,
              alignItems: 'center'
            }}>
              {headerMenu.map((item) => (
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
                        return MenuBookIcon;
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
                      color: theme.palette.mode === 'dark' ? '#ECBC4B' : 'inherit'
                    }} />;
                  })()}
                  {item.name}
                </Link>
              ))}
            </Box>

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

            {/* Sağ taraftaki ikonlar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
              {/* Masaüstü görünümü */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSearchOpen ? 'translateX(-240px)' : 'translateX(0)'
                }}>
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
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                      sx={{ color: 'text.primary' }}
                    >
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Arama kutusu */}
                <Box 
                  sx={{ 
                    position: 'fixed',
                    top: { xs: 56, md: 64 },
                    right: 0,
                    left: 0,
                    zIndex: 1200,
                    bgcolor: 'background.paper',
                    boxShadow: isSearchOpen ? 1 : 'none',
                    transition: 'all 0.3s ease-in-out',
                    height: isSearchOpen ? 'auto' : 0,
                    overflow: 'hidden',
                    display: { xs: 'none', md: 'block' }
                  }}
                >
                  <Slide direction="down" in={isSearchOpen} mountOnEnter unmountOnExit>
                    <Container maxWidth="lg">
                      <Box sx={{ 
                        py: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <TextField
                          autoFocus
                          fullWidth
                          placeholder="Ürün ara..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{ 
                            maxWidth: 600,
                            mx: 'auto',
                            '& .MuiOutlinedInput-root': {
                              bgcolor: 'background.paper',
                              '& fieldset': {
                                borderColor: 'divider'
                              },
                              '&:hover fieldset': {
                                borderColor: 'primary.main'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'primary.main'
                              }
                            }
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSearchQuery('');
                                    setSearchResults(null);
                                  }}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                        <IconButton
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery('');
                            setSearchResults(null);
                          }}
                          sx={{ color: 'text.secondary' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    </Container>
                  </Slide>
                </Box>
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
                  href="tel:+358449782878"
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
                <Fab
                  size="small"
                  onClick={() => setIsSearchOpen(true)}
                  sx={{
                    bgcolor: theme.palette.mode === 'dark' ? '#0f0f1a' : '#f5f5f5',
                    color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? '#1b1b26' : '#ffffff'
                    }
                  }}
                >
                  <SearchIcon />
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
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <List sx={{ py: 1 }}>
              {headerMenu.map((item) => (
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
                        return MenuBookIcon;
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

        {/* Hero Section */}
        <Box
          id="hero"
          sx={{
            background: heroSection.backgroundImage 
              ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${getImageUrl(heroSection.backgroundImage)})`
              : `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.background.default, 1)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: { xs: '60vh', md: '80vh' },
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h2"
                align="center"
                sx={{
                  mb: { xs: 1, md: 2 },
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  color: 'white',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.75rem' }
                }}
              >
                {heroSection.title || 'Esteri Restaurant'}
              </Typography>
              <Typography
                variant="h5"
                align="center"
                sx={{
                  mb: { xs: 2, md: 4 },
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 300,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
                }}
              >
                {heroSection.subtitle || 'Lezzetin ve Kalitenin Buluşma Noktası'}
              </Typography>
              {heroSection.description && (
                <Typography
                  variant="body1"
                  align="center"
                  sx={{ 
                    mb: { xs: 2, md: 4 }, 
                    maxWidth: 800, 
                    mx: 'auto',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    px: { xs: 2, md: 0 }
                  }}
                >
                  {heroSection.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  href={heroSection.buttonLink}
                  startIcon={<RestaurantIcon />}
                  sx={{
                    bgcolor: '#ECBC4B',
                    color: '#000',
                    '&:hover': {
                      bgcolor: '#d4a73d'
                    },
                    borderRadius: 2,
                    px: { xs: 3, md: 4 },
                    py: { xs: 1, md: 1.5 },
                    fontSize: { xs: '0.9rem', md: '1.1rem' },
                    textTransform: 'none',
                    boxShadow: theme.shadows[3]
                  }}
                >
                  {heroSection.buttonText}
                </Button>
              </Box>
            </motion.div>
          </Container>
        </Box>

        {/* Hero Section sonrası filtreleme sistemi */}
        <Box
          sx={{
            py: { xs: 1, md: 2 },  // Padding'i azalttım
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 0.5, md: 1 },  // Gap'i azalttım
              flexWrap: 'wrap', 
              justifyContent: 'center',
              mx: -0.5  // Negatif margin ekleyerek kenarlardan taşan butonları düzeltiyoruz
            }}>
              <Button
                variant="outlined"
                onClick={() => setSelectedCategory('all')}
                size="small"
                startIcon={<RestaurantIcon sx={{ 
                  fontSize: { xs: 14, md: 16 },
                  color: selectedCategory === 'all' 
                    ? theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B'
                    : theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a'
                }} />}
                sx={(theme) => ({ 
                  borderRadius: 20,
                  fontSize: { xs: '0.7rem', md: '0.8rem' },
                  py: { xs: 0.3, md: 0.5 },
                  px: { xs: 1, md: 1.5 },
                  minHeight: { xs: 28, md: 32 },
                  m: 0.5,
                  bgcolor: selectedCategory === 'all' 
                    ? theme.palette.mode === 'dark' ? '#1e1e2d' : '#ffffff'
                    : 'transparent',
                  border: selectedCategory === 'all'
                    ? theme.palette.mode === 'dark' ? '1px solid #ffffff' : '1px solid #1a1a1a'
                    : theme.palette.mode === 'dark' ? '1px solid #ffffff' : '1px solid #1a1a1a',
                  color: theme.palette.mode === 'dark' 
                    ? '#ffffff'
                    : '#1a1a1a',
                  '& .MuiSvgIcon-root': {
                    color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a'
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: '4px'
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    transition: 'transform 0.2s ease-in-out',
                    bgcolor: selectedCategory === 'all'
                      ? theme.palette.mode === 'dark' ? '#1e1e2d' : '#ffffff'
                      : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderRadius: 20
                  }
                })}
              >
                Tümü
              </Button>
              {Array.isArray(categories) && categories.length > 0 && categories.map((category) => (
                <Button
                  key={category._id}
                  variant="outlined"
                  onClick={() => setSelectedCategory(category._id)}
                  size="small"
                  startIcon={(() => {
                    const Icon = (() => {
                      const name = category.slug.toLowerCase();
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
                        return MenuBookIcon;
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
                      fontSize: { xs: 14, md: 16 },
                      color: selectedCategory === category._id 
                        ? theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B'
                        : '#1a1a1a'
                    }} />;
                  })()}
                  sx={(theme) => ({ 
                    borderRadius: 20,
                    fontSize: { xs: '0.7rem', md: '0.8rem' },
                    py: { xs: 0.3, md: 0.5 },
                    px: { xs: 1, md: 1.5 },
                    minHeight: { xs: 28, md: 32 },
                    m: 0.5,
                    bgcolor: selectedCategory === category._id 
                      ? theme.palette.mode === 'dark' ? '#1e1e2d' : '#ffffff'
                      : theme.palette.mode === 'dark' ? '#1b1b26' : 'transparent',
                    border: selectedCategory === category._id
                      ? 'none'
                      : theme.palette.mode === 'dark' ? '1px solid #ffffff' : '1px solid #1a1a1a',
                    color: theme.palette.mode === 'dark' 
                      ? selectedCategory === category._id ? '#ffffff' : '#ffffff'
                      : '#1a1a1a',
                    '& .MuiSvgIcon-root': {
                      color: theme.palette.mode === 'dark' ? '#ECBC4B' : '#1a1a1a'
                    },
                    '& .MuiButton-startIcon': {
                      marginRight: '4px'
                    },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s ease-in-out',
                      bgcolor: selectedCategory === category._id
                        ? theme.palette.mode === 'dark' ? '#1e1e2d' : '#ffffff'
                        : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderRadius: 20
                    }
                  })}
                >
                  {category.name}
                </Button>
              ))}
            </Box>
          </Container>
        </Box>

        {/* Menü Kategorileri */}
        <Box id="menu">
          <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 6 } }}>
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((category) => {
                // Kategorideki ürünleri al (backend'den sıralı geliyor)
                const categoryProducts = Array.isArray(productsResponse?.data) 
                  ? productsResponse.data.filter(product => 
                      product && 
                      product.category && 
                      (typeof product.category === 'object' ? product.category._id : product.category) === category._id
                    )
                  : [];
                
                // Eğer arama sorgusu varsa filtrele
                const filteredProducts = searchQuery 
                  ? categoryProducts.filter(product =>
                      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                  : categoryProducts;
                
                // Eğer seçili kategori "all" değilse ve bu kategori seçili değilse veya ürün yoksa kategoriyi gösterme
                if ((selectedCategory !== 'all' && selectedCategory !== category._id) || filteredProducts.length === 0) {
                  return null;
                }

                return (
                  <Box 
                    key={category._id} 
                    id={`category-${category.slug}`}
                    sx={{ 
                      mb: 6,
                      backgroundColor: theme.palette.mode === 'dark' ? '#1b1b26' : '#f9f9fa',
                      borderRadius: 3,
                      p: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      backdropFilter: 'blur(10px)',
                      scrollMarginTop: '100px'
                    }}
                  >
                    <Typography
                      variant="h4"
                      component="h2"
                      sx={{
                        mb: 3,
                        pb: 2,
                        borderBottom: `2px solid ${theme.palette.text.categoryTitle}`,
                        color: theme.palette.text.categoryTitle,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: { xs: '1.5rem', md: '2.125rem' }
                      }}
                    >
                      {(() => {
                        const Icon = (() => {
                          const name = category.slug.toLowerCase();
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
                            return MenuBookIcon;
                          } else if (name.includes('iletişim') || name.includes('contact')) {
                            return PhoneIcon;
                          } else if (name.includes('hakkında') || name.includes('about')) {
                            return InfoIcon;
                          } else if (name.includes('fi') || name.includes('en') || name.includes('sv')) {
                            return LanguageIcon;
                          }
                          return RestaurantIcon;
                        })();
                        return <Icon sx={{ fontSize: 32, color: theme.palette.text.categoryTitle }} />;
                      })()}
                      {category.name}
                    </Typography>

                    <Grid container spacing={{ xs: 3, sm: 2, md: 3 }}>
                      {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                            <Box sx={{ 
                              width: { xs: '90%', sm: '100%' },
                              mx: { xs: 'auto', sm: 0 }
                            }}>
                              <Card
                                component={RouterLink}
                                to={`/products/${product?.slug}`}
                                onClick={(e) => {
                                  if (!product?.slug) {
                                    e.preventDefault();
                                    return;
                                  }
                                }}
                                sx={{
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  position: 'relative',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  boxShadow: theme.shadows[3],
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                  backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#0f0f1a',
                                  transform: 'translateZ(0)',
                                  '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: theme.shadows[8],
                                    '& .MuiCardMedia-root': {
                                      transform: 'scale(1.05)',
                                    },
                                    '& .product-price': {
                                      transform: 'translateY(-5px)',
                                    },
                                    '& .product-title': {
                                      color: '#ECBC4B',
                                    }
                                  }
                                }}
                              >
                                {product.image && (
                                  <Box sx={{ 
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '8px 8px 0 0',
                                    height: 250,
                                    flexShrink: 0
                                  }}>
                                    <CardMedia
                                      component="img"
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                        backgroundColor: 'grey.50',
                                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        filter: 'brightness(0.95)',
                                        '&:hover': {
                                          filter: 'brightness(1)',
                                        }
                                      }}
                                      image={getImageUrl(product.image)}
                                      alt={product.name}
                                    />
                                  </Box>
                                )}
                                <CardContent 
                                  sx={{ 
                                    p: { xs: 2, md: 3 },
                                    '&:last-child': { pb: 3 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: { xs: 180, md: 200 },
                                    overflow: 'hidden'
                                  }}
                                >
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1, 
                                    mb: 1,
                                    borderBottom: `2px solid ${theme.palette.text.categoryTitle}`,
                                    pb: 1,
                                    flexShrink: 0
                                  }}>
                                    {(() => {
                                      const Icon = (() => {
                                        const name = product.name.toLowerCase();
                                        if (name.includes('pizza')) {
                                          return PizzaIcon;
                                        } else if (name.includes('kebab')) {
                                          return FastfoodIcon;
                                        } else if (name.includes('salaatti') || name.includes('salad')) {
                                          return SaladIcon;
                                        } else if (name.includes('juoma') || name.includes('drink')) {
                                          return DrinkIcon;
                                        } else if (name.includes('grilli') || name.includes('grill')) {
                                          return RestaurantIcon;
                                        } else {
                                          return RestaurantIcon;
                                        }
                                      })();
                                      return <Icon sx={{ 
                                        fontSize: { xs: 20, md: 24 }, 
                                        color: theme.palette.text.categoryTitle,
                                        transition: 'transform 0.3s ease',
                                        '&:hover': {
                                          transform: 'rotate(10deg)'
                                        }
                                      }} />;
                                    })()}
                                    <Typography
                                      variant="h6"
                                      className="product-title"
                                      sx={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontWeight: 600,
                                        fontSize: { xs: '1rem', md: '1.25rem' },
                                        color: theme.palette.mode === 'light' ? '#000000' : '#ffffff',
                                        textShadow: '0px 0px 1px rgba(0,0,0,0.1)',
                                        transition: 'color 0.3s ease'
                                      }}
                                    >
                                      {product.name}
                                    </Typography>
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ 
                                      mb: 'auto',
                                      fontSize: { xs: '0.875rem', md: '1rem' },
                                      color: theme.palette.text.description,
                                      lineHeight: 1.6,
                                      overflow: 'hidden',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {product.description && product.description.length > 50 
                                      ? `${product.description.substring(0, 50)}...` 
                                      : product.description}
                                  </Typography>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    pt: 1,
                                    borderTop: `1px solid ${theme.palette.divider}`,
                                    mt: 'auto',
                                    flexShrink: 0
                                  }}>
                                    <EuroIcon sx={{ 
                                      fontSize: { xs: 18, md: 22 }, 
                                      color: theme.palette.mode === 'light' ? '#000000' : '#ffffff',
                                      filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))'
                                    }} />
                                    <Typography
                                      variant="h6"
                                      className="product-price"
                                      sx={{
                                        fontWeight: 700,
                                        fontFamily: "'Poppins', sans-serif",
                                        fontSize: { xs: '1.1rem', md: '1.3rem' },
                                        color: theme.palette.mode === 'light' ? '#000000' : '#ffffff',
                                        textShadow: '0px 1px 1px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.3s ease'
                                      }}
                                    >
                                      {product.price} €
                                      {product.familyPrice && (
                                        <Typography
                                          component="span"
                                          variant="body2"
                                          sx={{ 
                                            ml: 1,
                                            fontSize: { xs: '0.8rem', md: '0.9rem' },
                                            color: theme.palette.text.secondary,
                                            fontWeight: 500
                                          }}
                                        >
                                          Aile Boy: {product.familyPrice} €
                                        </Typography>
                                      )}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Box>
                          </Grid>
                        ))
                      ) : (
                        <Grid item xs={12}>
                          <Alert severity="info">Bu kategoride henüz ürün bulunmamaktadır.</Alert>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                );
              })
            ) : (
              <Box sx={{ py: 4 }}>
                <Alert severity="info">Henüz kategori bulunmamaktadır.</Alert>
              </Box>
            )}
          </Container>
        </Box>

       
        {/* Önemli Notlar */}
        {importantNotes.length > 0 && (
          <Box sx={{ 
            my: { xs: 4, md: 8 }, 
            px: { xs: 2, md: 4 },
            maxWidth: '1200px',
            mx: 'auto',
            position: 'relative',
            backgroundColor: theme.palette.mode === 'dark' ? '#1b1b26' : '#f9f9fa',
            borderRadius: 3,
            p: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(10px)',
          }}>
            {showUpdateAlert && (
              <Slide direction="down" in={showUpdateAlert}>
                <Alert 
                  severity="success"
                  sx={{ 
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    minWidth: 200,
                    boxShadow: theme.shadows[3]
                  }}
                >
                  Önemli bilgiler güncellendi!
                </Alert>
              </Slide>
            )}
            <Typography
              variant="h4"
              sx={{
                mb: 3,
                pb: 2,
                borderBottom: `2px solid ${theme.palette.text.categoryTitle}`,
                color: theme.palette.text.categoryTitle,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1.5rem', md: '2.125rem' },
                '&:after': {
                  content: 'none'
                }
              }}
            >
              <InfoIcon sx={{ fontSize: 32, color: theme.palette.text.categoryTitle }} />
              Önemli Bilgiler
            </Typography>
            <Box sx={{ mt: { xs: 3, md: 4 } }}>
              {importantNotes.map((note, index) => (
                <Box
                  key={note._id}
                  sx={{
                    mb: { xs: 2, md: 3 },
                    pb: { xs: 2, md: 3 },
                    borderBottom: index !== importantNotes.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                    backgroundColor: theme.palette.mode === 'dark' ? '#1f1f2a' : '#ffffff',
                    borderRadius: 2,
                    p: 2,
                    minHeight: { xs: 100, md: 120 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    '&:last-child': {
                      mb: 0,
                      pb: 0,
                      borderBottom: 'none'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, md: 2 } }}>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: { xs: '20px', md: '24px' },
                        height: { xs: '20px', md: '24px' },
                        borderRadius: '50%',
                        bgcolor: theme.palette.mode === 'dark' ? '#1b1b26' : '#1a1a1a',
                        color: '#ffffff',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        fontWeight: 600,
                        mt: 0.5,
                        transition: 'background-color 0.3s ease'
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 500,
                          mb: { xs: 0.5, md: 1 },
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a',
                          fontSize: { xs: '1rem', md: '1.25rem' }
                        }}
                      >
                        {note.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 400,
                          lineHeight: 1.6,
                          color: theme.palette.text.description,
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        }}
                      >
                        {note.content}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Rezervasyon Dialog */}
        <ReservationDialog
          open={isReservationDialogOpen}
          onClose={() => setIsReservationDialogOpen(false)}
        />

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: theme.palette.mode === 'dark' ? '#1b1b26' : '#f5f5f5',
            borderTop: `1px solid ${theme.palette.divider}`
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
                      sx={{ color: 'text.secondary', '&:hover': { color: '#1877F2' } }}
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
                      sx={{ color: 'text.secondary', '&:hover': { color: '#E4405F' } }}
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
                      sx={{ color: 'text.secondary', '&:hover': { color: '#1DA1F2' } }}
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
                      sx={{ color: 'text.secondary', '&:hover': { color: '#FF0000' } }}
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
                      sx={{ color: 'text.secondary', '&:hover': { color: '#0A66C2' } }}
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
                      sx={{ color: 'text.secondary', '&:hover': { color: '#25D366' } }}
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
                      sx={{ color: 'text.secondary', '&:hover': { color: '#E60023' } }}
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
                      sx={{ color: 'text.secondary', '&:hover': { color: '#000000' } }}
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
                      sx={{ color: 'text.secondary', '&:hover': { color: '#0088cc' } }}
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
      </Box>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        {siteSettings?.metaTitle && <title>{siteSettings.metaTitle}</title>}
        {siteSettings?.metaDescription && <meta name="description" content={siteSettings.metaDescription} />}
        {siteSettings?.metaKeywords && <meta name="keywords" content={siteSettings.metaKeywords} />}
        {siteSettings?.googleVerification && <meta name="google-site-verification" content={siteSettings.googleVerification} />}
        {siteSettings?.bingVerification && <meta name="msvalidate.01" content={siteSettings.bingVerification} />}
        {siteSettings?.yandexVerification && <meta name="yandex-verification" content={siteSettings.yandexVerification} />}
        
        {/* Sosyal Medya Meta Etiketleri */}
        {siteSettings?.socialMedia?.ogTitle && <meta property="og:title" content={siteSettings.socialMedia.ogTitle} />}
        {siteSettings?.socialMedia?.ogDescription && <meta property="og:description" content={siteSettings.socialMedia.ogDescription} />}
        {siteSettings?.socialMedia?.ogImage && <meta property="og:image" content={siteSettings.socialMedia.ogImage} />}
        {siteSettings?.socialMedia?.twitterTitle && <meta name="twitter:title" content={siteSettings.socialMedia.twitterTitle} />}
        {siteSettings?.socialMedia?.twitterDescription && <meta name="twitter:description" content={siteSettings.socialMedia.twitterDescription} />}
        {siteSettings?.socialMedia?.twitterImage && <meta name="twitter:image" content={siteSettings.socialMedia.twitterImage} />}
        {siteSettings?.socialMedia?.twitterCardType && <meta name="twitter:card" content={siteSettings.socialMedia.twitterCardType} />}

        {/* Özel Meta Etiketleri */}
        {siteSettings?.customMetaTags && Array.isArray(siteSettings.customMetaTags) && 
          siteSettings.customMetaTags.map((tag, index) => (
            tag.name && tag.content && 
            <meta 
              key={`${tag.name}-${index}`} 
              {...(tag.name.startsWith('og:') ? { property: tag.name } : { name: tag.name })}
              content={tag.content} 
            />
          ))
        }

        {/* Favicon */}
        {siteSettings?.favicon && <link rel="icon" type="image/x-icon" href={siteSettings.favicon} />}

        {/* Özel CSS ve JS */}
        {siteSettings?.customCss && <style>{siteSettings.customCss}</style>}
        {siteSettings?.customJs && <script>{siteSettings.customJs}</script>}

        {/* Google Analytics */}
        {siteSettings?.googleAnalyticsId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${siteSettings.googleAnalyticsId}`}></script>
            <script>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${siteSettings.googleAnalyticsId}');
              `}
            </script>
          </>
        )}
      </Helmet>
      {content}
    </>
  );
};

export default Home;