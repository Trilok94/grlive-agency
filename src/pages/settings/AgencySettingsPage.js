import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { 
  FaBuilding, 
  FaEdit, 
  FaSave, 
  FaImage, 
  FaCheck, 
  FaTimes, 
  FaSpinner,
  FaGlobe,
  FaEnvelope,
  FaIdBadge,
  FaShieldAlt,
  FaRegLightbulb,
  FaHeadset,
  FaMoneyBillWave,
  FaBriefcase,
  FaFileContract,
  FaUniversity,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaAddressCard,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Agent from '../../models/Agent';
import User from '../../models/User';
import PayoutMethod from '../../models/PayoutMethod';
import { agencyService } from '../../services/agencyService';
import Parse from 'parse';
import { countries } from '../../utils/helpers';
import ConfigService from '../../services/ConfigService';

const AgencySettingsPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agency, setAgency] = useState(null);
  const [agentUser, setAgentUser] = useState(null);
  const [fixedCommissionRate, setFixedCommissionRate] = useState(null);
  const [isCommissionFixed, setIsCommissionFixed] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [currentPayoutMethod, setCurrentPayoutMethod] = useState(null);
  
  // Country select states
  const [selectedCompanyCountry, setSelectedCompanyCountry] = useState(null);
  const [selectedBankingCountry, setSelectedBankingCountry] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [rules, setRules] = useState('');
  const [commissions, setCommissions] = useState('');
  const [support, setSupport] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Company info fields
  const [companyName, setCompanyName] = useState('');
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState('');
  const [companyTaxId, setCompanyTaxId] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyPostalCode, setCompanyPostalCode] = useState('');
  const [companyCountry, setCompanyCountry] = useState('');
  
  // Banking info fields - mandatory fields as specified
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountSurname, setBankAccountSurname] = useState('');
  const [bankingEmail, setBankingEmail] = useState('');
  const [bankingCountry, setBankingCountry] = useState('');
  const [bankingCity, setBankingCity] = useState('');
  const [accountId, setAccountId] = useState('');
  const [bankName, setBankName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');

  useEffect(() => {
    fetchAgencyData();
    // Get commission configuration from ConfigService
    const config = new ConfigService();
    setFixedCommissionRate(config.getAgentFixedCommissionAmount());
    setIsCommissionFixed(config.isAgentCommissionFixed());
  }, [currentUser]);

  const fetchAgencyData = async () => {
    try {
      setLoading(true);
      
      // Get the current user with included bank account payment method (vallet)
      const userQuery = new Parse.Query(Parse.User);
      userQuery.include(User.keys.PAYOUT_VALLET);
      const userWithPaymentMethods = await userQuery.get(currentUser.id);
      
      // Get the agent data for the current user
      const agentData = await agencyService.getAgentByUserId(userWithPaymentMethods.id);
      
      if (agentData) {
        setAgency(agentData);
        setAgentUser(userWithPaymentMethods);
        
        // Set form values
        setName(agentData.get(Agent.keys.NAME) || '');
        setDescription(agentData.get(Agent.keys.DESCRIPTION) || '');
        setWebsite(agentData.get(Agent.keys.COMPANY_WEBSITE) || '');
        setEmail(agentData.get(Agent.keys.EMAIL) || '');
        setRules(agentData.get(Agent.keys.RULES) || '');
        setCommissions(agentData.get(Agent.keys.COMMISSIONS) || '');
        setSupport(agentData.get(Agent.keys.SUPPORT) || '');
        
        // Set company info fields
        setCompanyName(agentData.get(Agent.keys.COMPANY_NAME) || '');
        setCompanyRegistrationNumber(agentData.get(Agent.keys.COMPANY_REGISTRATION_NUMBER) || '');
        setCompanyTaxId(agentData.get(Agent.keys.COMPANY_TAX_ID) || '');
        setCompanyAddress(agentData.get(Agent.keys.COMPANY_ADDRESS) || '');
        setCompanyCity(agentData.get(Agent.keys.COMPANY_CITY) || '');
        setCompanyPostalCode(agentData.get(Agent.keys.COMPANY_POSTAL_CODE) || '');
        setCompanyCountry(agentData.get(Agent.keys.COMPANY_COUNTRY) || '');
      
      // Set company country select value
    const companyCountryCode = agentData.get(Agent.keys.COMPANY_COUNTRY) || '';
    if (companyCountryCode) {
      // Find country by its code (value), not by its name (label)
      const countryOption = countries.find(c => c.value === companyCountryCode);
      if (countryOption) {
        setSelectedCompanyCountry(countryOption);
        // Also set the display value for reference
        setCompanyCountry(countryOption.label);
      }
    }
        
        // Only collect bank account payment method (vallet type)
        const paymentMethods = [];
        let defaultMethod = null;
        
        // Check for bank/vallet payment method (bank accounts are stored as vallet type)
        const valletMethod = userWithPaymentMethods.payoutVallet;
        if (valletMethod && hasPaymentMethodData(valletMethod)) {
          paymentMethods.push(valletMethod);
          defaultMethod = valletMethod;
        }
        
        setPayoutMethods(paymentMethods);
        
        if (defaultMethod) {
          setCurrentPayoutMethod(defaultMethod);
          
          // Always set payment method to 'bank' for UI display purposes
          // (bank accounts are stored as 'vallet' type in the database)
          setPaymentMethod('bank');
          
          setBankAccountName(defaultMethod.getName() || '');
          setBankAccountSurname(defaultMethod.getSurname() || '');
          setBankingEmail(defaultMethod.getEmail() || '');
          setBankingCountry(defaultMethod.getCountry() || '');
        
          // Set banking country select value
        const bankingCountryCode = defaultMethod.getCountry() || '';
        if (bankingCountryCode) {
          // Find country by its code (value), not by its name (label)
          const countryOption = countries.find(c => c.value === bankingCountryCode);
          if (countryOption) {
            setSelectedBankingCountry(countryOption);
            // Also set the display value for reference
            setBankingCountry(countryOption.label);
          }
        }
          setBankingCity(defaultMethod.getCity() || '');
          setAccountId(defaultMethod.getAccountId() || '');
          setBankName(defaultMethod.getBankName() || '');
          setPhoneNumber(defaultMethod.getPhoneNumber() || '');
        } else {
          // Default values if no payout method exists
          setBankAccountName('');
          setBankAccountSurname('');
          setBankingEmail('');
          setBankingCountry('');
          setBankingCity('');
          setAccountId('');
          setBankName('');
          setPhoneNumber('');
          setPaymentMethod('bank'); // Default to bank UI for new users
        }
        
        // Set logo preview if exists
        if (agentData.get(Agent.keys.LOGO)) {
          setLogoPreview(agentData.get(Agent.keys.LOGO).url());
        } else if (currentUser.get(User.keys.AVATAR_FILE)) {
          setLogoPreview(currentUser.get(User.keys.AVATAR_FILE).url());
        }
      } else {
        toast.error(t('settings.agency.notFound'));
      }
    } catch (error) {
      console.error('Error fetching agency data:', error);
      toast.error(t('settings.agency.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    
    if (!agency) return;
    
    try {
      setSaving(true);
      
      // Update agency data
      agency.set(Agent.keys.NAME, name);
      agency.set(Agent.keys.DESCRIPTION, description);
      agency.set(Agent.keys.COMPANY_WEBSITE, website);
      agency.set(Agent.keys.EMAIL, email);
      
      // Handle logo upload if changed
      if (logoFile) {
        const parseFile = new Parse.File(logoFile.name, logoFile);
        await parseFile.save();
        agency.set(Agent.keys.LOGO, parseFile);
      }
      
      await agency.save();
      toast.success(t('settings.agency.saveSuccess'));
    } catch (error) {
      console.error('Error saving agency data:', error);
      toast.error(t('settings.agency.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRules = async (e) => {
    e.preventDefault();
    
    if (!agency) return;
    
    try {
      setSaving(true);
      agency.set(Agent.keys.RULES, rules);
      await agency.save();
      toast.success(t('settings.agency.rulesUpdated'));
    } catch (error) {
      console.error('Error saving agency rules:', error);
      toast.error(t('settings.agency.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCommissions = async (e) => {
    e.preventDefault();
    
    if (!agency) return;
    
    try {
      setSaving(true);
      agency.set(Agent.keys.COMMISSIONS, commissions);
      await agency.save();
      toast.success(t('settings.agency.commissionsUpdated'));
    } catch (error) {
      console.error('Error saving agency commissions:', error);
      toast.error(t('settings.agency.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSupport = async (e) => {
    e.preventDefault();
    
    if (!agency) return;
    
    try {
      setSaving(true);
      agency.set(Agent.keys.SUPPORT, support);
      await agency.save();
      toast.success(t('settings.agency.supportUpdated'));
    } catch (error) {
      console.error('Error saving agency support:', error);
      toast.error(t('settings.agency.saveError'));
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveCompanyInfo = async (e) => {
    e.preventDefault();
    
    if (!agency) return;
    
    try {
      setSaving(true);
      
      // Update company info fields
      agency.set(Agent.keys.COMPANY_NAME, companyName);
      agency.set(Agent.keys.COMPANY_REGISTRATION_NUMBER, companyRegistrationNumber);
      agency.set(Agent.keys.COMPANY_TAX_ID, companyTaxId);
      agency.set(Agent.keys.COMPANY_ADDRESS, companyAddress);
      agency.set(Agent.keys.COMPANY_CITY, companyCity);
      agency.set(Agent.keys.COMPANY_POSTAL_CODE, companyPostalCode);
      // Save the country code (value) instead of the country name (label)
    agency.set(Agent.keys.COMPANY_COUNTRY, selectedCompanyCountry ? selectedCompanyCountry.value : '');
      
      await agency.save();
      toast.success(t('settings.agency.companyInfoUpdated'));
    } catch (error) {
      console.error('Error saving company info:', error);
      toast.error(t('settings.agency.saveError'));
    } finally {
      setSaving(false);
    }
  };
  
  // Helper function to check if a bank account payment method has meaningful data
  const hasPaymentMethodData = (method) => {
    if (!method) return false;
    
    // For bank accounts (vallet type), check for required fields
    return !!method.getName() || !!method.getSurname() || !!method.getBankName() || !!method.getAccountId();
  };
  
  const handleSaveBankingInfo = async (e) => {
    e.preventDefault();
    
    if (!agency) return;
    
    try {
      setSaving(true);
      
      // For bank accounts, we always use type 'vallet' in the database
      const actualPaymentMethod = PayoutMethod.paymentMethods.VALLET;
      
      // Prepare data for the payout method with mandatory fields
      const payoutData = {
        paymentMethod: actualPaymentMethod,
        name: bankAccountName,
        surname: bankAccountSurname,
        email: bankingEmail,
        // Use country code (value) instead of country name (label)
        country: selectedBankingCountry ? selectedBankingCountry.value : '',
        city: bankingCity,
        accountId: accountId,
        bankName: bankName,
        phoneNumber: phoneNumber
      };
      
      // If we already have a payout method, update it
      if (currentPayoutMethod) {
        // Update existing payout method
        // For bank accounts, we need to use type 'vallet' in the database
        currentPayoutMethod.setPaymentMethod(actualPaymentMethod);
        
        if (paymentMethod === PayoutMethod.paymentMethods.PAYPAL) {
          currentPayoutMethod.setEmail(email || currentUser.get(User.keys.EMAIL) || '');
        } else {
          // Set mandatory bank fields
          currentPayoutMethod.setName(bankAccountName);
          currentPayoutMethod.setSurname(bankAccountSurname);
          currentPayoutMethod.setEmail(bankingEmail);
          currentPayoutMethod.setCountry(selectedBankingCountry ? selectedBankingCountry.value : '');
          currentPayoutMethod.setCity(bankingCity);
          currentPayoutMethod.setAccountId(accountId);
          currentPayoutMethod.setBankName(bankName);
          currentPayoutMethod.setPhoneNumber(phoneNumber);
        }
        
        await currentPayoutMethod.save();
        
        // Update the user's selected payment method pointer
        currentUser.set(User.keys.SELECTED_PAYMENT_METHOD, currentPayoutMethod);
        
        // Always set the VALLET pointer for bank accounts
        currentUser.set(User.keys.PAYOUT_VALLET, currentPayoutMethod);
        
        await currentUser.save();
      } else {
        // Create a new payout method
        const newPayoutMethod = await PayoutMethod.createPayoutMethod(payoutData, currentUser);
        setCurrentPayoutMethod(newPayoutMethod);
        setPayoutMethods([...payoutMethods, newPayoutMethod]);
        
        // Update the user's selected payment method pointer
        currentUser.set(User.keys.SELECTED_PAYMENT_METHOD, newPayoutMethod);
        
        // Always set the VALLET pointer for bank accounts
        currentUser.set(User.keys.PAYOUT_VALLET, newPayoutMethod);
        
        await currentUser.save();
      }
      
      toast.success(t('settings.agency.bankingInfoUpdated'));
    } catch (error) {
      console.error('Error saving banking info:', error);
      toast.error(t('settings.agency.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <FaSpinner className="spinner" />
        <p>{t('settings.loading')}</p>
      </LoadingContainer>
    );
  }

  if (!agency) {
    return (
      <ErrorContainer>
        <FaTimes />
        <h2>{t('settings.agency.notFound')}</h2>
        <p>{t('settings.agency.createFirst')}</p>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <PageHeader>
        <h1>
          <FaBuilding />
          {t('settings.agency.title')}
        </h1>
        <p>{t('settings.agency.subtitle')}</p>
      </PageHeader>

      <SettingsLayout>
        <TabsContainer>
          <TabButton 
            $active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')}
          >
            <FaBuilding />
            {t('settings.agency.tabs.general')}
          </TabButton>
          <TabButton 
            $active={activeTab === 'company'} 
            onClick={() => setActiveTab('company')}
          >
            <FaBriefcase />
            {t('settings.agency.tabs.company')}
          </TabButton>
          <TabButton 
            $active={activeTab === 'banking'} 
            onClick={() => setActiveTab('banking')}
          >
            <FaUniversity />
            {t('settings.agency.tabs.banking')}
          </TabButton>
          <TabButton 
            $active={activeTab === 'rules'} 
            onClick={() => setActiveTab('rules')}
          >
            <FaShieldAlt />
            {t('settings.agency.tabs.rules')}
          </TabButton>
          <TabButton 
            $active={activeTab === 'commissions'} 
            onClick={() => setActiveTab('commissions')}
          >
            <FaMoneyBillWave />
            {t('settings.agency.tabs.commissions')}
          </TabButton>
          <TabButton 
            $active={activeTab === 'support'} 
            onClick={() => setActiveTab('support')}
          >
            <FaHeadset />
            {t('settings.agency.tabs.support')}
          </TabButton>
        </TabsContainer>

        <SettingsContent>
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral}>
              <SettingsCard>
                <CardHeader>
                  <h2>{t('settings.agency.generalInfo')}</h2>
                </CardHeader>
                <CardContent>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="agencyName">
                        <FaBuilding />
                        {t('settings.agency.name')}
                      </Label>
                      <Input
                        id="agencyName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('settings.agency.namePlaceholder')}
                        required
                      />
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="agencyDescription">
                        <FaRegLightbulb />
                        {t('settings.agency.description')}
                      </Label>
                      <Textarea
                        id="agencyDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('settings.agency.descriptionPlaceholder')}
                        rows={4}
                      />
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="agencyWebsite">
                        <FaGlobe />
                        {t('settings.agency.agencyWebsite')}
                      </Label>
                      <Input
                        id="agencyWebsite"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder={t('settings.agency.agencyWebsitePlaceholder')}
                      />
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="agencyEmail">
                        <FaEnvelope />
                        {t('settings.agency.contactEmail')}
                      </Label>
                      <Input
                        id="agencyEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('settings.agency.contactEmailPlaceholder')}
                      />
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="agencyLogo">
                        <FaImage />
                        {t('settings.agency.logo')}
                      </Label>
                      <LogoContainer>
                        {logoPreview ? (
                          <LogoPreview>
                            <img src={logoPreview} alt="Agency Logo Preview" />
                          </LogoPreview>
                        ) : (
                          <LogoPlaceholder>
                            <FaBuilding />
                          </LogoPlaceholder>
                        )}
                        <LogoUpload>
                          <input
                            id="agencyLogo"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            style={{ display: 'none' }}
                          />
                          <UploadButton
                            type="button"
                            onClick={() => document.getElementById('agencyLogo').click()}
                          >
                            <FaEdit />
                            {t('settings.agency.changeLogo')}
                          </UploadButton>
                        </LogoUpload>
                      </LogoContainer>
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label>
                        <FaIdBadge />
                        {t('settings.agency.id')}
                      </Label>
                      <ReadOnlyField>
                        {agentUser?.get(User.keys.UID) || '-'}
                      </ReadOnlyField>
                      <FieldHint>{t('settings.agency.idHint')}</FieldHint>
                    </FormGroup>
                  </FormRow>
                </CardContent>
                <CardFooter>
                  <SaveButton type="submit" disabled={saving}>
                    {saving ? <FaSpinner className="spinner" /> : <FaSave />}
                    {t('settings.save')}
                  </SaveButton>
                </CardFooter>
              </SettingsCard>
            </form>
          )}

          {activeTab === 'rules' && (
            <form onSubmit={handleSaveRules}>
              <SettingsCard>
                <CardHeader>
                  <h2>{t('settings.agency.tabs.rules')}</h2>
                  <p>{t('settings.agency.rulesDescription')}</p>
                </CardHeader>
                <CardContent>
                  <FormRow>
                    <FormGroup>
                      {/* Non-editable standard rules section */}
                      <Label>Standard Rules (Non-editable)</Label>
                      <div style={{ marginBottom: '20px' }}>
                        <ReadOnlyRules>
                          <h3>1. Minimum Presence</h3>
                          <ul>
                            <li>Broadcast at least 30 hours per month.</li>
                            <li>Be active on the pre-established days communicated by the agency.</li>
                          </ul>
                          
                          <h3>2. Behavior in Live</h3>
                          <ul>
                            <li>Maintain polite and professional language.</li>
                            <li>It is forbidden to insult, argue, or discuss sensitive topics (politics, religion, etc.).</li>
                            <li>Follow the platform's guidelines.</li>
                          </ul>
                          
                          <h3>3. Appearance and Environment</h3>
                          <ul>
                            <li>Clear and tidy framing.</li>
                            <li>Proper lighting and clear audio.</li>
                            <li>Well-groomed look, consistent with the agency's image.</li>
                          </ul>
                          
                          <h3>4. Audience Engagement</h3>
                          <ul>
                            <li>Actively interact with viewers.</li>
                            <li>Thank for gifts/donations.</li>
                            <li>Stimulate conversation in a positive way.</li>
                          </ul>
                          
                          <h3>5. Exclusivity</h3>
                          <ul>
                            <li>Work exclusively with the agency for the agreed platform.</li>
                            <li>Communication with other agencies must be authorized.</li>
                          </ul>
                          
                          <h3>6. Payments and Bonuses</h3>
                          <ul>
                            <li>Payments are made as decided by the platform.</li>
                            <li>Bonuses and prizes are communicated separately.</li>
                            <li>Follow terms and conditions to receive credit.</li>
                          </ul>
                          
                          <h3>7. Communication</h3>
                          <ul>
                            <li>Be available for updates via WhatsApp, Telegram, or email.</li>
                            <li>Respond to agency communications within 24 hours.</li>
                          </ul>
                          
                          <h3>8. Prohibited Content</h3>
                          <ul>
                            <li>It is forbidden to show nudity or sexually explicit content in public live sessions.</li>
                            <li>It is forbidden to promote alcohol, drugs, or dangerous behaviors.</li>
                          </ul>
                          
                          <h3>9. Confidentiality</h3>
                          <ul>
                            <li>Do not disclose agreements, strategies, or internal information of the agency.</li>
                          </ul>
                          
                          <h3>10. Violations</h3>
                          <ul>
                            <li>In case of rule violations, the host may receive a warning.</li>
                            <li>Repeated violations may result in termination of the contract.</li>
                          </ul>
                        </ReadOnlyRules>
                      </div>
                      
                      {/* Additional rules section that agencies can edit */}
                      <Label>{t('settings.agency.additionalRules')}</Label>
                      <Textarea
                        id="agencyRules"
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                        placeholder={t('settings.agency.additionalRulesPlaceholder')}
                        rows={7}
                      />
                    </FormGroup>
                  </FormRow>
                </CardContent>
                <CardFooter>
                  <SaveButton type="submit" disabled={saving}>
                    {saving ? <FaSpinner className="spinner" /> : <FaSave />}
                    {t('settings.save')}
                  </SaveButton>
                </CardFooter>
              </SettingsCard>
            </form>
          )}

          {activeTab === 'commissions' && (
            <form onSubmit={handleSaveCommissions}>
              <SettingsCard>
                <CardHeader>
                  <h2>{t('settings.agency.tabs.commissions')}</h2>
                  <p>{t('settings.agency.commissionsDescription')}</p>
                </CardHeader>
                <CardContent>
                  {/* Fixed Commission Rate (read-only) */}
                  <FormRow>
                    <FormGroup>
                      <Label>{t('settings.agency.fixedCommissionRate')}</Label>
                      <ReadOnlyField>
                        {isCommissionFixed ? 
                          `${fixedCommissionRate}% ${t('settings.agency.fixedCommissionExplanation')}` :
                          t('settings.agency.commissionNotFixed')}
                      </ReadOnlyField>
                      <FieldHint>{t('settings.agency.commissionRateNote')}</FieldHint>
                    </FormGroup>
                  </FormRow>
                  
                  {/* Editable incentives and compensation rules */}
                  <FormRow>
                    <FormGroup>
                      <Label>{t('settings.agency.incentivesAndCompensation')}</Label>
                      <Textarea
                        id="agencyCommissions"
                        value={commissions}
                        onChange={(e) => setCommissions(e.target.value)}
                        placeholder={t('settings.agency.incentivesPlaceholder')}
                        rows={8}
                      />
                      <FieldHint>{t('settings.agency.incentivesHint')}</FieldHint>
                    </FormGroup>
                  </FormRow>
                </CardContent>
                <CardFooter>
                  <SaveButton type="submit" disabled={saving}>
                    {saving ? <FaSpinner className="spinner" /> : <FaSave />}
                    {t('settings.save')}
                  </SaveButton>
                </CardFooter>
              </SettingsCard>
            </form>
          )}

          {activeTab === 'support' && (
            <form onSubmit={handleSaveSupport}>
              <SettingsCard>
                <CardHeader>
                  <h2>{t('settings.agency.tabs.support')}</h2>
                  <p>{t('settings.agency.supportDescription')}</p>
                </CardHeader>
                <CardContent>
                  <FormRow>
                    <FormGroup>
                      <Textarea
                        id="agencySupport"
                        value={support}
                        onChange={(e) => setSupport(e.target.value)}
                        placeholder={t('settings.agency.supportPlaceholder')}
                        rows={10}
                      />
                    </FormGroup>
                  </FormRow>
                </CardContent>
                <CardFooter>
                  <SaveButton type="submit" disabled={saving}>
                    {saving ? <FaSpinner className="spinner" /> : <FaSave />}
                    {t('settings.save')}
                  </SaveButton>
                </CardFooter>
              </SettingsCard>
            </form>
          )}
          
          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompanyInfo}>
              <SettingsCard>
                <CardHeader>
                  <h2>{t('settings.agency.tabs.company')}</h2>
                  <p>{t('settings.agency.companyInfoDescription')}</p>
                </CardHeader>
                <CardContent>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="companyName">
                        <FaBriefcase />
                        {t('settings.agency.companyName')}
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={t('settings.agency.companyNamePlaceholder')}
                      />
                    </FormGroup>
                  </FormRow>
                  
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="companyRegistrationNumber">
                        <FaFileContract />
                        {t('settings.agency.companyRegistrationNumber')}
                      </Label>
                      <Input
                        id="companyRegistrationNumber"
                        type="text"
                        value={companyRegistrationNumber}
                        onChange={(e) => setCompanyRegistrationNumber(e.target.value)}
                        placeholder={t('settings.agency.companyRegistrationNumberPlaceholder')}
                      />
                    </FormGroup>
                  </FormRow>
                  
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="companyTaxId">
                        <FaFileInvoiceDollar />
                        {t('settings.agency.companyTaxId')}
                      </Label>
                      <Input
                        id="companyTaxId"
                        type="text"
                        value={companyTaxId}
                        onChange={(e) => setCompanyTaxId(e.target.value)}
                        placeholder={t('settings.agency.companyTaxIdPlaceholder')}
                      />
                    </FormGroup>
                  </FormRow>
                  
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="companyAddress">
                        <FaAddressCard />
                        {t('settings.agency.companyAddress')}
                      </Label>
                      <Input
                        id="companyAddress"
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder={t('settings.agency.companyAddressPlaceholder')}
                      />
                    </FormGroup>
                  </FormRow>
                  
                  <FormRow>
                    <FormGroup style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <Label htmlFor="companyCity">
                          {t('settings.agency.companyCity')}
                        </Label>
                        <Input
                          id="companyCity"
                          type="text"
                          value={companyCity}
                          onChange={(e) => setCompanyCity(e.target.value)}
                          placeholder={t('settings.agency.companyCityPlaceholder')}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Label htmlFor="companyPostalCode">
                          {t('settings.agency.companyPostalCode')}
                        </Label>
                        <Input
                          id="companyPostalCode"
                          type="text"
                          value={companyPostalCode}
                          onChange={(e) => setCompanyPostalCode(e.target.value)}
                          placeholder={t('settings.agency.companyPostalCodePlaceholder')}
                        />
                      </div>
                    </FormGroup>
                  </FormRow>
                  
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="companyCountry">
                        {t('settings.agency.companyCountry')}
                      </Label>
                      <Select
                        id="companyCountry"
                        options={countries}
                        value={selectedCompanyCountry}
                        onChange={setSelectedCompanyCountry}
                        placeholder={t('settings.agency.companyCountryPlaceholder')}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </FormGroup>
                  </FormRow>
                </CardContent>
                <CardFooter>
                  <SaveButton type="submit" disabled={saving}>
                    {saving ? <FaSpinner className="spinner" /> : <FaSave />}
                    {t('settings.save')}
                  </SaveButton>
                </CardFooter>
              </SettingsCard>
            </form>
          )}
          
          {activeTab === 'banking' && (
            <form onSubmit={handleSaveBankingInfo}>
              <SettingsCard>
                <CardHeader>
                  <h2>{t('settings.agency.tabs.banking')}</h2>
                  <p>{t('settings.agency.bankingInfoDescription')}</p>
                </CardHeader>
                <CardContent>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="paymentMethod">
                        <FaMoneyBillWave />
                        {t('settings.agency.paymentMethod')}
                      </Label>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <PaymentMethodOption 
                          $active={true}
                          type="button"
                          disabled
                        >
                          <FaUniversity />
                          {t('settings.agency.paymentMethods.bank')}
                        </PaymentMethodOption>
                      </div>
                    </FormGroup>
                  </FormRow>
                  
                  {/* Always show bank account fields */}
                    <>
                      <FormRow>
                        <FormGroup>
                          <Label htmlFor="bankAccountName">
                            <FaUser />
                            {t('settings.agency.firstName')}
                          </Label>
                          <Input
                            id="bankAccountName"
                            type="text"
                            value={bankAccountName}
                            onChange={(e) => setBankAccountName(e.target.value)}
                            placeholder={t('settings.agency.firstNamePlaceholder')}
                            required
                          />
                        </FormGroup>
                      </FormRow>
                      
                      <FormRow>
                        <FormGroup>
                          <Label htmlFor="bankAccountSurname">
                            <FaUser />
                            {t('settings.agency.surname')}
                          </Label>
                          <Input
                            id="bankAccountSurname"
                            type="text"
                            value={bankAccountSurname}
                            onChange={(e) => setBankAccountSurname(e.target.value)}
                            placeholder={t('settings.agency.surnamePlaceholder')}
                            required
                          />
                        </FormGroup>
                      </FormRow>
                      
                      <FormRow>
                        <FormGroup>
                          <Label htmlFor="bankingEmail">
                            <FaEnvelope />
                            {t('settings.agency.bankingEmail')}
                          </Label>
                          <Input
                            id="bankingEmail"
                            type="email"
                            value={bankingEmail}
                            onChange={(e) => setBankingEmail(e.target.value)}
                            placeholder={t('settings.agency.bankingEmailPlaceholder')}
                            required
                          />
                        </FormGroup>
                      </FormRow>
                      
                      <FormRow>
                        <FormGroup>
                          <Label htmlFor="bankingCountry">
                            <FaGlobe />
                            {t('settings.agency.bankingCountry')}
                          </Label>
                          <Select
                            id="bankingCountry"
                            options={countries}
                            value={selectedBankingCountry}
                            onChange={setSelectedBankingCountry}
                            placeholder={t('settings.agency.bankingCountryPlaceholder')}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            required
                          />
                        </FormGroup>
                      </FormRow>
                      
                      <FormRow>
                        <FormGroup>
                          <Label htmlFor="bankingCity">
                            <FaBuilding />
                            {t('settings.agency.bankingCity')}
                          </Label>
                          <Input
                            id="bankingCity"
                            type="text"
                            value={bankingCity}
                            onChange={(e) => setBankingCity(e.target.value)}
                            placeholder={t('settings.agency.bankingCityPlaceholder')}
                            required
                          />
                        </FormGroup>
                      </FormRow>
                      
                      <FormRow>
                        <FormGroup>
                          <Label htmlFor="accountId">
                            <FaIdBadge />
                            {t('settings.agency.accountId')}
                          </Label>
                          <Input
                            id="accountId"
                            type="text"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            placeholder={t('settings.agency.accountIdPlaceholder')}
                            required
                          />
                        </FormGroup>
                      </FormRow>
                      
                      <FormRow>
                        <FormGroup>
                          <Label htmlFor="bankName">
                            <FaUniversity />
                            {t('settings.agency.bankName')}
                          </Label>
                          <Input
                            id="bankName"
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder={t('settings.agency.bankNamePlaceholder')}
                            required
                          />
                        </FormGroup>
                      </FormRow>
                      
                      <FormRow>
                        <FormGroup>
                          <Label htmlFor="phoneNumber">
                            <FaHeadset />
                            {t('settings.agency.phoneNumber')}
                          </Label>
                          <Input
                            id="phoneNumber"
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder={t('settings.agency.phoneNumberPlaceholder')}
                            required
                          />
                        </FormGroup>
                      </FormRow>
                    </>
                  
                </CardContent>
                <CardFooter>
                  <SaveButton type="submit" disabled={saving}>
                    {saving ? <FaSpinner className="spinner" /> : <FaSave />}
                    {t('settings.save')}
                  </SaveButton>
                </CardFooter>
              </SettingsCard>
            </form>
          )}
        </SettingsContent>
      </SettingsLayout>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.8rem;
    color: #333;
    margin-bottom: 0.5rem;
    
    svg {
      color: #4a90e2;
    }
  }
  
  p {
    color: #666;
    font-size: 1rem;
  }
`;

const SettingsLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
  
  @media (max-width: 767px) {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    
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
  border: 1px solid ${props => props.$active ? '#4a90e2' : '#ddd'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-weight: ${props => props.$active ? '600' : '400'};
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.$active ? '#4a90e2' : '#f8f9fa'};
  }
  
  svg {
    font-size: 1.1rem;
    color: ${props => props.$active ? 'white' : '#4a90e2'};
  }
  
  @media (max-width: 767px) {
    flex: 1;
    justify-content: center;
  }
`;

const SettingsContent = styled.div`
  flex: 1;
`;

const SettingsCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  
  h2 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: #333;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  
  svg {
    color: #4a90e2;
    font-size: 1rem;
  }
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
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
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

const ReadOnlyField = styled.div`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f8f9fa;
  color: #666;
`;

const ReadOnlyRules = styled.div`
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: #f8f9fa;
  color: #333;
  max-height: 400px;
  overflow-y: auto;
  
  h3 {
    font-size: 1rem;
    margin: 1rem 0 0.5rem;
    color: #4a90e2;
    &:first-of-type {
      margin-top: 0;
    }
  }
  
  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  
  li {
    margin-bottom: 0.4rem;
    line-height: 1.4;
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

const PaymentMethodOption = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.$active ? '#4a90e2' : '#f8f9fa'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: 1px solid ${props => props.$active ? '#4a90e2' : '#ddd'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: ${props => props.$active ? '500' : 'normal'};
  flex: 1;
  
  &:hover {
    background-color: ${props => props.$active ? '#3a7bc8' : '#e9ecef'};
  }
  
  svg {
    color: ${props => props.$active ? 'white' : '#4a90e2'};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  
  .spinner {
    font-size: 2rem;
    color: #4a90e2;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  p {
    color: #666;
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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  
  svg {
    font-size: 3rem;
    color: #e74c3c;
    margin-bottom: 1rem;
  }
  
  h2 {
    margin: 0 0 1rem 0;
    color: #333;
  }
  
  p {
    color: #666;
    max-width: 500px;
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

export default AgencySettingsPage;
