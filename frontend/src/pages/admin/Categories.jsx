import { useState, useCallback } from 'react';
import {
    Box,
    Button,
    IconButton,
    Typography,
    TextField,
    Container,
    TableContainer,
    Table,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Grid,
    CircularProgress,
    Alert,
    Slide
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragHandle as DragHandleIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';
import GenericFormDialog from './components/GenericFormDialog';

// Validasyon şeması
const CategorySchema = Yup.object().shape({
    name: Yup.string()
        .min(2, 'Kategori adı en az 2 karakter olmalıdır')
        .max(50, 'Kategori adı en fazla 50 karakter olabilir')
        .required('Kategori adı gereklidir'),
    description: Yup.string()
        .max(200, 'Açıklama en fazla 200 karakter olabilir')
});

const Categories = () => {
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Başarı mesajını göster ve 3 saniye sonra kaldır
    const showSuccessMessage = useCallback((message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    }, []);

    // Kategorileri getir
    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('api/categories');
            return response.data.data.sort((a, b) => a.order - b.order);
        },
        staleTime: 0,
        cacheTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
        refetchOnMount: true
    });

    // Kategori oluştur
    const createMutation = useMutation({
        mutationFn: (data) => api.post('api/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
            showSuccessMessage('Kategori başarıyla oluşturuldu');
            handleClose();
        },
        onError: (error) => {
            enqueueSnackbar(error.response?.data?.message || 'Bir hata oluştu', { variant: 'error' });
        }
    });

    // Kategori güncelle
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`api/categories/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
            showSuccessMessage('Kategori başarıyla güncellendi');
            handleClose();
        },
        onError: (error) => {
            enqueueSnackbar(error.response?.data?.message || 'Bir hata oluştu', { variant: 'error' });
        }
    });

    // Kategori sil
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`api/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
            showSuccessMessage('Kategori başarıyla silindi');
        },
        onError: (error) => {
            enqueueSnackbar(error.response?.data?.message || 'Bir hata oluştu', { variant: 'error' });
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
            enqueueSnackbar(error.response?.data?.error || 'Bir hata oluştu', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
            deleteMutation.mutate(id);
        }
    };

    // Sıralama güncelle
    const reorderMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.put('api/categories/reorder', { categories: data });
            return response.data;
        },
        onSuccess: () => {
            showSuccessMessage('Sıralama başarıyla güncellendi');
            queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
        },
        onError: (err) => {
            enqueueSnackbar('Sıralama güncellenirken bir hata oluştu', { variant: 'error' });
        }
    });

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(categories);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedOrder = items.map((item, index) => ({
            categoryId: item._id,
            order: index + 1
        }));

        reorderMutation.mutate(updatedOrder);
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
    }

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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h4">Kategoriler</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Yeni Kategori
                </Button>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="categories">
                    {(provided) => (
                        <TableContainer component={Paper} ref={provided.innerRef} {...provided.droppableProps}>
                            <Table>
                                <TableBody>
                                    {categories?.map((category, index) => (
                                        <Draggable
                                            key={category._id}
                                            draggableId={category._id.toString()}
                                            index={index}
                                        >
                                            {(provided) => (
                                                <TableRow
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                    <TableCell width={50} {...provided.dragHandleProps}>
                                                        <DragHandleIcon />
                                                    </TableCell>
                                                    <TableCell>{category.name}</TableCell>
                                                    <TableCell>{category.description}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            onClick={() => handleOpen(category)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => handleDelete(category._id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Droppable>
            </DragDropContext>

            <GenericFormDialog
                open={open}
                onClose={handleClose}
                title={editItem ? 'Kategori Düzenle' : 'Yeni Kategori'}
                maxWidth="sm"
            >
                <Formik
                    initialValues={{
                        name: editItem?.name || '',
                        description: editItem?.description || ''
                    }}
                    validationSchema={CategorySchema}
                    onSubmit={handleSubmit}
                >
                    {({ errors, touched, isSubmitting, handleSubmit }) => (
                        <Form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Field name="name">
                                        {({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="Kategori Adı"
                                                error={touched.name && Boolean(errors.name)}
                                                helperText={touched.name && errors.name}
                                            />
                                        )}
                                    </Field>
                                </Grid>
                                <Grid item xs={12}>
                                    <Field name="description">
                                        {({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="Açıklama"
                                                multiline
                                                rows={3}
                                                error={touched.description && Boolean(errors.description)}
                                                helperText={touched.description && errors.description}
                                            />
                                        )}
                                    </Field>
                                </Grid>
                            </Grid>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                                <Button onClick={handleClose} color="inherit">
                                    İptal
                                </Button>
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
                                        editItem ? 'Güncelle' : 'Oluştur'
                                    )}
                                </Button>
                            </Box>
                        </Form>
                    )}
                </Formik>
            </GenericFormDialog>
        </Container>
    );
};

export default Categories; 