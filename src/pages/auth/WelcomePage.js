import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaVideo, FaUsers, FaChartLine, FaApple, FaGooglePlay, FaTimes, FaBars, FaTimes as FaClose } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import appConfig from '../../config/appConfig';
import LanguageSelector from '../../components/LanguageSelector';

// Import TokLive logo
import tokLiveLogo from '../../assets/icons/ic_logo_white.png';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
`;

const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a, #4338ca, #7e22ce);
  color: white;
  position: relative;
  overflow-x: hidden;
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  
  @keyframes gradientShift {
    0% { background-position: 0% 50% }
    50% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
  }
`;

const Header = styled.header`
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 100;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-size: 2rem;
  font-weight: bold;
  z-index: 101;
  
  img {
    height: 60px;
    margin-right: 10px;
    transition: all 0.3s ease;
  }
  
  @media (max-width: 768px) {
    img {
      height: 40px;
    }
  }
`;

const NavButtons = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  height: 40px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 101;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MobileMenu = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    right: 0;
    width: 80%;
    max-width: 300px;
    height: 100vh;
    background: linear-gradient(135deg, #0f172a, #4338ca);
    padding: 5rem 2rem 2rem;
    z-index: 99;
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(100%)'};
    transition: transform 0.3s ease-in-out;
    box-shadow: -5px 0 30px rgba(0, 0, 0, 0.3);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    
    a, button {
      margin-bottom: 1rem;
      width: 100%;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    
    a {
      width: 100%;
    }
    
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s ease;
  }
  
  &:hover::after {
    left: 100%;
  }
  
  &.primary {
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    color: white;
    border: none;
    min-width: 120px;
    
    &:hover {
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }
  }
  
  &.secondary {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    min-width: 120px;
    backdrop-filter: blur(4px);
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
  
  @media (max-width: 768px) {
    height: 42px;
    padding: 0.6rem 1.25rem;
    font-size: 0.95rem;
  }
`;

const HeroSection = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 8rem 2rem 2rem; /* Increased top padding to account for fixed header */
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15), transparent 70%);
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    padding: 7rem 1.5rem 2rem; /* Adjusted for mobile */
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  background: linear-gradient(to right, #fff, #c7d2fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
  animation: ${fadeIn} 0.8s ease-out;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  max-width: 800px;
  margin-bottom: 3rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  animation: ${fadeIn} 0.8s ease-out;
  animation-delay: 0.2s;
  animation-fill-mode: both;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }
`;

const FeaturesSection = styled.section`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1200px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  @media (max-width: 480px) {
    gap: 2.5rem;
    margin-bottom: 3rem;
    flex-direction: column;
    align-items: center;
  }
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  min-width: 280px;
  max-width: 350px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #8b5cf6, #6366f1);
    opacity: 0.7;
    transition: all 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.15);
    
    &::before {
      opacity: 1;
    }
  }
  
  @media (max-width: 768px) {
    min-width: 240px;
    max-width: 320px;
    padding: 1.5rem;
    width: 280px;
  }
  
  @media (max-width: 480px) {
    width: calc(100% - 2rem);
    min-width: unset;
    max-width: unset;
    padding: 2.5rem 1.5rem;
    margin: 0 1rem;
    
    &:hover {
      transform: translateY(-5px);
    }
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.1);
  width: 90px;
  height: 90px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  
  ${FeatureCard}:hover & {
    transform: scale(1.1) rotate(5deg);
    color: white;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    border-color: rgba(139, 92, 246, 0.5);
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #e0e7ff;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  max-width: 90%;
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const Footer = styled.footer`
  padding: 2rem;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    font-size: 0.9rem;
  }
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  animation: ${fadeIn} 0.3s ease-out;
`;

const PopupContent = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  color: #333;
  text-align: left;
  border: 1px solid rgba(139, 92, 246, 0.2);
  animation: ${fadeIn} 0.4s ease-out;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    width: 95%;
    max-width: 450px;
  }
  
  @media (max-width: 480px) {
    padding: 1.25rem;
    border-radius: 12px;
  }
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    background: linear-gradient(to right, #4338ca, #7e22ce);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    color: #333;
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
    width: 36px;
    height: 36px;
  }
`;

const AppButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  
  a {
    display: flex;
    flex: 1;
  }
  
  button {
    height: 48px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
    }
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.75rem;
    
    button {
      height: 44px;
    }
  }
