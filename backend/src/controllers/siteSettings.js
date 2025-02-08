const SiteSettings = require('../models/SiteSettings');
const { clearCache } = require('../middleware/cache');
const { createActivity } = require('./activityController');

// Site ayarlarını getir
exports.getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    
    // Eğer ayarlar yoksa, varsayılan ayarları oluştur
    if (!settings) {
      settings = await SiteSettings.create({
        siteName: 'Esteri',
        metaTitle: 'Esteri Restaurant',
        metaDescription: 'Esteri Restaurant - Lezzetin ve Kalitenin Buluşma Noktası',
        metaKeywords: 'restaurant, pizza, kebap, yemek, finlandiya',
        maintenanceMode: false,
        maintenanceMessage: 'Site bakımda. Lütfen daha sonra tekrar deneyin.',
        socialMedia: {
          ogTitle: 'Esteri Restaurant',
          ogDescription: 'Lezzetin ve Kalitenin Buluşma Noktası',
          twitterCardType: 'summary_large_image'
        },
        structuredData: {
          organization: '{}',
          website: '{}',
          breadcrumb: '{}'
        }
      });
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Site ayarlarını güncelle
exports.updateSiteSettings = async (req, res) => {
  try {
    const {
      siteName,
      logo,
      favicon,
      metaTitle,
      metaDescription,
      metaKeywords,
      robotsTxt,
      googleVerification,
      bingVerification,
      yandexVerification,
      customMetaTags,
      socialMedia,
      structuredData,
      googleAnalyticsId,
      customCss,
      customJs,
      maintenanceMode,
      maintenanceMessage
    } = req.body;

    let settings = await SiteSettings.findOne();
    
    if (!settings) {
      settings = new SiteSettings({});
    }

    // Temel alanları güncelle
    if (siteName) settings.siteName = siteName;
    // Logo alanını güncelle (logo undefined, null veya boş string olabilir)
    settings.logo = logo;
    if (favicon) settings.favicon = favicon;
    if (metaTitle) settings.metaTitle = metaTitle;
    if (metaDescription) settings.metaDescription = metaDescription;
    if (metaKeywords) settings.metaKeywords = metaKeywords;
    if (robotsTxt) settings.robotsTxt = robotsTxt;
    if (googleVerification) settings.googleVerification = googleVerification;
    if (bingVerification) settings.bingVerification = bingVerification;
    if (yandexVerification) settings.yandexVerification = yandexVerification;
    if (customMetaTags) {
      // customMetaTags'in array olduğundan emin ol
      if (Array.isArray(customMetaTags)) {
        // Her bir meta tag'in geçerli olduğunu kontrol et
        const validMetaTags = customMetaTags.filter(tag => 
          tag && 
          typeof tag === 'object' && 
          tag.name && 
          tag.content && 
          typeof tag.name === 'string' && 
          typeof tag.content === 'string'
        );
        settings.customMetaTags = validMetaTags;
      } else {
        console.warn('Invalid customMetaTags format:', customMetaTags);
      }
    }
    if (googleAnalyticsId) settings.googleAnalyticsId = googleAnalyticsId;
    if (customCss) settings.customCss = customCss;
    if (customJs) settings.customJs = customJs;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (maintenanceMessage) settings.maintenanceMessage = maintenanceMessage;

    // Social Media alanlarını güncelle
    if (socialMedia) {
      settings.socialMedia = {
        ...settings.socialMedia,
        ...socialMedia
      };
    }

    // Structured Data alanlarını güncelle
    if (structuredData) {
      settings.structuredData = {
        ...settings.structuredData,
        ...structuredData
      };
    }

    await settings.save();
    await clearCache('cache:*'); // Tüm cache'i temizle

    // Aktivite kaydı oluştur
    await createActivity({
      type: 'update',
      module: 'site-settings',
      description: 'Site ayarları güncellendi',
      user: req.user?.name || 'Admin'
    });
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Site ayarları güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Site ayarları güncellenirken bir hata oluştu'
    });
  }
}; 