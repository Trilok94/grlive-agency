/**
 * Application Configuration
 * 
 * This file contains all the configuration values for the GrLive Agency Dashboard.
 * Centralizing these values makes it easier to maintain and update the application.
 */

const appConfig = {
  // Application Information
  appName: 'Grlive Agency Dashboard',

  // Parse Server Configuration
  parseServer: {
    applicationId: 'toV4KIY6QqAIZEVWhK5NAowtkACfeRkLTdShHM3b',
    serverUrl: 'https://api.grlive.in/1/',
    javascriptKey: 'AnV2Up7Wvqbrs9QZFVRoFMq3qSRkHbfCfLdheTUr'
  },

  // App Store Links
  appStoreLinks: {
    ios: 'https://apps.apple.com/app/id000000',
    android: 'https://play.google.com/store/apps/details?id=com.app.grlive'
  },

  // Social Media Links
  socialMedia: {
    facebook: 'https://facebook.com/GRLive',
    twitter: 'https://twitter.com/GRLive',
    instagram: 'https://instagram.com/GRLive'
  },

  // Social Login Configuration
  socialLogin: {
    facebook: {
      appId: '788911803703621', // Facebook App ID
      version: 'v18.0'
    },
    google: {
      clientId: "167791903606-p6cdjj32dp7qv18tpo9eahnkia2orfam.apps.googleusercontent.com"
    },
    apple: {
      clientId: '123456789', // Apple Client ID
      scope: 'name email',
      redirectURI: window.location.origin
    }
  },

  // Support Information
  support: {
    email: 'support@grlive.in',
    helpCenter: 'https://help.grlive.in'
  },
};

export default appConfig;