`;

const WelcomePage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  
  const openPopup = () => setShowPopup(true);
  const closePopup = () => setShowPopup(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuOpen && !e.target.closest('.mobile-menu-container')) {
        setMobileMenuOpen(false);
      }
    };
    
    if (mobileMenuOpen) {
      // Add a small delay to avoid immediate closing when opening
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
    }
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);
  return (
    <WelcomeContainer>
      <Header>
        <Logo>
          <img src={tokLiveLogo} alt="TokLive Logo" />
        </Logo>
        <NavButtons>
          <LanguageSelector />
          <Link to="/login">
            <Button className="secondary">{t('auth.welcome.login')}</Button>
          </Link>
          <Button className="primary" onClick={openPopup}>{t('auth.welcome.getStarted')}</Button>
        </NavButtons>
        
        <MobileMenuButton onClick={(e) => {
          e.stopPropagation();
          toggleMobileMenu();
        }} className="mobile-menu-container">
          {mobileMenuOpen ? <FaClose /> : <FaBars />}
        </MobileMenuButton>
        
        <MobileMenu $isOpen={mobileMenuOpen} className="mobile-menu-container" onClick={(e) => e.stopPropagation()}>
          <div style={{ marginBottom: '2rem', width: '100%' }}>
            <div style={{ 
              width: '100%', 
              padding: '0.75rem 1rem',
              borderRadius: '50px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
            }}>
              <LanguageSelector />
            </div>
          </div>
          <Link to="/login" style={{ width: '100%', marginBottom: '1.5rem' }}>
            <Button className="secondary" style={{ width: '100%' }}>{t('auth.welcome.login')}</Button>
          </Link>
          <Button className="primary" onClick={openPopup} style={{ width: '100%' }}>{t('auth.welcome.getStarted')}</Button>
        </MobileMenu>
      </Header>
      
      <HeroSection>
        <Title>{t('auth.welcome.heroTitle')}</Title>
        <Subtitle>
          {t('auth.welcome.heroSubtitle')}
        </Subtitle>
        
        <FeaturesSection>
          <FeatureCard>
            <FeatureIcon>
              <FaVideo />
            </FeatureIcon>
            <FeatureTitle>{t('auth.welcome.features.scheduling')}</FeatureTitle>
            <FeatureDescription>
              {t('auth.welcome.features.schedulingDesc')}
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaUsers />
            </FeatureIcon>
            <FeatureTitle>{t('auth.welcome.features.hostManagement')}</FeatureTitle>
            <FeatureDescription>
              {t('auth.welcome.features.hostManagementDesc')}
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaChartLine />
            </FeatureIcon>
            <FeatureTitle>{t('auth.welcome.features.analytics')}</FeatureTitle>
            <FeatureDescription>
              {t('auth.welcome.features.analyticsDesc')}
            </FeatureDescription>
          </FeatureCard>
        </FeaturesSection>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '600px', padding: '0 1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={appConfig.appStoreLinks.ios} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: '1 1 auto', minWidth: '180px', maxWidth: '220px' }}>
              <Button className="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#e0e7ff' }}>
                <FaApple /> {t('auth.welcome.downloadPopup.downloadIos')}
              </Button>
            </a>
            <a href={appConfig.appStoreLinks.android} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: '1 1 auto', minWidth: '180px', maxWidth: '220px' }}>
              <Button className="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#e0e7ff' }}>
                <FaGooglePlay /> {t('auth.welcome.downloadPopup.downloadAndroid')}
              </Button>
            </a>
          </div>
          <p style={{ color: 'white', marginBottom: '1rem', textAlign: 'center', padding: '0 1rem' }}>
            {t('auth.welcome.downloadInstructions')}
          </p>
          <ButtonGroup style={{ width: '100%', maxWidth: '100%' }}>
            <Link to="/login" style={{ width: '100%', maxWidth: '100%', display: 'block' }}>
              <Button className="primary" style={{ 
                padding: '1rem 2rem', 
                fontSize: '1.1rem', 
                width: '100%',
                maxWidth: '350px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)'
              }}>
                {t('auth.welcome.accessDashboard')}
              </Button>
            </Link>
          </ButtonGroup>
        </div>
      </HeroSection>
      
      <Footer>
        {t('common.copyright', { year: new Date().getFullYear() })}
      </Footer>
      
      {showPopup && (
        <PopupOverlay onClick={closePopup}>
          <PopupContent onClick={(e) => e.stopPropagation()}>
            <PopupHeader>
              <h2>{t('auth.welcome.downloadPopup.title')}</h2>
              <CloseButton onClick={closePopup}>
                <FaTimes />
              </CloseButton>
            </PopupHeader>
            
            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{t('auth.welcome.downloadPopup.instructions')}</p>
            
            <ol style={{ margin: '1rem 0', paddingLeft: '1.5rem', color: '#4b5563', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '0.5rem' }}>{t('auth.welcome.downloadPopup.step1')}</li>
              <li style={{ marginBottom: '0.5rem' }}>{t('auth.welcome.downloadPopup.step2')}</li>
              <li>{t('auth.welcome.downloadPopup.step3')}</li>
            </ol>
            
            <AppButtons>
              <a href={appConfig.appStoreLinks.ios} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                <button 
                  style={{ 
                    width: '100%', 
                    height: '48px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    padding: '0 1.5rem',
                    borderRadius: '50px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.1)'
                  }}
                >
                  <FaApple /> {t('auth.welcome.downloadPopup.downloadIos')}
                </button>
              </a>
              <a href={appConfig.appStoreLinks.android} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                <button 
                  style={{ 
                    width: '100%', 
                    height: '48px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    padding: '0 1.5rem',
                    borderRadius: '50px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.1)'
                  }}
                >
                  <FaGooglePlay /> {t('auth.welcome.downloadPopup.downloadAndroid')}
                </button>
              </a>
            </AppButtons>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: '#4b5563', fontWeight: '500' }}>{t('auth.welcome.downloadPopup.haveAccount')}</p>
              <Link to="/login">
                <button 
                  style={{ 
                    marginTop: '0.5rem',
                    height: '48px',
                    padding: '0 1.5rem',
                    borderRadius: '50px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: 'white',
                    border: 'none',
                    width: '100%',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  {t('auth.welcome.downloadPopup.loginToDashboard')}
                </button>
              </Link>
            </div>
          </PopupContent>
        </PopupOverlay>
      )}
    </WelcomeContainer>
  );
};

export default WelcomePage;
