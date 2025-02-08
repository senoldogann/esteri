import React from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    CircularProgress,
    Paper
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import CategoryIcon from '@mui/icons-material/Category';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import api from '../../../utils/api';

const getActivityIcon = (module) => {
    switch (module) {
        case 'product':
            return <FastfoodIcon />;
        case 'category':
            return <CategoryIcon />;
        case 'menu':
            return <MenuIcon />;
        case 'important-notes':
            return <InfoIcon />;
        default:
            return <SettingsIcon />;
    }
};

const getActivityColor = (type) => {
    switch (type) {
        case 'create':
            return 'success.main';
        case 'update':
            return 'primary.main';
        case 'delete':
            return 'error.main';
        default:
            return 'primary.main';
    }
};

const RecentActivities = () => {
    const { data: activities, isLoading } = useQuery({
        queryKey: ['activities'],
        queryFn: async () => {
            const response = await api.get('api/activities');
            return response.data.data;
        },
        refetchInterval: 2000, // 2 saniyede bir güncelle
        refetchOnWindowFocus: true, // Sayfa fokuslandığında güncelle
        refetchOnMount: true, // Bileşen mount olduğunda güncelle
        staleTime: 0 // Her zaman yeni veri al
    });

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Son Aktiviteler
            </Typography>
            <Paper sx={{ width: '100%', maxHeight: 400, overflow: 'auto' }}>
                <List sx={{ width: '100%', p: 0 }}>
                    {activities?.map((activity) => (
                        <ListItem key={activity._id} sx={{ 
                            width: '100%',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': {
                                borderBottom: 'none'
                            }
                        }}>
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                                    {getActivityIcon(activity.module)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={activity.description}
                                secondary={
                                    <Typography component="span" variant="caption" color="text.secondary">
                                        {activity.user} - {format(new Date(activity.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))}
                    {(!activities || activities.length === 0) && (
                        <ListItem>
                            <ListItemText 
                                primary="Henüz aktivite bulunmuyor" 
                                sx={{ textAlign: 'center', color: 'text.secondary' }}
                            />
                        </ListItem>
                    )}
                </List>
            </Paper>
        </Box>
    );
};

export default RecentActivities; 