import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FaUserTie, FaEnvelope, FaBuilding, FaSpinner, FaGavel, FaPercentage, FaHeadset, FaSignOutAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Agent from '../../models/Agent';
import { toast } from 'react-toastify';
import Parse, { User } from 'parse';
import UserModel from '../../models/User';
import AgencyInvitation from '../../models/AgencyInvitation';
import SystemMessage from '../../models/SystemMessage';
import Host from '../../models/Host';

const AgentDetailsContainer = styled.div`
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 100%;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 12px;
  }
`;

const AgentHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1a2a6c 0%, #2a3a7c 100%);
  border-radius: 12px;
  color: white;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 30%;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 100%);
    transform: skewX(-15deg) translateX(50%);
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    text-align: center;
    border-radius: 10px;
  }
`;

const AgentAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 16px;
  background: ${props => props.$hasImage ? 'none' : 'rgba(255,255,255,0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 2rem;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border: 3px solid rgba(255,255,255,0.2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    font-size: 48px;
    color: rgba(255,255,255,0.9);
  }
  
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    margin-right: 0;
    margin-bottom: 1.25rem;
    border-radius: 12px;
  }
`;

const AgentInfo = styled.div`
  flex: 1;
  
  h2 {
    font-size: 2rem;
    margin: 0 0 0.5rem;
    color: white;
    font-weight: 600;
  }

  p {
    color: rgba(255,255,255,0.8);
    font-size: 1.1rem;
    margin: 0;
  }
  
  @media (max-width: 768px) {
    h2 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem;
    }
    
    p {
      font-size: 1rem;
    }
  }
`;

const AgentName = styled.h2`
  margin: 0 0 5px 0;
  color: #333;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin: 1.5rem 0;
  }
`;

const TabsContainer = styled.div`
  margin-top: 2rem;
`;

const TabList = styled.div`
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid #eee;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
`;

const TabButton = styled.button`
  padding: 0.8rem 1.5rem;
  background: none;
  border: none;
  color: ${props => props.$active ? '#1a2a6c' : '#666'};
  font-weight: ${props => props.$active ? '600' : '400'};
  font-size: 1rem;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.$active ? '#1a2a6c' : 'transparent'};
    transition: all 0.3s ease;
  }

  &:hover {
    color: #1a2a6c;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    flex: 1 0 auto;
    min-width: 40%;
    text-align: center;
    min-height: 44px;
    touch-action: manipulation;
  }
`;

const TabContent = styled.div`
  display: ${props => props.$active ? 'block' : 'none'};
`;

const AgentStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #eee;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  p {
    margin: 0;
    font-size: 1.8rem;
    color: #1a2a6c;
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 10px;
    
    &:hover {
      transform: none;
    }
    
    h4 {
      font-size: 0.8rem;
    }
    
    p {
      font-size: 1.5rem;
    }
  }
`;

const InfoSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: #f8f9fa;
  border: 1px solid #eee;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  h3 {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 1rem;
    color: #1a2a6c;
    font-size: 1.2rem;

    svg {
      color: #2a3a7c;
    }
  }

  p {
    color: #444;
    line-height: 1.8;
    white-space: pre-line;
    font-size: 1rem;
  }
  
  @media (max-width: 768px) {
    margin-top: 1.5rem;
    padding: 1.25rem;
    border-radius: 10px;
    
    h3 {
      font-size: 1.1rem;
      gap: 0.6rem;
      margin-bottom: 0.8rem;
      flex-wrap: wrap;
    }
    
    p {
      font-size: 0.95rem;
      line-height: 1.6;
    }
  }
`;

const ContactInfo = styled(InfoSection)`
  margin-top: 20px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  
  svg {
    margin-right: 10px;
    color: #666;
  }
  
  span {
    color: #333;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #666;
  
  svg {
    animation: spin 1s linear infinite;
    font-size: 2rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #dc3545;
  padding: 2rem;
`;

const LeaveAgencyButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: ${props => {
    if (props.disabled && props.$pending) {
      return 'rgba(220, 53, 69, 0.6)'; // Red background for pending status
    } else if (props.disabled) {
      return 'rgba(255, 255, 255, 0.2)';
    } else {
      return 'rgba(255, 255, 255, 0.15)';
    }
  }};
  color: white;
  border: 1px solid ${props => props.$pending ? 'rgba(220, 53, 69, 0.4)' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
  
  &:hover {
    background: ${props => {
      if (props.disabled && props.$pending) {
        return 'rgba(220, 53, 69, 0.6)'; // Red background for pending status
      } else if (props.disabled) {
        return 'rgba(255, 255, 255, 0.2)';
      } else {
        return 'rgba(255, 255, 255, 0.25)';
      }
    }};
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
  }
  
  svg {
    font-size: 1rem;
    color: ${props => props.$pending ? '#ffcccc' : 'white'};
  }
  
  @media (max-width: 768px) {
    position: static;
    margin: 1rem auto 0;
    width: 100%;
    justify-content: center;
    padding: 0.8rem 1rem;
    font-size: 0.85rem;
    min-height: 44px;
    touch-action: manipulation;
    border-radius: 6px;
    
    &:hover {
      transform: none;
    }
  }
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ConfirmationContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  animation: fadeInUp 0.3s ease-out;
  
  h3 {
    color: #1a2a6c;
    margin-top: 0;
    font-size: 1.5rem;
  }
  
  p {
    color: #666;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    width: 95%;
    border-radius: 10px;
    
    h3 {
      font-size: 1.3rem;
    }
    
    p {
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  @media (max-width: 768px) {
    padding: 0.8rem 1rem;
    width: 100%;
    min-height: 44px;
    touch-action: manipulation;
    font-size: 0.95rem;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const CancelButton = styled(Button)`
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #ced4da;
  
  &:hover:not(:disabled) {
    background: #e9ecef;
  }
`;

const ConfirmButton = styled(Button)`
  background: #dc3545;
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background: #c82333;
  }
`;

const AgentDetails = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingLeave, setPendingLeave] = useState(false);
  const [leavingAgency, setLeavingAgency] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

  const checkExistingPendingLeave = async () => {
    try {
      if (!currentUser) return;

      const hostId = currentUser.get(UserModel.keys.HOST_ID);
      const agentId = currentUser.get(UserModel.keys.AGENCY_ID);

      if (!hostId || !agentId) return;

      const queryBuilder = new Parse.Query(AgencyInvitation);
      queryBuilder.equalTo(AgencyInvitation.keys.HOST_ID, hostId);
      queryBuilder.equalTo(AgencyInvitation.keys.AGENT_ID, agentId);
      queryBuilder.equalTo(AgencyInvitation.keys.INVITATION_STATUS, AgencyInvitation.invitationStatus.PENDING);
      queryBuilder.equalTo(AgencyInvitation.keys.INVITATION_TYPE, AgencyInvitation.invitationType.LEAVE);

      const application = await queryBuilder.first();
      setPendingLeave(!!application);
    } catch (error) {
      console.error('Error checking pending leave requests:', error);
    }
  };

  const registerLeaveInvitation = async () => {
    try {
      setLeavingAgency(true);
      
      if (!currentUser) {
        throw new Error(t('agency.leave.notLoggedIn'));
      }

      const agencyId = currentUser.get(UserModel.keys.AGENCY_ID);
      const hostId = currentUser.get(UserModel.keys.HOST_ID);
      
      if (!agencyId || !hostId) {
        throw new Error(t('agency.leave.noAgencyOrHost'));
      }

      // Get the agency and host objects
      const agencyQuery = new Parse.Query(Agent);
      const agency = await agencyQuery.get(agencyId);

      const hostQuery = new Parse.Query(Host);
      const host = await hostQuery.get(hostId);

      // Create the invitation
      const invitation = new AgencyInvitation();
      invitation.setAgent = agency;
      invitation.setAgentId = agencyId;
      invitation.setHostAuthor = currentUser;
      invitation.setHostAuthorId = currentUser.id;
      invitation.setHost = host;
      invitation.setHostId = hostId;
      invitation.setInvitationType = AgencyInvitation.invitationType.LEAVE;
      invitation.setInvitationStatus = AgencyInvitation.invitationStatus.PENDING;

      const response = await invitation.save();

      if (response) {
        await sendSystemMessage(invitation);
        // Explicitly check for pending leave requests after successful submission
        await checkExistingPendingLeave();
        toast.success(t('agency.leave.success'));
      } else {
        throw new Error(t('agency.leave.error'));
      }
    } catch (error) {
      console.error('Error registering leave invitation:', error);
      toast.error(error.message || t('agency.leave.error'));
    } finally {
      setLeavingAgency(false);
      setShowLeaveConfirmation(false);
    }
  };

  const sendSystemMessage = async (invitation) => {
    try {
      if (!currentUser) return;

      const agencyId = currentUser.get(UserModel.keys.AGENCY_ID);
      const hostId = currentUser.get(UserModel.keys.HOST_ID);
      
      if (!agencyId || !hostId) return;

      // Get the agency and host objects
      const agencyQuery = new Parse.Query(Agent);
      const agency = await agencyQuery.get(agencyId);

      const hostQuery = new Parse.Query(Host);
      const host = await hostQuery.get(hostId);

      // Get the agency owner (receiver)
      const agencyOwnerQuery = new Parse.Query(UserModel);
      agencyOwnerQuery.equalTo('objectId', agency.get('authorId'));
      const agencyOwner = await agencyOwnerQuery.first();

      if (!agencyOwner) {
        throw new Error(t('agency.leave.noAgencyOwner'));
      }

      // Create the system message
      const systemMessage = new SystemMessage();
      systemMessage.setMessageType = SystemMessage.systemMessageType.HOST_LEAVE_AGENCY;
      systemMessage.setAuthor = currentUser;
      systemMessage.setAgent = agency;
      systemMessage.setReceiver = agencyOwner;
      systemMessage.setHost = host;
      systemMessage.setMessageStatus = SystemMessage.systemMessageStatus.PENDING;
      systemMessage.setInvitation = invitation;
      systemMessage.setRead = false;

      await systemMessage.save();
    } catch (error) {
      console.error('Error sending system message:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        // Get the agent pointer from the current user
        const agencyId = currentUser.get('agencyId');
        if (!agencyId) {
          throw new Error('No agency found for this user');
        }

        // Fetch the agent details
        const query = new Parse.Query(Agent);
        query.include('author');
        const agent = await query.get(agencyId);

        if (!agent) {
          throw new Error('Agent not found');
        }

        // Get the agent's author (user) details
        const author = agent.get('author');
        if (!author) {
          throw new Error('Author not found');
        }

        setAgentData({
          agencyName: agent.get(Agent.keys.NAME) ?? author.get(UserModel.keys.FULL_NAME),
          agencyLogo: agent.get(Agent.keys.LOGO)?.url() || author.get(UserModel.keys.AVATAR_FILE)?.url(),
          description: agent.get(Agent.keys.DESCRIPTION),
          uid: agent.get(Agent.keys.UID),
          email: agent.get(Agent.keys.EMAIL),
          stats: {
            totalHosts: agent.get(Agent.keys.HOST_IDS) ? agent.get(Agent.keys.HOST_IDS).length : 0,
            activeHosts: agent.get(Agent.keys.HOST_IDS) ? agent.get(Agent.keys.HOST_IDS).length : 0
          },
          rules: agent.get(Agent.keys.RULES) || t('agency.join.details.noRules'),
          commissions: agent.get(Agent.keys.COMMISSIONS) || t('agency.join.details.noCommissions'),
          support: agent.get(Agent.keys.SUPPORT) || t('agency.join.details.noSupport')
        });
      } catch (err) {
        console.error('Error fetching agent details:', err);
        setError(err.message);
        toast.error(t('agency.join.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [currentUser, t]);

  if (loading) {
    return (
      <AgentDetailsContainer>
        <LoadingSpinner>
          <FaSpinner />
        </LoadingSpinner>
      </AgentDetailsContainer>
    );
  }

  if (error) {
    return (
      <AgentDetailsContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </AgentDetailsContainer>
    );
  }

  if (!agentData) {
    return (
      <AgentDetailsContainer>
        <ErrorMessage>{t('agency.join.noData')}</ErrorMessage>
      </AgentDetailsContainer>
    );
  }

  return (
    <AgentDetailsContainer>
      <AgentHeader>
        <AgentAvatar $hasImage={!!agentData.agencyLogo}>
          {agentData.agencyLogo ? (
            <img src={agentData.agencyLogo} alt={agentData.agencyName} />
          ) : (
            <FaUserTie />
          )}
        </AgentAvatar>
        <AgentInfo>
          <h2>{agentData.agencyName}</h2>
          <p>{agentData.description}</p>
        </AgentInfo>
        <LeaveAgencyButton 
          onClick={() => setShowLeaveConfirmation(true)}
          disabled={pendingLeave || leavingAgency}
          $pending={pendingLeave}
        >
          {pendingLeave ? (
            <>
              <FaExclamationTriangle />
              {t('agency.leave.pending')}
            </>
          ) : (
            <>
              <FaSignOutAlt />
              {t('agency.leave.button')}
            </>
          )}
        </LeaveAgencyButton>
      </AgentHeader>

      <TabsContainer>
        <TabList>
          <TabButton 
            $active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          >
            {t('agency.join.details.tabs.overview')}
          </TabButton>
          <TabButton 
            $active={activeTab === 'rules'} 
            onClick={() => setActiveTab('rules')}
          >
            {t('agency.join.details.tabs.rules')}
          </TabButton>
          <TabButton 
            $active={activeTab === 'commissions'} 
            onClick={() => setActiveTab('commissions')}
          >
            {t('agency.join.details.tabs.commissions')}
          </TabButton>
          <TabButton 
            $active={activeTab === 'support'} 
            onClick={() => setActiveTab('support')}
          >
            {t('agency.join.details.tabs.support')}
          </TabButton>
        </TabList>

        <TabContent $active={activeTab === 'overview'}>
          <StatsGrid>
            <StatCard>
              <h4>{t('dashboard.agent.totalHosts')}</h4>
              <p>{agentData.stats.totalHosts}</p>
            </StatCard>
            <StatCard>
              <h4>{t('dashboard.agent.activeHosts')}</h4>
              <p>{agentData.stats.activeHosts}</p>
            </StatCard>
          </StatsGrid>

          <InfoSection>
            <h3>
              <FaEnvelope />
              {t('agency.join.details.tabs.contactInfo')}
            </h3>
            <p>{agentData.email}</p>
            <p style={{ marginTop: '10px' }}>
              <FaBuilding style={{ marginRight: '8px' }} />
              {agentData.agencyName}
            </p>
          </InfoSection>
        </TabContent>

        <TabContent $active={activeTab === 'rules'}>
          <InfoSection>
            <h3>
              <FaGavel />
              {t('agency.join.details.tabs.rules')}
            </h3>
            <p>{agentData.rules}</p>
          </InfoSection>
        </TabContent>

        <TabContent $active={activeTab === 'commissions'}>
          <InfoSection>
            <h3>
              <FaPercentage />
              {t('agency.join.details.tabs.commissions')}
            </h3>
            <p>{agentData.commissions}</p>
          </InfoSection>
        </TabContent>

        <TabContent $active={activeTab === 'support'}>
          <InfoSection>
            <h3>
              <FaHeadset />
              {t('agency.join.details.tabs.support')}
            </h3>
            <p>{agentData.support}</p>
          </InfoSection>
        </TabContent>
      </TabsContainer>

      {showLeaveConfirmation && (
        <ConfirmationModal>
          <ConfirmationContent>
            <h3>{t('agency.leave.confirmTitle')}</h3>
            <p>{t('agency.leave.confirmMessage')}</p>
            <ButtonGroup>
              <CancelButton onClick={() => setShowLeaveConfirmation(false)} disabled={leavingAgency}>
                {t('agency.leave.cancel')}
              </CancelButton>
              <ConfirmButton onClick={registerLeaveInvitation} disabled={leavingAgency}>
                {leavingAgency ? (
                  <>
                    <FaSpinner className="spinner" />
                    {t('agency.leave.processing')}
                  </>
                ) : (
                  t('agency.leave.confirm')
                )}
              </ConfirmButton>
            </ButtonGroup>
          </ConfirmationContent>
        </ConfirmationModal>
      )}
    </AgentDetailsContainer>
  );
};

export default AgentDetails;
