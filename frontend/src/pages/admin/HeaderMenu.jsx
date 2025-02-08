import { useState, useCallback } from 'react';
import {
    Box,
    Button,
    Card,
    IconButton,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Container,
    Paper,
    Grid,
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    CircularProgress,
    Alert,
    Slide
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../../utils/api';
import GenericFormDialog from './components/GenericFormDialog';

const HeaderMenu = () => {
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        link: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Başarı mesajını göster ve 3 saniye sonra kaldır
    const showSuccessMessage = useCallback((message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    }, []);

    // Menü öğelerini getir
    const { data: menuItems, isLoading } = useQuery({
        queryKey: ['headerMenu'],
        queryFn: async () => {
            const response = await api.get('api/header-menu');
            return response.data.data;
        }
    });

    // Menü öğesi oluştur
    const createMutation = useMutation({
        mutationFn: (data) => api.post('api/header-menu', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['headerMenu']);
            showSuccessMessage('Menü öğesi başarıyla oluşturuldu');
            handleClose();
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Bir hata oluştu';
            enqueueSnackbar(message, { variant: 'error' });
        }
    });

    // Menü öğesi güncelle
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`api/header-menu/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['headerMenu']);
            showSuccessMessage('Menü öğesi başarıyla güncellendi');
            handleClose();
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Bir hata oluştu';
            enqueueSnackbar(message, { variant: 'error' });
        }
    });

    // Menü öğesi sil
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`api/header-menu/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['headerMenu']);
            showSuccessMessage('Menü öğesi başarıyla silindi');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Bir hata oluştu';
            enqueueSnackbar(message, { variant: 'error' });
        }
    });

    // Sıralama güncelle
    const reorderMutation = useMutation({
        mutationFn: (data) => api.put('api/header-menu/reorder', { items: data }),
        onSuccess: () => {
            queryClient.invalidateQueries(['headerMenu']);
            showSuccessMessage('Sıralama başarıyla güncellendi');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Bir hata oluştu';
            enqueueSnackbar(message, { variant: 'error' });
        }
    });

    const handleOpen = (item = null) => {
        if (item) {
            setEditItem(item);
            setFormData({
                name: item.name,
                link: item.link
            });
        } else {
            setEditItem(null);
            setFormData({
                name: '',
                link: ''
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditItem(null);
        setFormData({
            name: '',
            link: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editItem) {
            updateMutation.mutate({ id: editItem._id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Bu menü öğesini silmek istediğinizden emin misiniz?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(menuItems);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedOrder = items.map((item, index) => ({
            id: item._id,
            order: index + 1
        }));

        reorderMutation.mutate(updatedOrder);
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Başarı mesajı */}
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
                <Typography variant="h4">Header Menü</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Yeni Menü Öğesi
                </Button>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="menu-items">
                    {(provided) => (
                        <TableContainer component={Paper} ref={provided.innerRef} {...provided.droppableProps}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={50}></TableCell>
                                        <TableCell>Menü Adı</TableCell>
                                        <TableCell>Link</TableCell>
                                        <TableCell align="right">İşlemler</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {menuItems?.map((item, index) => (
                                        <Draggable
                                            key={item._id}
                                            draggableId={item._id}
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
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell>{item.link}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            onClick={() => handleOpen(item)}
                                                            size="small"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => handleDelete(item._id)}
                                                            size="small"
                                                            color="error"
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
                title={editItem ? 'Menü Öğesi Düzenle' : 'Yeni Menü Öğesi Ekle'}
                maxWidth="sm"
            >
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Menü Adı"
                                name="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Link"
                                name="link"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                required
                                helperText="Örnek: /hakkimizda veya https://example.com"
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                        <Button onClick={handleClose} color="inherit">
                            İptal
                        </Button>
                        <Button 
                            type="submit"
                            variant="contained"
                            disabled={createMutation.isLoading || updateMutation.isLoading}
                        >
                            {createMutation.isLoading || updateMutation.isLoading ? (
                                <>
                                    <CircularProgress size={24} sx={{ mr: 1 }} />
                                    Kaydediliyor...
                                </>
                            ) : (
                                editItem ? 'Güncelle' : 'Oluştur'
                            )}
                        </Button>
                    </Box>
                </form>
            </GenericFormDialog>
        </Container>
    );
};

export default HeaderMenu; 