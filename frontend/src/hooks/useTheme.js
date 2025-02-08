import { useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

export const useTheme = () => {
    const [mode, setMode] = useState('light');

    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: '#2196f3',
            },
            secondary: {
                main: '#f50057',
            },
        },
        typography: {
            fontFamily: "'Poppins', sans-serif",
            h1: {
                fontWeight: 600,
            },
            h2: {
                fontWeight: 600,
            },
            h3: {
                fontWeight: 600,
            },
            h4: {
                fontWeight: 600,
            },
            h5: {
                fontWeight: 600,
            },
            h6: {
                fontWeight: 600,
            },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 500,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: '#fff',
                        color: '#000',
                    },
                },
            },
        },
    });

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    return { theme, mode, toggleTheme };
};

export default useTheme; 