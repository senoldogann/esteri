import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Switch,
  FormControlLabel,
  Container,
  Slide,
  Tabs,
  Tab,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  FormControl,
  AlertTitle
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { useSnackbar } from 'notistack';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Delete as DeleteIcon, Add as AddIcon, AutoFixHigh as AutoFixHighIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

// Validasyon şeması
const SiteSettingsSchema = Yup.object().shape({
  siteName: Yup.string()
    .min(2, 'Site adı en az 2 karakter olmalıdır')
    .max(100, 'Site adı en fazla 100 karakter olabilir')
    .required('Site adı gereklidir'),
  metaTitle: Yup.string(),
  metaDescription: Yup.string(),
  metaKeywords: Yup.string(),
  robotsTxt: Yup.string(),
  googleVerification: Yup.string(),
  bingVerification: Yup.string(),
  yandexVerification: Yup.string(),
  googleAnalyticsId: Yup.string()
    .matches(/^UA-\d{4,10}-\d{1,4}$|^G-[A-Z0-9]{10}$/, 'Geçerli bir Google Analytics ID giriniz'),
  logo: Yup.string(),
  favicon: Yup.string(),
  customCss: Yup.string(),
  customJs: Yup.string(),
  maintenanceMode: Yup.boolean(),
  maintenanceMessage: Yup.string().test(
    'maintenance-message-required',
    'Bakım modu açıkken mesaj gereklidir',
    function (value) {
      return !this.parent.maintenanceMode || (this.parent.maintenanceMode && value && value.length > 0);
    }
  ),
  socialMedia: Yup.object().shape({
    ogTitle: Yup.string(),
    ogDescription: Yup.string(),
    ogImage: Yup.string(),
    twitterTitle: Yup.string(),
    twitterDescription: Yup.string(),
    twitterImage: Yup.string(),
    twitterCardType: Yup.string().oneOf(['summary', 'summary_large_image', 'app', 'player'])
  }),
  structuredData: Yup.object().shape({
    organization: Yup.string(),
    website: Yup.string(),
    breadcrumb: Yup.string()
  }),
  customMetaTags: Yup.string(),
  metaTags: Yup.string(),
});

