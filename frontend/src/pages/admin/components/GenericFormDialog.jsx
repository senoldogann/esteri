import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const GenericFormDialog = ({ 
    open, 
    onClose, 
    title,
    maxWidth = 'md',
    children
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    {title}
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {children}
            </DialogContent>
        </Dialog>
    );
};

export default GenericFormDialog; 