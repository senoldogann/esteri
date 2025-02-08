import React, { useState } from 'react';
import {
    AppBar as MuiAppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Menu,
    Container,
    Button,
    MenuItem,
    useTheme,
    useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../utils/api';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

const AppBar = () => {
    const [anchorElNav, setAnchorElNav] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const location = useLocation();

    // Site ayarlarını getir
    const { data: settings } = useQuery({
        queryKey: ['publicSiteSettings'],
        queryFn: async () => {
            const response = await api.get('/api/site-settings/public');
            return response.data.data;
        }
    });

    // Header menüyü getir
    const { data: menuItems } = useQuery({
        queryKey: ['publicHeaderMenu'],
        queryFn: async () => {
            const response = await api.get('/api/header-menu/public');
            return response.data.data;
        }
    });

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    return (
        <MuiAppBar position="sticky" sx={{ bgcolor: 'background.paper' }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    {/* Logo - Desktop */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
                        {settings?.logo && (
                            <img
                                src={`${import.meta.env.VITE_API_URL}/${settings.logo}`}
                                alt={settings?.siteName || 'Logo'}
                                style={{ height: '50px' }}
                            />
                        )}
                    </Box>

                    {/* Mobile menu */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="menu"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                            }}
                        >
                            {menuItems?.map((item) => (
                                <MenuItem 
                                    key={item._id} 
                                    onClick={handleCloseNavMenu}
                                    component={RouterLink}
                                    to={item.link}
                                    selected={location.pathname === item.link}
                                >
                                    <Typography textAlign="center">{item.name}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>

                    {/* Logo - Mobile */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1 }}>
                        {settings?.logo && (
                            <img
                                src={`${import.meta.env.VITE_API_URL}/${settings.logo}`}
                                alt={settings?.siteName || 'Logo'}
                                style={{ height: '40px' }}
                            />
                        )}
                    </Box>

                    {/* Desktop menu */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
                        {menuItems?.map((item) => (
                            <Button
                                key={item._id}
                                component={RouterLink}
                                to={item.link}
                                onClick={handleCloseNavMenu}
                                sx={{
                                    my: 2,
                                    mx: 1,
                                    color: location.pathname === item.link ? 'primary.main' : 'text.primary',
                                    display: 'block',
                                    fontWeight: location.pathname === item.link ? 600 : 400
                                }}
                            >
                                {item.name}
                            </Button>
                        ))}
                    </Box>

                    {/* Language Switcher */}
                    <Box sx={{ ml: 2 }}>
                        <LanguageSwitcher />
                    </Box>
                </Toolbar>
            </Container>
        </MuiAppBar>
    );
};

export default AppBar; 