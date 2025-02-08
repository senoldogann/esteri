import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 2 
            }}>
                <Box sx={{ 
                    backgroundColor: `${color}20`,
                    borderRadius: '50%',
                    p: 1,
                    mr: 2
                }}>
                    {icon}
                </Box>
                <Typography variant="h6" component="div">
                    {title}
                </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                {value || '0'}
            </Typography>
        </CardContent>
    </Card>
);

export default StatCard; 