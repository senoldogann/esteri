import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Box, Typography, TextField, Button, Container, useTheme, MenuItem } from '@mui/material';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { tr } from 'date-fns/locale';
import { addMonths, isWithinInterval, format, parse } from 'date-fns';

// API base URL'ini tanımla
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  timeout: 10000
});

// Yeniden deneme interceptor'ı
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('Hata detayları:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      fullError: error
    });

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      
      // String hata mesajı
      if (typeof errorData === 'string') {
        return Promise.reject(new Error(errorData));
      }
      
      // Obje içindeki hata mesajı
      if (errorData?.error) {
        return Promise.reject(new Error(errorData.error));
      }
      
      // Diğer durumlar
      return Promise.reject(new Error('Seçtiğiniz saatte yer bulunmamaktadır. Lütfen başka bir saat seçiniz.'));
    }

    // Ağ hatası
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol ediniz.'));
    }

    // Diğer tüm hatalar
    return Promise.reject(new Error('Seçtiğiniz saatte yer bulunmamaktadır. Lütfen başka bir saat seçiniz.'));
  }
);

const ReservationForm = ({ onSuccess }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    numberOfPeople: 1,
    notes: ''
  });
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Müsait günleri kontrol et
  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      const endDate = addMonths(startDate, 2);

      // Tarih formatını düzelt ve kontrol logları ekle
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      console.log('API isteği gönderiliyor:', {
        url: `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/reservations/available-dates`,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });

      const response = await api.get('/api/reservations/available-dates', {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log('API yanıtı:', response.data);

      if (response.data.success) {
        setAvailability(response.data.data);
        
        if (formData.date) {
          const dateAvailability = response.data.data[formData.date];
          if (dateAvailability) {
            const timeSlot = dateAvailability.timeSlots[formData.time] || 0;
            const remainingCapacity = Math.max(0, 15 - timeSlot);
            
            if (formData.numberOfPeople > remainingCapacity) {
              toast.warning('Seçilen saat için yeterli kapasite kalmadı.');
              setFormData(prev => ({
                ...prev,
                time: ''
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Müsait günler yüklenirken hata:', error);
      console.error('Hata detayları:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        config: error.config
      });
      
      let errorMessage = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Sunucu yanıt vermiyor. Otomatik olarak yeniden deneniyor...';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Sunucu bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.';
      }
      
      toast.error(errorMessage);
      setAvailability({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableDates();
  }, [refreshKey]);

  // Tarih seçildiğinde
  const handleDateChange = async (newDate) => {
    const formattedDate = format(newDate, 'yyyy-MM-dd');
    setFormData(prev => ({
      ...prev,
      date: formattedDate,
      time: '' // Tarihi değiştirince saati sıfırla
    }));

    // Seçilen tarih için müsaitlik bilgilerini güncelle
    await fetchAvailableDates();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Tarih seçilebilir mi kontrol et
  const isDateDisabled = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateAvailability = availability[dateStr];
    
    // Eğer tarih için müsaitlik bilgisi yoksa veya doluysa seçilemez
    if (!dateAvailability || dateAvailability.isFull) {
      return true;
    }

    // Seçilen kişi sayısı için yeterli kapasite var mı kontrol et
    if (formData.numberOfPeople > dateAvailability.remainingCapacity) {
      return true;
    }

    return false;
  };

  // Kişi sayısı değiştiğinde tarihleri yeniden kontrol et
  useEffect(() => {
    if (formData.date) {
      const dateStr = format(new Date(formData.date), 'yyyy-MM-dd');
      const dateAvailability = availability[dateStr];
      
      if (dateAvailability && formData.numberOfPeople > dateAvailability.remainingCapacity) {
        // Eğer seçilen kişi sayısı kapasiteyi aşıyorsa tarihi sıfırla
        setFormData(prev => ({
          ...prev,
          date: '',
          time: ''
        }));
        toast.warning('Seçilen tarih için yeterli kapasite bulunmuyor.');
      }
    }
  }, [formData.numberOfPeople, availability]);

  // Müsait saatleri getir
  const getAvailableTimeSlots = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateAvailability = availability[dateStr];
    
    // Seçilen tarihteki tüm rezervasyonları kontrol et
    const timeSlots = dateAvailability?.timeSlots || {};
    
    // Her saat için doluluk durumunu kontrol et
    return (time) => {
      const currentSlot = timeSlots[time] || 0;
      const remainingCapacity = Math.max(0, 15 - currentSlot);
      
      // Eğer kalan kapasite, istenen kişi sayısından azsa veya doluysa
      return remainingCapacity < formData.numberOfPeople;
    };
  };

  // Saat değiştiğinde
  const handleTimeChange = (newTime) => {
    if (!newTime) {
      setFormData(prev => ({ ...prev, time: '' }));
      return;
    }

    const timeStr = format(newTime, 'HH:mm');
    const hour = parseInt(timeStr.split(':')[0]);
    const minute = parseInt(timeStr.split(':')[1]);

    // 10:30 - 22:00 arası kontrol
    if (hour < 10 || (hour === 10 && minute < 30) || hour >= 22) {
      toast.warning('Lütfen 10:30 - 22:00 arasında bir saat seçin');
      setFormData(prev => ({ ...prev, time: '' }));
      return;
    }

    // Seçilen saatin doluluk durumunu kontrol et
    if (formData.date) {
      const isTimeSlotDisabled = getAvailableTimeSlots(new Date(formData.date))(timeStr);
      if (isTimeSlotDisabled) {
        toast.error(`${timeStr} saati için yeterli kapasite bulunmuyor. (${formData.numberOfPeople} kişi için)`);
        setFormData(prev => ({ ...prev, time: '' }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, time: timeStr }));
  };

  // Başarılı rezervasyon sonrası
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post('/api/reservations', formData);
      
      if (response.data.success) {
        toast.success('Rezervasyonunuz başarıyla oluşturuldu!', {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        
        if (onSuccess) {
          onSuccess(response.data.data);
        }
        // Formu sıfırla
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          date: '',
          time: '',
          numberOfPeople: 1,
          notes: ''
        });
        setRefreshKey(old => old + 1);
      }
    } catch (error) {
      console.error('Rezervasyon oluşturma hatası:', error);
      
      let errorMessage = error.message;

      // Kapasite dolu hatasını kontrol et
      if (errorMessage.includes('kapasite') || errorMessage.includes('doluluk')) {
        const match = errorMessage.match(/Mevcut doluluk: (\d+) kişi, Kalan kapasite: (\d+) kişi/);
        if (match) {
          const [, current, remaining] = match;
          errorMessage = `⚠️ Üzgünüz, seçtiğiniz saat dolu!\n\nŞu anda: ${current} kişilik rezervasyon var\nKalan kapasite: ${remaining} kişi\n\nLütfen başka bir saat seçiniz.`;
        } else {
          errorMessage = '⚠️ Seçtiğiniz saatte yer bulunmamaktadır. Lütfen başka bir saat seçiniz.';
        }
        // Saat seçimini sıfırla
        setFormData(prev => ({
          ...prev,
          time: ''
        }));
      }

      // Hata mesajını göster
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 7000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: theme.palette.mode === 'dark' ? '#2b2b2b' : '#fff',
          color: theme.palette.mode === 'dark' ? '#fff' : '#333',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '1rem',
          width: '100%',
          maxWidth: '500px',
          whiteSpace: 'pre-line'
        }
      });

      // Hata durumunda müsaitlik bilgilerini güncelle
      fetchAvailableDates();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : '#fff',
        borderRadius: 2,
        p: 4,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 3px 10px rgba(255,255,255,0.1)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '1000px',
        mx: 'auto',
        my: 4,
        color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
        border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 4,
        borderBottom: `2px solid ${theme.palette.mode === 'dark' ? '#fff' : '#000'}`,
        pb: 2
      }}>
        <EventSeatIcon sx={{ 
          fontSize: 32,
          color: theme.palette.mode === 'dark' ? '#fff' : 'inherit'
        }} />
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 600,
            color: theme.palette.mode === 'dark' ? '#fff' : 'inherit'
          }}
        >
          Rezervasyon Yap
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 3 
        }}>
          <TextField
            label="Ad Soyad"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
              },
              '& .MuiOutlinedInput-input': {
                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              }
            }}
          />

          <TextField
            label="E-posta"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
              },
              '& .MuiOutlinedInput-input': {
                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              }
            }}
          />

          <TextField
            label="Telefon"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
              },
              '& .MuiOutlinedInput-input': {
                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              }
            }}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
            <DatePicker
              label="Tarih"
              value={formData.date ? new Date(formData.date) : null}
              onChange={handleDateChange}
              shouldDisableDate={isDateDisabled}
              minDate={new Date()}
              maxDate={addMonths(new Date(), 2)}
              slotProps={{
                textField: {
                  required: true,
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
            <TimePicker
              label="Saat"
              value={formData.time ? parse(formData.time, 'HH:mm', new Date()) : null}
              onChange={handleTimeChange}
              disabled={!formData.date}
              ampm={false}
              minutesStep={15}
              minTime={new Date(0, 0, 0, 10, 30)}
              maxTime={new Date(0, 0, 0, 22, 0)}
              shouldDisableTime={(time) => {
                if (!formData.date) return false;
                const timeStr = format(time, 'HH:mm');
                return getAvailableTimeSlots(new Date(formData.date))(timeStr);
              }}
              slotProps={{
                textField: {
                  required: true,
                  fullWidth: true,
                  helperText: "10:30 - 22:00 arası rezervasyon yapılabilir",
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
                    },
                    '& .MuiOutlinedInput-input': {
                      color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
                    }
                  }
                }
              }}
            />
          </LocalizationProvider>

          <TextField
            label="Kişi Sayısı"
            name="numberOfPeople"
            type="number"
            value={formData.numberOfPeople}
            onChange={handleChange}
            required
            fullWidth
            inputProps={{
              min: 1,
              max: 15
            }}
            helperText="Maksimum kapasite her saat için 15 kişidir"
            error={formData.numberOfPeople > 15}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
              },
              '& .MuiOutlinedInput-input': {
                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              }
            }}
          />

          <TextField
            label="Notlar"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
            sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 4,
            py: 1.5,
            backgroundColor: theme.palette.mode === 'dark' ? '#ECBC4B' : '#ECBC4B',
            color: '#000',
            fontSize: '1.1rem',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#d4a73d' : '#d4a73d',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(236, 188, 75, 0.4)'
            },
            '&:disabled': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(236, 188, 75, 0.3)' : 'rgba(0, 0, 0, 0.12)',
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)'
            }
          }}
          startIcon={<EventSeatIcon />}
          disabled={loading}
        >
          {loading ? 'Gönderiliyor...' : 'Rezervasyon Yap'}
        </Button>
      </form>
    </Box>
  );
};

export default ReservationForm; 