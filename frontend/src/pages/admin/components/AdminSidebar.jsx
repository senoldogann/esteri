import React from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    useTheme
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HeroIcon from '@mui/icons-material/Slideshow';
import InfoIcon from '@mui/icons-material/Info';
import ArticleIcon from '@mui/icons-material/Article';
import SettingsIcon from '@mui/icons-material/Settings';
import EventSeatIcon from '@mui/icons-material/EventSeat';

const drawerWidth = 240;

const AdminSidebar = ({ mobileOpen, handleDrawerToggle, menuItems }) => {
    const theme = useTheme();
    const location = useLocation();

    const drawer = (
        <Box sx={{ overflow: 'auto' }}>
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.path} disablePadding>
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={location.pathname === item.path}
                            sx={{
                                minHeight: 48,
                                px: 2.5,
                                '&.Mui-selected': {
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.08)'
                                        : 'rgba(0, 0, 0, 0.05)',
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.12)'
                                            : 'rgba(0, 0, 0, 0.07)',
                                    }
                                },
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.08)'
                                        : 'rgba(0, 0, 0, 0.04)',
                                }
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: 3,
                                    justifyContent: 'center',
                                    color: location.pathname === item.path
                                        ? theme.palette.primary.main
                                        : theme.palette.text.secondary
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.title}
                                sx={{
                                    '& .MuiListItemText-primary': {
                                        fontWeight: location.pathname === item.path ? 600 : 400,
                                        color: location.pathname === item.path
                                            ? theme.palette.text.primary
                                            : theme.palette.text.secondary
                                    }
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
            {/* Mobil çekmece */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Mobil performansı artırır
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { 
                        boxSizing: 'border-box', 
                        width: drawerWidth,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1b1b26' : '#ffffff',
                        borderRight: `1px solid ${theme.palette.divider}`
                    },
                }}
            >
                {drawer}
            </Drawer>
            
            {/* Masaüstü çekmece */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { 
                        boxSizing: 'border-box', 
                        width: drawerWidth,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1b1b26' : '#ffffff',
                        borderRight: `1px solid ${theme.palette.divider}`
                    },
                }}
                open
            >
                {drawer}
            </Drawer>
        </Box>
    );
};

export default AdminSidebar;