import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './pages/admin/components/AdminLayout';
import ProtectedRoute from './pages/admin/components/ProtectedRoute';
import Home from './pages/public/Home';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import HeaderMenu from './pages/admin/HeaderMenu';
import HeroSection from './pages/admin/HeroSection';
import ImportantNotes from './pages/admin/ImportantNotes';
import Footer from './pages/admin/Footer';
import SiteSettings from './pages/admin/SiteSettings';
import { ThemeProvider, CssBaseline, createTheme, useMediaQuery } from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { ColorModeContext } from './contexts/ColorModeContext';
import ProductDetail from './pages/public/ProductDetail';
import { HelmetProvider } from 'react-helmet-async';
import { createBrowserRouter, RouterProvider, createRoutesFromElements } from 'react-router-dom';
import Reservations from './pages/admin/Reservations';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  // Sistem temasını algıla
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // Local storage'dan tema tercihini al veya sistem temasını kullan
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    const pathname = window.location.pathname;
    // Admin paneli için her zaman light mode
    if (pathname.startsWith('/admin')) {
      return 'light';
    }
    return savedMode || (prefersDarkMode ? 'dark' : 'light');
  });

  // Sistem teması değiştiğinde otomatik güncelle
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    const pathname = window.location.pathname;
    // Admin paneli için her zaman light mode
    if (pathname.startsWith('/admin')) {
      setMode('light');
      return;
    }
    if (!savedMode) {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode, window.location.pathname]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const pathname = window.location.pathname;
          // Admin panelinde tema değişikliğini engelle
          if (pathname.startsWith('/admin')) {
            return 'light';
          }
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode
                primary: {
                  main: '#ECBC4B',
                  dark: '#d4a73d',
                  light: '#f3cc6d'
                },
                background: {
                  default: '#f5f5f5',
                  paper: '#ffffff',
                  category: '#f9f9fa'
                },
                text: {
                  primary: '#000000',
                  secondary: '#000000',
                  categoryTitle: '#000000',
                  description: '#000000'
                },
                divider: 'rgba(0, 0, 0, 0.12)',
                icon: {
                  main: '#ECBC4B'
                }
              }
            : {
                // Dark mode
                primary: {
                  main: '#372e3c',
                  light: '#443a4a',
                  dark: '#2a232e'
                },
                background: {
                  default: '#0f0f1a',
                  paper: '#1b1b26',
                  category: '#1b1b26'
                },
                text: {
                  primary: '#ffffff',
                  secondary: '#b6b6ba',
                  categoryTitle: '#ECBC4B',
                  description: '#b6b6ba',
                 
                },
                divider: 'rgba(255, 255, 255, 0.12)',
                icon: {
                  main: '#ffffff'
                }
              }),
        },
        typography: {
          fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
          allVariants: {
            color: mode === 'light' ? '#000000' : '#ffffff',
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
          },
          h1: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
            fontWeight: 600
          },
          h2: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
            fontWeight: 600
          },
          h3: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
            fontWeight: 600
          },
          h4: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
            fontWeight: 600
          },
          h5: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
            fontWeight: 600
          },
          h6: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
            fontWeight: 600
          },
          subtitle1: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
            fontWeight: 500
          },
          subtitle2: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
            fontWeight: 500
          },
          body1: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
          },
          body2: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
          },
          button: {
            fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
            fontWeight: 500
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
                background: '#ffffff',
                color: '#1a1a1a',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  background: mode === 'light'
                    ? 'linear-gradient(45deg, #d4a73d 30%, #ECBC4B 90%)'
                    : 'linear-gradient(45deg, #d4a73d 30%, #d4a73d 90%)',
                  transform: 'translateY(-2px)',
                  boxShadow: mode === 'light'
                    ? '0 4px 20px rgba(236, 188, 75, 0.25)'
                    : '0 4px 20px rgba(55, 46, 60, 0.25)',
                  color: '#1a1a1a'
                },
                '&.Mui-selected': {
                  color: mode === 'dark' ? '#ffffff !important' : '#1a1a1a',
                  backgroundColor: mode === 'dark' ? '#1e1e2d !important' : '#ffffff'
                },
                '&.active': {
                  color: mode === 'dark' ? '#ffffff !important' : '#1a1a1a',
                  backgroundColor: mode === 'dark' ? '#1e1e2d !important' : '#ffffff'
                },
                '&[aria-current="page"]': {
                  color: mode === 'dark' ? '#ffffff !important' : '#1a1a1a',
                  backgroundColor: mode === 'dark' ? '#1e1e2d !important' : '#ffffff'
                }
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#ECBC4B' : '#ffffff',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1)',
                  color: mode === 'light' ? '#d4a73d' : '#ffffff',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? '#ffffff' : '#372e3c',
                color: mode === 'light' ? '#000000' : '#ffffff',
                transition: 'all 0.3s ease-in-out',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? '#f5f5f5' : '#1b1b26',
                color: mode === 'light' ? '#000000' : '#ffffff',
                transition: 'all 0.3s ease-in-out',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#000000' : '#ffffff',
                transition: 'all 0.3s ease-in-out',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#000000' : '#ffffff',
                '& .MuiTypography-root': {
                  color: mode === 'light' ? '#000000' : '#ffffff'
                }
              },
              head: {
                color: mode === 'light' ? '#000000' : '#ffffff',
                fontWeight: 600
              },
              body: {
                color: mode === 'light' ? '#000000' : '#ffffff'
              }
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? '#f5f5f5' : '#2a232e',
              },
            },
          },
          MuiTypography: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#000000' : '#ffffff',
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#666666' : '#ffffff',
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#000000' : '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="header-menu" element={<HeaderMenu />} />
          <Route path="hero-section" element={<HeroSection />} />
          <Route path="important-notes" element={<ImportantNotes />} />
          <Route path="footer" element={<Footer />} />
          <Route path="site-settings" element={<SiteSettings />} />
          <Route path="reservations" element={<Reservations />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </>
    ),
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    }
  );

  return (
    <HelmetProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <RouterProvider router={router} />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={mode}
          />
        </ThemeProvider>
      </ColorModeContext.Provider>
    </HelmetProvider>
  );
};

export default App;
