import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { format, isToday, isYesterday } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import {
  FaUsers,
  FaChartLine,
  FaMoneyBillWave,
  FaStream,
  FaCircle,
  FaArrowRight,
  FaPlus,
  FaSearch,
  FaTimes,
  FaSpinner,
  FaVideo,
  FaClock,
  FaUserCircle,
  FaCheck,
  FaInfoCircle,
  FaCalendarAlt,
  FaExchangeAlt,
  FaFileInvoiceDollar,
  FaComments,
  FaUserMinus,
  FaPaperPlane
} from 'react-icons/fa';
import { FaImage } from 'react-icons/fa';
import { GiDiamonds } from 'react-icons/gi';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { diamondsToUsd, formatUsd } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useTranslation as useLanguage } from 'react-i18next';
import Parse from 'parse';
import Agent from '../../models/Agent';
import UserModel from '../../models/User';
import HostStreamStats from '../../models/HostStreamStats';
import Host from '../../models/Host';
import AgencyInvitation from '../../models/AgencyInvitation';
import SystemMessage from '../../models/SystemMessage';
import Transaction from '../../models/Transaction';
import { Chat } from '../../models/Chat';
import { Message } from '../../models/Message';
import User from '../../models/User';

// Format stream time from seconds to hours and minutes
const formatStreamTime = (seconds) => {
  if (!seconds) return '0h 0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
};

