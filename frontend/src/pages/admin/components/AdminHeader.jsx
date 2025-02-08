import React, { useState } from 'react';
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Divider,
    useTheme
} from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle,
    Logout,
    Person,
    Settings
} from '@mui/icons-material';
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from 'react-router-dom';

const AdminHeader = ({ handleDrawerToggle }) => {
    const theme = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Çıkış yapılırken hata:', error);
        }
        handleMenuClose();
    };

    const handleProfile = () => {
        navigate('/admin/profile');
        handleMenuClose();
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                width: { sm: `calc(100% - 240px)` },
                ml: { sm: `240px` },
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                boxShadow: 'none',
                borderBottom: `1px solid ${theme.palette.divider}`
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }} />
                
                {/* Kullanıcı Menüsü */}
                <IconButton
                    onClick={handleMenuOpen}
                    size="large"
                    edge="end"
                    aria-label="kullanıcı menüsü"
                    aria-controls="user-menu"
                    aria-haspopup="true"
                >
                    <Avatar
                        sx={{
                            width: 35,
                            height: 35,
                            bgcolor: theme.palette.primary.main
                        }}
                    >
                        {user?.name?.charAt(0) || 'A'}
                    </Avatar>
                </IconButton>

                <Menu
                    id="user-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    onClick={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                        sx: {
                            mt: 1,
                            minWidth: 200,
                            boxShadow: theme.shadows[3],
                            '& .MuiMenuItem-root': {
                                py: 1,
                                px: 2
                            }
                        }
                    }}
                >
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="subtitle1" noWrap>
                            {user?.name || 'Admin'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {user?.email || 'admin@example.com'}
                        </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <MenuItem onClick={handleProfile}>
                        <ListItemIcon>
                            <Person fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Profil</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <Logout fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Çıkış Yap</ListItemText>
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default AdminHeader; 