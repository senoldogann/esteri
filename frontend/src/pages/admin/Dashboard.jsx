import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Paper,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    CircularProgress,
    useTheme,
    Divider,
    ListItemIcon,
    Button
} from '@mui/material';
import {
    PeopleAlt as PeopleIcon,
    EventAvailable as EventIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    AccessTime as TimeIcon,
    TrendingUp as TrendingUpIcon,
    CalendarToday as CalendarIcon,
    Group as GroupIcon,
    Restaurant as RestaurantIcon,
    Category as CategoryIcon,
    Menu as MenuIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link as RouterLink } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { alpha } from '@mui/material/styles';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
});

const Dashboard = () => {
    const theme = useTheme();
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        todayTotal: 0,
        weeklyStats: []
    });

    // Rezervasyonları getir
    const { data: reservations, isLoading: reservationsLoading, refetch: refetchReservations } = useQuery({
        queryKey: ['reservations'],
        queryFn: async () => {
            const response = await api.get('/api/reservations');
            return response.data.data;
        }
    });

    // Ürünleri getir
    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/api/products');
            return response.data.data;
        }
    });

    // Kategorileri getir
    const { data: categories, isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/api/categories');
            return response.data.data;
        }
    });

    // Menü öğelerini getir
    const { data: menuItems, isLoading: menuItemsLoading } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => {
            const response = await api.get('/api/header-menu');
            return response.data.data;
        }
    });

    useEffect(() => {
        if (reservations) {
            // Temel istatistikler
            const total = reservations.length;
            const pending = reservations.filter(r => r.status === 'beklemede').length;
            const confirmed = reservations.filter(r => r.status === 'onaylandı').length;
            const completed = reservations.filter(r => r.status === 'tamamlandı').length;
            const cancelled = reservations.filter(r => r.status === 'iptal edildi').length;

            // Bugünün rezervasyonları
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTotal = reservations.filter(r => {
                const reservationDate = new Date(r.date);
                reservationDate.setHours(0, 0, 0, 0);
                return reservationDate.getTime() === today.getTime();
            }).length;

            // Haftalık istatistikler
            const weeklyData = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const count = reservations.filter(r => {
                    const reservationDate = new Date(r.date);
                    reservationDate.setHours(0, 0, 0, 0);
                    return reservationDate.getTime() === date.getTime();
                }).length;

                return {
                    date: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
                    count
                };
            }).reverse();

            setStats({
                total,
                pending,
                confirmed,
                completed,
                cancelled,
                todayTotal,
                weeklyStats: weeklyData
            });
        }
    }, [reservations]);

    const StatCard = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        mr: 2
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="h6" color="text.secondary">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    if (reservationsLoading || productsLoading || categoriesLoading || menuItemsLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Dashboard
                </Typography>
                <Tooltip title="Yenile">
                    <IconButton onClick={() => refetchReservations()}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={3}>
                {/* Sistem İstatistikleri */}
                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                        Sistem İstatistikleri
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Toplam Ürün"
                                value={products?.length || 0}
                                icon={<RestaurantIcon />}
                                color={theme.palette.info.main}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Toplam Kategori"
                                value={categories?.length || 0}
                                icon={<CategoryIcon />}
                                color={theme.palette.success.main}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Menü Öğeleri"
                                value={menuItems?.length || 0}
                                icon={<MenuIcon />}
                                color={theme.palette.warning.main}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Aktif Ayarlar"
                                value="1"
                                icon={<SettingsIcon />}
                                color={theme.palette.secondary.main}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Rezervasyon İstatistikleri */}
                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 3, mt: 3 }}>
                        Rezervasyon İstatistikleri
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Toplam Rezervasyon"
                                value={stats.total}
                                icon={<EventIcon />}
                                color={theme.palette.primary.main}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Bekleyen"
                                value={stats.pending}
                                icon={<TimeIcon />}
                                color={theme.palette.warning.main}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Onaylanan"
                                value={stats.confirmed}
                                icon={<CheckIcon />}
                                color={theme.palette.success.main}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="İptal Edilen"
                                value={stats.cancelled}
                                icon={<CancelIcon />}
                                color={theme.palette.error.main}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Grafik ve Özet */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Haftalık Rezervasyon Grafiği
                        </Typography>
                        <Box sx={{ height: 300, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.weeklyStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <ChartTooltip />
                                    <Bar dataKey="count" fill={theme.palette.primary.main} name="Rezervasyon" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Bugünün Özeti */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Bugünün Özeti
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemIcon>
                                    <CalendarIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary="Bugünkü Rezervasyonlar" 
                                    secondary={stats.todayTotal}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <GroupIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary="Toplam Tamamlanan" 
                                    secondary={stats.completed}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <TrendingUpIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary="Doluluk Oranı" 
                                    secondary={`${Math.round((stats.confirmed / stats.total) * 100 || 0)}%`}
                                />
                            </ListItem>
                        </List>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Button
                                    component={RouterLink}
                                    to="/admin/reservations"
                                    variant="contained"
                                    fullWidth
                                >
                                    Rezervasyonlar
                                </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button
                                    component={RouterLink}
                                    to="/admin/products"
                                    variant="outlined"
                                    fullWidth
                                >
                                    Ürünler
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard; 