// Add Host Modal Component
const AddHostModal = ({ isOpen, onClose, onAddHost }) => {
  const { t } = useTranslation();
  const [userId, setUserId] = useState('');
  const [hostCode, setHostCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('search'); // search, preview, success

  const resetForm = () => {
    setUserId('');
    setHostCode('');
    setFoundUser(null);
    setHostData(null);
    setError('');
    setStep('search');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const searchUser = async () => {
    if (!userId || !hostCode) {
      setError(t('hostManagement.addHost.enterBothFields'));
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      // Query for user with the provided ID and host code
      const userQuery = new Parse.Query(UserModel);
      userQuery.equalTo('objectId', hostCode);
      userQuery.equalTo(UserModel.keys.UID, Number(userId));
      
      // Make sure user is not already an agent or has an agency
      userQuery.doesNotExist(UserModel.keys.AGENT);
      userQuery.doesNotExist(UserModel.keys.AGENCY);
      
      const user = await userQuery.first();

      if (!user) {
        setError(t('hostManagement.addHost.userNotFound'));
        setFoundUser(null);
        setHostData(null);
        return;
      }

      // Check if the user already has a host record
      let hostRecord = null;
      try {
        hostRecord = await Host.getHostByAuthorId(user.id);
      } catch (err) {
        console.error('Error checking host record:', err);
      }

      setFoundUser(user);
      
      if (hostRecord) {
        setHostData({
          streamCount: hostRecord.streams?.length || 0,
          totalStreamTime: hostRecord.getDuration || 0,
          diamonds: user.get(UserModel.keys.DIAMONDS_TOTAL) || 0,
          revenue: diamondsToUsd(user.get(UserModel.keys.DIAMONDS_TOTAL) || 0)
        });
      } else {
        setHostData({
          streamCount: 0,
          totalStreamTime: 0,
          diamonds: 0,
          revenue: 0
        });
      }
      
      setStep('preview');
    } catch (error) {
      console.error('Error searching for user:', error);
      setError(t('common.error'));
    } finally {
      setIsSearching(false);
    }
  };

  const checkPendingInvitations = async () => {
    if (!foundUser) return false;
    
    try {
      const query = new Parse.Query(AgencyInvitation);
      query.equalTo(AgencyInvitation.keys.HOST_AUTHOR_ID, foundUser.id);
      query.equalTo(AgencyInvitation.keys.INVITATION_STATUS, AgencyInvitation.invitationStatus.PENDING);
      
      const pendingInvitations = await query.find();
      return pendingInvitations.length > 0;
    } catch (error) {
      console.error('Error checking pending invitations:', error);
      return false;
    }
  };

  const sendSystemMessage = async (invitation, user, agent, host) => {
    try {
      // Create a new system message
      const systemMessage = new SystemMessage();
      
      // Set message type for host invitation
      systemMessage.setMessageType = SystemMessage.systemMessageType.HOST_ADDED_AGENCY;
      
      // Set current user as author
      const currentUser = Parse.User.current();
      systemMessage.setAuthor = currentUser;
      
      // Set the host user as receiver
      systemMessage.setReceiver = user;
      
      // Set agent
      systemMessage.setAgent = agent;
      
      // Set host if available
      if (host) {
        systemMessage.setHost = host;
      }
      
      // Set invitation
      systemMessage.setInvitation = invitation;
      
      // Set message status and read flag
      systemMessage.setMessageStatus = SystemMessage.systemMessageStatus.PENDING;
      systemMessage.setRead = false;
      
      // Save the system message
      await systemMessage.save();
      
      console.log('System message sent successfully');
    } catch (error) {
      console.error('Error sending system message:', error);
      // We don't want to fail the whole process if just the system message fails
      // So we just log the error and continue
    }
  };
  
  const sendInvitation = async () => {
    if (!foundUser) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Check for pending invitations
      const hasPendingInvitations = await checkPendingInvitations();
      
      if (hasPendingInvitations) {
        setError(t('hostManagement.addHost.pendingInvitationExists'));
        setIsSubmitting(false);
        return;
      }
      
      // Get current user's agent
      const currentUser = Parse.User.current();
      const agent = await Agent.getAgentByAuthorId(currentUser.id);
      
      if (!agent) {
        setError(t('hostManagement.addHost.agentNotFound'));
        setIsSubmitting(false);
        return;
      }
      
      // Create invitation
      const invitation = new AgencyInvitation();
      
      // Set agent
      invitation.set(AgencyInvitation.keys.AGENT, agent);
      invitation.set(AgencyInvitation.keys.AGENT_ID, agent.id);
      
      // Set host author
      invitation.set(AgencyInvitation.keys.HOST_AUTHOR, foundUser);
      invitation.set(AgencyInvitation.keys.HOST_AUTHOR_ID, foundUser.id);
      
      // Get host record if it exists
      let hostRecord = null;
      try {
        hostRecord = await Host.getHostByAuthorId(foundUser.id);
        if (hostRecord) {
          invitation.set(AgencyInvitation.keys.HOST, hostRecord);
          invitation.set(AgencyInvitation.keys.HOST_ID, hostRecord.id);
        }
      } catch (err) {
        console.error('Error getting host record:', err);
      }
      
      // Set invitation type and status
      invitation.set(AgencyInvitation.keys.INVITATION_TYPE, AgencyInvitation.invitationType.INVITE);
      invitation.set(AgencyInvitation.keys.INVITATION_STATUS, AgencyInvitation.invitationStatus.PENDING);
      
      // Save invitation
      await invitation.save();
      
      // Send system message
      await sendSystemMessage(invitation, foundUser, agent, hostRecord);
      
      setStep('success');
      
      // Refresh hosts data
      if (onAddHost) {
        onAddHost();
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError(t('hostManagement.addHost.invitationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't use conditional rendering with return null
  // The formatStreamDuration function is defined outside the component
  const formatStreamDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0h 0m';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <ModalOverlay $isOpen={isOpen}>
      <ModalContainer>
        <ModalHeader>
          <h2>{t('hostManagement.addHost.title')}</h2>
          <CloseButton onClick={handleClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        <ModalContent>
          {step === 'search' && (
            <>
              <InfoBox>
                <FaInfoCircle />
                <p>{t('hostManagement.addHost.infoMessage')}</p>
              </InfoBox>
              
              <FormGroup>
                <Label>{t('hostManagement.addHost.userId')}</Label>
                <Input 
                  type="text" 
                  value={userId}
                  onChange={(e) => {
                    // Only allow numeric input (0-9)
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    setUserId(numericValue);
                  }}
                  placeholder={t('hostManagement.addHost.userIdPlaceholder')}
                  inputMode="numeric" // Shows numeric keyboard on mobile devices
                  pattern="[0-9]*" // HTML5 validation for numbers only
                />
              </FormGroup>
              
              <FormGroup>
                <Label>{t('hostManagement.addHost.hostCode')}</Label>
                <Input 
                  type="text" 
                  value={hostCode}
                  onChange={(e) => setHostCode(e.target.value)}
                  placeholder={t('hostManagement.addHost.hostCodePlaceholder')}
                />
              </FormGroup>
              
              {error && <ErrorMessage>{error}</ErrorMessage>}
              
              <ButtonGroup>
                <CancelButton onClick={handleClose}>
                  {t('common.cancel')}
                </CancelButton>
                <SearchButton onClick={searchUser} disabled={isSearching}>
                  {isSearching ? <FaSpinner className="spinner" /> : <FaSearch />}
                  {isSearching ? t('common.searching') : t('common.search')}
                </SearchButton>
              </ButtonGroup>
            </>
          )}
          
          {step === 'preview' && foundUser && (
            <>
              <UserPreview>
                <UserAvatar>
                  {foundUser.get(UserModel.keys.AVATAR_FILE) ? (
                    <img 
                      src={foundUser.get(UserModel.keys.AVATAR_FILE).url()} 
                      alt={foundUser.get(UserModel.keys.FULL_NAME)} 
                    />
                  ) : (
                    <FaUserCircle />
                  )}
                </UserAvatar>
                
                <UserInfo>
                  <h3>{foundUser.get(UserModel.keys.FULL_NAME) || t('hostManagement.addHost.unknownUser')}</h3>
                  <p className="uid">{foundUser.get(UserModel.keys.UID) || ''}</p>
                </UserInfo>
              </UserPreview>
              
              <UserMetrics>
                <MetricItem>
                  <FaVideo title={t('hostHistory.columns.streams')} />
                  <strong>{hostData?.streamCount || 0}</strong>
                </MetricItem>
                
                <MetricItem>
                  <FaClock title={t('hostHistory.columns.duration')} />
                  <strong>{formatStreamDuration(hostData?.totalStreamTime || 0)}</strong>
                </MetricItem>
                
                <MetricItem>
                  <FaMoneyBillWave title={t('dashboard.hosts.earnings')} />
                  <strong>${(hostData?.revenue || 0).toFixed(2)}</strong>
                </MetricItem>
              </UserMetrics>
              
              {error && <ErrorMessage>{error}</ErrorMessage>}
              
              <ButtonGroup>
                <CancelButton onClick={() => setStep('search')}>
                  {t('common.back')}
                </CancelButton>
                <ConfirmButton onClick={sendInvitation} disabled={isSubmitting}>
                  {isSubmitting ? <FaSpinner className="spinner" /> : null}
                  {t('hostManagement.addHost.sendInvitation')}
                </ConfirmButton>
              </ButtonGroup>
            </>
          )}
          
          {step === 'success' && (
            <SuccessMessage>
              <FaCheck />
              <h3>{t('hostManagement.addHost.invitationSent')}</h3>
              <p>{t('hostManagement.addHost.invitationSentMessage')}</p>
              
              <CloseSuccessButton onClick={handleClose}>
                {t('common.close')}
              </CloseSuccessButton>
            </SuccessMessage>
          )}
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

// Host Details Modal Component
const HostDetailsModal = ({ isOpen, onClose, host, onHostRemoved }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { i18n } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [hostData, setHostData] = useState(null);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  // Explicitly initialize to false to prevent auto-opening
  const [showCompensationModal, setShowCompensationModal] = useState(false);
  const [compensationAmount, setCompensationAmount] = useState('');
  const [sendingCompensation, setSendingCompensation] = useState(false);
  const fileInputRef = useRef(null);
  const chatMessagesRef = useRef(null);
  
  // Initialize host details and reset modals
  useEffect(() => {
    if (isOpen && host) {
      fetchHostDetails();
    }
    
    // Always ensure modals are closed when opening/closing the host details
    setShowCompensationModal(false);
    setCompensationAmount('');
  }, [isOpen, host]);
  
  const fetchHostDetails = async () => {
    setLoading(true);
    try {
      // Fetch detailed host information
      const hostQuery = new Parse.Query(Host);
      hostQuery.equalTo(Host.keys.OBJECT_ID, host.id);
      hostQuery.include(Host.keys.AUTHOR);
      hostQuery.include(Host.keys.AGENCY);
      const hostObject = await hostQuery.first();
      
      if (hostObject) {
        setHostData(hostObject);
      }
      
      // Fetch commission transactions
      const transactionQuery = new Parse.Query(Transaction);
      transactionQuery.equalTo(Transaction.keys.AUTHOR_ID, hostObject.getAuthorId);
      transactionQuery.equalTo(Transaction.keys.RECEIVER_ID, hostObject.agency.get(Agent.keys.AUTHOR_ID));
      transactionQuery.equalTo(Transaction.keys.TRANSACTION_TYPE, Transaction.transactionType.HOST_COMMISSION);
      transactionQuery.include(Transaction.keys.AUTHOR);
      transactionQuery.include(Transaction.keys.RECEIVER);
      transactionQuery.descending(Transaction.keys.CREATED_AT);
      //transactionQuery.limit(50);
      
      const transactionResults = await transactionQuery.find();
      setTransactions(transactionResults);
    } catch (error) {
      console.error('Error fetching host details:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'MMM dd, yyyy HH:mm');
  };
  
  const handleSendCompensation = async () => {
    if (!compensationAmount || isNaN(compensationAmount) || Number(compensationAmount) <= 0) {
      toast.error(t('dashboard.hosts.invalidCompensationAmount'));
      return;
    }
    
    setSendingCompensation(true);
    try {
      // Call cloud code to distribute compensation
      await Parse.Cloud.run('agent_credit_host', {
        senderId: Parse.User.current().id,
        receiverId: host.author.id,
        amount: Number(compensationAmount),
        type: Transaction.transactionType.COMPENSATION
      });
      
      setShowCompensationModal(false);
      setCompensationAmount('');
      toast.success(t('dashboard.hosts.compensationSuccess'));
    } catch (error) {
      // Log the full error for debugging
      console.error('Error sending compensation:', error);
      
      // Access the error object directly if it has the nested structure
      if (error && error.code && typeof error.code === 'object' && error.code.message) {
        // This handles the specific nested structure: {"code":{"message":"Insufficient funds","code":441}}
        toast.error(error.code.message);
      } else if (error && error.message) {
        // Regular error message
        toast.error(error.message);
      } else {
        // Fallback to generic message
        toast.error(t('dashboard.hosts.compensationError'));
      }
    } finally {
      setSendingCompensation(false);
    }
  };
  
  const handleChatWithHost = async () => {
    setShowChatModal(true);
    setChatLoading(true);
    
    try {
      // Get the host user object
      const hostUser = await new Parse.Query(Parse.User)
        .equalTo(User.keys.OBJECT_ID, host.author.id)
        .first();
      
      if (!hostUser) {
        toast.error(t('dashboard.hosts.userNotFound'));
        setChatLoading(false);
        return;
      }
      
      // Check if a chat already exists or create a new one
      Chat.checkOrCreateChat({
        user: hostUser,
        currentUser: Parse.User.current(),
        onChat: (chat) => {
          setCurrentChat(chat);
          loadMessages(chat.id);
          setChatLoading(false);
        },
        onNewChat: (chat) => {
          if (chat) {
            setCurrentChat(chat);
            setMessages([]);
            setChatLoading(false);
          } else {
            toast.error(t('dashboard.hosts.chatCreationFailed'));
            setChatLoading(false);
          }
        },
        onError: () => {
          toast.error(t('dashboard.hosts.chatError'));
          setChatLoading(false);
        }
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error(t('common.error'));
      setChatLoading(false);
    }
  };
  
  const loadMessages = async (chatId) => {
    setChatLoading(true);
    try {
      // Get messages sorted by createdAt in ascending order (oldest first)
      const messagesList = await Message.getMessages(chatId);
      setMessages(messagesList);
      setChatLoading(false);
      
      // Scroll to bottom of messages
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error(t('dashboard.hosts.messagesLoadError'));
      setChatLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentChat) return;
    
    setSending(true);
    try {
      const participants = currentChat.get(Chat.KEY_PARTICIPANTS) || [];
      const message = await Message.sendTextMessage(
        currentChat.id,
        messageText,
        Parse.User.current(),
        participants
      );
      
      // Update the chat's last message
      currentChat.set(Chat.KEY_LAST_MESSAGE, message);
      await currentChat.save();
      
      // Add the new message to the list and clear the input
      setMessages(prevMessages => [...prevMessages, message]);
      setMessageText('');
      
      // Force a reload of messages to ensure everything is in sync
      await loadMessages(currentChat.id);
      
      // Scroll to bottom of messages
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('dashboard.hosts.messageSendError'));
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedImage) {
        handleSendImage();
      } else {
        handleSendMessage();
      }
    }
  };
  
  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if file is an image and less than 5MB
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
        setSelectedImage(file);
      } else {
        toast.error(t('dashboard.hosts.imageError'));
      }
    }
  };
  
  const handleSendImage = async () => {
    if (!selectedImage || !currentChat) return;
    
    setUploadingImage(true);
    try {
      // Create a Parse File from the selected image
      const parseFile = new Parse.File(selectedImage.name, selectedImage);
      await parseFile.save();
      
      const participants = currentChat.get(Chat.KEY_PARTICIPANTS) || [];
      
      // Send image message
      const message = await Message.sendImageMessage(
        currentChat.id,
        parseFile,
        messageText, // Optional caption
        Parse.User.current(),
        participants
      );
      
      // Update the chat's last message
      currentChat.set(Chat.KEY_LAST_MESSAGE, message);
      await currentChat.save();
      
      // Add the new message to the list and clear inputs
      setMessages(prevMessages => [...prevMessages, message]);
      setMessageText('');
      setSelectedImage(null);
      
      // Force a reload of messages to ensure everything is in sync
      await loadMessages(currentChat.id);
      
      // Scroll to bottom of messages
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error(t('dashboard.hosts.imageUploadError'));
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleRemoveHost = async () => {
    if (!hostData) return;
    
    setIsProcessing(true);
    try {
      // Call cloud code to remove host from agency
      await Parse.Cloud.run('process_agency_remove_host', {
        hostId: hostData.id
      });
      
      toast.success(t('dashboard.hosts.hostRemovedSuccess'));
      setShowRemoveConfirmation(false);
      onClose(); // Close the modal after successful removal
      
      // Refresh the hosts list
      if (typeof onHostRemoved === 'function') {
        onHostRemoved();
      }
    } catch (error) {
      console.error('Error removing host:', error);
      toast.error(t('common.error'));
    } finally {
      setIsProcessing(false);
      window.location.reload();
    }
  };
  
  // Don't use conditional rendering with return null anymore
  // Instead, let the ModalOverlay handle visibility with the $isOpen prop
  return (
    <ModalOverlay $isOpen={isOpen}>
      <HostDetailsContainer>
        <ModalHeader>
          <h2>{t('dashboard.hosts.hostDetails')}</h2>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        {/* Confirmation Modal for Host Removal */}
        <ConfirmationModal $isOpen={showRemoveConfirmation}>
          <div className="confirm-content">
            <h3>{t('dashboard.hosts.confirmRemoveHost')}</h3>
            <p>{t('dashboard.hosts.confirmRemoveHostMessage', { hostName: host.name || t('dashboard.hosts.unknownHost') })}</p>
            <CompensationActions>
              <CompensationCancelButton onClick={() => setShowRemoveConfirmation(false)} disabled={isProcessing}>
                {t('common.cancel')}
              </CompensationCancelButton>
              <CompensationConfirmButton 
                onClick={handleRemoveHost} 
                disabled={isProcessing}
                style={{ backgroundColor: '#e53e3e' }}
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="spinner" /> {t('common.processing')}
                  </>
                ) : (
                  t('common.confirm')
                )}
              </CompensationConfirmButton>
            </CompensationActions>
          </div>
        </ConfirmationModal>
        
        {loading ? (
          <LoadingContainer>
            <FaSpinner className="spinner" />
            <p>{t('common.loading')}</p>
          </LoadingContainer>
        ) : (
          <ModalContent>
            {/* Host Profile Section */}
            <HostProfileSection>
              {host.avatar ? (
                <img src={host.avatar} alt={host.name} className="avatar-img" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', fontSize: '1.5rem', color: '#64748b' }}>
                  {host.name
                    ? host.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'UN'}
                </div>
              )}
              
              <HostInfo>
                <h3>{host.name || t('dashboard.hosts.unknownHost')}</h3>
                <p className="uid">ID: {host.uid}</p>
                <StatusBadge className={host.status}>
                  <FaCircle /> {t(`dashboard.hosts.statusTypes.${host.status}`)}
                </StatusBadge>
                
                <HostActionButtons>
                  <ActionButton onClick={handleChatWithHost} className="chat-btn">
                    <FaComments /> {t('dashboard.hosts.chatWithHost')}
                  </ActionButton>
                  <ActionButton onClick={() => setShowCompensationModal(true)} className="compensation-btn">
                    <GiDiamonds /> {t('dashboard.hosts.distributeCompensation')}
                  </ActionButton>
                  <ActionButton onClick={() => setShowRemoveConfirmation(true)} className="remove-btn">
                    <FaUserMinus /> {t('dashboard.hosts.removeHost')}
                  </ActionButton>
                </HostActionButtons>
              </HostInfo>
            </HostProfileSection>
            
            {/* Host Stats Section */}
            <StatsSection>
              <StatItem>
                <FaVideo />
                <div>
                  <h4>{t('dashboard.stats.streams')}</h4>
                  <p>{host.streamCount}</p>
                </div>
              </StatItem>
              
              <StatItem>
                <FaClock />
                <div>
                  <h4>{t('dashboard.stats.duration')}</h4>
                  <p>{formatStreamTime(host.totalStreamTime)}</p>
                </div>
              </StatItem>
              
              <StatItem>
                <FaMoneyBillWave />
                <div>
                  <h4>{t('dashboard.stats.earnings')}</h4>
                  <p>${diamondsToUsd(host.hostEarnings)}</p>
                </div>
              </StatItem>
              
              <StatItem>
                <FaExchangeAlt />
                <div>
                  <h4>{t('dashboard.stats.commissions')}</h4>
                  <p>${diamondsToUsd(host.commissionSent)}</p>
                </div>
              </StatItem>
            </StatsSection>
            
            {/* Transactions Section */}
            <TransactionsSection>
              <SectionTitle>
                <FaFileInvoiceDollar />
                {t('dashboard.hosts.commissionHistory')}
              </SectionTitle>
              
              {transactions.length > 0 ? (
                <TransactionsTable>
                  <thead>
                    <tr>
                      <th>{t('dashboard.hosts.date')}</th>
                      <th>{t('dashboard.hosts.amount')}</th>
                      <th>{t('dashboard.hosts.points')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{formatDate(transaction.createdAt)}</td>
                        <td className="amount">${diamondsToUsd(transaction.get(Transaction.keys.DIAMONDS))}</td>
                        <td className="points">
                          <GiDiamonds className="diamond-icon" /> {transaction.get(Transaction.keys.DIAMONDS)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </TransactionsTable>
              ) : (
                <EmptyTransactions>
                  <FaInfoCircle />
                  <p>{t('dashboard.hosts.noTransactions')}</p>
                </EmptyTransactions>
              )}
            </TransactionsSection>
          </ModalContent>
        )}
        

        
        {/* Compensation Modal */}
        <ModalOverlay $isOpen={showCompensationModal}>
          <CompensationModalContainer>
            <ModalHeader>
              <h2>{t('dashboard.hosts.distributeCompensationTitle')}</h2>
              <CloseButton onClick={() => setShowCompensationModal(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <CompensationContent>
              <p>{t('dashboard.hosts.compensationDescription')}</p>
              
              <CompensationInputGroup>
                <DiamondIcon>
                  <GiDiamonds />
                </DiamondIcon>
                <CompensationInput 
                  type="number" 
                  min="1"
                  placeholder={t('dashboard.hosts.enterDiamonds')}
                  value={compensationAmount}
                  onChange={(e) => setCompensationAmount(e.target.value)}
                />
              </CompensationInputGroup>
              
              {compensationAmount && !isNaN(compensationAmount) && Number(compensationAmount) > 0 && (
                <ConversionText>
                  {compensationAmount} {t('dashboard.hosts.diamondsEquals')} {formatUsd(diamondsToUsd(Number(compensationAmount)))}
                </ConversionText>
              )}
              
              <CompensationActions>
                <CompensationCancelButton onClick={() => setShowCompensationModal(false)}>
                  {t('common.cancel')}
                </CompensationCancelButton>
                <CompensationConfirmButton 
                  onClick={handleSendCompensation}
                  disabled={!compensationAmount || isNaN(compensationAmount) || Number(compensationAmount) <= 0 || sendingCompensation}
                >
                  {sendingCompensation ? (
                    <>
                      <FaSpinner className="spinner" /> {t('dashboard.hosts.sending')}
                    </>
                  ) : (
                    t('dashboard.hosts.sendCompensation')
                  )}
                </CompensationConfirmButton>
              </CompensationActions>
            </CompensationContent>
          </CompensationModalContainer>
        </ModalOverlay>
        
        {/* Chat Modal */}
        <ChatModal $isOpen={showChatModal}>
          <ChatModalContent>
            <ChatModalHeader>
              <div className="user-info">
                {host.avatar ? (
                  <img src={host.avatar} alt={host.name} className="avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    {host.name ? host.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div>
                  <h3>{host.name || t('dashboard.hosts.unknownHost')}</h3>
                  <p className="status">
                    <FaCircle className={host.status} /> {t(`dashboard.hosts.statusTypes.${host.status}`)}
                  </p>
                </div>
              </div>
              <ChatCloseButton onClick={() => setShowChatModal(false)}>
                <FaTimes />
              </ChatCloseButton>
            </ChatModalHeader>
            
            <ChatMessages ref={chatMessagesRef}>
              {chatLoading ? (
                <LoadingContainer>
                  <FaSpinner className="spinner" />
                  <p>{t('common.loading')}</p>
                </LoadingContainer>
              ) : messages.length === 0 ? (
                <EmptyChat>
                  <FaPaperPlane />
                  <p>{t('dashboard.hosts.startConversation')}</p>
                </EmptyChat>
              ) : (
                // Display messages in chronological order (oldest first, newest at the bottom)
                [...messages].sort((a, b) => {
                  const dateA = a.get('createdAt');
                  const dateB = b.get('createdAt');
                  return dateA - dateB; // Sort by date ascending (oldest first)
                }).map(message => {
                  const isSent = message.get(Message.KEY_SENDER_ID) === currentUser.id;
                  const messageDate = message.get('createdAt');
                  
                  // Format date in a more friendly way
                  let formattedTime;
                  
                  if (isToday(messageDate)) {
                    formattedTime = t('common.today') + ' ' + format(messageDate, 'HH:mm');
                  } else if (isYesterday(messageDate)) {
                    formattedTime = t('common.yesterday') + ' ' + format(messageDate, 'HH:mm');
                  } else {
                    formattedTime = format(messageDate, 'dd MMM, HH:mm');
                  }
                  
                  return (
                    <MessageBubble key={message.id} $isSent={isSent}>
                      <MessageContent $isSent={isSent}>
                        {message.get(Message.KEY_MESSAGE_TYPE) === Message.MESSAGE_TYPE_IMAGE ? (
                          <MessageImage src={message.get(Message.KEY_MEDIA_FILE).url()} alt="Image message" />
                        ) : (
                          message.get(Message.KEY_TEXT_MESSAGE)
                        )}
                      </MessageContent>
                      <MessageTime $isSent={isSent}>{formattedTime}</MessageTime>
                    </MessageBubble>
                  );
                })
              )}
            </ChatMessages>
            
            {selectedImage && (
              <ImagePreviewContainer>
                <ImagePreview src={URL.createObjectURL(selectedImage)} alt="Selected image" />
                <RemoveImageButton onClick={() => setSelectedImage(null)}>
                  <FaTimes />
                </RemoveImageButton>
              </ImagePreviewContainer>
            )}
            
            <ChatInputArea>
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageSelect}
                disabled={chatLoading || !currentChat || sending || uploadingImage}
              />
              <ImageButton 
                onClick={() => fileInputRef.current.click()}
                disabled={chatLoading || !currentChat || sending || uploadingImage}
              >
                <FaImage />
              </ImageButton>
              <ChatInput 
                type="text"
                placeholder={t('dashboard.hosts.typeMessage')}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={chatLoading || !currentChat || uploadingImage}
              />
              <SendButton 
                onClick={selectedImage ? handleSendImage : handleSendMessage} 
                disabled={(!messageText.trim() && !selectedImage) || chatLoading || sending || !currentChat || uploadingImage}
              >
                {sending || uploadingImage ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
              </SendButton>
            </ChatInputArea>
          </ChatModalContent>
        </ChatModal>
      </HostDetailsContainer>
    </ModalOverlay>
  );
};

const HostsManagement = () => {
  const { t } = useTranslation();
  const [hostsData, setHosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddHostModalOpen, setIsAddHostModalOpen] = useState(false);
  const [selectedHost, setSelectedHost] = useState(null);
  const [showHostDetailsModal, setShowHostDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    totalHosts: 0,
    activeHosts: 0,
    hostsRevenue: 0,
    totalRevenue: 0
  });

  const fetchHosts = async () => {
    setIsLoading(true);
    try {
      const currentUser = Parse.User.current();
      if (!currentUser) return;

      const agent = await Agent.getAgentByAuthorId(currentUser.id);
      if (!agent) return;

      // Get current month's dates for stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get hosts data with earnings
      const { hosts: hostsWithEarnings, totalEarnings } = await Host.getHostsData(agent);

      // Get stream stats for additional metrics
      const streamStats = await HostStreamStats.getAgentDashboardStats(agent, startOfMonth, endOfMonth);

      // Get Hosts data
      const enrichedHostsData = hostsWithEarnings.map(host => {
        
        const user = host.author;
        let status = HostStreamStats.status.OFFLINE;
        const userStatus = user.get(UserModel.keys.STATUS);
        if (user.get(UserModel.keys.IS_LIVE_STREAMING)) {
          status = HostStreamStats.status.STREAMING;
        } else if (userStatus) {
          status = userStatus;
        }

        return {
          ...host,
          hostEarnings: host.hostEarnings,
          totalStreamTime: host.totalStreamTime,
          commissionSent: host.commissionSent,
          status: status
        };
      });

      setHosts(enrichedHostsData);

      // Calculate summary stats
      const totalHosts = agent.hostIds?.length || 0;
      const activeHosts = streamStats.activeHosts;
      const hostsRevenue = totalEarnings;
      const totalRevenue = agent.diamondsTotal;

      setStats({
        totalHosts,
        activeHosts,
        hostsRevenue,
        totalRevenue
      });

    } catch (error) {
      console.error('Error fetching hosts data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  return (
    <Container>
      <AddHostModal 
        isOpen={isAddHostModalOpen} 
        onClose={() => setIsAddHostModalOpen(false)} 
        onAddHost={fetchHosts} 
      />
      <Header>
        <Title>
          <FaUsers />
          {t('dashboard.hosts.title')}
        </Title>
        <AddHostButton onClick={() => setIsAddHostModalOpen(true)}>
          <FaPlus />
          Add new host
        </AddHostButton>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="title">
            <FaUsers />
            {t('dashboard.overview.totalHosts')}
          </div>
          <div className="value">{stats.totalHosts}</div>
        </StatCard>

        <StatCard>
          <div className="title">
            <FaUsers />
            {t('dashboard.stats.activeHosts')}
          </div>
          <div className="value">{stats.activeHosts}</div>
          <div className="percentage">{stats.totalHosts > 0 ? Math.round((stats.activeHosts / stats.totalHosts) * 100) : 0}%</div>
        </StatCard>

        <StatCard>
          <div className="title">
            <FaMoneyBillWave />
            {t('dashboard.stats.hostEarnings')}
          </div>
          <div className="value">${diamondsToUsd(stats.hostsRevenue)}</div>
        </StatCard>

        <StatCard>
          <div className="title">
            <FaMoneyBillWave />
            {t('dashboard.overview.agencyEarnings')}
          </div>
          <div className="value">${diamondsToUsd(stats.totalRevenue)}</div>
        </StatCard>
      </StatsGrid>

      <ContentCard>
        <div className="card-header">
          <div className="card-title">
            <FaUsers />
            {t('dashboard.hosts.allHosts')}
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <th>{t('dashboard.stats.host')}</th>
              <th>{t('dashboard.stats.status')}</th>
              <th>{t('dashboard.stats.streams')}</th>
              <th>{t('dashboard.stats.duration')}</th>
              <th>{t('dashboard.stats.earnings')}</th>
              <th>{t('dashboard.stats.commissions')}</th>
              <th>{t('dashboard.stats.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  {t('dashboard.hosts.loading')}
                </td>
              </tr>
            ) : hostsData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  {t('dashboard.hosts.noActiveHosts')}
                </td>
              </tr>
            ) : (
              hostsData.map(host => {
                // Get avatar initials
                const initials = host.name
                  ? host.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                  : 'UN';

                return (
                  <tr key={host.hostId}>
                    <td>
                      <div className="host-cell">
                        {host.avatar ? (
                          <img
                            src={host.avatar}
                            alt={host.name}
                            className="avatar-img"
                          />
                        ) : (
                          <div className="avatar">{initials}</div>
                        )}
                        <div className="host-info">
                          <div className="name">{host.name || t('dashboard.hosts.unknownHost')}</div>
                          <div className="id">ID: {host.uid}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge className={host.status}>
                        <FaCircle /> {t(`dashboard.hosts.statusTypes.${host.status}`)}
                      </StatusBadge>
                    </td>
                    <td>
                      <div className="metrics-cell">
                        <FaStream /> {host.streamCount}
                      </div>
                    </td>
                    <td>
                      <div className="metrics-cell">
                        {formatStreamTime(host.totalStreamTime)}
                      </div>
                    </td>
                    <td>
                      <div className="metrics-cell">
                        <FaMoneyBillWave /> ${diamondsToUsd(host.hostEarnings)}
                      </div>
                    </td>
                    <td>
                      <div className="metrics-cell">
                        <FaMoneyBillWave /> ${diamondsToUsd(host.commissionSent)}
                      </div>
                    </td>
                    <td>
                      <ActionButton onClick={() => {
                        setSelectedHost(host);
                        setShowHostDetailsModal(true);
                      }}>
                        {t('dashboard.stats.viewDetails')}
                        <FaArrowRight />
                      </ActionButton>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </ContentCard>
      
      {/* Always render the modal but control visibility with isOpen prop */}
      {selectedHost && (
        <HostDetailsModal
          isOpen={showHostDetailsModal}
          onClose={() => setShowHostDetailsModal(false)}
          host={selectedHost}
          onHostRemoved={fetchHosts}
        />
      )}
    </Container>
  );
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;



const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a2a6c;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: #1a2a6c;
  }
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #1a2a6c, #b21f1f);
  }

  .title {
    color: #64748b;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    svg {
      color: #1a2a6c;
    }
  }

  .value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1a2a6c;
    margin-bottom: 0.5rem;
    letter-spacing: -0.5px;
  }

  .percentage {
    font-size: 1rem;
    color: #64748b;
    font-weight: 500;
  }
`;

const ContentCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
  animation-delay: 0.2s;
  animation-fill-mode: both;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
  }

  .card-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: #1a2a6c;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    svg {
      color: #1a2a6c;
    }
    
    @media (max-width: 768px) {
      font-size: 1.2rem;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th, td {
    padding: 1.25rem 1rem;
    text-align: left;
  }
  
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    
    th, td {
      padding: 1rem 0.75rem;
      white-space: nowrap;
    }
  }

  th {
    font-weight: 600;
    color: #64748b;
    font-size: 0.95rem;
    border-bottom: 2px solid #f1f5f9;
  }

  td {
    font-size: 0.95rem;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }

  tbody tr {
    transition: all 0.2s ease;

    &:hover {
      background-color: #f8fafc;
    }
  }

  .host-cell {
    display: flex;
    align-items: center;
    gap: 1rem;

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #64748b;
      flex-shrink: 0;
    }
    
    .avatar-img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e2e8f0;
      flex-shrink: 0;
    }

    .host-info {
      .name {
        font-weight: 600;
        color: #1a2a6c;
        margin-bottom: 0.25rem;
      }
      .id {
        font-size: 0.85rem;
        color: #64748b;
      }
    }
    
    @media (max-width: 768px) {
      gap: 0.75rem;
      
      .avatar, .avatar-img {
        width: 32px;
        height: 32px;
      }
      
      .host-info .name {
        font-size: 0.9rem;
      }
      
      .host-info .id {
        font-size: 0.8rem;
      }
    }
  }

  .metrics-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;

    svg {
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      font-size: 0.9rem;
      
      svg {
        font-size: 0.8rem;
      }
    }
  }
`;

const StatusBadge = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    font-size: 0.6rem;
    animation: ${pulse} 2s infinite;
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  &.streaming {
    background: #fef2f2;
    color: #ef4444;
  }

  &.online {
    background: #f0fdf4;
    color: #10b981;
  }

  &.offline {
    background: #f8fafc;
    color: #64748b;
  }
`;



const ActionButton = styled.button`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  background: #1a2a6c;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    font-size: 0.9rem;
    transition: transform 0.2s ease;
  }

  &:hover {
    background: #2a3a7c;
    transform: translateX(2px);

    svg {
      transform: translateX(2px);
    }
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    min-height: 40px;
    min-width: 90px;
    touch-action: manipulation;
    
    svg {
      font-size: 0.85rem;
    }
  }
`;

const AddHostButton = styled.button`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(90deg, #1a2a6c, #b21f1f);
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    min-height: 44px;
    touch-action: manipulation;
  }

  svg {
    font-size: 0.9rem;
  }

  &:hover {
    background: linear-gradient(90deg, #1a2a6c, #e74c3c);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  }
`;

// Modal Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: 95%;
    max-height: 80vh;
    border-radius: 12px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1a2a6c;
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    
    h2 {
      font-size: 1.3rem;
    }
  }
`;

const ModalContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    gap: 1rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #1a2a6c;
  }
`;

const InfoBox = styled.div`
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-left: 4px solid #0ea5e9;

  svg {
    color: #0ea5e9;
    font-size: 1.25rem;
    margin-top: 0.25rem;
  }

  p {
    margin: 0;
    color: #0c4a6e;
    font-size: 0.95rem;
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    padding: 0.875rem;
    gap: 0.5rem;
    
    svg {
      font-size: 1.1rem;
    }
    
    p {
      font-size: 0.9rem;
    }
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    gap: 0.4rem;
  }
`;

const Label = styled.label`
  font-size: 0.95rem;
  font-weight: 500;
  color: #334155;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  &::placeholder {
    color: #94a3b8;
  }
  
  @media (max-width: 768px) {
    padding: 0.7rem 0.875rem;
    font-size: 0.95rem;
    border-radius: 6px;
  }
`;



const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
  
  @media (max-width: 768px) {
    gap: 0.75rem;
    flex-wrap: wrap;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 0.7rem 1.25rem;
    font-size: 0.9rem;
    border-radius: 6px;
    min-height: 44px;
    touch-action: manipulation;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const CancelButton = styled(Button)`
  background: #f1f5f9;
  color: #64748b;
  border: none;

  &:hover:not(:disabled) {
    background: #e2e8f0;
  }
`;

const SearchButton = styled(Button)`
  background: #1a2a6c;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #2a3a7c;
  }
`;

const ConfirmButton = styled(Button)`
  background: linear-gradient(90deg, #1a2a6c, #b21f1f);
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: linear-gradient(90deg, #1a2a6c, #e74c3c);
  }
`;

const UserPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  
  @media (max-width: 768px) {
    padding: 0.875rem;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
`;

const UserAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid #cbd5e1;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    font-size: 2.5rem;
    color: #94a3b8;
  }
  
  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
    
    svg {
      font-size: 2rem;
    }
  }
`;

const UserInfo = styled.div`
  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    color: #1a2a6c;
  }

  .uid {
    margin: 0;
    font-size: 0.9rem;
    color: #64748b;
  }
  
  @media (max-width: 768px) {
    h3 {
      font-size: 1.1rem;
      margin-bottom: 0.2rem;
    }
    
    .uid {
      font-size: 0.85rem;
    }
  }
`;

const UserMetrics = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  
  @media (max-width: 768px) {
    padding: 0.625rem;
    gap: 0.75rem;
    flex-wrap: wrap;
    width: 100%;
  }
`;

const MetricItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #64748b;

  svg {
    color: #1a2a6c;
    font-size: 1.1rem;
  }

  strong {
    color: #334155;
    font-size: 1rem;
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    gap: 0.4rem;
    
    svg {
      font-size: 1rem;
    }
    
    strong {
      font-size: 0.95rem;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.9rem;
  padding: 0.5rem;
  background: #fef2f2;
  border-radius: 6px;
  border-left: 3px solid #ef4444;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    padding: 0.4rem;
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;

  svg {
    font-size: 3rem;
    color: #10b981;
    margin-bottom: 1rem;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    color: #1a2a6c;
    font-size: 1.5rem;
  }

  p {
    margin: 0 0 1.5rem 0;
    color: #64748b;
    font-size: 1rem;
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    
    svg {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }
    
    h3 {
      font-size: 1.3rem;
      margin-bottom: 0.4rem;
    }
    
    p {
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
    }
  }
`;

const CloseSuccessButton = styled(Button)`
  background: #1a2a6c;
  color: white;
  border: none;
  padding: 0.75rem 2rem;

  &:hover {
    background: #2a3a7c;
  }
  
  @media (max-width: 768px) {
    padding: 0.7rem 1.75rem;
    min-width: 120px;
  }
`;

// Host Details Modal Styled Components
const HostDetailsContainer = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.3s ease-out;
  
  @media (max-width: 768px) {
    width: 95%;
    max-height: 85vh;
    border-radius: 12px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
  
  .spinner {
    font-size: 2rem;
    margin-bottom: 1rem;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    padding: 2rem;
    
    .spinner {
      font-size: 1.75rem;
    }
  }
`;

const HostProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
    gap: 1rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const HostInfo = styled.div`
  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.5rem;
    color: #1a2a6c;
  }
  
  .uid {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: #64748b;
  }
`;

const HostActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  
  .chat-btn {
    background-color: #3b82f6;
    
    &:hover {
      background-color: #2563eb;
    }
  }
  
  .remove-btn {
    background-color: #ef4444;
    
    &:hover {
      background-color: #dc2626;
    }
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 12px;
  
  svg {
    font-size: 1.5rem;
    color: #1a2a6c;
  }
  
  h4 {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    color: #64748b;
    font-weight: 500;
  }
  
  p {
    margin: 0;
    font-size: 1.25rem;
    color: #1a2a6c;
    font-weight: 600;
  }
`;

const TransactionsSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #1a2a6c;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    color: #1a2a6c;
  }
`;

const TransactionsTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th, td {
    padding: 1rem;
    text-align: left;
  }
  
  th {
    font-weight: 600;
    color: #64748b;
    font-size: 0.9rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  td {
    font-size: 0.95rem;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .amount {
    font-weight: 600;
    color: #1a2a6c;
  }
  
  .points {
    font-weight: 600;
    color: #3b82f6;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .diamond-icon {
      color: #8b5cf6;
      font-size: 1.2rem;
    }
  }
  
  tr:last-child td {
    border-bottom: none;
  }
`;

const EmptyTransactions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f8fafc;
  border-radius: 12px;
  color: #64748b;
  
  svg {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.7;
  }
  
  p {
    margin: 0;
    font-size: 1rem;
  }
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(15, 23, 42, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s, visibility 0.3s;
  
  .confirm-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    
    h3 {
      margin: 0 0 1rem 0;
      color: #1e293b;
    }
    
    p {
      margin: 0 0 1.5rem 0;
      color: #64748b;
    }
    
    .confirm-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    
    .spinner {
      animation: ${spin} 1s linear infinite;
      margin-left: 0.5rem;
    }
  }
`;

// Chat Modal Styled Components
const ChatModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(15, 23, 42, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s, visibility 0.3s;
`;

const ChatModalContent = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.3s ease-out;
`;

const ChatModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #4776E6, #8E54E9);
  color: white;
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .status {
      margin: 4px 0 0 0;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 5px;
      
      svg {
        font-size: 0.6rem;
        
        &.online {
          color: #10b981;
        }
        
        &.offline {
          color: #6b7280;
        }
        
        &.streaming {
          color: #f59e0b;
        }
      }
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.5);
    }
    
    .avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.2rem;
      color: white;
    }
  }
`;

const ChatCloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 300px;
  max-height: 50vh;
  
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 20px;
  }
`;

const MessageBubble = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 70%;
  align-self: ${props => props.$isSent ? 'flex-end' : 'flex-start'};
  animation: ${fadeIn} 0.3s ease-out;
`;

const MessageContent = styled.div`
  padding: 0.75rem 1rem;
  border-radius: ${props => props.$isSent 
    ? '18px 18px 4px 18px' 
    : '18px 18px 18px 4px'};
  background-color: ${props => props.$isSent ? '#4776E6' : 'white'};
  color: ${props => props.$isSent ? 'white' : '#334155'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: ${props => props.$isSent ? 'none' : '1px solid #e2e8f0'};
  word-break: break-word;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  align-self: ${props => props.$isSent ? 'flex-end' : 'flex-start'};
  padding: 0 0.5rem;
`;

const EmptyChat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  text-align: center;
  padding: 2rem;
  
  svg {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    font-size: 0.9rem;
  }
`;

const ChatInputArea = styled.div`
  display: flex;
  padding: 1rem;
  background-color: white;
  border-top: 1px solid #e2e8f0;
  gap: 0.75rem;
  align-items: center;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  font-size: 0.9rem;
  background-color: #f8fafc;
  
  &:focus {
    outline: none;
    border-color: #4776E6;
    box-shadow: 0 0 0 2px rgba(71, 118, 230, 0.1);
  }
  
  &::placeholder {
    color: #94a3b8;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4776E6;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3b5bbd;
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  .spinner {
    animation: ${spin} 1s linear infinite;
  }
`;

const ImageButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e2e8f0;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;
  
  &:hover {
    background-color: #cbd5e0;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ImagePreviewContainer = styled.div`
  padding: 10px;
  background-color: #f7fafc;
  border-top: 1px solid #e2e8f0;
  position: relative;
  display: flex;
  justify-content: center;
`;

const ImagePreview = styled.img`
  max-height: 150px;
  max-width: 100%;
  border-radius: 8px;
  object-fit: contain;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`;

const MessageImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.02);
  }
`;

// Styled components for compensation modal
const CompensationModalContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 95%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
`;

const CompensationContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CompensationInputGroup = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
`;

const DiamondIcon = styled.div`
  background-color: #f7fafc;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e2e8f0;
  color: #805ad5;
  font-size: 1.2rem;
`;

const CompensationInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  border: none;
  outline: none;
  font-size: 1rem;
  
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const ConversionText = styled.div`
  background-color: #f7fafc;
  padding: 10px 15px;
  border-radius: 8px;
  color: #4a5568;
  font-size: 0.9rem;
  text-align: center;
`;

const CompensationActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
`;

const CompensationCancelButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #4a5568;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f7fafc;
  }
`;

const CompensationConfirmButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #4776E6;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #3b5bbd;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .spinner {
    animation: ${spin} 1s linear infinite;
  }
`;



export default HostsManagement;
