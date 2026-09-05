import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaFilter, FaSpinner, FaCheck, FaTimes, FaUserCircle, FaVideo, FaClock, FaSignOutAlt, FaExclamationTriangle, FaEllipsisV } from 'react-icons/fa';
import Parse from 'parse';
import AgencyInvitation from '../../models/AgencyInvitation';
import User from '../../models/User';
import Host from '../../models/Host';
import SystemMessage from '../../models/SystemMessage';
import { formatDistanceToNow, formatDuration } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { toast } from 'react-toastify';

// Styled Components
const HostApplicationContainer = styled.div`
  padding: 30px;
  height: 100%;
  overflow-y: visible;
  
  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  color: #334155;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 300px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
  
  input {
    width: 100%;
    padding: 10px 15px 10px 40px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
    
    &:focus {
      border-color: #9d50bb;
      box-shadow: 0 0 0 2px rgba(157, 80, 187, 0.1);
    }
    
    @media (max-width: 768px) {
      padding: 12px 15px 12px 40px;
      font-size: 16px;
      min-height: 44px;
    }
  }
  
  svg {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }
`;

const FiltersSection = styled.div`
  margin-bottom: 30px;
`;

const FilterLabel = styled.div`
  font-size: ${props => props.$primary ? '16px' : '14px'};
  font-weight: 600;
  color: ${props => props.$primary ? '#334155' : '#64748b'};
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  
  ${props => props.$primary && `
    &:before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background: linear-gradient(to bottom, #9d50bb, #6e48aa);
      margin-right: 8px;
      border-radius: 2px;
    }
  `}
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: ${props => props.$active ? 'rgba(157, 80, 187, 0.1)' : 'white'};
  color: ${props => props.$active ? '#9d50bb' : '#64748b'};
  font-weight: ${props => props.$active ? '600' : 'normal'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  
  &:hover {
    background: rgba(157, 80, 187, 0.05);
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 14px;
    min-height: 44px;
    touch-action: manipulation;
  }
  
  ${props => props.$primary && `
    padding: 10px 18px;
    font-size: 15px;
    background: ${props.$active ? 'linear-gradient(135deg, #9d50bb, #6e48aa)' : 'white'};
    border: 1px solid ${props.$active ? 'transparent' : '#e2e8f0'};
    color: ${props.$active ? 'white' : '#64748b'};
    font-weight: ${props.$active ? '600' : '500'};
    box-shadow: ${props.$active ? '0 4px 10px rgba(157, 80, 187, 0.2)' : 'none'};
    
    &:hover {
      background: ${props.$active ? 'linear-gradient(135deg, #9d50bb, #6e48aa)' : 'rgba(157, 80, 187, 0.05)'};
      box-shadow: ${props.$active ? '0 4px 12px rgba(157, 80, 187, 0.25)' : '0 2px 6px rgba(157, 80, 187, 0.1)'};
      color: ${props.$active ? 'white' : '#9d50bb'};
    }
    
    @media (max-width: 768px) {
      padding: 10px 16px;
      min-height: 44px;
    }
  `}
`;

const ApplicationsTable = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: visible;
  
  @media (max-width: 768px) {
    border-radius: 8px;
    overflow-x: auto;
    overflow-y: visible;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 15px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  
  span {
    font-weight: 600;
    color: #64748b;
    font-size: 14px;
    padding-right: 10px;
  }
  
  @media (max-width: 768px) {
    padding: 12px 15px;
    min-width: 900px;
    
    span {
      font-size: 13px;
    }
  }
`;

const ApplicationRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s;
  position: relative;
  overflow: visible;
  
  &:hover {
    background: rgba(157, 80, 187, 0.02);
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    padding: 12px 15px;
    min-width: 900px;
    touch-action: manipulation;
  }
`;

const HostInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #64748b;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .info {
    .name {
      font-weight: 600;
      color: #334155;
      margin-bottom: 2px;
    }
    
    .uid {
      font-size: 12px;
      color: #94a3b8;
    }
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    min-height: 28px;
    touch-action: manipulation;
  }
  
  ${props => {
    if (props.$status === AgencyInvitation.invitationStatus.PENDING) {
      return `
        background: rgba(234, 179, 8, 0.1);
        color: #b45309;
      `;
    } else if (props.$status === AgencyInvitation.invitationStatus.ACCEPTED) {
      return `
        background: rgba(34, 197, 94, 0.1);
        color: #16a34a;
      `;
    } else if (props.$status === AgencyInvitation.invitationStatus.REJECTED) {
      return `
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      `;
    }
  }}
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 14px;
    min-height: 44px;
    touch-action: manipulation;
  }
  
  ${props => props.$primary ? `
    background: #9d50bb;
    color: white;
    border: none;
    
    &:hover {
      background: #8c44a9;
    }
  ` : `
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
    
    &:hover {
      background: #f8fafc;
    }
  `}
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
  
  svg {
    font-size: 40px;
    margin-bottom: 15px;
    opacity: 0.5;
  }
  
  p {
    font-size: 16px;
    margin: 0 0 5px 0;
  }
  
  span {
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    padding: 40px 15px;
    
    svg {
      font-size: 36px;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 15px;
    }
    
    span {
      font-size: 13px;
    }
  }
