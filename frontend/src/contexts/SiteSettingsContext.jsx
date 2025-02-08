import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

const SiteSettingsContext = createContext();

const defaultSettings = {
    logo: '/default-logo.png',
    darkModeLogo: '/default-logo.png',
    favicon: '/favicon.ico',
    title: 'Yükleniyor...'
};

export const SiteSettingsProvider = ({ children }) => {
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const response = await api.get('api/site-settings');
            return response.data.data;
        }
    });

    const value = {
        settings: isLoading ? defaultSettings : settings,
        isLoading
    };

    return (
        <SiteSettingsContext.Provider value={value}>
            {children}
        </SiteSettingsContext.Provider>
    );
};

export const useSiteSettings = () => {
    const context = useContext(SiteSettingsContext);
    if (!context) {
        throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
    }
    return context;
}; 