// Tab Panel bileşeni
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`site-settings-tabpanel-${index}`}
      aria-labelledby={`site-settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SiteSettings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Başarı mesajını göster ve 3 saniye sonra kaldır
  const showSuccessMessage = useCallback((message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  // Site ayarlarını getir
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const response = await api.get('api/site-settings');
      console.log('Mevcut site ayarları:', response.data.data);
      return response.data.data;
    }
  });

  // Site ayarlarını güncelle
  const { mutate: updateSettings, isLoading: isUpdating } = useMutation({
    mutationFn: async (data) => {
      console.log('Güncellenecek veriler:', data);
      const response = await api.put('/api/site-settings', data);
      console.log('Güncelleme yanıtı:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Güncelleme başarılı:', data);
      showSuccessMessage('Site ayarları başarıyla güncellendi');
      queryClient.invalidateQueries(['siteSettings']);
      queryClient.invalidateQueries(['publicSiteSettings']);
      queryClient.invalidateQueries(['activities'], { refetchType: 'all' });
    },
    onError: (error) => {
      console.error('Güncelleme hatası:', error);
      enqueueSnackbar(error.response?.data?.error || 'Bir hata oluştu', { variant: 'error' });
    }
  });

  // Meta tag'leri HTML'e uygula
  const applyMetaTags = (metaTags) => {
    try {
      // Meta tag string'ini DOM elementlerine çevir
      const parser = new DOMParser();
      const doc = parser.parseFromString(metaTags, 'text/html');
      const tags = doc.head.children;

      // Mevcut meta tag'leri temizle
      const existingTags = document.head.querySelectorAll('meta');
      existingTags.forEach(tag => {
        if (tag.getAttribute('name') || tag.getAttribute('property')) {
          tag.remove();
        }
      });

      // Yeni meta tag'leri ekle
      Array.from(tags).forEach(tag => {
        if (tag.tagName.toLowerCase() === 'meta') {
          document.head.appendChild(tag.cloneNode(true));
        }
      });

      return true;
    } catch (error) {
      console.error('Meta tag uygulama hatası:', error);
      return false;
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log('Form gönderiliyor:', values);
      const data = {
        ...values,
        maintenanceMode: values.maintenanceMode === 'true' || values.maintenanceMode === true,
        // Logo URL'sini düzgün şekilde gönder
        logo: values.logo || null
      };

      // Meta tag'leri doğrula ve temizle
      if (values.customMetaTags) {
        try {
          // Meta tag'leri parse et
          const parser = new DOMParser();
          const doc = parser.parseFromString(values.customMetaTags, 'text/html');
          const metaTags = doc.querySelectorAll('meta');
          
          // Meta tag'leri backend'in beklediği formata dönüştür
          const formattedMetaTags = Array.from(metaTags).map(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');
            return { name, content };
          }).filter(tag => tag.name && tag.content);

          // Formatlı meta tag'leri data objesine ekle
          data.customMetaTags = formattedMetaTags;
        } catch (error) {
          console.error('Meta tag parse hatası:', error);
          enqueueSnackbar('Meta tag\'ler geçerli formatta değil', { variant: 'error' });
          return;
        }
      }

      // Logo ve favicon URL'lerini düzenle
      if (data.logo && !data.logo.startsWith('http')) {
        data.logo = `${import.meta.env.VITE_API_URL}/${data.logo}`;
      }
      if (data.favicon && !data.favicon.startsWith('http')) {
        data.favicon = `${import.meta.env.VITE_API_URL}/${data.favicon}`;
      }

      console.log('Düzenlenmiş veriler:', data);
      await updateSettings(data);
      
      // Başarı mesajı göster
      enqueueSnackbar('Site ayarları başarıyla güncellendi', { variant: 'success' });
      
      // Cache'i güncelle
      await queryClient.invalidateQueries(['siteSettings']);
      await queryClient.invalidateQueries(['publicSiteSettings']);

      // Meta tag'leri hemen uygula
      if (values.customMetaTags) {
        applyMetaTags(values.customMetaTags);
      }
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      enqueueSnackbar(error.response?.data?.error || 'Bir hata oluştu', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const generateSampleStructuredData = (siteName, siteUrl) => {
    const organization = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": siteName,
      "url": siteUrl,
      "logo": settings?.logo || "https://example.com/logo.png",
      "image": settings?.socialMedia?.ogImage || "https://example.com/restaurant-image.jpg",
      "description": settings?.metaDescription || "Puolanka'nın en iyi restoranı",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Mäkeläntie 2",
        "addressLocality": "Puolanka",
        "postalCode": "89200",
        "addressCountry": "FI"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "64.8683",
        "longitude": "27.6766"
      },
      "telephone": "+358 40 1234567",
      "servesCuisine": ["Fin Mutfağı", "Avrupa Mutfağı"],
      "priceRange": "€€",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "11:00",
          "closes": "22:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Saturday"],
          "opens": "12:00",
          "closes": "23:00"
        }
      ]
    };

    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteName,
      "url": siteUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Anasayfa",
          "item": siteUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Menü",
          "item": `${siteUrl}/menu`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Rezervasyon",
          "item": `${siteUrl}/reservation`
        }
      ]
    };

    return {
      organization: JSON.stringify(organization, null, 2),
      website: JSON.stringify(website, null, 2),
      breadcrumb: JSON.stringify(breadcrumb, null, 2)
    };
  };

  const generateSampleSocialMediaData = () => {
    return {
      ogImage: settings?.logo || "https://example.com/og-image.jpg",
      twitterImage: settings?.logo || "https://example.com/twitter-image.jpg",
      twitterCardType: "summary_large_image",
      facebookAppId: "",
      facebookPageUrl: "https://facebook.com/ravintola-esteri",
      instagramUsername: "ravintolaesteri",
      twitterUsername: "ravintolaesteri"
    };
  };

  const generateSampleCustomMetaTags = () => {
    const sampleTags = [
      {
        name: 'description',
        content: 'Esteri Restaurant - Finlandiya\'nın en iyi Türk ve Pizza restoranı. Taze malzemeler, özel tarifler ve unutulmaz lezzetler.'
      },
      {
        name: 'keywords',
        content: 'esteri, restaurant, türk mutfağı, pizza, kebap, helsinki, finlandiya, restoran, rezervasyon'
      },
      {
        property: 'og:title',
        content: 'Esteri Restaurant - Türk & Pizza Mutfağı'
      },
      {
        property: 'og:description',
        content: 'Geleneksel Türk lezzetleri ve İtalyan pizzaları bir arada. Özel soslar, taze malzemeler ve eşsiz ambiyans.'
      },
      {
        property: 'og:type',
        content: 'restaurant.restaurant'
      },
      {
        property: 'og:locale',
        content: 'tr_TR'
      },
      {
        property: 'og:locale:alternate',
        content: 'en_US'
      },
      {
        property: 'og:locale:alternate',
        content: 'fi_FI'
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        name: 'twitter:title',
        content: 'Esteri Restaurant - Türk & Pizza Mutfağı'
      },
      {
        name: 'twitter:description',
        content: 'Geleneksel Türk lezzetleri ve İtalyan pizzaları bir arada. Rezervasyon için hemen tıklayın!'
      },
      {
        name: 'robots',
        content: 'index, follow'
      },
      {
        name: 'googlebot',
        content: 'index, follow'
      },
      {
        name: 'revisit-after',
        content: '7 days'
      },
      {
        name: 'rating',
        content: 'safe for kids'
      },
      {
        name: 'geo.region',
        content: 'FI'
      },
      {
        name: 'geo.placename',
        content: 'Helsinki'
      }
    ];

    // Meta tag'leri string formatına çevir
    const metaTagString = sampleTags.map(tag => {
      if (tag.property) {
        return `<meta property="${tag.property}" content="${tag.content}" />`;
      }
      return `<meta name="${tag.name}" content="${tag.content}" />`;
    }).join('\n');

    return metaTagString;
  };

  const generateSampleSeoData = () => {
    return {
      metaTitle: "Ravintola Esteri - Puolanka'nın En İyi Türk Restoranı",
      metaDescription: "Puolanka'nın kalbinde geleneksel Türk ve Fin lezzetleri. Taze malzemeler, özenli servis ve unutulmaz bir yemek deneyimi için Ravintola Esteri'ye bekleriz.",
      metaKeywords: "ravintola esteri, puolanka restoran, türk mutfağı, fin mutfağı, kebap, pizza, lahmacun, pide, döner, kahvaltı, akşam yemeği, öğle yemeği, rezervasyon, catering",
      robotsTxt: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${window.location.origin}/sitemap.xml`,
      googleVerification: "google-site-verification-code",
      bingVerification: "bing-site-verification-code",
      yandexVerification: "yandex-site-verification-code"
    };
  };

  const handleLoadSampleData = (section, setFieldValue) => {
    const siteUrl = window.location.origin;
    const siteName = settings?.siteName || "Ravintola Esteri";

    switch (section) {
      case 'structuredData':
        const sampleStructuredData = generateSampleStructuredData(siteName, siteUrl);
        setFieldValue('structuredData.organization', sampleStructuredData.organization);
        setFieldValue('structuredData.website', sampleStructuredData.website);
        setFieldValue('structuredData.breadcrumb', sampleStructuredData.breadcrumb);
        showSuccessMessage('Örnek yapılandırılmış veri yüklendi');
        break;

      case 'socialMedia':
        const sampleSocialMedia = generateSampleSocialMediaData();
        setFieldValue('socialMedia', sampleSocialMedia);
        showSuccessMessage('Örnek sosyal medya verileri yüklendi');
        break;

      case 'customMetaTags':
        const sampleMetaTags = generateSampleCustomMetaTags();
        setFieldValue('customMetaTags', sampleMetaTags);
        showSuccessMessage('Örnek meta etiketleri yüklendi');
        break;

      case 'seo':
        const sampleSeoData = generateSampleSeoData();
        Object.keys(sampleSeoData).forEach(key => {
          setFieldValue(key, sampleSeoData[key]);
        });
        showSuccessMessage('Örnek SEO etiketleri yüklendi');
        break;

      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error.response?.data?.error || 'Bir hata oluştu'}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        {settings?.metaTitle && <title>{settings.metaTitle}</title>}
        {settings?.metaDescription && <meta name="description" content={settings.metaDescription} />}
        {settings?.metaKeywords && <meta name="keywords" content={settings.metaKeywords} />}
        {settings?.googleVerification && <meta name="google-site-verification" content={settings.googleVerification} />}
        {settings?.bingVerification && <meta name="msvalidate.01" content={settings.bingVerification} />}
        {settings?.yandexVerification && <meta name="yandex-verification" content={settings.yandexVerification} />}
        
        {/* Social Media Meta Tags */}
        {settings?.socialMedia?.ogTitle && <meta property="og:title" content={settings.socialMedia.ogTitle} />}
        {settings?.socialMedia?.ogDescription && <meta property="og:description" content={settings.socialMedia.ogDescription} />}
        {settings?.socialMedia?.ogImage && <meta property="og:image" content={settings.socialMedia.ogImage} />}
        {settings?.socialMedia?.twitterTitle && <meta name="twitter:title" content={settings.socialMedia.twitterTitle} />}
        {settings?.socialMedia?.twitterDescription && <meta name="twitter:description" content={settings.socialMedia.twitterDescription} />}
        {settings?.socialMedia?.twitterImage && <meta name="twitter:image" content={settings.socialMedia.twitterImage} />}
        {settings?.socialMedia?.twitterCardType && <meta name="twitter:card" content={settings.socialMedia.twitterCardType} />}

        {/* Custom Meta Tags */}
        {settings?.customMetaTags && Array.isArray(settings.customMetaTags) && 
          settings.customMetaTags.map((tag, index) => (
            tag.name && tag.content && 
            <meta 
              key={`${tag.name}-${index}`} 
              {...(tag.name.startsWith('og:') ? { property: tag.name } : { name: tag.name })}
              content={tag.content} 
            />
          ))
        }
      </Helmet>
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
      <Typography variant="h4" sx={{ mb: 4 }}>Site Ayarları</Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Genel" />
        <Tab label="SEO" />
        <Tab label="Sosyal Medya" />
        <Tab label="Gelişmiş" />
      </Tabs>

      <Card>
        <CardContent>
          <Formik
            initialValues={{
              siteName: settings?.siteName || '',
              metaTitle: settings?.metaTitle || '',
              metaDescription: settings?.metaDescription || '',
              metaKeywords: settings?.metaKeywords || '',
              robotsTxt: settings?.robotsTxt || '',
              googleVerification: settings?.googleVerification || '',
              bingVerification: settings?.bingVerification || '',
              yandexVerification: settings?.yandexVerification || '',
              googleAnalyticsId: settings?.googleAnalyticsId || '',
              logo: settings?.logo?.replace(`${import.meta.env.VITE_API_URL}/`, '') || '',
              favicon: settings?.favicon?.replace(`${import.meta.env.VITE_API_URL}/`, '') || '',
              customCss: settings?.customCss || '',
              customJs: settings?.customJs || '',
              maintenanceMode: settings?.maintenanceMode || false,
              maintenanceMessage: settings?.maintenanceMessage || '',
              socialMedia: settings?.socialMedia || {
                ogTitle: '',
                ogDescription: '',
                ogImage: '',
                twitterTitle: '',
                twitterDescription: '',
                twitterImage: '',
                twitterCardType: 'summary_large_image'
              },
              structuredData: settings?.structuredData || {
                organization: '{}',
                website: '{}',
                breadcrumb: '{}'
              },
              customMetaTags: typeof settings?.customMetaTags === 'string' 
                ? settings.customMetaTags 
                : Array.isArray(settings?.customMetaTags) 
                  ? settings.customMetaTags.map(tag => {
                      if (tag.property) {
                        return `<meta property="${tag.property}" content="${tag.content}" />`;
                      }
                      return `<meta name="${tag.name}" content="${tag.content}" />`;
                    }).join('\n')
                  : '',
              metaTags: typeof settings?.metaTags === 'string'
                ? settings.metaTags
                : Array.isArray(settings?.metaTags)
                  ? settings.metaTags.map(tag => {
                      if (tag.property) {
                        return `<meta property="${tag.property}" content="${tag.content}" />`;
                      }
                      return `<meta name="${tag.name}" content="${tag.content}" />`;
                    }).join('\n')
                  : '',
            }}
            validationSchema={SiteSettingsSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, values, setFieldValue }) => (
              <Form>
                <TabPanel value={activeTab} index={0}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Site Adı"
                        name="siteName"
                        value={values.siteName}
                        onChange={(e) => setFieldValue('siteName', e.target.value)}
                        required
                        error={touched.siteName && Boolean(errors.siteName)}
                        helperText={touched.siteName && errors.siteName}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Logo URL"
                        name="logo"
                        value={values.logo}
                        onChange={(e) => setFieldValue('logo', e.target.value)}
                        helperText="Logo URL boş bırakılırsa site adı gösterilecektir"
                        sx={{ mb: 2 }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Field name="googleAnalyticsId">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Google Analytics ID"
                            error={touched.googleAnalyticsId && Boolean(errors.googleAnalyticsId)}
                            helperText={touched.googleAnalyticsId && errors.googleAnalyticsId}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Field name="favicon">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Favicon URL"
                            error={touched.favicon && Boolean(errors.favicon)}
                            helperText={(touched.favicon && errors.favicon) || "Favicon için URL girin (örn: uploads/favicon.ico)"}
                          />
                        )}
                      </Field>
                      {settings?.favicon && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption">Mevcut Favicon:</Typography>
                          <Box component="img" src={settings.favicon} alt="Favicon" sx={{ maxHeight: 32, mt: 1 }} />
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="maintenanceMode">
                        {({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                {...field}
                                checked={field.value}
                              />
                            }
                            label="Bakım Modu"
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="maintenanceMessage">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Bakım Modu Mesajı"
                            multiline
                            rows={2}
                            error={touched.maintenanceMessage && Boolean(errors.maintenanceMessage)}
                            helperText={touched.maintenanceMessage && errors.maintenanceMessage}
                            disabled={!values.maintenanceMode}
                          />
                        )}
                      </Field>
                    </Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">SEO Ayarları</Typography>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleLoadSampleData('seo', setFieldValue)}
                        >
                          Örnek SEO Etiketleri Yükle
                        </Button>
                      </Box>
                      <Alert severity="info" sx={{ mb: 3 }}>
                        <AlertTitle>SEO Önerileri</AlertTitle>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          <li>Meta başlık 50-60 karakter arasında olmalıdır</li>
                          <li>Meta açıklama 150-160 karakter arasında olmalıdır</li>
                          <li>Anahtar kelimeler alakalı ve doğal olmalıdır</li>
                        </ul>
                      </Alert>
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="metaTitle">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Meta Title"
                            error={touched.metaTitle && Boolean(errors.metaTitle)}
                            helperText={touched.metaTitle && errors.metaTitle}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="metaDescription">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Meta Description"
                            multiline
                            rows={3}
                            error={touched.metaDescription && Boolean(errors.metaDescription)}
                            helperText={touched.metaDescription && errors.metaDescription}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="metaKeywords">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Meta Keywords"
                            multiline
                            rows={2}
                            error={touched.metaKeywords && Boolean(errors.metaKeywords)}
                            helperText="Anahtar kelimeleri virgülle ayırın"
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="robotsTxt">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Robots.txt İçeriği"
                            multiline
                            rows={4}
                            error={touched.robotsTxt && Boolean(errors.robotsTxt)}
                            helperText={touched.robotsTxt && errors.robotsTxt}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Field name="googleVerification">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Google Site Doğrulama"
                            error={touched.googleVerification && Boolean(errors.googleVerification)}
                            helperText={touched.googleVerification && errors.googleVerification}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Field name="bingVerification">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Bing Site Doğrulama"
                            error={touched.bingVerification && Boolean(errors.bingVerification)}
                            helperText={touched.bingVerification && errors.bingVerification}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Field name="yandexVerification">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Yandex Site Doğrulama"
                            error={touched.yandexVerification && Boolean(errors.yandexVerification)}
                            helperText={touched.yandexVerification && errors.yandexVerification}
                          />
                        )}
                      </Field>
                    </Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Sosyal Medya Meta Etiketleri
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Bu ayarlar, siteniz sosyal medyada paylaşıldığında nasıl görüneceğini belirler.
                      </Typography>
                    </Grid>

                    {/* Facebook (Open Graph) Ayarları */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
                        Facebook ve Diğer Platformlar (Open Graph)
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Field name="socialMedia.ogTitle">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="OG Başlık"
                            placeholder="Esteri Restaurant - Lezzetin Adresi"
                            helperText="Facebook ve diğer platformlarda görünecek başlık"
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Field name="socialMedia.ogImage">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="OG Görsel URL"
                            placeholder="https://esteri.fi/images/og-image.jpg"
                            helperText="En az 1200x630 piksel boyutunda bir görsel URL'si"
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="socialMedia.ogDescription">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            rows={2}
                            label="OG Açıklama"
                            placeholder="Helsinki'nin kalbinde geleneksel Türk lezzetleri..."
                            helperText="Facebook ve diğer platformlarda görünecek açıklama (50-160 karakter)"
                          />
                        )}
                      </Field>
                    </Grid>

                    {/* Twitter Card Ayarları */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
                        Twitter Card Ayarları
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Field name="socialMedia.twitterTitle">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Twitter Başlık"
                            placeholder="Esteri Restaurant"
                            helperText="Twitter'da görünecek başlık"
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Field name="socialMedia.twitterCardType">
                        {({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            label="Twitter Kart Tipi"
                            helperText="Paylaşımın Twitter'da nasıl görüneceğini belirler"
                          >
                            <MenuItem value="summary">Özet (Küçük Görsel)</MenuItem>
                            <MenuItem value="summary_large_image">Büyük Görsel</MenuItem>
                            <MenuItem value="app">Uygulama</MenuItem>
                            <MenuItem value="player">Video Oynatıcı</MenuItem>
                          </TextField>
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Field name="socialMedia.twitterImage">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Twitter Görsel URL"
                            placeholder="https://esteri.fi/images/twitter-image.jpg"
                            helperText="Twitter için özel görsel URL'si (Büyük görsel için: 1200x600px)"
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="socialMedia.twitterDescription">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            rows={2}
                            label="Twitter Açıklama"
                            placeholder="Helsinki'nin en lezzetli Türk restoranı..."
                            helperText="Twitter'da görünecek açıklama (maksimum 200 karakter)"
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          const defaultSocialMedia = {
                            ogTitle: "Esteri Restaurant - Lezzetin ve Kalitenin Buluşma Noktası",
                            ogDescription: "Helsinki'nin kalbinde geleneksel Türk lezzetleri ile hizmetinizdeyiz. Pizza, kebap ve daha fazlası...",
                            ogImage: "https://esteri.fi/images/og-default.jpg",
                            twitterTitle: "Esteri Restaurant",
                            twitterDescription: "Helsinki'nin en lezzetli Türk restoranı. Geleneksel lezzetler modern sunumla buluşuyor.",
                            twitterImage: "https://esteri.fi/images/twitter-default.jpg",
                            twitterCardType: "summary_large_image"
                          };

                          setFieldValue('socialMedia', defaultSocialMedia);
                        }}
                        sx={{ mt: 2 }}
                      >
                        Örnek Meta Etiketlerini Yükle
                      </Button>
                    </Grid>

                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <AlertTitle>Önerilen Görsel Boyutları</AlertTitle>
                        <strong>Facebook (OG):</strong>
                        <ul>
                          <li>Minimum boyut: 1200 x 630 piksel</li>
                          <li>En boy oranı: 1.91:1</li>
                        </ul>
                        <strong>Twitter:</strong>
                        <ul>
                          <li>Büyük görsel: 1200 x 600 piksel</li>
                          <li>Özet görsel: 240 x 240 piksel</li>
                        </ul>
                      </Alert>
                    </Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Özel Meta Tag'ler
                      </Typography>
                      <Field name="customMetaTags">
                        {({ field, form }) => (
                          <TextField
                            {...field}
                            label="Meta Tag'ler"
                            multiline
                            rows={10}
                            fullWidth
                            value={typeof field.value === 'string' ? field.value : ''}
                            onChange={(e) => form.setFieldValue('customMetaTags', e.target.value)}
                            sx={{ mb: 2 }}
                            helperText="Meta tag'leri HTML formatında girin. Örnek: <meta name='description' content='Site açıklaması' />"
                          />
                        )}
                      </Field>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          const sampleTags = generateSampleCustomMetaTags();
                          setFieldValue('customMetaTags', sampleTags);
                          toast.success('Örnek meta tag\'ler oluşturuldu!');
                        }}
                        startIcon={<AutoFixHighIcon />}
                        sx={{ mb: 2 }}
                      >
                        Örnek Meta Tag Yükle
                      </Button>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <AlertTitle>Meta Tag Önerileri</AlertTitle>
                        <ul>
                          <li>Description meta tag'i 150-160 karakter arasında olmalıdır</li>
                          <li>Keywords meta tag'i alakalı ve doğal anahtar kelimeler içermelidir</li>
                          <li>Sosyal medya meta tag'leri paylaşımlarınızın daha iyi görünmesini sağlar</li>
                          <li>Dil ve bölge meta tag'leri sitenizin hedef kitlesini belirtir</li>
                        </ul>
                      </Alert>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                        Yapılandırılmış Veri (Structured Data)
                      </Typography>
                      <Field name="structuredData.organization">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Organization Schema"
                            multiline
                            rows={4}
                            error={touched.structuredData?.organization && Boolean(errors.structuredData?.organization)}
                            helperText={touched.structuredData?.organization && errors.structuredData?.organization}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="structuredData.website">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Website Schema"
                            multiline
                            rows={4}
                            error={touched.structuredData?.website && Boolean(errors.structuredData?.website)}
                            helperText={touched.structuredData?.website && errors.structuredData?.website}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="structuredData.breadcrumb">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Breadcrumb Schema"
                            multiline
                            rows={4}
                            error={touched.structuredData?.breadcrumb && Boolean(errors.structuredData?.breadcrumb)}
                            helperText={touched.structuredData?.breadcrumb && errors.structuredData?.breadcrumb}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleLoadSampleData('structuredData', setFieldValue)}
                        sx={{ mb: 2 }}
                      >
                        Örnek Yapılandırılmış Veri Yükle
                      </Button>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <AlertTitle>Bilgi</AlertTitle>
                        Bu bölümde sitenizin arama motorlarında daha iyi görünmesi için gerekli yapılandırılmış verileri düzenleyebilirsiniz.
                        Örnek veriyi yükledikten sonra kendi ihtiyaçlarınıza göre düzenleyebilirsiniz.
                      </Alert>
                    </Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={4}>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Meta Tag Ayarları
                    </Typography>
                    <Field name="metaTags">
                      {({ field, form }) => (
                        <TextField
                          {...field}
                          label="Meta Tags"
                          multiline
                          rows={10}
                          fullWidth
                          value={typeof field.value === 'string' ? field.value : ''}
                          onChange={(e) => form.setFieldValue('metaTags', e.target.value)}
                          sx={{ mb: 2 }}
                          helperText="Meta tag'leri HTML formatında girin"
                        />
                      )}
                    </Field>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        const sampleTags = generateSampleCustomMetaTags();
                        setFieldValue('metaTags', sampleTags);
                        toast.success('Örnek meta tag\'ler oluşturuldu!');
                      }}
                      startIcon={<AutoFixHighIcon />}
                      sx={{ mb: 2 }}
                    >
                      Örnek Meta Tag Yükle
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Not: Meta tag'ler sitenizin SEO performansını ve sosyal medya paylaşımlarını etkiler.
                    </Typography>
                  </Box>
                </TabPanel>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    sx={{ minWidth: 200 }}
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Kaydet'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SiteSettings; 