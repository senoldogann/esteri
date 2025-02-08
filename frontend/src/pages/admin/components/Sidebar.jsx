import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import MenuIcon from '@mui/icons-material/Menu';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import NotesIcon from '@mui/icons-material/Notes';
import WebIcon from '@mui/icons-material/Web';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    path: '/admin',
    icon: <DashboardIcon />
  },
  {
    title: 'Kategoriler',
    path: '/admin/categories',
    icon: <CategoryIcon />
  },
  {
    title: 'Ürünler',
    path: '/admin/products',
    icon: <FastfoodIcon />
  },
  {
    title: 'Header Menü',
    path: '/admin/header-menu',
    icon: <MenuIcon />
  },
  {
    title: 'Hero Section',
    path: '/admin/hero-section',
    icon: <ViewCarouselIcon />
  },
  {
    title: 'Önemli Notlar',
    path: '/admin/important-notes',
    icon: <NotesIcon />
  },
  {
    title: 'Footer',
    path: '/admin/footer',
    icon: <WebIcon />
  },
  {
    title: 'Site Ayarları',
    path: '/admin/site-settings',
    icon: <SettingsIcon />
  }
];

const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider'
      }}
    >
      <List sx={{ py: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.path}
            component="button"
            onClick={() => navigate(item.path)}
            sx={{
              width: '100%',
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              bgcolor: location.pathname === item.path ? 
                theme.palette.action.selected : 'transparent',
              color: location.pathname === item.path ? 
                theme.palette.primary.main : theme.palette.text.primary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
                cursor: 'pointer'
              },
              border: 'none',
              textAlign: 'left',
              borderRadius: 1,
              mb: 0.5
            }}
          >
            <ListItemIcon 
              sx={{ 
                minWidth: 40,
                color: location.pathname === item.path ? 
                  theme.palette.primary.main : theme.palette.text.secondary 
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: location.pathname === item.path ? 600 : 400
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <List>
        <ListItem
          component="button"
          onClick={handleLogout}
          sx={{
            width: '100%',
            py: 1.5,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.error.main,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
              cursor: 'pointer'
            },
            border: 'none',
            textAlign: 'left',
            borderRadius: 1
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: theme.palette.error.main }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Çıkış Yap"
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          />
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar; 