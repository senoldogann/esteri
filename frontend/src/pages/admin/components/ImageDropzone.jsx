import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import UploadIcon from '@mui/icons-material/Upload';

const ImageDropzone = ({ onDrop, currentImage, imageUrl }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        maxSize: 5242880, // 5MB
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles?.length > 0) {
                const file = acceptedFiles[0];
                // Dosya boyutunu kontrol et
                if (file.size > 5242880) {
                    console.error('Dosya boyutu çok büyük (max 5MB)');
                    return;
                }
                onDrop(file);
            }
        },
        onDropRejected: (rejectedFiles) => {
            console.error('Dosya reddedildi:', rejectedFiles);
        }
    });

    return (
        <>
            <Box
                {...getRootProps()}
                sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : '#ccc',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    mb: 2,
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                    }
                }}
            >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 40, mb: 1, color: isDragActive ? 'primary.main' : 'text.secondary' }} />
                <Typography color={isDragActive ? 'primary.main' : 'text.primary'}>
                    {isDragActive
                        ? 'Resmi buraya bırakın...'
                        : currentImage
                        ? `Seçilen dosya: ${currentImage.name}`
                        : 'Resim yüklemek için tıklayın veya sürükleyin (max 5MB)'}
                </Typography>
            </Box>
            {imageUrl && !currentImage && (
                <Box
                    component="img"
                    src={imageUrl}
                    alt="Mevcut resim"
                    sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        borderRadius: 1
                    }}
                />
            )}
        </>
    );
};

export default ImageDropzone; 