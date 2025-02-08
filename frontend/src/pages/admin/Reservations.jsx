import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { toast } from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { alpha } from '@mui/material/styles';

// API base URL'ini tanımla
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Request interceptor - her istekte token'ı güncelle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Reservations = () => {
  const theme = useTheme();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);

  const fetchReservations = async () => {
    try {
      const response = await api.get('/api/reservations');
      setReservations(response.data.data);
      setFilteredReservations(response.data.data);
    } catch (error) {
      toast.error('Rezervasyonlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    const filtered = reservations.filter(reservation => {
      const matchesSearch = reservation.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.phone.includes(searchQuery);

      // Tab'a göre filtreleme
      const matchesTab = selectedTab === 0 
        ? reservation.status !== 'tamamlandı' 
        : reservation.status === 'tamamlandı';

      return matchesSearch && matchesTab;
    });
    setFilteredReservations(filtered);
    setPage(0);
  }, [searchQuery, reservations, selectedTab]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Önce rezervasyonu kontrol et
      const reservation = reservations.find(r => r._id === id);
      
      console.log('Durum değiştirme isteği:', {
        id,
        newStatus,
        currentStatus: reservation?.status
      });
      
      // Eğer rezervasyon tamamlandıysa, durumu değiştirmeye izin verme
      if (reservation.status === 'tamamlandı') {
        toast.error('Tamamlanmış rezervasyonların durumu değiştirilemez.');
        return;
      }

      setLoading(true);
      
      console.log('API isteği gönderiliyor:', {
        url: `${api.defaults.baseURL}/api/reservations/${id}/status`,
        data: { status: newStatus }
      });

      const response = await api.patch(`/api/reservations/${id}/status`, {
        status: newStatus
      });

      console.log('API yanıtı:', response.data);

      if (response.data.success) {
        toast.success('Rezervasyon durumu güncellendi');
        // Rezervasyonları yeniden yükle
        await fetchReservations();
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      toast.error(
        error.response?.data?.error || 
        error.message || 
        'Durum güncellenirken bir hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Önce rezervasyonu kontrol et
      const reservation = reservations.find(r => r._id === id);
      
      // Eğer rezervasyon tamamlandıysa, silinmesine izin verme
      if (reservation.status === 'tamamlandı') {
        toast.error('Tamamlanmış rezervasyonlar silinemez.');
        return;
      }

      if (window.confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) {
        setLoading(true);
        const response = await api.delete(`/api/reservations/${id}`);
        
        if (response.data.success) {
          toast.success('Rezervasyon başarıyla silindi');
          // Rezervasyonları yeniden yükle
          fetchReservations();
        }
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error(error.message || 'Rezervasyon silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'onaylandı':
        return {
          bg: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.main,
          borderColor: alpha(theme.palette.success.main, 0.3),
          hoverBg: alpha(theme.palette.success.main, 0.2)
        };
      case 'beklemede':
        return {
          bg: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.main,
          borderColor: alpha(theme.palette.warning.main, 0.3),
          hoverBg: alpha(theme.palette.warning.main, 0.2)
        };
      case 'iptal edildi':
        return {
          bg: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.main,
          borderColor: alpha(theme.palette.error.main, 0.3),
          hoverBg: alpha(theme.palette.error.main, 0.2)
        };
      case 'tamamlandı':
        return {
          bg: alpha(theme.palette.info.main, 0.1),
          color: theme.palette.info.main,
          borderColor: alpha(theme.palette.info.main, 0.3),
          hoverBg: alpha(theme.palette.info.main, 0.2)
        };
      default:
        return {
          bg: alpha(theme.palette.grey[500], 0.1),
          color: theme.palette.grey[700],
          borderColor: alpha(theme.palette.grey[500], 0.3),
          hoverBg: alpha(theme.palette.grey[500], 0.2)
        };
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  if (loading) {
    return <Box sx={{ p: 3 }}>Yükleniyor...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Rezervasyonlar
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Yenile">
            <IconButton onClick={fetchReservations}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              textTransform: 'none',
              minHeight: 48,
              py: 1,
              px: 2
            }
          }}
        >
          <Tab 
            icon={<EventAvailableIcon />} 
            iconPosition="start" 
            label="Devam Eden Rezervasyonlar" 
          />
          <Tab 
            icon={<EventBusyIcon />} 
            iconPosition="start" 
            label="Tamamlanan Rezervasyonlar" 
          />
        </Tabs>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ad Soyad</TableCell>
              <TableCell>İletişim</TableCell>
              <TableCell>Tarih/Saat</TableCell>
              <TableCell>Kişi Sayısı</TableCell>
              <TableCell>Notlar</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReservations
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((reservation) => (
                <TableRow key={reservation._id}>
                  <TableCell>{reservation.fullName}</TableCell>
                  <TableCell>
                    <div>{reservation.email}</div>
                    <div>{reservation.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div>{new Date(reservation.date).toLocaleDateString('tr-TR')}</div>
                    <div>{reservation.time}</div>
                  </TableCell>
                  <TableCell>{reservation.numberOfPeople} kişi</TableCell>
                  <TableCell>{reservation.notes || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(reservation._id, e.target.value)}
                      disabled={reservation.status === 'tamamlandı'}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 150,
                        height: 36,
                        fontSize: '0.875rem',
                        backgroundColor: getStatusColor(reservation.status).bg,
                        color: getStatusColor(reservation.status).color,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: getStatusColor(reservation.status).borderColor,
                          borderWidth: '1px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: getStatusColor(reservation.status).borderColor,
                          borderWidth: '1.5px',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: getStatusColor(reservation.status).borderColor,
                          borderWidth: '1.5px',
                        },
                        '& .MuiSelect-select': {
                          py: 0.75,
                          px: 1.5,
                        },
                        '&.Mui-disabled': {
                          backgroundColor: alpha(theme.palette.info.main, 0.05),
                          color: alpha(theme.palette.info.main, 0.7),
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.info.main, 0.2),
                          }
                        },
                        '& .MuiSvgIcon-root': {
                          color: getStatusColor(reservation.status).color,
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            mt: 0.5,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            borderRadius: 1,
                            '& .MuiMenuItem-root': {
                              px: 1.5,
                              py: 1,
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              },
                              '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.16),
                                }
                              }
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="beklemede" sx={{ 
                        color: getStatusColor('beklemede').color,
                        '&.Mui-selected': { backgroundColor: getStatusColor('beklemede').bg }
                      }}>
                        Beklemede
                      </MenuItem>
                      <MenuItem value="onaylandı" sx={{ 
                        color: getStatusColor('onaylandı').color,
                        '&.Mui-selected': { backgroundColor: getStatusColor('onaylandı').bg }
                      }}>
                        Onaylandı
                      </MenuItem>
                      <MenuItem value="iptal edildi" sx={{ 
                        color: getStatusColor('iptal edildi').color,
                        '&.Mui-selected': { backgroundColor: getStatusColor('iptal edildi').bg }
                      }}>
                        İptal Edildi
                      </MenuItem>
                      <MenuItem value="tamamlandı" sx={{ 
                        color: getStatusColor('tamamlandı').color,
                        '&.Mui-selected': { backgroundColor: getStatusColor('tamamlandı').bg }
                      }}>
                        Tamamlandı
                      </MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleDelete(reservation._id)}
                      disabled={reservation.status === 'tamamlandı'}
                      sx={{
                        color: reservation.status === 'tamamlandı' ? 'gray' : 'error.main',
                        '&:hover': {
                          backgroundColor: reservation.status === 'tamamlandı' ? 'transparent' : 'error.light'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredReservations.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Sayfa başına satır:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
        }
      />
    </Box>
  );
};

export default Reservations; 