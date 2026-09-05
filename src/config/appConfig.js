/**
 * Application Configuration
 * 
 * This file contains all the configuration values for the LotusLive Agency Dashboard.
 * Centralizing these values makes it easier to maintain and update the application.
 */

const appConfig = {
  // Application Information
  appName: 'Lotus Live Agency Dashboard',
  
  // Parse Server Configuration
  parseServer: {
    applicationId: 'toV4KIY6QqAIZEVWhK5NAowtkACfeRkLTdShHM3b',
    serverUrl: 'http://localhost:3345/1/',
    javascriptKey: 'AnV2Up7Wvqbrs9QZFVRoFMq3qSRkHbfCfLdheTUr'
  },
  
  // App Store Links
  appStoreLinks: {
    ios: 'https://apps.apple.com/app/id000000',
    android: 'https://play.google.com/store/apps/details?id=com.lotuslive.app'
  },
  
  // Social Media Links
  socialMedia: {
    facebook: 'https://facebook.com/lotusLive',
    twitter: 'https://twitter.com/lotusLive',
    instagram: 'https://instagram.com/lotusLive'
  },

  // Social Login Configuration
  socialLogin: {
    facebook: {
      appId: '788911803703621', // Facebook App ID
      version: 'v18.0'
    },
    google: {
      clientId: '367490381258-5qb04fsld35oquseahskpcv3h0deftob.apps.googleusercontent.com' // Google Client ID
    },
    apple: {
      clientId: '123456789', // Apple Client ID
      scope: 'name email',
      redirectURI: window.location.origin
    }
  },
  
  // Support Information
  support: {
    email: 'support@lotusapp.live',
    helpCenter: 'https://help.lotusapp.live'
  },
};

export default appConfig;
