import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';

import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebookF, FaApple } from 'react-icons/fa';
import Parse from 'parse';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/ParseService';
import appConfig from '../../config/appConfig';
import { useTranslation } from 'react-i18next';

// Import TokLive logo
import tokLiveLogo from '../../assets/icons/ic_logo_dark.png';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const LoginContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a, #4338ca, #7e22ce);
  position: relative;
  overflow-x: hidden;
  background-size: 400% 400%;
  animation: ${fadeIn} 0.6s ease-out, gradientShift 15s ease infinite;
  
  @keyframes gradientShift {
    0% { background-position: 0% 50% }
    50% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
  }
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: white;
  animation: ${fadeIn} 0.6s ease-out;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-top-left-radius: 24px;
  border-bottom-left-radius: 24px;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
  padding: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
  border-left: 1px solid rgba(99, 102, 241, 0.1);
  
  @media (max-width: 768px) {
    border-radius: 0;
    flex: 1;
    padding: 2rem 1.5rem;
    width: 100%;
  }
  
  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: #4338ca;
  
  img {
    height: 80px;
    margin-right: 15px;
    transition: transform 0.3s ease;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
  
  @media (max-width: 480px) {
    margin-bottom: 1.5rem;
    
    img {
      height: 60px;
    }
  }
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 400px;
  animation: ${fadeIn} 0.8s ease-out;
  
  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #4338ca, #7e22ce);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
  
  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  margin-bottom: 2rem;
  color: #666;
  line-height: 1.5;
  
  @media (max-width: 480px) {
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
  width: 100%;
  
  @media (max-width: 480px) {
    margin-bottom: 1.25rem;
  }
`;

const StyledField = styled(Field)`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 1px solid #ddd;
  border-radius: 50px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  
  &:focus {
    border-color: #6366f1;
    outline: none;
    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.15);
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 1rem;
  color: #999;
  transition: color 0.3s ease;
  
  ${FormGroup}:focus-within & {
    color: #6366f1;
  }
`;

const PasswordToggle = styled.div`
  position: absolute;
  right: 1rem;
  top: 1rem;
  color: #999;
  cursor: pointer;
`;

const ErrorText = styled.div`
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-left: 0.5rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    box-shadow: none;
  }
  
  &:after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    bottom: -50%;
    left: -50%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0));
    transform: rotate(45deg) translate(0, -100%);
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover:after {
    opacity: 1;
    transform: rotate(45deg) translate(0, 100%);
    transition: transform 0.7s ease-in-out, opacity 0.3s;
  }
`;

const ForgotPassword = styled(Link)`
  display: block;
  text-align: right;
  margin-bottom: 1.5rem;
  color: #6366f1;
  text-decoration: none;
  transition: all 0.3s ease;
  padding: 0.5rem 0;
  
  &:hover {
    color: #7c3aed;
    transform: translateX(-3px);
  }
  
  @media (max-width: 480px) {
    margin-bottom: 1.25rem;
  }
`;

const BackToHome = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-top: 2rem;
  color: #666;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  transition: all 0.3s ease;
  
  &:hover {
    color: #1a2a6c;
    background-color: rgba(26, 42, 108, 0.05);
  }
  
  @media (max-width: 480px) {
    margin-top: 1.5rem;
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: #999;
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: rgba(99, 102, 241, 0.2);
  }
  
  span {
    padding: 0 1rem;
    font-size: 0.9rem;
  }
  
  @media (max-width: 480px) {
    margin: 1.25rem 0;
  }
`;

const SocialLoginButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
  
  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const SocialButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-radius: 50px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background-color: white;
  color: #333;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  animation: ${fadeIn} 0.6s ease-out;
  animation-fill-mode: both;
  
  &.google {
    &:hover {
      background-color: #DB4437;
      color: white;
      border-color: #DB4437;
      box-shadow: 0 4px 10px rgba(219, 68, 55, 0.2);
      transform: translateY(-2px);
    }
  }
  
  &.facebook {
    &:hover {
      background-color: #4267B2;
      color: white;
      border-color: #4267B2;
      box-shadow: 0 4px 10px rgba(66, 103, 178, 0.2);
      transform: translateY(-2px);
    }
  }
  
  &.apple {
    &:hover {
      background-color: #000;
      color: white;
      border-color: #000;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }
  }
  
  &:nth-child(1) {
    animation-delay: 0.4s;
  }
`;

const FeatureList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin-top: 2rem;
`;

const FeatureItem = styled.li`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  opacity: 0.9;
  
  &:before {
    content: '✓';
    margin-right: 0.5rem;
    color: #fdbb2d;
    font-weight: bold;
  }
  
  &:nth-child(1) {
    animation-delay: 0.4s;
  }
  
  &:nth-child(2) {
    animation-delay: 0.6s;
  }
  
  &:nth-child(3) {
    animation-delay: 0.8s;
  }
  
  &:nth-child(4) {
    animation-delay: 1s;
  }
  
  &:nth-child(5) {
    animation-delay: 1.2s;
  }
`;

// Helper functions to detect input type
const isEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

const isPhoneNumber = (value) => {
  // Transform numbers starting with 00 into +
  if (value.startsWith('00')) {
    value = '+' + value.slice(2);
  }
  // Match formats like +33XXXXXXXX or +244XXXXXXXX
  const phoneRegex = /^\+[0-9]{10,15}$/;
  return phoneRegex.test(value);
};

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Username, email or phone number is required'),
  password: Yup.string().required('Password is required'),
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingInWithToken, setIsLoggingInWithToken] = useState(false);
  const { currentUser, login, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Look for token in URL query parameters and attempt login if found
  useEffect(() => {
    const loginWithToken = async () => {
      try {
        // Check if we have a token parameter in the URL
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        
        if (token) {
          setIsLoggingInWithToken(true);
          console.log('Found session token in URL, attempting to authenticate...');
          
          // Try to authenticate with the session token
          const user = await authService.loginWithSessionToken(token);
          
          if (user) {
            console.log('Successfully authenticated with token');
            setCurrentUser(user);
            toast.success(t('auth.login.success'));
            
            // Clean up the URL to remove the token (for security)
            // Replace current history entry with a clean URL
            window.history.replaceState({}, document.title, '/dashboard');
            
            // Navigate to dashboard
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error authenticating with token:', error);
        toast.error(t('auth.login.socialLoginFailed', { provider: 'Token' }));
        
        // Clean up the URL to remove the token even if login failed
        window.history.replaceState({}, document.title, '/login');
        
        setIsLoggingInWithToken(false);
      }
    };
    
    loginWithToken();
  }, [location, setCurrentUser, navigate, t]);

  // If user is already logged in, redirect to dashboard
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }
  
  // Show loading indicator while logging in with token
  if (isLoggingInWithToken) {
    return (
      <LoginContainer>
        <RightPanel>
          <Logo>
            <img src={tokLiveLogo} alt="TokLive Logo" />
          </Logo>
          <FormContainer>
            <Title>{t('auth.login.loggingIn')}</Title>
            <Subtitle>{t('auth.login.subtitle')}</Subtitle>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid rgba(99, 102, 241, 0.2)', borderRadius: '50%', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }}></div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <p style={{ marginTop: '1rem' }}>{t('auth.login.automaticLogin')}</p>
            </div>
          </FormContainer>
        </RightPanel>
      </LoginContainer>
    );
  }

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      let username = values.username.trim();
      const password = values.password.trim();

      // Transform phone numbers starting with 00 into +
      if (username.startsWith('00')) {
        username = '+' + username.slice(2);
      }

      // Check if input is email or phone number
      if (isEmail(username) || isPhoneNumber(username)) {
        try {
          // Call cloud function to check user
          const params = { email_account_phone: username };
          const result = await Parse.Cloud.run('check_user', params);

          const extractedUsername = result.get("username");

          if (extractedUsername) {
            // Continue login with the returned username
            await login(extractedUsername, password);
            toast.success(t('auth.login.success'));
            navigate('/dashboard', { replace: true });
          } else {
            setFieldError('username', 'User not found');
            toast.error('User not found');
          }
        } catch (cloudError) {
          setFieldError('username', 'Invalid email or phone number');
          toast.error('Invalid email or phone number');
        }
      } else {
        // Regular username login
        await login(username, password);
        toast.success(t('auth.login.success'));
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error(t('auth.login.error'));
      setFieldError('password', t('auth.login.invalidCredentials'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      // For Google auth, we don't want to show success message immediately
      // We'll handle that separately
      if (provider === 'google') {
        handleGoogleLogin();
        return; // Exit early, success/error handling is done in the callback
      }
      
      let user;
      switch (provider) {
        // Google login is now handled separately to prevent premature success messages
        case 'google':
          // Skip since it's handled outside the switch
          break;

        case 'facebook':
          try {
            // Ensure Facebook SDK is loaded and properly initialized
            if (!window.FB) {
              // Load Facebook SDK if not already loaded
              await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://connect.facebook.net/en_US/sdk.js';
                script.async = true;
                script.defer = true;
                script.onload = () => {
                  // Initialize Facebook SDK after loading
                  window.fbAsyncInit = function () {
                    window.FB.init({
                      appId: appConfig.socialLogin?.facebook?.appId,
                      cookie: true,
                      xfbml: true,
                      version: 'v18.0'
                    });
                    resolve();
                  };
                  window.fbAsyncInit();
                };
                script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
                document.body.appendChild(script);
              });
            } else if (!window.FB._apiKey) {
              // FB is loaded but not initialized
              window.FB.init({
                appId: appConfig.socialLogin?.facebook?.appId,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
              });
            }

            // Trigger Facebook Login
            const fbResponse = await new Promise((resolve, reject) => {
              window.FB.login((response) => {
                if (response.authResponse) {
                  console.log('Facebook authResponse:', response.authResponse);
                  resolve(response);
                } else {
                  reject(new Error('Facebook login cancelled'));
                }
              }, { scope: 'public_profile,email' });
            });

            // Get user profile information
            const userInfo = await new Promise((resolve, reject) => {
              window.FB.api('/me', { fields: 'id,name,email,picture' }, (response) => {
                if (response && !response.error) {
                  resolve(response);
                } else {
                  reject(new Error('Failed to get Facebook user info'));
                }
              });
            });

            // Only allow existing users to login
            try {
              // Try to find an existing user with this Facebook ID
              const query = new Parse.Query(Parse.User);
              query.equalTo('fbId', userInfo.id);
              const existingUser = await query.first();

              if (existingUser) {

                const { accessToken, userID, expiresIn } = fbResponse.authResponse;

                const expirationDate = new Date();
                expirationDate.setSeconds(expirationDate.getSeconds() + expiresIn);

                const authData = {
                  id: userID,
                  access_token: accessToken,
                  expiration_date: expirationDate.toISOString()
                };
                // User exists, use auth provider login
                user = await Parse.FacebookUtils.logIn(authData);
                window.location.reload();
              } else {
                // User doesn't exist, show error message
                throw new Error(t('auth.errors.account_not_found_create_in_app'));
              }
            } catch (error) {
              console.error('Facebook login error:', error);
              throw error;
            }
          } catch (error) {
            console.error('Facebook login error:', error);
            throw error;
          }
          break;

        case 'apple':
          try {
            // Load Apple Sign-In if not already loaded
            if (!window.AppleID) {
              await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
                script.async = true;
                script.defer = true;
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Apple Sign-In SDK'));
                document.body.appendChild(script);
              });
            }

            // Initialize Apple Sign-In
            const appleConfig = appConfig.socialLogin?.apple;
            if (!appleConfig?.clientId) {
              throw new Error('Apple Client ID not configured');
            }

            // Initialize Apple Sign-In SDK
            window.AppleID.auth.init({
              clientId: appleConfig.clientId,
              scope: 'name email',
              redirectURI: window.location.origin,
              usePopup: true
            });

            // Trigger Apple Sign-In
            const appleResponse = await window.AppleID.auth.signIn();

            // Get Apple user ID from the token
            const appleUserId = appleResponse.authorization.id_token.split('.')[1];
            const decodedApplePayload = JSON.parse(atob(appleUserId));
            console.log('Apple token payload:', decodedApplePayload);

            // Only allow existing users to login
            try {
              // Try to find an existing user with this Apple ID
              const query = new Parse.Query(Parse.User);
              query.equalTo('appleId', decodedApplePayload.sub);
              const existingUser = await query.first();

              if (existingUser) {
                // User exists, use auth provider login
                user = await Parse.User.logInWith('apple', {
                  id_token: appleResponse.authorization.id_token,
                  // Include user info if provided (only sent on first login)
                  user: appleResponse.user ? {
                    name: appleResponse.user.name,
                    email: appleResponse.user.email
                  } : undefined
                });
              } else {
                // User doesn't exist, show error message
                throw new Error(t('auth.errors.account_not_found_create_in_app'));
              }
            } catch (error) {
              console.error('Apple login error:', error);
              throw error;
            }
          } catch (error) {
            console.error('Apple login error:', error);
            throw error;
          }
          break;

        default:
          throw new Error('Unsupported social provider');
      }

      // Update current user in auth context
      setCurrentUser(user);
      toast.success(t('auth.login.success'));
      navigate('/dashboard');
    } catch (error) {
      console.error(`${provider} login error:`, error);
      
      // We've already shown specific error toasts for individual providers,
      // only show generic error if one hasn't been shown already
      if (!error.handledWithToast) {
        toast.error(t('auth.login.socialLoginFailed', { provider }));
      }
    }
  };

  // Separate function to handle Google login
  const handleGoogleLogin = () => {
    try {
      const googleClientId = appConfig.socialLogin?.google?.clientId;
      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: 'openid profile email',
        ux_mode: 'popup',
        callback: async (response) => {
          try {
            // User cancelled or authorization failed
            if (!response || !response.code) {
              console.log('Google login cancelled or failed');
              toast.error(t('auth.errors.login_cancelled'));
              return;
            }
            
            const authCode = response.code;

            // Call your Parse Cloud Code to exchange code for tokens
            const result = await Parse.Cloud.run('exchangeGoogleCode', { code: authCode });

            const { access_token, id_token, userId } = result;

            const googleAuthData = {
              id: userId,
              id_token,
              access_token,
            };

            // Only allow existing users to login
            // Try to find an existing user with this Google ID
            const query = new Parse.Query(Parse.User);
            query.equalTo('ggId', googleAuthData.id);
            const existingUser = await query.first();

            if (existingUser) {
              const user = await Parse.User.logInWith('google', { authData: googleAuthData });
              setCurrentUser(user);
              console.log('User logged in with Google:', user);
              
              // NOW show the success toast and navigate
              toast.success(t('auth.login.success'));
              navigate('/dashboard', { replace: true });
            } else {
              // User doesn't exist, show error message
              toast.error(t('auth.errors.account_not_found_create_in_app'));
            }
          } catch (error) {
            console.error('Google auth callback error:', error);
            if (error.message && error.message.includes('account_not_found')) {
              toast.error(t('auth.errors.account_not_found_create_in_app'));
            } else {
              toast.error(t('auth.login.socialLoginFailed', { provider: 'Google' }));
            }
          }
        },
      });

      // Request the authorization code
      codeClient.requestCode();
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(t('auth.login.socialLoginFailed', { provider: 'Google' }));
    }
  };

  return (
    <LoginContainer>
      <LeftPanel>
        <h1 style={{
          fontSize: '3rem',
          marginBottom: '2rem',
          background: 'linear-gradient(90deg, #ffffff, #f0f0f0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
        }}>{t('app.name')}</h1>
        <p style={{
          fontSize: '1.5rem',
          marginBottom: '2rem',
          maxWidth: '500px',
          textAlign: 'center',
          lineHeight: '1.6',
          opacity: '0.9'
        }}>
          {t('app.tagline')}
        </p>

        <FeatureList>
          <FeatureItem>{t('auth.welcome.features.hostManagement')}</FeatureItem>
          <FeatureItem>{t('auth.welcome.features.analytics')}</FeatureItem>
          <FeatureItem>{t('auth.welcome.features.payments')}</FeatureItem>
          <FeatureItem>{t('auth.welcome.features.scheduling')}</FeatureItem>
          <FeatureItem>{t('auth.welcome.features.security')}</FeatureItem>
        </FeatureList>
      </LeftPanel>

      <RightPanel>
        <Logo>
          <img src={tokLiveLogo} alt="TokLive Logo" />
        </Logo>
        <FormContainer>
          <Title>{t('auth.login.title')}</Title>
          <Subtitle>{t('auth.login.subtitle')}</Subtitle>

          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form>
                <SocialLoginButtons>
                  <SocialButton
                    type="button"
                    className="google"
                    onClick={() => handleSocialLogin('google')}
                    aria-label="Sign in with Google"
                  >
                    <FaGoogle />
                  </SocialButton>
                  <SocialButton
                    type="button"
                    className="facebook"
                    onClick={() => handleSocialLogin('facebook')}
                    aria-label="Sign in with Facebook"
                  >
                    <FaFacebookF />
                  </SocialButton>
                  <SocialButton
                    type="button"
                    className="apple"
                    onClick={() => handleSocialLogin('apple')}
                    aria-label="Sign in with Apple"
                    style={{ display: 'none' }} /* Hide Apple login as it's not implemented yet */
                  >
                    <FaApple />
                  </SocialButton>
                </SocialLoginButtons>

                <OrDivider>
                  <span>{t('auth.login.or')}</span>
                </OrDivider>

                <FormGroup>
                  <InputIcon>
                    <FaUser />
                  </InputIcon>
                  <StyledField
                    type="text"
                    name="username"
                    placeholder={t('auth.login.usernameOrEmailOrPhone')}
                  />
                  <ErrorMessage name="username" component={ErrorText} />
                </FormGroup>

                <FormGroup>
                  <InputIcon>
                    <FaLock />
                  </InputIcon>
                  <StyledField
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder={t('auth.login.password')}
                  />
                  <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </PasswordToggle>
                  <ErrorMessage name="password" component={ErrorText} />
                </FormGroup>

                <ForgotPassword to="/forgot-password">
                  {t('auth.login.forgotPassword')}
                </ForgotPassword>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
                </Button>
              </Form>
            )}
          </Formik>

          <BackToHome to="/">
            <span style={{ marginRight: '0.5rem' }}>←</span> {t('auth.login.backToHome')}
          </BackToHome>
        </FormContainer>
      </RightPanel>
    </LoginContainer>
  );
};

export default LoginPage;
