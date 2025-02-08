const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    required: [true, 'Site adı gereklidir'],
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  favicon: {
    type: String,
    trim: true
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  metaKeywords: {
    type: String,
    trim: true
  },
  // SEO Alanları
  robotsTxt: {
    type: String,
    trim: true
  },
  googleVerification: {
    type: String,
    trim: true
  },
  bingVerification: {
    type: String,
    trim: true
  },
  yandexVerification: {
    type: String,
    trim: true
  },
  customMetaTags: [{
    name: String,
    content: String
  }],
  socialMedia: {
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    twitterTitle: String,
    twitterDescription: String,
    twitterImage: String,
    twitterCardType: {
      type: String,
      enum: ['summary', 'summary_large_image', 'app', 'player'],
      default: 'summary_large_image'
    }
  },
  structuredData: {
    organization: {
      type: String,
      default: '{}'
    },
    website: {
      type: String,
      default: '{}'
    },
    breadcrumb: {
      type: String,
      default: '{}'
    }
  },
  googleAnalyticsId: {
    type: String,
    trim: true
  },
  customCss: {
    type: String
  },
  customJs: {
    type: String
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema); 