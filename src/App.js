import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import appConfig from './config/appConfig';

// Import i18n configuration
import './i18n';

// Pages
import WelcomePage from './pages/auth/WelcomePage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import HostsPage from './pages/hosts/HostsPage';
import RegisterAgencyPage from './pages/agency/RegisterAgencyPage';
import JoinAgencyPage from './pages/agency/JoinAgencyPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider } from './context/AuthContext';

// Services
import { initializeParse } from './services/ParseService';
import ConfigService from './services/ConfigService';

function App() {
  useEffect(() => {
    // Initialize Parse with app credentials from config file
    initializeParse(
      appConfig.parseServer.applicationId,
      appConfig.parseServer.serverUrl,
      appConfig.parseServer.javascriptKey
    );

    // Initialize ConfigService
    ConfigService.getInstance().initialize().catch(error => {
      console.error('Failed to initialize ConfigService:', error);
    });

    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: appConfig.socialLogin?.facebook?.appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0' // Explicitly set version without using variable
      });
    };

    // Load Facebook SDK
    if (!window.FB) {
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    
    // Load Google Identity Services
    if (!window.google || !window.google.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts && appConfig.socialLogin?.google?.clientId) {
          window.google.accounts.id.initialize({
            client_id: appConfig.socialLogin.google.clientId,
            auto_select: false,
            callback: () => {}
          });
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register-agency" element={<RegisterAgencyPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/hosts" element={<HostsPage />} />
              <Route path="/agency/register" element={<RegisterAgencyPage />} />
              <Route path="/agency/join" element={<JoinAgencyPage />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </Suspense>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
}

export default App;
