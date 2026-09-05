import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import RegisterAgencyForm from '../../components/agency/RegisterAgencyForm';
import tokLiveLogo from '../../assets/icons/ic_logo.png';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Global styles with animations
const GlobalStyle = createGlobalStyle`
  @keyframes fadeInAnimation {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideInAnimation {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

const RegisterAgencyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/agency/options');
  };

  return (
    <>
      <GlobalStyle />
      <PageContainer>
        <Header>
          <BackButton onClick={handleBack}>
            <FaArrowLeft />
            <span>{t('common.back')}</span>
          </BackButton>
          <LogoContainer>
            <img src={tokLiveLogo} alt="TokLive Logo" />
          </LogoContainer>
        </Header>
        <ContentContainer>
          <PageTitle>{t('agency.register.title')}</PageTitle>
          <PageDescription>{t('agency.register.description')}</PageDescription>
          <RegisterAgencyForm />
        </ContentContainer>
      </PageContainer>
    </>
  );
};

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  padding: 1rem;
  animation: fadeInAnimation 0.5s ease-out;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
`;

const LogoContainer = styled.div`
  img {
    height: 50px;
    object-fit: contain;
    filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
  }
`;

const ContentContainer = styled.div`
  max-width: 700px;
  margin: 0 auto;
  animation: fadeInAnimation 0.6s ease-out;
`;

const PageTitle = styled.h1`
  color: white;
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const PageDescription = styled.p`
  color: white;
  font-size: 1rem;
  text-align: center;
  margin-bottom: 1rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  span {
    font-weight: 500;
  }
`;

export default RegisterAgencyPage;
