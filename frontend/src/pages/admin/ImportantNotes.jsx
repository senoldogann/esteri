import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Slide,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { useSnackbar } from 'notistack';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Validasyon şeması
const NoteSchema = Yup.object().shape({
  title: Yup.string()
    .min(2, 'Başlık en az 2 karakter olmalıdır')
    .max(100, 'Başlık en fazla 100 karakter olabilir')
    .required('Başlık gereklidir'),
  content: Yup.string()
    .min(2, 'İçerik en az 2 karakter olmalıdır')
    .max(500, 'İçerik en fazla 500 karakter olabilir')
    .required('İçerik gereklidir'),
  order: Yup.number()
    .min(0, 'Sıra 0\'dan küçük olamaz')
    .required('Sıra gereklidir')
});

const ImportantNotes = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  // Başarı mesajını göster ve 3 saniye sonra kaldır
  const showSuccessMessage = useCallback((message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  // Notları getir
  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['importantNotes'],
    queryFn: async () => {
      const response = await api.get('/api/important-notes');
      return response.data.data;
    }
  });

  // Not oluştur
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/important-notes', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['importantNotes']);
      queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
      showSuccessMessage('Not başarıyla oluşturuldu');
      handleClose();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Not oluşturulurken bir hata oluştu', { variant: 'error' });
    }
  });

  // Not güncelle
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/api/important-notes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['importantNotes']);
      queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
      showSuccessMessage('Not başarıyla güncellendi');
      handleClose();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Not güncellenirken bir hata oluştu', { variant: 'error' });
    }
  });

  // Not sil
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`api/important-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['importantNotes']);
      queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
      showSuccessMessage('Not başarıyla silindi');
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Not silinirken bir hata oluştu', { variant: 'error' });
    }
  });

  const handleOpen = (item = null) => {
    setEditItem(item);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem._id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
    } catch (error) {
      console.error('Form gönderme hatası:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <Typography>Yükleniyor...</Typography>;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {successMessage && (
        <Slide direction="down" in={Boolean(successMessage)} mountOnEnter unmountOnExit>
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              position: 'fixed',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              minWidth: 300,
              boxShadow: 3
            }}
          >
            {successMessage}
          </Alert>
        </Slide>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">Önemli Notlar Yönetimi</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Yeni Not Ekle
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 440, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={100}>Sıra</TableCell>
              <TableCell width={200}>Başlık</TableCell>
              <TableCell>İçerik</TableCell>
              <TableCell width={120} align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notes?.map((note) => (
              <TableRow key={note._id}>
                <TableCell>{note.order}</TableCell>
                <TableCell>{note.title}</TableCell>
                <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {note.content}
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpen(note)} color="primary" size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(note._id)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <Formik
          initialValues={{
            title: editItem?.title || '',
            content: editItem?.content || '',
            order: editItem?.order || 0
          }}
          validationSchema={NoteSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogTitle>
                {editItem ? 'Notu Düzenle' : 'Yeni Not Ekle'}
              </DialogTitle>
              <DialogContent>
                <Field name="title">
                  {({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Başlık"
                      margin="normal"
                      error={touched.title && Boolean(errors.title)}
                      helperText={touched.title && errors.title}
                    />
                  )}
                </Field>
                <Field name="content">
                  {({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="İçerik"
                      margin="normal"
                      multiline
                      rows={4}
                      error={touched.content && Boolean(errors.content)}
                      helperText={touched.content && errors.content}
                    />
                  )}
                </Field>
                <Field name="order">
                  {({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Sıra"
                      margin="normal"
                      error={touched.order && Boolean(errors.order)}
                      helperText={touched.order && errors.order}
                    />
                  )}
                </Field>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>İptal</Button>
                <Button 
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Kaydediliyor...
                    </>
                  ) : (
                    editItem ? 'Güncelle' : 'Ekle'
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Container>
  );
};

export default ImportantNotes; 