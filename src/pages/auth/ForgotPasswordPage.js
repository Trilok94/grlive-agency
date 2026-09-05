import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { authService } from '../../services/ParseService';

import { useTranslation } from 'react-i18next';

// Import TokLive logo
import tokLiveLogo from '../../assets/icons/ic_logo_dark.png';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shine = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const ForgotPasswordContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a, #4338ca, #7e22ce);
  background-size: 400% 400%;
  animation: ${shine} 15s ease infinite;
  padding: 2rem;
  
  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 24px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  padding: 3rem;
  animation: ${fadeIn} 0.6s ease-out;
  border: 1px solid rgba(99, 102, 241, 0.1);
  
  @media (max-width: 480px) {
    padding: 2rem 1.5rem;
    border-radius: 20px;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2rem;
  color: #4338ca;
  
  img {
    height: 70px;
    margin-right: 10px;
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

const Title = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #4338ca, #7e22ce);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  font-weight: 600;
  
  @media (max-width: 480px) {
    font-size: 1.6rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  margin-bottom: 2rem;
  color: #666;
  text-align: center;
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
    box-shadow: 0 2px 10px rgba(99, 102, 241, 0.15);
  }
  
  @media (max-width: 480px) {
    padding: 0.9rem 1rem 0.9rem 3rem;
    font-size: 0.95rem;
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
  
  @media (max-width: 480px) {
    top: 0.9rem;
  }
`;

const ErrorText = styled.div`
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-left: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  background-size: 200% auto;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
  
  @media (max-width: 480px) {
    padding: 0.9rem;
    font-size: 0.95rem;
  }
`;

const BackToLogin = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  color: #666;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  transition: all 0.3s ease;
  
  &:hover {
    color: #6366f1;
    background-color: rgba(99, 102, 241, 0.05);
    transform: translateX(-3px);
  }
  
  svg {
    margin-right: 0.5rem;
    transition: transform 0.3s ease;
  }
  
  &:hover svg {
    transform: translateX(-3px);
  }
  
  @media (max-width: 480px) {
    margin-top: 1.5rem;
    font-size: 0.95rem;
  }
`;

const SuccessMessage = styled.div`
  background-color: rgba(99, 102, 241, 0.1);
  color: #4338ca;
  padding: 1.5rem;
  border-radius: 15px;
  margin-bottom: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.1);
  animation: ${fadeIn} 0.6s ease-out;
  border: 1px solid rgba(99, 102, 241, 0.2);
  
  h3 {
    font-weight: 600;
  }
  
  p {
    line-height: 1.5;
  }
  
  @media (max-width: 480px) {
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }
`;

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPasswordPage = () => {
  const [resetSent, setResetSent] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await authService.requestPasswordReset(values.email);
      setResetSent(true);
      toast.success(t('auth.forgotPassword.resetSent'));
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(t('auth.forgotPassword.resetError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ForgotPasswordContainer>
      <Card>
        <Logo>
          <img src={tokLiveLogo} alt="TokLive Logo" />
        </Logo>
        
        {resetSent ? (
          <>
            <SuccessMessage>
              <h3 style={{ marginBottom: '1rem' }}>{t('auth.forgotPassword.resetSent')}</h3>
              <p>
                {t('auth.forgotPassword.resetSentMessage')}
              </p>
            </SuccessMessage>
            
            <BackToLogin to="/login">
              <FaArrowLeft /> {t('auth.forgotPassword.backToLogin')}
            </BackToLogin>
          </>
        ) : (
          <>
            <Title>{t('auth.forgotPassword.title')}</Title>
            <Subtitle>
              {t('auth.forgotPassword.subtitle')}
            </Subtitle>
            
            <Formik
              initialValues={{ email: '' }}
              validationSchema={ForgotPasswordSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <FormGroup>
                    <InputIcon>
                      <FaEnvelope />
                    </InputIcon>
                    <StyledField
                      type="email"
                      name="email"
                      placeholder={t('auth.forgotPassword.email')}
                    />
                    <ErrorMessage name="email" component={ErrorText} />
                  </FormGroup>
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.resetButton')}
                  </Button>
                </Form>
              )}
            </Formik>
            
            <BackToLogin to="/login">
              <FaArrowLeft /> {t('auth.forgotPassword.backToLogin')}
            </BackToLogin>
          </>
        )}
      </Card>
    </ForgotPasswordContainer>
  );
};

export default ForgotPasswordPage;
