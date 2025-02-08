import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HeroIcon from '@mui/icons-material/Slideshow';
import InfoIcon from '@mui/icons-material/Info';
import ArticleIcon from '@mui/icons-material/Article';
import SettingsIcon from '@mui/icons-material/Settings';

const AdminLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        {
            title: 'Dashboard',
            path: '/admin/dashboard',
            icon: <DashboardIcon />
        },
        {
            title: 'Rezervasyonlar',
            path: '/admin/reservations',
            icon: <EventSeatIcon />
        },
        {
            title: 'Kategoriler',
            path: '/admin/categories',
            icon: <CategoryIcon />
        },
        {
            title: 'Ürünler',
            path: '/admin/products',
            icon: <RestaurantMenuIcon />
        },
        {
            title: 'Header Menü',
            path: '/admin/header-menu',
            icon: <MenuBookIcon />
        },
        {
            title: 'Hero Section',
            path: '/admin/hero-section',
            icon: <HeroIcon />
        },
        {
            title: 'Önemli Notlar',
            path: '/admin/important-notes',
            icon: <InfoIcon />
        },
        {
            title: 'Footer',
            path: '/admin/footer',
            icon: <ArticleIcon />
        },
        {
            title: 'Site Ayarları',
            path: '/admin/site-settings',
            icon: <SettingsIcon />
        }
    ];

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            
            {/* Header */}
            <AdminHeader handleDrawerToggle={handleDrawerToggle} />

            {/* Sidebar */}
            <AdminSidebar 
                mobileOpen={mobileOpen} 
                handleDrawerToggle={handleDrawerToggle} 
                menuItems={menuItems}
            />

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - 240px)` },
                    mt: '64px', // Header yüksekliği kadar margin
                    bgcolor: 'background.default'
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout; 