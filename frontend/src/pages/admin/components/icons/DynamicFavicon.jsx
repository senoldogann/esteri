import { useEffect } from 'react';
import { useSiteSettings } from '../../../../contexts/SiteSettingsContext';

const DynamicFavicon = () => {
  const settings = useSiteSettings();

  useEffect(() => {
    if (settings && settings.favicon) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      link.href = settings.favicon;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [settings?.favicon]);

  return null;
};

export default DynamicFavicon; 