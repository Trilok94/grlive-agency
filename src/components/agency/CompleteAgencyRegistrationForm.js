import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { 
  FaBuilding, 
  FaSave, 
  FaSpinner,
  FaIdBadge,
  FaUniversity,
  FaUser,
  FaImage
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Agent from '../../models/Agent';
import User from '../../models/User';
import PayoutMethod from '../../models/PayoutMethod';
import { agencyService } from '../../services/agencyService';
import Parse from 'parse';
import { countries } from '../../utils/helpers';
import AgencyApplication from '../../models/AgencyApplication';

const CompleteAgencyRegistrationForm = ({ application, onSuccess }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  
  // Country select states
  const [selectedCompanyCountry, setSelectedCompanyCountry] = useState(null);
  const [selectedBankingCountry, setSelectedBankingCountry] = useState(null);
  
  // Logo state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Company info fields
  const [companyName, setCompanyName] = useState('');
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState('');
  const [companyTaxId, setCompanyTaxId] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyPostalCode, setCompanyPostalCode] = useState('');
  
  // Banking info fields
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountSurname, setBankAccountSurname] = useState('');
  const [bankingEmail, setBankingEmail] = useState('');
  const [bankingCity, setBankingCity] = useState('');
  const [accountId, setAccountId] = useState('');
  const [bankName, setBankName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');

  // Initialize form with application data if available
  useEffect(() => {
    if (application) {
      // Pre-fill email from application
      setBankingEmail(application.get('contactEmail') || '');
    }
  }, [application]);
  
  // Tab change handler
  const handleTabChange = (tab) => {
    // If trying to go to banking tab, validate company info first
    if (tab === 'banking') {
      handleSaveCompanyInfo();
    } else {
      setActiveTab(tab);
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (1MB max)
      const maxSize = 1 * 1024 * 1024; // 1MB in bytes
      if (file.size > maxSize) {
        toast.error(t('settings.logoTooLarge') || 'Logo file is too large. Maximum size is 1MB.');
        e.target.value = null; // Reset the input
        return;
      }
      
      // Validate file type (optional additional check)
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error(t('settings.invalidLogoFormat') || 'Invalid logo format. Please use JPG, PNG, GIF or SVG.');
        e.target.value = null; // Reset the input
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompanyInfo = (e) => {
    if (e) e.preventDefault();
    
    // Validate all company information fields
    if (!logoFile && !logoPreview) {
      toast.error(t('settings.pleaseUploadLogo'));
      return;
    }
    if (!companyName) {
      toast.error(t('settings.pleaseEnterCompanyName'));
      return;
    }
    if (!companyRegistrationNumber) {
      toast.error(t('settings.pleaseEnterCompanyRegistrationNumber'));
      return;
    }
    if (!companyTaxId) {
      toast.error(t('settings.pleaseEnterCompanyTaxId'));
      return;
    }
    if (!companyAddress) {
      toast.error(t('settings.pleaseEnterCompanyAddress'));
      return;
    }
    if (!companyCity) {
      toast.error(t('settings.pleaseEnterCompanyCity'));
      return;
    }
    if (!companyPostalCode) {
      toast.error(t('settings.pleaseEnterCompanyPostalCode'));
      return;
    }
    if (!selectedCompanyCountry) {
      toast.error(t('settings.pleaseSelectCompanyCountry'));
      return;
    }
    
    // If all validations pass, proceed to banking section
    setActiveTab('banking');
  };

  const handleSaveBankingInfo = async (e) => {
    e.preventDefault();
    
    // Validate all banking information fields
    if (!bankAccountName) {
      toast.error(t('settings.pleaseEnterBankAccountName'));
      return;
    }
    if (!bankAccountSurname) {
      toast.error(t('settings.pleaseEnterBankAccountSurname'));
      return;
    }
    if (!bankingEmail) {
      toast.error(t('settings.pleaseEnterBankingEmail'));
      return;
    }
    if (!selectedBankingCountry) {
      toast.error(t('settings.pleaseSelectBankingCountry'));
      return;
    }
    if (!bankingCity) {
      toast.error(t('settings.pleaseEnterBankingCity'));
      return;
    }
    if (!accountId) {
      toast.error(t('settings.pleaseEnterAccountId'));
      return;
    }
    if (!bankName) {
      toast.error(t('settings.pleaseEnterBankName'));
      return;
    }
    if (!phoneNumber) {
      toast.error(t('settings.pleaseEnterPhoneNumber'));
      return;
    }
    
    setSaving(true);
    
    try {
      // Process logo file if selected
      let logoParseFile = null;
      if (logoFile) {
        const fileName = `agency_logo_${Date.now()}_${logoFile.name}`;
        logoParseFile = new Parse.File(fileName, logoFile);
        await logoParseFile.save();
      }
      
      // Update the agent record
      const agentData = {
        name: application.get(Agent.keys.NAME),
        user: currentUser,
        companyName,
        companyRegistrationNumber,
        companyTaxId,
        companyAddress,
        companyCity,
        companyPostalCode,
        companyCountry: selectedCompanyCountry.value,
        logo: logoParseFile
      };
      
      const agent = await agencyService.updateAgent(agentData);
      
      // Create bank account payment method
      const paymentMethodData = {
        type: PayoutMethod.paymentMethods.VALLET,
        accountName: bankAccountName,
        accountSurname: bankAccountSurname,
        email: bankingEmail,
        country: selectedBankingCountry.value,
        city: bankingCity,
        accountId: accountId,
        bankName: bankName,
        phoneNumber: phoneNumber,
      };
      
      await agencyService.savePaymentMethod(paymentMethodData, currentUser);
      
      // Update application status to completed
      application.set(AgencyApplication.keys.STATUS, AgencyApplication.status.COMPLETED);
      await application.save(null);
      
      toast.success(t('settings.agencyRegistrationCompleted'));
      
      // Force a refresh of the page to show the updated status
      // We use a short delay to ensure the server has time to process the update
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 1000);
      
      // Call the success callback if needed for other purposes
      if (onSuccess) {
        // We don't need to call this immediately as we're refreshing the page
        setTimeout(() => onSuccess(agent), 1500);
      }
    } catch (error) {
      console.error('Error completing agency registration:', error);
      toast.error(t('settings.errorSavingData'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container>
      <PageHeader>
        <h1>
          <FaBuilding />
          {t('settings.completeAgencyRegistration')}
        </h1>
        <p>{t('settings.completeRegistrationDescription')}</p>
      </PageHeader>
      
      <TabsContainer>
        <TabButton 
          $active={activeTab === 'company'} 
          onClick={() => handleTabChange('company')}
        >
          <FaIdBadge />
          {t('settings.companyInformation')}
        </TabButton>
        <TabButton 
          $active={activeTab === 'banking'} 
          onClick={() => handleTabChange('banking')}
        >
          <FaUniversity />
          {t('settings.bankingInformation')}
        </TabButton>
      </TabsContainer>
      
      {activeTab === 'company' && (
        <Card>
          <CardHeader>
            <h2>{t('settings.companyInformation')}</h2>
            <p>{t('settings.companyInfoDescription')}</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSaveCompanyInfo}>
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.agencyLogo')} *</Label>
                  <LogoContainer>
                    {logoPreview ? (
                      <LogoPreview>
                        <img src={logoPreview} alt="Agency Logo Preview" />
                      </LogoPreview>
                    ) : (
                      <LogoPlaceholder>
                        <FaImage />
                      </LogoPlaceholder>
                    )}
                    <LogoUpload>
                      <UploadButton as="label" htmlFor="logo-upload">
                        <FaImage />
                        {t('settings.uploadLogo')}
                      </UploadButton>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                      />
                      <FieldHint>{t('settings.logoHint')}</FieldHint>
                    </LogoUpload>
                  </LogoContainer>
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.companyName')} *</Label>
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t('settings.companyNamePlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.companyRegistrationNumber')} *</Label>
                  <Input
                    type="text"
                    value={companyRegistrationNumber}
                    onChange={(e) => setCompanyRegistrationNumber(e.target.value)}
                    placeholder={t('settings.companyRegistrationNumberPlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.companyTaxId')} *</Label>
                  <Input
                    type="text"
                    value={companyTaxId}
                    onChange={(e) => setCompanyTaxId(e.target.value)}
                    placeholder={t('settings.companyTaxIdPlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.companyAddress')} *</Label>
                  <Input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder={t('settings.companyAddressPlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.companyCity')} *</Label>
                  <Input
                    type="text"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    placeholder={t('settings.companyCityPlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.companyPostalCode')} *</Label>
                  <Input
                    type="text"
                    value={companyPostalCode}
                    onChange={(e) => setCompanyPostalCode(e.target.value)}
                    placeholder={t('settings.companyPostalCodePlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.companyCountry')} *</Label>
                  <Select
                    value={selectedCompanyCountry}
                    onChange={setSelectedCompanyCountry}
                    options={countries.map(country => ({ value: country.value, label: country.label }))}
                    placeholder={t('settings.selectCountry')}
                    styles={SelectStyles}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <CardFooter>
                <SaveButton onClick={handleSaveCompanyInfo}>
                  {t('settings.saveAndContinue')}
                </SaveButton>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'banking' && (
        <Card>
          <CardHeader>
            <h2>{t('settings.bankingInformation')}</h2>
            <p>{t('settings.bankingInfoDescription')}</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSaveBankingInfo}>
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.accountHolderFirstName')} *</Label>
                  <Input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder={t('settings.bankAccountNamePlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.accountHolderLastName')} *</Label>
                  <Input
                    type="text"
                    value={bankAccountSurname}
                    onChange={(e) => setBankAccountSurname(e.target.value)}
                    placeholder={t('settings.bankAccountSurnamePlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.email')} *</Label>
                  <Input
                    type="email"
                    value={bankingEmail}
                    onChange={(e) => setBankingEmail(e.target.value)}
                    placeholder={t('settings.bankingEmailPlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.country')} *</Label>
                  <Select
                    value={selectedBankingCountry}
                    onChange={setSelectedBankingCountry}
                    options={countries.map(country => ({ value: country.value, label: country.label }))}
                    placeholder={t('settings.selectCountry')}
                    styles={SelectStyles}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.city')} *</Label>
                  <Input
                    type="text"
                    value={bankingCity}
                    onChange={(e) => setBankingCity(e.target.value)}
                    placeholder={t('settings.bankingCityPlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.accountNumber')} *</Label>
                  <Input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder={t('settings.accountIdPlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.bankName')} *</Label>
                  <Input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder={t('settings.bankNamePlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>{t('settings.phoneNumber')} *</Label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('settings.phoneNumberPlaceholder')}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <CardFooter>
                <BackButton type="button" onClick={() => setActiveTab('company')}>
                  {t('settings.back')}
                </BackButton>
                <SaveButton type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <FaSpinner className="spinner" />
                      {t('settings.saving')}
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {t('settings.completeRegistration')}
                    </>
                  )}
                </SaveButton>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    color: #2d3748;
    
    svg {
      color: #4a90e2;
    }
  }
  
  p {
    color: #718096;
    font-size: 1rem;
    line-height: 1.5;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #edf2f7;
  overflow-x: auto;
  
  @media (max-width: 576px) {
    flex-wrap: nowrap;
    
    &::-webkit-scrollbar {
      height: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c5c5c5;
      border-radius: 10px;
    }
  }
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: ${props => props.$active ? '#4a90e2' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  font-weight: ${props => props.$active ? '600' : '400'};
  
  &:hover {
    background-color: ${props => props.$active ? '#4a90e2' : '#f8f9fa'};
  }
  
  svg {
    font-size: 1rem;
    color: ${props => props.$active ? 'white' : '#4a90e2'};
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  overflow: hidden;
  border: 1px solid #edf2f7;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #edf2f7;
  
  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #2d3748;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const CardFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const FormRow = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormGroup = styled.div`
  width: 100%;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: #4a5568;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const LogoPreview = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const LogoPlaceholder = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  
  svg {
    font-size: 2.5rem;
    color: #aaa;
  }
`;

const LogoUpload = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e9ecef;
  }
  
  svg {
    color: #4a90e2;
  }
`;

const FieldHint = styled.div`
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #888;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #3a7bc8;
  }
  
  &:disabled {
    background-color: #a0c3e8;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 1rem;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #f8f9fa;
  color: #4a5568;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e9ecef;
  }
`;

// Custom styles for react-select
const SelectStyles = {
  control: (provided) => ({
    ...provided,
    border: '1px solid #ddd',
    borderRadius: '8px',
    minHeight: '42px',
    boxShadow: 'none',
    '&:hover': {
      border: '1px solid #4a90e2',
    },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#4a90e2' : state.isFocused ? '#f0f7ff' : null,
    color: state.isSelected ? 'white' : '#333',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#4a90e2',
      color: 'white',
    },
  }),
};

export default CompleteAgencyRegistrationForm;
