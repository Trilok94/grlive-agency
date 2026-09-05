import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  FaBuilding, 
  FaUserPlus, 
  FaHourglassHalf, 
  FaCheckCircle, 
  FaArrowLeft,
  FaExclamationCircle, 
  FaChartLine,
  FaUsers,
  FaMoneyBillWave,
  FaStream,
  FaSpinner,
  FaShieldAlt,
  FaEnvelope,
  FaCheck,
  FaTimes,
  FaEye,
  FaHeadset,
  FaIdBadge,
  FaRegLightbulb,
  FaRegCommentDots
} from 'react-icons/fa';
import RegisterAgencyForm from '../../components/agency/RegisterAgencyForm';
import CompleteAgencyRegistrationForm from '../../components/agency/CompleteAgencyRegistrationForm';
import JoinAgencyPage from './JoinAgencyPage';
import { agencyService } from '../../services/agencyService';
import { systemMessageService } from '../../services/systemMessageService';
import { authService } from '../../services/ParseService';
import AgencyApplication from '../../models/AgencyApplication';
import SystemMessage from '../../models/SystemMessage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Agent from '../../models/Agent';
import User from '../../models/User';
import ConfigService from '../../services/ConfigService';

const AgencyOptionsPage = () => {
  const [selectedOption, setSelectedOption] = useState(null); // 'register' or 'join'
  const [pendingApplication, setPendingApplication] = useState(null);
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const [previewAgency, setPreviewAgency] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [canJoinAgencyFromDashboard, setCanJoinAgencyFromDashboard] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const config = ConfigService.getInstance();
  
  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Check if joining agency from dashboard is enabled
  useEffect(() => {
    // Get the configuration setting
    const joinEnabled = config.getUserCanJoinAgencyFromDashboard();
    setCanJoinAgencyFromDashboard(joinEnabled);
  }, []);

  useEffect(() => {
    const checkPendingStatus = async () => {
      try {
        // Explicitly check if user is authenticated
        const user = authService.getCurrentUser();
        if (!user) {
          navigate('/');
          return;
        }

        // Check for pending application
        const pendingApp = await agencyService.checkPendingApplication(user);
        console.log('Pending application status:', pendingApp ? pendingApp.get(AgencyApplication.keys.STATUS) : 'none');
        setPendingApplication(pendingApp);
        
        // Check for pending invitation
        const pendingInv = await systemMessageService.checkPendingAgencyInvitation(user);
        setPendingInvitation(pendingInv);
      } catch (error) {
        console.error('Error checking pending status:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    // Only check if there's a current user
    if (currentUser) {
      checkPendingStatus();
    } else {
      navigate('/');
    }
  }, [navigate, currentUser]);

  // Handler for successful agency application submission
  const handleApplicationSubmitted = async (report) => {
    try {
      // Wait a moment for the server to create the AgencyApplication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the latest application data
      const user = authService.getCurrentUser();
      const latestApplication = await agencyService.checkPendingApplication(user);
      
      if (latestApplication) {
        setPendingApplication(latestApplication);
        setApplicationSubmitted(true);
      } else {
        // If we can't find the application yet, try again after a short delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryApplication = await agencyService.checkPendingApplication(user);
        setPendingApplication(retryApplication);
        setApplicationSubmitted(true);
      }
    } catch (error) {
      console.error('Error getting latest application data:', error);
      // Still set as submitted even if we can't get the latest data
      setApplicationSubmitted(true);
    }
  };

  const SuccessContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 2rem;
  `;

  const SuccessIcon = styled.div`
    color: #4CAF50;
    font-size: 5rem;
    margin-bottom: 1rem;
  `;

  const SuccessMessage = styled.p`
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: #333;
  `;

  // Handle invitation actions
  const handleInvitationAction = async (action) => {
    setProcessingInvitation(true);
    try {
      await systemMessageService.processAgencyInvitation(pendingInvitation.id, action);
      
      if (action === SystemMessage.systemMessageStatus.ACCEPTED) {
        toast.success(t('agencyOptions.invitationAccepted'));
        // Redirect to dashboard after accepting
        navigate('/dashboard');
      } else {
        toast.info(t('agencyOptions.invitationRejected'));
        // Refresh the page to show options again
        setPendingInvitation(null);
      }
    } catch (error) {
      console.error('Error processing invitation:', error);
      toast.error(t('agencyOptions.invitationError'));
    } finally {
      setProcessingInvitation(false);
    }
  };
  
  // Handle agency preview
  const handlePreviewAgency = () => {
    setPreviewAgency(true);
    setActiveTab('description');
  };
  
  // If previewing agency - show modal
  if (previewAgency && pendingInvitation) {
    const agency = pendingInvitation.get(SystemMessage.keys.AGENT);
    const agentUser = pendingInvitation.get(SystemMessage.keys.AUTHOR);
    return (
      <>
        <Container>
          <StatusCard>
            <StatusHeader>
              <StatusIcon $status="invitation">
                <FaEnvelope />
              </StatusIcon>
              <StatusInfo>
                <h2>{t('agencyOptions.invitationReceived')}</h2>
                <StatusBadge $status="pending">{t('agencyOptions.pendingInvitation')}</StatusBadge>
              </StatusInfo>
            </StatusHeader>
            
            <StatusMessage>
              <p>{t('agencyOptions.invitationMessage', { agencyName: agency.get('name') })}</p>
            </StatusMessage>
            
            <ActionButtonsContainer>
              <PreviewButton onClick={handlePreviewAgency} disabled={processingInvitation}>
                <FaEye />
                {t('agencyOptions.previewAgency')}
              </PreviewButton>
              <ActionButton onClick={() => handleInvitationAction(SystemMessage.systemMessageStatus.ACCEPTED)} disabled={processingInvitation}>
                {processingInvitation ? <FaSpinner className="spinner" /> : <FaCheck />}
                {t('agencyOptions.acceptInvitation')}
              </ActionButton>
              <RejectButton onClick={() => handleInvitationAction(SystemMessage.systemMessageStatus.REJECTED)} disabled={processingInvitation}>
                {processingInvitation ? <FaSpinner className="spinner" /> : <FaTimes />}
                {t('agencyOptions.rejectInvitation')}
              </RejectButton>
            </ActionButtonsContainer>
          </StatusCard>
        </Container>
        
        <AgencyDetailsContainer>
          <AgencyDetailsContent>
            <ModalHeader>
              <HeaderContent>
                <AgencyLogo>
                  {agency.get(Agent.keys.LOGO) || agentUser.get(User.keys.AVATAR_FILE) ? (
                    <img src={agency.get(Agent.keys.LOGO)?.url() || agentUser.get(User.keys.AVATAR_FILE)?.url()} alt={agency.get(Agent.keys.NAME)} />
                  ) : (
                    <FaBuilding />
                  )}
                </AgencyLogo>
                <div>
                  <h2>{agency.get(Agent.keys.NAME) || agentUser.get(User.keys.NAME)}</h2>
                  <AgencyId>ID: {agentUser.get(User.keys.UID)}</AgencyId>
                </div>
              </HeaderContent>
              <CloseButton onClick={() => setPreviewAgency(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            
            <TabContainer>
              <TabButton 
                $active={activeTab === 'description'}
                onClick={() => setActiveTab('description')}
              >
                <FaBuilding style={{ marginRight: '0.5rem' }} />
                {t('agency.join.details.tabs.description')}
              </TabButton>
              <TabButton 
                $active={activeTab === 'rules'}
                onClick={() => setActiveTab('rules')}
              >
                <FaShieldAlt style={{ marginRight: '0.5rem' }} />
                {t('agency.join.details.tabs.rules')}
              </TabButton>
              <TabButton 
                $active={activeTab === 'commissions'}
                onClick={() => setActiveTab('commissions')}
              >
                <FaMoneyBillWave style={{ marginRight: '0.5rem' }} />
                {t('agency.join.details.tabs.commissions')}
              </TabButton>
              <TabButton 
                $active={activeTab === 'support'}
                onClick={() => setActiveTab('support')}
              >
                <FaHeadset style={{ marginRight: '0.5rem' }} />
                {t('agency.join.details.tabs.support')}
              </TabButton>
            </TabContainer>

            <TabContent>
              {activeTab === 'description' && (
                <>
                  {(agency.get(Agent.keys.LOGO) || agentUser.get(User.keys.AVATAR_FILE)) && (
                    <img
                      src={(agency.get(Agent.keys.LOGO)?.url() || agentUser.get(User.keys.AVATAR_FILE)?.url())}
                      alt={agency.get(Agent.keys.NAME)}
                      style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                    />
                  )}
                  <p>{agency.get('description') || t('agency.join.details.noDescription')}</p>
                  <StatSection>
                    <StatItem>
                      <FaUsers />
                      <span>{t('agency.join.details.members', { count: agency.get(Agent.keys.HOST_IDS).length || 0 })}</span>
                    </StatItem>
                    <StatItem>
                      <FaIdBadge />
                      <span>{t('agencyOptions.agencyId')}: {agency.get(User.keys.UID)}</span>
                    </StatItem>
                    <StatItem>
                      <FaRegLightbulb />
                      <span>{t('agency.join.details.opportunities')}</span>
                    </StatItem>
                  </StatSection>
                </>
              )}
              {activeTab === 'rules' && (
                <>
                  <p>{agency.get(Agent.keys.RULES) || t('agency.join.details.noRules')}</p>
                  <StatSection>
                    <StatItem>
                      <FaShieldAlt />
                      <span>{t('agency.join.details.rulesProtection')}</span>
                    </StatItem>
                  </StatSection>
                </>
              )}
              {activeTab === 'commissions' && (
                <>
                  <p>{agency.get(Agent.keys.COMMISSIONS) || t('agency.join.details.noCommissions')}</p>
                  <StatSection>
                    <StatItem>
                      <FaMoneyBillWave />
                      <span>{t('agency.join.details.fairCommissions')}</span>
                    </StatItem>
                  </StatSection>
                </>
              )}
              {activeTab === 'support' && (
                <>
                  <p>{agency.get(Agent.keys.SUPPORT) || t('agency.join.details.noSupport')}</p>
                  <StatSection>
                    <StatItem>
                      <FaRegCommentDots />
                      <span>{t('agency.join.details.supportAvailable')}</span>
                    </StatItem>
                  </StatSection>
                </>
              )}
            </TabContent>


          </AgencyDetailsContent>
        </AgencyDetailsContainer>
      </>
    );
  }
  
  // If there's a pending invitation
  if (pendingInvitation) {
    const agency = pendingInvitation.get(SystemMessage.keys.AGENT);
    return (
      <Container>
        <StatusCard>
          <StatusHeader>
            <StatusIcon $status="invitation">
              <FaEnvelope />
            </StatusIcon>
            <StatusInfo>
              <h2>{t('agencyOptions.invitationReceived')}</h2>
              <StatusBadge $status="pending">{t('agencyOptions.pendingInvitation')}</StatusBadge>
            </StatusInfo>
          </StatusHeader>
          
          <StatusMessage>
            <p>{t('agencyOptions.invitationMessage', { agencyName: agency.get('name') })}</p>
          </StatusMessage>
          
          <ActionButtonsContainer>
            <PreviewButton onClick={handlePreviewAgency} disabled={processingInvitation}>
              <FaEye />
              {t('agencyOptions.previewAgency')}
            </PreviewButton>
            <ActionButton onClick={() => handleInvitationAction(SystemMessage.systemMessageStatus.ACCEPTED)} disabled={processingInvitation}>
              {processingInvitation ? <FaSpinner className="spinner" /> : <FaCheck />}
              {t('agencyOptions.acceptInvitation')}
            </ActionButton>
            <RejectButton onClick={() => handleInvitationAction(SystemMessage.systemMessageStatus.REJECTED)} disabled={processingInvitation}>
              {processingInvitation ? <FaSpinner className="spinner" /> : <FaTimes />}
              {t('agencyOptions.rejectInvitation')}
            </RejectButton>
          </ActionButtonsContainer>
        </StatusCard>
      </Container>
    );
  }
  
  // If application is submitted, show success view
  if (applicationSubmitted) {
    return (
      <Container>
        <StatusCard>
          <StatusHeader>
            <StatusIcon $status="approved">
              <FaCheckCircle />
            </StatusIcon>
            <StatusInfo>
              <h2>{t('agencyOptions.applicationSubmitted')}</h2>
              <StatusDate>
                {t('agencyOptions.submitted')}: {pendingApplication?.createdAt?.toLocaleDateString() || 'N/A'}
              </StatusDate>
            </StatusInfo>
          </StatusHeader>
          
          <StatusMessage>
            <p>{t('agencyOptions.applicationSubmittedMessage')}</p>
            <p>{t('agencyOptions.applicationReviewMessage')}</p>
          </StatusMessage>
          
          <ApplicationDetailsCard>
            <DetailsHeader>
              <FaBuilding />
              <h3>{t('agencyOptions.applicationDetails')}</h3>
            </DetailsHeader>
            
            <DetailsList>
              <DetailItem>
                <DetailLabel>{t('agencyOptions.agencyName')}</DetailLabel>
                <DetailValue>{pendingApplication?.agencyName || 'N/A'}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>{t('agencyOptions.contactEmail')}</DetailLabel>
                <DetailValue>{pendingApplication?.contactEmail || 'N/A'}</DetailValue>
              </DetailItem>
            </DetailsList>
          </ApplicationDetailsCard>
          
          <ActionButtonsContainer>
            <ActionButton onClick={() => window.location.reload()}>
              {t('agencyOptions.goToDashboard')}
            </ActionButton>
          </ActionButtonsContainer>
        </StatusCard>
      </Container>
    );
  }

  // If there's a pending application, show appropriate status
  if (pendingApplication) {
    const status = pendingApplication.get(AgencyApplication.keys.STATUS);
    console.log('Rendering with application status:', status);
    
    if (status === AgencyApplication.status.PENDING) {
      return (
        <Container>
          <PageHeader>
            <h1>{t('agencyOptions.applicationStatus')}</h1>
            <Subtitle>{t('agencyOptions.trackYourApplication')}</Subtitle>
          </PageHeader>
          
          <StatusCard>
            <StatusHeader>
              <StatusIcon $status="pending">
                <FaHourglassHalf />
              </StatusIcon>
              <StatusInfo>
                <h2>{t('agencyOptions.applicationInReview')}</h2>
                <StatusDate>
                  {t('agencyOptions.submitted')}: {pendingApplication.createdAt.toLocaleDateString()}
                </StatusDate>
              </StatusInfo>
            </StatusHeader>
            
            <StatusMessage>
              <p>{t('agencyOptions.applicationInReviewMessage')}</p>
              <p>{t('agencyOptions.applicationReviewMessage')}</p>
            </StatusMessage>
            
            <ApplicationDetailsCard>
              <DetailsHeader>
                <FaBuilding />
                <h3>{t('agencyOptions.applicationDetails')}</h3>
              </DetailsHeader>
              
              <DetailsList>
                <DetailItem>
                  <DetailLabel>{t('agencyOptions.agencyName')}</DetailLabel>
                  <DetailValue>{pendingApplication.get(AgencyApplication.keys.AGENCY_NAME)}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>{t('agencyOptions.contactEmail')}</DetailLabel>
                  <DetailValue>{pendingApplication.get(AgencyApplication.keys.CONTACT_EMAIL)}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>{t('agencyOptions.status')}</DetailLabel>
                  <DetailValue>
                    <StatusBadge $status="pending">{t('agencyOptions.pending')}</StatusBadge>
                  </DetailValue>
                </DetailItem>
              </DetailsList>
            </ApplicationDetailsCard>
          </StatusCard>
        </Container>
      );
    }
    
    if (status === AgencyApplication.status.COMPLETED) {
      console.log('Rendering COMPLETED status view');
      return (
        <Container>
          <PageHeader>
            <h1>{t('agencyOptions.applicationStatus')}</h1>
            <Subtitle>{t('agencyOptions.waitingForFinalApproval')}</Subtitle>
          </PageHeader>
          
          <StatusCard>
            <StatusHeader>
              <StatusIcon $status="pending">
                <FaHourglassHalf />
              </StatusIcon>
              <StatusInfo>
                <h2>{t('agencyOptions.applicationCompleted')}</h2>
                <StatusDate>
                  {t('agencyOptions.submitted')}: {pendingApplication.createdAt.toLocaleDateString()}
                </StatusDate>
              </StatusInfo>
            </StatusHeader>
            
            <StatusMessage>
              <p>{t('agencyOptions.applicationCompletedMessage')}</p>
            </StatusMessage>
            
            {pendingApplication.get(AgencyApplication.keys.MESSAGE) && (
              <MessageBox>
                <MessageHeader>
                  <FaRegCommentDots />
                  <h3>{t('agencyOptions.adminMessage')}</h3>
                </MessageHeader>
                <MessageContent>
                  {pendingApplication.get(AgencyApplication.keys.MESSAGE)}
                </MessageContent>
              </MessageBox>
            )}
          </StatusCard>
        </Container>
      );
    }
    
    if (status === AgencyApplication.status.ACCEPTED) {
      return (
        <Container>
          <PageHeader>
            <h1>{t('agencyOptions.applicationStatus')}</h1>
            <Subtitle>{t('agencyOptions.completeYourRegistration')}</Subtitle>
          </PageHeader>
          
          <StatusCard>
            <StatusHeader>
              <StatusIcon $status="accepted">
                <FaCheckCircle />
              </StatusIcon>
              <StatusInfo>
                <h2>{t('agencyOptions.applicationAccepted')}</h2>
                <StatusDate>
                  {t('agencyOptions.submitted')}: {pendingApplication.createdAt.toLocaleDateString()}
                </StatusDate>
              </StatusInfo>
            </StatusHeader>
            
            <StatusMessage>
              <p>{t('agencyOptions.applicationAcceptedMessage')}</p>
            </StatusMessage>
            
            {pendingApplication.get(AgencyApplication.keys.MESSAGE) && (
              <MessageBox>
                <MessageHeader>
                  <FaRegCommentDots />
                  <h3>{t('agencyOptions.adminMessage')}</h3>
                </MessageHeader>
                <MessageContent>
                  {pendingApplication.get(AgencyApplication.keys.MESSAGE)}
                </MessageContent>
              </MessageBox>
            )}
          </StatusCard>
          
          <div style={{ marginTop: '2rem' }}>
            <CompleteAgencyRegistrationForm 
              application={pendingApplication}
              onSuccess={(agent) => {
                // We'll handle navigation in the form component
                console.log('Agency registration completed', agent);
              }}
            />
          </div>
        </Container>
      );
    }
    
    if (status === AgencyApplication.status.REJECTED) {
      return (
        <Container>
          <PageHeader>
            <h1>{t('agencyOptions.applicationStatus')}</h1>
            <Subtitle>{t('agencyOptions.trackYourApplication')}</Subtitle>
          </PageHeader>
          
          <StatusCard>
            <StatusHeader>
              <StatusIcon $status="refused">
                <FaExclamationCircle />
              </StatusIcon>
              <StatusInfo>
                <h2>{t('agencyOptions.applicationRefused')}</h2>
                <StatusDate>
                  {t('agencyOptions.submitted')}: {pendingApplication.createdAt.toLocaleDateString()}
                </StatusDate>
              </StatusInfo>
            </StatusHeader>
            
            <StatusMessage>
              <p>{t('agencyOptions.applicationRefusedMessage')}</p>
            </StatusMessage>
            
            {pendingApplication.get(AgencyApplication.keys.MESSAGE) && (
              <MessageBox>
                <MessageHeader>
                  <FaExclamationCircle />
                  <h3>{t('agencyOptions.adminMessage')}</h3>
                </MessageHeader>
                <MessageContent>
                  {pendingApplication.get(AgencyApplication.keys.MESSAGE)}
                </MessageContent>
              </MessageBox>
            )}
            
            {/* <ActionButtonsContainer>
              <ActionButton onClick={() => setSelectedOption('register')}>
                {t('agencyOptions.tryAgain')}
              </ActionButton>
            </ActionButtonsContainer> */}
          </StatusCard>
        </Container>
      );
    }
  }

  if (selectedOption === 'register') {
    return (
      <>
        {!applicationSubmitted && (
          <BackButton onClick={() => setSelectedOption(null)}>{t('agencyOptions.backToOptions')}</BackButton>
        )}
        <RegisterAgencyForm 
          onSuccessfulSubmission={handleApplicationSubmitted} 
        />
      </>
    );
  }

  if (selectedOption === 'join' && canJoinAgencyFromDashboard) {
    return (
      <>
        {!applicationSubmitted && (
          <BackButton onClick={() => setSelectedOption(null)}>{t('agencyOptions.backToOptions')}</BackButton>
        )}
        <JoinAgencyPage />
      </>
    );
  }

  if (!pendingApplication && !pendingInvitation && !applicationSubmitted && !loading) {
    return (
      <Container>
        <PageHeader>
          <h1>{t('agencyOptions.chooseYourPath')}</h1>
          <Subtitle>{t('agencyOptions.selectHowToProceed')}</Subtitle>
        </PageHeader>

        <OptionsGrid>
          <OptionCard 
            $animate={animateCards} 
            $delay="0.1s" 
            onClick={() => setSelectedOption('register')}
          >
            <CardHeader>
              <IconCircle>
                <FaBuilding />
              </IconCircle>
              <h2>{t('agencyOptions.registerAgency')}</h2>
            </CardHeader>
            
            <CardDescription>
              {t('agencyOptions.registerAgencyDescription')}
            </CardDescription>
            
            <FeaturesList>
              <FeatureItem>
                <FeatureIcon><FaUsers /></FeatureIcon>
                <FeatureText>{t('agencyOptions.recruitAndManageStreamers')}</FeatureText>
              </FeatureItem>
              <FeatureItem>
                <FeatureIcon><FaMoneyBillWave /></FeatureIcon>
                <FeatureText>{t('agencyOptions.setCommissionRates')}</FeatureText>
              </FeatureItem>
              <FeatureItem>
                <FeatureIcon><FaChartLine /></FeatureIcon>
                <FeatureText>{t('agencyOptions.accessAgencyDashboard')}</FeatureText>
              </FeatureItem>
            </FeaturesList>
            
            <ActionButton>
              {t('agencyOptions.registerAgency')}
            </ActionButton>
          </OptionCard>

          {canJoinAgencyFromDashboard && (
            <OptionCard 
              $animate={animateCards} 
              $delay="0.3s" 
              onClick={() => setSelectedOption('join')}
            >
              <CardHeader>
                <IconCircle>
                  <FaUserPlus />
                </IconCircle>
                <h2>{t('agencyOptions.joinAgency')}</h2>
              </CardHeader>
              
              <CardDescription>
                {t('agencyOptions.joinAgencyDescription')}
              </CardDescription>
              
              <FeaturesList>
                <FeatureItem>
                  <FeatureIcon><FaStream /></FeatureIcon>
                  <FeatureText>{t('agencyOptions.findAgencyOpportunities')}</FeatureText>
                </FeatureItem>
                <FeatureItem>
                  <FeatureIcon><FaShieldAlt /></FeatureIcon>
                  <FeatureText>{t('agencyOptions.exploreAgencyBenefits')}</FeatureText>
                </FeatureItem>
                <FeatureItem>
                  <FeatureIcon><FaUserPlus /></FeatureIcon>
                  <FeatureText>{t('agencyOptions.applyToAgencies')}</FeatureText>
                </FeatureItem>
              </FeaturesList>
              
              <ActionButton>
                {t('agencyOptions.joinAgency')}
              </ActionButton>
            </OptionCard>
          )}  
        </OptionsGrid>
      </Container>
    );
  }
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const IconCircle = styled.div`
  background: linear-gradient(135deg, #4a90e2, #63b3ed);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  box-shadow: 0 5px 15px rgba(74, 144, 226, 0.3);
  
  svg {
    font-size: 1.5rem;
    color: white;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin: 1rem auto;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #4a5568;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: #3182ce;
  }
  
  svg {
    margin-right: 0.5rem;
    font-size: 0.9rem;
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem;
    margin-bottom: 1rem;
    min-height: 44px;
    
    svg {
      font-size: 0.85rem;
    }
  }
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-top: 1.5rem;
  }
`;

const OptionCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  opacity: ${props => props.$animate ? 1 : 0};
  transform: ${props => props.$animate ? 'translateX(0)' : 'translateX(-30px)'};
  transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  transition-delay: ${props => props.$delay || '0s'};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
    border-color: rgba(0, 0, 0, 0.1);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #4a90e2, #63b3ed);
    border-radius: 16px 16px 0 0;
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
    
    &:hover {
      transform: none;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.05);
    }
    
    &::before {
      border-radius: 12px 12px 0 0;
    }
  }
`;

const LoadingText = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #718096;
`;

const StatusCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  max-width: 700px;
  margin: 0 auto;
  animation: ${fadeIn} 0.5s ease-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const AgencyAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
  background-color: rgba(66, 153, 225, 0.1);
  overflow: hidden;
  border: 2px solid rgba(66, 153, 225, 0.2);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  svg {
    font-size: 1.8rem;
    color: #4299E1;
  }
  
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    margin-right: 0.75rem;
    
    svg {
      font-size: 1.5rem;
    }
  }
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const StatusIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.5rem;
  flex-shrink: 0;
  background-color: ${props => {
    switch(props.$status) {
      case 'pending': return 'rgba(246, 173, 85, 0.1)';
      case 'approved': return 'rgba(72, 187, 120, 0.1)';
      case 'refused': return 'rgba(245, 101, 101, 0.1)';
      default: return 'rgba(74, 144, 226, 0.1)';
    }
  }};
  
  svg {
    font-size: 1.5rem;
    color: ${props => {
      switch(props.$status) {
        case 'pending': return '#F6AD55';
        case 'approved': return '#48BB78';
        case 'refused': return '#F56565';
        default: return '#4A90E2';
      }
    }};
  }
`;

const ApplicationDetailsCard = styled.div`
  background-color: #f7fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const DetailsHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  
  svg {
    font-size: 1.2rem;
    color: #4a90e2;
    margin-right: 0.75rem;
  }
  
  h3 {
    margin: 0;
    color: #2d3748;
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

const DetailsList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailLabel = styled.span`
  color: #718096;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.span`
  color: #2d3748;
  font-weight: 500;
`;

const ApplicationDetails = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
  text-align: left;
  
  h3 {
    color: #2d3748;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    margin-bottom: 0.75rem;
    color: #4a5568;
  }
`;

const StatusInfo = styled.div`
  flex: 1;
  
  h2 {
    margin: 0 0 0.5rem 0;
    color: #2d3748;
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const StatusDate = styled.div`
  color: #718096;
  font-size: 0.9rem;
`;

const StatusMessage = styled.div`
  margin-bottom: 2rem;
  
  p {
    color: #4a5568;
    margin-bottom: 1rem;
    line-height: 1.6;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => {
    switch(props.$status) {
      case 'pending': return 'rgba(246, 173, 85, 0.1)';
      case 'approved': return 'rgba(72, 187, 120, 0.1)';
      case 'refused': return 'rgba(245, 101, 101, 0.1)';
      default: return 'rgba(74, 144, 226, 0.1)';
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'pending': return '#F6AD55';
      case 'approved': return '#48BB78';
      case 'refused': return '#F56565';
      default: return '#4A90E2';
    }
  }};
`;

const MessageBox = styled.div`
  background-color: rgba(245, 101, 101, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #F56565;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  
  svg {
    font-size: 1.2rem;
    color: #F56565;
    margin-right: 0.75rem;
  }
  
  h3 {
    margin: 0;
    color: #2d3748;
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

const MessageContent = styled.p`
  color: #4a5568;
  font-style: italic;
  margin: 0;
  line-height: 1.6;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  
  > button {
    width: 100%;
    max-width: 300px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 2.5rem;
  text-align: center;
  
  h1 {
    color: #2d3748;
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
`;

const Subtitle = styled.p`
  color: #718096;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto 1.5rem auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  
  .spinner {
    animation: spin 1s linear infinite;
    font-size: 2rem;
    color: #4a90e2;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h2 {
    margin: 0;
    color: #2d3748;
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const CardDescription = styled.p`
  color: #4a5568;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-size: 1rem;
`;

const FeaturesList = styled.div`
  margin-bottom: 2rem;
  width: 100%;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const FeatureIcon = styled.div`
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(74, 144, 226, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  
  svg {
    font-size: 0.9rem;
    color: #4a90e2;
  }
`;

const FeatureText = styled.span`
  color: #4a5568;
  font-size: 0.95rem;
`;

const ActionButton = styled.button`
  background: linear-gradient(90deg, #4a90e2, #63b3ed);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.9rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: auto;
  box-shadow: 0 4px 10px rgba(74, 144, 226, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    box-shadow: 0 6px 15px rgba(74, 144, 226, 0.3);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(74, 144, 226, 0.2);
  }
  
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
`;





const PreviewButton = styled.button`
  background: linear-gradient(90deg, #4a90e2, #63b3ed);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 10px rgba(74, 144, 226, 0.2);
  width: 100%;
  
  &:hover:not(:disabled) {
    box-shadow: 0 6px 15px rgba(74, 144, 226, 0.3);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const RejectButton = styled.button`
  background: white;
  color: #e53e3e;
  border: 1px solid #e53e3e;
  border-radius: 8px;
  padding: 0.8rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  
  &:hover:not(:disabled) {
    background: #fff5f5;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #f5f5f5;
    color: #a0aec0;
    border-color: #e2e8f0;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const AgencyBackButton = styled.button`
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: #4a5568;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
  align-self: flex-start;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  
  span {
    font-weight: 500;
  }
`;

// Modal components
const AgencyDetailsContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  backdrop-filter: blur(5px);
  animation: ${fadeIn} 0.3s ease-out;
  padding: 1rem;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const AgencyDetailsContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: ${fadeIn} 0.4s ease-out;
  position: relative;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c5c5c5;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  @media (max-width: 768px) {
    width: 95%;
    max-height: 85vh;
    border-radius: 12px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.5rem;
    color: #333;
  }
`;

const AgencyLogo = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background-color: rgba(66, 153, 225, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(66, 153, 225, 0.2);
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  svg {
    font-size: 1.8rem;
    color: #4299E1;
  }
`;

const AgencyId = styled.div`
  font-size: 0.85rem;
  color: #718096;
  font-weight: 500;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    padding: 1rem 1.25rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
  
  @media (max-width: 768px) {
    font-size: 1.35rem;
    padding: 0.5rem;
  }
`;

const TabContainer = styled.div`
  display: flex;
  background: #f7fafc;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c5c5c5;
    border-radius: 10px;
  }
  
  @media (max-width: 768px) {
    -webkit-overflow-scrolling: touch;
  }
`;

const TabButton = styled.button`
  background: none;
  border: none;
  padding: 1.25rem 2rem;
  font-size: 0.95rem;
  cursor: pointer;
  color: ${props => props.$active ? '#4a90e2' : '#718096'};
  transition: all 0.3s ease;
  position: relative;
  white-space: nowrap;
  font-weight: ${props => props.$active ? '600' : '400'};

  &:hover {
    color: #4a90e2;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: ${props => props.$active ? '#4a90e2' : 'transparent'};
    transition: all 0.3s ease;
  }
  
  @media (max-width: 768px) {
    padding: 1rem 1.25rem;
    font-size: 0.85rem;
    min-height: 44px;
    
    svg {
      font-size: 0.9rem;
      margin-right: 0.25rem;
    }
  }
`;

const TabContent = styled.div`
  padding: 2rem;
  
  p {
    color: #4a5568;
    line-height: 1.6;
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
  
  img {
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    
    p {
      font-size: 0.95rem;
      margin-bottom: 1rem;
    }
    
    img {
      border-radius: 6px;
      margin-bottom: 1rem;
    }
  }
`;

const StatSection = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  background-color: #f7fafc;
  border: 1px solid rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1.25rem;
    margin-top: 1.5rem;
    gap: 1.25rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  svg {
    color: #4a90e2;
    font-size: 1.25rem;
  }

  span {
    font-weight: 500;
    color: #2d3748;
  }
  
  @media (max-width: 768px) {
    gap: 0.5rem;
    
    svg {
      font-size: 1.1rem;
    }
    
    span {
      font-size: 0.95rem;
    }
  }
`;

export default AgencyOptionsPage;
