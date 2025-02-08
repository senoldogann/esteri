import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AppBar from './AppBar';

const Layout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar />
            <Box component="main" sx={{ flexGrow: 1, mt: 8, p: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;