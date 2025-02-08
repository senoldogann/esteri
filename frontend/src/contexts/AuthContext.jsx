import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            const response = await api.get('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response?.data?.success && response?.data?.data) {
                setUser(response.data.data);
            } else {
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (err) {
            console.error('Auth check error:', err);
            localStorage.removeItem('token');
            setUser(null);
            setError(err.response?.data?.message || 'Oturum kontrolü başarısız');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async (credentials) => {
        try {
            setError(null);
            
            if (!credentials?.email || !credentials?.password) {
                throw new Error('Email ve şifre gerekli');
            }

            const response = await api.post('/api/auth/login', credentials);
            console.log('Login response:', response.data);

            if (response?.data?.success && response?.data?.data?.token) {
                const token = response.data.data.token;
                localStorage.setItem('token', token);

                // Kullanıcı bilgilerini al
                const userResponse = await api.get('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('User response details:', {
                    success: userResponse.data?.success,
                    hasData: !!userResponse.data?.data,
                    userData: userResponse.data?.data
                });

                if (userResponse.data?.success && userResponse.data?.data) {
                    setUser(userResponse.data.data);
                    return response.data;
                } else {
                    console.error('Invalid user response:', userResponse.data);
                    throw new Error('Kullanıcı bilgileri alınamadı');
                }
            } else {
                console.error('Invalid login response:', response.data);
                throw new Error('Giriş başarısız');
            }
        } catch (err) {
            console.error('Login error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            const errorMessage = err.response?.data?.message || err.message || 'Giriş yapılırken bir hata oluştu';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const logout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await api.post('/api/auth/logout', {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    const value = {
        user,
        login,
        logout,
        error,
        loading,
        isAuthenticated: !!user,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext; 