`;

const ActionMenuContainer = styled.div`
  position: relative;
  display: inline-block;
  z-index: 100;
  justify-self: end;
`;

const ActionMenuButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(157, 80, 187, 0.05);
    color: #9d50bb;
  }
  
  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 18px;
    min-height: 44px;
    min-width: 44px;
    touch-action: manipulation;
  }
`;

const ActionMenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  min-width: 180px;
  z-index: 1000;
  border: 1px solid #e2e8f0;
  transform: translateZ(0);
  overflow: visible;
  
  @media (max-width: 768px) {
    min-width: 200px;
    right: 0;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
`;

const ActionMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font-size: 14px;
  color: ${props => props.$danger ? '#dc3545' : '#334155'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$danger ? 'rgba(220, 53, 69, 0.05)' : 'rgba(157, 80, 187, 0.05)'};
  }
  
  svg {
    color: ${props => props.$danger ? '#dc3545' : '#9d50bb'};
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 15px;
    min-height: 44px;
    touch-action: manipulation;
    
    svg {
      font-size: 16px;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  padding: 0 1rem;
  
  @media (max-width: 768px) {
    align-items: flex-start;
    padding-top: 15vh;
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  
  h3 {
    margin-top: 0;
    color: ${props => props.$danger ? '#dc3545' : '#334155'};
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    
    svg {
      color: ${props => props.$danger ? '#dc3545' : '#9d50bb'};
    }
  }
  
  p {
    color: #64748b;
    margin-bottom: 24px;
    line-height: 1.5;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
  
  .spinner {
    font-size: 30px;
    margin-bottom: 15px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  p {
    font-size: 16px;
    margin: 0;
  }
`;

const HostApplication = () => {
  const { t, i18n } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptJoinModal, setShowAcceptJoinModal] = useState(false);
  const [showRejectJoinModal, setShowRejectJoinModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  
  useEffect(() => {
    fetchApplications();
  }, []);
  
  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionMenu && !event.target.closest('.action-menu')) {
        setShowActionMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);
  
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const currentUser = Parse.User.current();
      if (!currentUser) return;
      
      // Get the agent for the current user
      const agentId = currentUser.get(User.keys.AGENT_ID);
      
      if (!agentId) {
        console.error('Current user is not associated with an agent');
        setLoading(false);
        return;
      }
      
      // Query for agency invitations where the current user's agent is involved
      const query = new Parse.Query(AgencyInvitation);
      query.equalTo(AgencyInvitation.keys.AGENT_ID, agentId);
      
      // Include the host and host.author pointers to get all the data we need
      query.include(AgencyInvitation.keys.HOST);
      query.include(AgencyInvitation.keys.HOST_AUTHOR_SUB);
      
      // Sort by createdAt in descending order (newest first)
      query.descending('createdAt');
      
      const results = await query.find();
      
      // For each application, fetch the host data if available
      const applicationsWithHostData = await Promise.all(results.map(async (application) => {
        const hostAuthor = application.getHostAuthor;
        if (hostAuthor) {
          const authorId = hostAuthor.id;
          try {
            const host = await Host.getHostByAuthorId(authorId);
            if (host) {
              application.hostData = {
                streamCount: host.streams.length || 0,
                totalStreamTime: host.getDuration || 0
              };
            }
          } catch (error) {
            console.error('Error fetching host data:', error);
          }
        }
        return application;
      }));
      
      setApplications(applicationsWithHostData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getFilteredApplications = () => {
    return applications.filter(app => {
      // Apply status filter
      if (statusFilter !== 'all' && app.getInvitationStatus !== statusFilter) {
        return false;
      }
      
      // Apply type filter
      if (typeFilter !== 'all' && app.getInvitationType !== typeFilter) {
        return false;
      }
      
      // Apply search query
      if (searchQuery) {
        const hostAuthor = app.getHostAuthor;
        if (!hostAuthor) return false;
        
        const name = hostAuthor.get(User.keys.FULL_NAME) || '';
        const uid = String(hostAuthor.get(User.keys.UID) || '');
        
        return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               uid.toLowerCase().includes(searchQuery.toLowerCase());
      }
      
      return true;
    });
  };
  
  const formatDate = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    // Use shorter format with "ago" for recent dates, actual date for older ones
    if (diffInSeconds < 60) {
      return t('time.justNow');
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}${t('time.minuteShort')} ${t('time.ago')}`;
    } else if (diffInHours < 24) {
      return `${diffInHours}${t('time.hourShort')} ${t('time.ago')}`;
    } else if (diffInDays < 30) {
      return `${diffInDays}${t('time.dayShort')} ${t('time.ago')}`;
    } else {
      // For older dates, show the actual date in format DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    }
  };
  
  const formatStreamDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0h 0m';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };
  
  const renderStatusBadge = (status) => {
    let icon = null;
    
    if (status === AgencyInvitation.invitationStatus.PENDING) {
      icon = <FaSpinner />;
    } else if (status === AgencyInvitation.invitationStatus.ACCEPTED) {
      icon = <FaCheck />;
    } else if (status === AgencyInvitation.invitationStatus.REJECTED) {
      icon = <FaTimes />;
    }
    
    return (
      <StatusBadge $status={status}>
        {icon}
        {status === AgencyInvitation.invitationStatus.PENDING && t('hostHistory.status.pending')}
        {status === AgencyInvitation.invitationStatus.ACCEPTED && t('hostHistory.status.accepted')}
        {status === AgencyInvitation.invitationStatus.REJECTED && t('hostHistory.status.rejected')}
      </StatusBadge>
    );
  };
  
  const handleReleaseHost = async () => {
    if (!selectedApplication) return;
    
    try {
      setProcessingAction(true);
      
      // Use the SystemMessage static method to process the leave request
      const response = await SystemMessage.processLeaveRequest(
        selectedApplication.id,
        SystemMessage.systemMessageStatus.ACCEPTED
      );
      
      if (response.success) {
        toast.success(t('hostHistory.actions.releaseSuccess'));
        await fetchApplications(); // Refresh the list
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('Error releasing host:', error);
      toast.error(t('hostHistory.actions.releaseError'));
    } finally {
      setProcessingAction(false);
      setShowReleaseModal(false);
      setSelectedApplication(null);
    }
  };
  
  const handleRejectLeaveRequest = async () => {
    if (!selectedApplication) return;
    
    try {
      setProcessingAction(true);
      
      // Use the SystemMessage static method to process the leave request
      const response = await SystemMessage.processLeaveRequest(
        selectedApplication.id,
        SystemMessage.systemMessageStatus.REJECTED
      );
      
      if (response.success) {
        toast.success(t('hostHistory.actions.rejectSuccess'));
        await fetchApplications(); // Refresh the list
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      toast.error(t('hostHistory.actions.rejectError'));
    } finally {
      setProcessingAction(false);
      setShowRejectModal(false);
      setSelectedApplication(null);
    }
  };

  // Handle accepting join request
  const handleAcceptJoinRequest = async () => {
    if (!selectedApplication) return;
    
    try {
      setProcessingAction(true);
      
      // Use the SystemMessage static method to process the join request
      const response = await SystemMessage.processJoinRequest(
        selectedApplication.id,
        SystemMessage.systemMessageStatus.ACCEPTED
      );

      if (response.success) {
        toast.success(t('hostHistory.actions.acceptSuccess', 'Join request accepted successfully'));
        await fetchApplications(); // Refresh the list
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('Error accepting join request:', error);
      toast.error(t('hostHistory.actions.acceptError', 'Failed to accept join request'));
    } finally {
      setProcessingAction(false);
      setShowAcceptJoinModal(false);
      setSelectedApplication(null);
    }
  };
  
  // Handle rejecting join request
  const handleRejectJoinRequest = async () => {
    if (!selectedApplication) return;
    
    try {
      setProcessingAction(true);
      
      // Use the SystemMessage static method to process the join request
      const response = await SystemMessage.processJoinRequest(
        selectedApplication.id,
        SystemMessage.systemMessageStatus.REJECTED
      );

      if (response.success) {
        toast.success(t('hostHistory.actions.rejectJoinSuccess', 'Join request rejected successfully'));
        await fetchApplications(); // Refresh the list
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('Error rejecting join request:', error);
      toast.error(t('hostHistory.actions.rejectJoinError', 'Failed to reject join request'));
    } finally {
      setProcessingAction(false);
      setShowRejectJoinModal(false);
      setSelectedApplication(null);
    }
  };
  
  const renderApplicationType = (type) => {
    switch (type) {
      case AgencyInvitation.invitationType.JOIN:
        return t('hostHistory.type.join');
      case AgencyInvitation.invitationType.INVITE:
        return t('hostHistory.type.invite');
      case AgencyInvitation.invitationType.LEAVE:
        return t('hostHistory.type.leave');
      case AgencyInvitation.invitationType.AUTO_LEAVE:
        return t('hostHistory.type.autoLeave');
      default:
        return type;
    }
  };
  
  const filteredApplications = getFilteredApplications();
  
  return (
    <HostApplicationContainer>
      <Header>
        <Title>{t('dashboard.agent.hostApplication')}</Title>
        <SearchContainer>
          <input 
            type="text" 
            placeholder={t('hostHistory.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch />
        </SearchContainer>
      </Header>
      
      <FiltersSection>
        <FilterLabel $primary>{t('hostHistory.filter.type')}</FilterLabel>
        <FilterContainer>
          <FilterButton 
            $active={typeFilter === 'all'} 
            onClick={() => setTypeFilter('all')}
            $primary
          >
            {t('hostHistory.filter.all')}
          </FilterButton>
          <FilterButton 
            $active={typeFilter === AgencyInvitation.invitationType.JOIN} 
            onClick={() => setTypeFilter(AgencyInvitation.invitationType.JOIN)}
            $primary
          >
            {t('hostHistory.filter.join')}
          </FilterButton>
          <FilterButton 
            $active={typeFilter === AgencyInvitation.invitationType.INVITE} 
            onClick={() => setTypeFilter(AgencyInvitation.invitationType.INVITE)}
            $primary
          >
            {t('hostHistory.filter.invite')}
          </FilterButton>
          <FilterButton 
            $active={typeFilter === AgencyInvitation.invitationType.LEAVE} 
            onClick={() => setTypeFilter(AgencyInvitation.invitationType.LEAVE)}
            $primary
          >
            {t('hostHistory.filter.leave')}
          </FilterButton>
        </FilterContainer>
        
        <FilterLabel>{t('hostHistory.filter.status')}</FilterLabel>
        <FilterContainer>
          <FilterButton 
            $active={statusFilter === 'all'} 
            onClick={() => setStatusFilter('all')}
          >
            {t('hostHistory.filter.all')}
          </FilterButton>
          <FilterButton 
            $active={statusFilter === AgencyInvitation.invitationStatus.PENDING} 
            onClick={() => setStatusFilter(AgencyInvitation.invitationStatus.PENDING)}
          >
            {t('hostHistory.status.pending')}
          </FilterButton>
          <FilterButton 
            $active={statusFilter === AgencyInvitation.invitationStatus.ACCEPTED} 
            onClick={() => setStatusFilter(AgencyInvitation.invitationStatus.ACCEPTED)}
          >
            {t('hostHistory.status.accepted')}
          </FilterButton>
          <FilterButton 
            $active={statusFilter === AgencyInvitation.invitationStatus.REJECTED} 
            onClick={() => setStatusFilter(AgencyInvitation.invitationStatus.REJECTED)}
          >
            {t('hostHistory.status.rejected')}
          </FilterButton>
        </FilterContainer>
      </FiltersSection>
      
      <ApplicationsTable>
        <TableHeader>
          <span>{t('hostHistory.columns.host')}</span>
          <span>{t('hostHistory.columns.type')}</span>
          <span>{t('hostHistory.columns.date')}</span>
          <span>{t('hostHistory.columns.status')}</span>
          <span>{t('hostHistory.columns.streams')}</span>
          <span>{t('hostHistory.columns.duration')}</span>
          <span>{t('hostHistory.columns.actions')}</span>
        </TableHeader>
        
        {loading ? (
          <LoadingState>
            <FaSpinner className="spinner" />
            <p>{t('common.loading')}</p>
          </LoadingState>
        ) : filteredApplications.length === 0 ? (
          <EmptyState>
            <FaUserCircle />
            <p>{t('hostHistory.noApplications')}</p>
            <span>{t('hostHistory.tryDifferentFilters')}</span>
          </EmptyState>
        ) : (
          filteredApplications.map(application => {
            const hostAuthor = application.getHostAuthor;
            const name = hostAuthor?.get(User.keys.FULL_NAME) || t('hostHistory.unknownUser');
            const uid = String(hostAuthor?.get(User.keys.UID) || '');
            const avatarFile = hostAuthor?.get(User.keys.AVATAR_FILE);
            const status = application.getInvitationStatus;
            const type = application.getInvitationType;
            const date = application.createdAt;
            
            return (
              <ApplicationRow key={application.id}>
                <HostInfo>
                  <div className="avatar">
                    {avatarFile ? (
                      <img src={avatarFile.url()} alt={name} />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="info">
                    <div className="name">{name}</div>
                    <div className="uid">{uid}</div>
                  </div>
                </HostInfo>
                <div>{renderApplicationType(type)}</div>
                <div>{formatDate(date)}</div>
                <div>{renderStatusBadge(status)}</div>
                <div className="stream-count">
                  <FaVideo style={{ marginRight: '8px', color: '#64748b' }} />
                  {application.hostData ? application.hostData.streamCount : 0}
                </div>
                <div className="stream-duration">
                  <FaClock style={{ marginRight: '8px', color: '#64748b' }} />
                  {application.hostData ? formatStreamDuration(application.hostData.totalStreamTime) : '0h 0m'}
                </div>
                <div>
                  {type === AgencyInvitation.invitationType.LEAVE && status === AgencyInvitation.invitationStatus.PENDING && (
                    <ActionMenuContainer className="action-menu">
                      <ActionMenuButton onClick={() => setShowActionMenu(application.id)}>
                        <FaEllipsisV />
                      </ActionMenuButton>
                      {showActionMenu === application.id && (
                        <ActionMenuDropdown>
                          <ActionMenuItem 
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowActionMenu(null);
                              setShowReleaseModal(true);
                            }}
                          >
                            <FaSignOutAlt />
                            {t('hostHistory.actions.releaseHost')}
                          </ActionMenuItem>
                          <ActionMenuItem 
                            $danger
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowActionMenu(null);
                              setShowRejectModal(true);
                            }}
                          >
                            <FaTimes />
                            {t('hostHistory.actions.rejectRequest')}
                          </ActionMenuItem>
                        </ActionMenuDropdown>
                      )}
                    </ActionMenuContainer>
                  )}
                  
                  {type === AgencyInvitation.invitationType.JOIN && status === AgencyInvitation.invitationStatus.PENDING && (
                    <ActionMenuContainer className="action-menu">
                      <ActionMenuButton onClick={() => setShowActionMenu(application.id)}>
                        <FaEllipsisV />
                      </ActionMenuButton>
                      {showActionMenu === application.id && (
                        <ActionMenuDropdown>
                          <ActionMenuItem 
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowActionMenu(null);
                              setShowAcceptJoinModal(true);
                            }}
                          >
                            <FaCheck />
                            {t('hostHistory.actions.accept', 'Accept')}
                          </ActionMenuItem>
                          <ActionMenuItem 
                            $danger
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowActionMenu(null);
                              setShowRejectJoinModal(true);
                            }}
                          >
                            <FaTimes />
                            {t('hostHistory.actions.reject', 'Reject')}
                          </ActionMenuItem>
                        </ActionMenuDropdown>
                      )}
                    </ActionMenuContainer>
                  )}
                </div>
              </ApplicationRow>
            );
          })
        )}
      </ApplicationsTable>
      
      {/* Release Host Confirmation Modal */}
      {showReleaseModal && selectedApplication && (
        <ModalOverlay>
          <ModalContent>
            <h3>
              <FaSignOutAlt />
              {t('hostHistory.modals.releaseTitle')}
            </h3>
            <p>{t('hostHistory.modals.releaseMessage')}</p>
            <ModalActions>
              <ActionButton 
                onClick={() => {
                  setShowReleaseModal(false);
                  setSelectedApplication(null);
                }}
                disabled={processingAction}
              >
                {t('common.cancel')}
              </ActionButton>
              <ActionButton 
                $primary
                onClick={handleReleaseHost}
                disabled={processingAction}
              >
                {processingAction ? (
                  <>
                    <FaSpinner className="spinner" style={{ marginRight: '8px' }} />
                    {t('common.processing')}
                  </>
                ) : t('hostHistory.actions.releaseConfirm')}
              </ActionButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Reject Leave Request Confirmation Modal */}
      {showRejectModal && selectedApplication && (
        <ModalOverlay>
          <ModalContent $danger>
            <h3>
              <FaExclamationTriangle />
              {t('hostHistory.modals.rejectTitle')}
            </h3>
            <p>{t('hostHistory.modals.rejectMessage')}</p>
            <ModalActions>
              <ActionButton 
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedApplication(null);
                }}
                disabled={processingAction}
              >
                {t('common.cancel')}
              </ActionButton>
              <ActionButton 
                $danger
                onClick={handleRejectLeaveRequest}
                disabled={processingAction}
              >
                {processingAction ? (
                  <>
                    <FaSpinner className="spinner" style={{ marginRight: '8px' }} />
                    {t('common.processing')}
                  </>
                ) : t('hostHistory.actions.rejectConfirm')}
              </ActionButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Accept Join Request Confirmation Modal */}
      {showAcceptJoinModal && selectedApplication && (
        <ModalOverlay>
          <ModalContent>
            <h3>
              <FaCheck />
              {t('hostHistory.modals.acceptJoinTitle', 'Accept Join Request')}
            </h3>
            <p>{t('hostHistory.modals.acceptJoinMessage', 'Are you sure you want to accept this join request? The user will become a member of your agency.')}</p>
            <ModalActions>
              <ActionButton 
                onClick={() => {
                  setShowAcceptJoinModal(false);
                  setSelectedApplication(null);
                }}
                disabled={processingAction}
              >
                {t('common.cancel')}
              </ActionButton>
              <ActionButton 
                $primary
                onClick={handleAcceptJoinRequest}
                disabled={processingAction}
              >
                {processingAction ? (
                  <>
                    <FaSpinner className="spinner" style={{ marginRight: '8px' }} />
                    {t('common.processing')}
                  </>
                ) : t('hostHistory.actions.acceptConfirm', 'Accept')}
              </ActionButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Reject Join Request Confirmation Modal */}
      {showRejectJoinModal && selectedApplication && (
        <ModalOverlay>
          <ModalContent $danger>
            <h3>
              <FaExclamationTriangle />
              {t('hostHistory.modals.rejectJoinTitle', 'Reject Join Request')}
            </h3>
            <p>{t('hostHistory.modals.rejectJoinMessage', 'Are you sure you want to reject this join request? This action cannot be undone.')}</p>
            <ModalActions>
              <ActionButton 
                onClick={() => {
                  setShowRejectJoinModal(false);
                  setSelectedApplication(null);
                }}
                disabled={processingAction}
              >
                {t('common.cancel')}
              </ActionButton>
              <ActionButton 
                $danger
                onClick={handleRejectJoinRequest}
                disabled={processingAction}
              >
                {processingAction ? (
                  <>
                    <FaSpinner className="spinner" style={{ marginRight: '8px' }} />
                    {t('common.processing')}
                  </>
                ) : t('hostHistory.actions.rejectJoinConfirm', 'Reject')}
              </ActionButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </HostApplicationContainer>
  );
};

export default HostApplication;
