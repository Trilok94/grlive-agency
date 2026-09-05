import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { 
  FaPaperPlane, 
  FaSpinner, 
  FaImage, 
  FaTimes, 
  FaExpand, 
  FaRegSmile, 
  FaMicrophone,
  FaEllipsisV,
  FaCheck,
  FaCheckDouble
} from 'react-icons/fa';
import Parse from 'parse';
import { Message } from '../../models/Message';
import { Chat } from '../../models/Chat';
import { useAuth } from '../../context/AuthContext';
import UserModel from '../../models/User';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Main container
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px); /* Increased height to fill more space */
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: ${fadeIn} 0.5s ease-out;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 0; /* Ensure no margin at bottom */
`;

const ChatHeader = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #4776E6, #8E54E9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h2 {
    margin: 0;
    color: white;
    font-weight: 600;
    font-size: 1.2rem;
  }
  
  p {
    margin: 5px 0 0 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 15px;
`;

const HeaderButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 24px 24px 16px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #f9fafc;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  min-height: 0; /* Ensures flex items can shrink below their minimum content size */
  
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

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 70%;
  ${props => props.$isSent ? 'align-self: flex-end;' : 'align-self: flex-start;'}
  margin-bottom: 12px;
  animation: ${slideUp} 0.3s ease-out;
  position: relative;
`;

const MessageContent = styled.div`
  padding: 14px 18px;
  border-radius: ${props => props.$isSent 
    ? '20px 20px 4px 20px' 
    : '20px 20px 20px 4px'};
  ${props => props.$isSent 
    ? 'background: linear-gradient(135deg, #6e48aa, #9d50bb); color: white;' 
    : 'background: white; color: #333;'}
  box-shadow: ${props => props.$isSent 
    ? '0 4px 12px rgba(110, 72, 170, 0.2)' 
    : '0 4px 12px rgba(0, 0, 0, 0.05)'};
  position: relative;
  font-size: 15px;
  line-height: 1.5;
  transition: transform 0.2s;
  border: ${props => props.$isSent ? 'none' : '1px solid rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const MessageStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  ${props => props.isSent ? 'justify-content: flex-end; padding-right: 10px;' : 'justify-content: flex-start; padding-left: 10px;'}
`;

const MessageTime = styled.span`
  font-size: 11px;
  color: ${props => props.isSent ? 'rgba(157, 80, 187, 0.7)' : '#999'};
  font-weight: 500;
`;

const ReadStatus = styled.span`
  color: ${props => props.$isRead ? '#4CAF50' : 'rgba(0, 0, 0, 0.3)'};
  font-size: 10px;
  display: flex;
  align-items: center;
`;

const ChatInput = styled.div`
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 12px;
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 10;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.03);
  align-items: center;
  margin-top: auto; /* Push to bottom if there's extra space */
`;

const Input = styled.input`
  flex: 1;
  padding: 14px 20px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 24px;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #9d50bb;
    box-shadow: 0 4px 12px rgba(157, 80, 187, 0.1);
    transform: translateY(-1px);
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const ActionButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: ${props => props.$primary ? 'linear-gradient(135deg, #6e48aa, #9d50bb)' : '#f0f2f5'};
  color: ${props => props.$primary ? 'white' : '#666'};
  box-shadow: ${props => props.$primary ? '0 4px 12px rgba(110, 72, 170, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)'};
  font-size: 18px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$primary ? '0 6px 16px rgba(110, 72, 170, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'};
    background: ${props => props.$primary ? 'linear-gradient(135deg, #7e58ba, #ad60cb)' : '#e4e6e9'};
  }

  &:disabled {
    background: #e0e0e0;
    color: #aaa;
    box-shadow: none;
    cursor: not-allowed;
    transform: none;
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const ImagePreviewContainer = styled.div`
  padding: 16px 20px;
  background: #f9fafc;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  position: relative;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ImagePreview = styled.img`
  max-height: 120px;
  max-width: 220px;
  border-radius: 12px;
  margin-right: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  
  &:hover {
    transform: scale(1.03);
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  
  &:hover {
    background: rgba(220, 53, 69, 0.8);
    transform: scale(1.1);
  }
`;

const ImageMessageContent = styled.div`
  max-width: 250px;
  border-radius: ${props => props.$isSent 
    ? '20px 20px 4px 20px' 
    : '20px 20px 20px 4px'};
  overflow: hidden;
  box-shadow: ${props => props.$isSent 
    ? '0 4px 12px rgba(110, 72, 170, 0.2)' 
    : '0 4px 12px rgba(0, 0, 0, 0.05)'};
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border: ${props => props.$isSent ? 'none' : '1px solid rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: ${props => props.$isSent 
    ? '0 8px 20px rgba(110, 72, 170, 0.3)' 
    : '0 8px 20px rgba(0, 0, 0, 0.1)'};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.3));
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover::after {
    opacity: 1;
  }
  
  img {
    width: 100%;
    display: block;
    transition: transform 0.3s;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
`;

const modalFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const modalScaleIn = keyframes`
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.4s ease, visibility 0.4s ease;
  backdrop-filter: blur(5px);
  
  ${props => props.$isOpen && css`
    opacity: 1;
    visibility: visible;
    animation: ${modalFadeIn} 0.4s ease-out;
  `}
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 90%;
  max-height: 90%;
  animation: ${props => props.$isOpen ? css`${modalScaleIn} 0.4s ease-out` : 'none'};
  
  img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: -50px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

const SupportChat = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [modalImage, setModalImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const scrollToBottomImmediate = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  // Mark a single message as read
  const setMessageRead = async (message) => {
    console.log('Marking message as read:', message);
    
    if (!message.get(Message.KEY_READ)) {
      message.set(Message.KEY_READ, true);
      await message.save();
      
      // Refresh the chat to update unread indicators
      try {
        if (chat) {
          const refreshedChat = await Chat.getChat(chat.id);
          setChat(refreshedChat);
        }
      } catch (error) {
        console.error('Error refreshing chat:', error);
      }
    }
  };

  // Initialize support chat
  useEffect(() => {
    if (currentUser) {
     initSupportChat();
    }
  }, [currentUser]);

  const initSupportChat = async () => {
    try {
      setLoading(true);
      
      // Find a support agent (in a real app, you'd have logic to select an available agent)
      const User = Parse.Object.extend('_User');
      const agentQuery = new Parse.Query(User);
      agentQuery.equalTo(UserModel.keys.AGENT_ID, currentUser.get(UserModel.keys.AGENCY_ID));

      const agent = await agentQuery.first();

      // Check if a chat already exists or create a new one
      Chat.checkOrCreateChat({
        user: agent,
        currentUser: currentUser,
        onChat: async (existingChat) => {
          setChat(existingChat);
          
          // Fetch messages for this chat
          const chatMessages = await Message.getMessages(existingChat.id);
          setMessages(chatMessages.reverse()); // Reverse to show oldest first
          setLoading(false);
        },
        onNewChat: async (newChat) => {
          if (newChat) {
            setChat(newChat);
            setMessages([]);
          } else {
            console.error('Failed to create new chat');
          }
          setLoading(false);
        },
        onError: () => {
          console.error('Error checking or creating chat');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error initializing support chat:', error);
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if ((messageText.trim() || selectedImage) && chat && !sending) {
      try {
        setSending(true);
        
        // Handle image upload if an image is selected
        if (selectedImage) {
          // Create a temporary message to show immediately
          const tempImageMessage = {
            id: 'temp-img-' + Date.now(),
            imageUrl: imagePreview,
            timestamp: new Date(),
            isSent: true,
            isPending: true,
            isImage: true
          };
          
          setMessages(prev => [...prev, tempImageMessage]);
          
          // Create Parse file from the selected image
          const parseFile = new Parse.File(selectedImage.name, selectedImage);
          await parseFile.save();
          
          // Send the actual image message
          const sentImageMessage = await Message.sendImageMessage(
            chat.id,
            parseFile,
            null, // No thumbnail for now
            currentUser,
            chat.participants
          );
          
          // Replace the temporary message with the actual one
          setMessages(prev => prev.map(msg => 
            msg.id === tempImageMessage.id ? {
              id: sentImageMessage.id,
              type: Message.MESSAGE_TYPE_IMAGE,
              mediaFile: sentImageMessage.mediaFile,
              timestamp: sentImageMessage.createdAt,
              isSent: sentImageMessage.senderId === currentUser.id,
              isPending: false,
              isImage: true
            } : msg
          ));
          
          // Update the last message in the chat
          chat.lastMessage = sentImageMessage;
          await chat.save();
          
          // Clear the image selection
          handleRemoveImage();
        }
        
        // Handle text message if text is entered
        if (messageText.trim()) {
          // Create a temporary message to show immediately
          const tempMessage = {
            id: 'temp-' + Date.now(),
            content: messageText,
            timestamp: new Date(),
            isSent: true,
            isPending: true
          };
          
          setMessages(prev => [...prev, tempMessage]);
          setMessageText('');
          
          // Send the actual message
          const sentMessage = await Message.sendTextMessage(
            chat.id,
            messageText,
            currentUser,
            chat.participants
          );
          
          // Replace the temporary message with the actual one
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessage.id ? {
              id: sentMessage.id,
              content: sentMessage.message,
              timestamp: sentMessage.createdAt,
              isSent: sentMessage.senderId === currentUser.id,
              isPending: false
            } : msg
          ));
          
          // Update the last message in the chat
          chat.lastMessage = sentMessage;
          await chat.save();
        }
        
      } catch (error) {
        console.error('Error sending message:', error);
        // Remove the temporary message if sending failed
        setMessages(prev => prev.filter(msg => !msg.isPending));
      } finally {
        setSending(false);
      }
    }
  };

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    setModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };
  
  const closeImageModal = () => {
    setModalOpen(false);
    setModalImage(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };
  
  // Close modal when clicking outside the image
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeImageModal();
      }
    };
    
    if (modalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalOpen]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && messageText.trim()) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Format message timestamp with more user-friendly format
  const formatTimestamp = (date) => {
    if (!date) return '';
    
    const messageDate = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Time part (hours:minutes)
    const timeStr = messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Check if it's today
    if (
      messageDate.getDate() === now.getDate() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear()
    ) {
      return t('dashboard.support.timeToday', { time: timeStr }) || `Today at ${timeStr}`;
    }
    
    // Check if it's yesterday
    if (
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()
    ) {
      return t('dashboard.support.timeYesterday', { time: timeStr }) || `Yesterday at ${timeStr}`;
    }
    
    // Check if it's within the last week
    const daysDiff = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      const weekday = messageDate.toLocaleDateString(undefined, { weekday: 'long' });
      return t('dashboard.support.timeWeekday', { weekday, time: timeStr }) || `${weekday} at ${timeStr}`;
    }
    
    // For older messages, show the full date
    const dateStr = messageDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return `${dateStr}, ${timeStr}`;
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <HeaderInfo>
          <h2>{t('dashboard.support.title')}</h2>
          <p>{t('dashboard.support.subtitle')}</p>
        </HeaderInfo>
        <HeaderActions>
          <HeaderButton title={t('common.moreOptions') || "More options"}>
            <FaEllipsisV />
          </HeaderButton>
        </HeaderActions>
      </ChatHeader>

      <ChatMessages ref={chatMessagesRef}>
        {loading ? (
          <LoadingContainer>
            <FaSpinner className="spinner" />
            <p>{t('common.loading')}</p>
          </LoadingContainer>
        ) : messages.length === 0 ? (
          <EmptyState>
            <FaRegSmile />
            <p>{t('dashboard.support.noMessages')}</p>
            <span>{t('dashboard.support.startConversation') || 'Start the conversation by sending a message below'}</span>
          </EmptyState>
        ) : (
          messages.map((msg) => {
            // Determine if message is sent by current user
            const isSent = msg.isSent || (msg.senderId === currentUser?.id);
            
            // Mark message as read if it's not sent by current user and not already read
            if (!isSent && msg.id && !msg.isPending) {
              // Check if this is a Parse object with the proper methods
              if (msg.get && !msg.get(Message.KEY_READ) && msg.get(Message.KEY_SENDER_ID) !== currentUser?.id) {
                // Use setTimeout to avoid blocking the UI render
                setTimeout(() => {
                  setMessageRead(msg);
                }, 1000);
              }
            }
            
            const isRead = msg.get ? msg.get(Message.KEY_READ) : !msg.isPending; // Check read status
            
            return (
              <MessageWrapper key={msg.id} $isSent={isSent}>
                {msg.isImage || msg.type === Message.MESSAGE_TYPE_IMAGE ? (
                  <>
                    <ImageMessageContent 
                      $isSent={isSent} 
                      onClick={() => openImageModal(msg.imageUrl || (msg.mediaFile ? msg.mediaFile.url() : ''))}
                    >
                      <img 
                        src={msg.imageUrl || (msg.mediaFile ? msg.mediaFile.url() : '')} 
                        alt={t('dashboard.support.sharedImage') || 'Shared image'} 
                      />
                      {msg.isPending && (
                        <PendingIndicator $isSent={isSent}>
                          <FaSpinner className="spinner" />
                        </PendingIndicator>
                      )}
                    </ImageMessageContent>
                    <MessageStatus $isSent={isSent}>
                      <MessageTime $isSent={isSent}>
                        {formatTimestamp(msg.timestamp || msg.createdAt)}
                      </MessageTime>
                      {isSent && !msg.isPending && (
                        <ReadStatus $isRead={isRead}>
                          {isRead ? <FaCheckDouble /> : <FaCheck />}
                        </ReadStatus>
                      )}
                    </MessageStatus>
                  </>
                ) : (
                  <>
                    <MessageContent $isSent={isSent}>
                      {msg.content || msg.message}
                      {msg.isPending && (
                        <PendingIndicator $isSent={isSent}>
                          <FaSpinner className="spinner" />
                        </PendingIndicator>
                      )}
                    </MessageContent>
                    <MessageStatus $isSent={isSent}>
                      <MessageTime $isSent={isSent}>
                        {formatTimestamp(msg.timestamp || msg.createdAt)}
                      </MessageTime>
                      {isSent && !msg.isPending && (
                        <ReadStatus $isRead={isRead}>
                          {isRead ? <FaCheckDouble /> : <FaCheck />}
                        </ReadStatus>
                      )}
                    </MessageStatus>
                  </>
                )}
              </MessageWrapper>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </ChatMessages>

      {selectedImage && (
        <ImagePreviewContainer>
          <ImagePreview src={imagePreview} alt={t('dashboard.support.selectedImage') || 'Selected image'} />
          <RemoveImageButton onClick={handleRemoveImage}>
            <FaTimes />
          </RemoveImageButton>
        </ImagePreviewContainer>
      )}
      
      <ChatInput>
        <ActionButton 
          onClick={() => fileInputRef.current?.click()} 
          disabled={loading || !chat}
          title={t('dashboard.support.attachImage') || 'Attach Image'}
        >
          <FaImage />
        </ActionButton>
        <Input
          id="chat-input"
          type="text"
          placeholder={t('dashboard.support.messagePlaceholder')}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || !chat}
        />
        <ActionButton 
          $primary 
          onClick={handleSend} 
          disabled={(!messageText.trim() && !selectedImage) || sending || loading || !chat}
        >
          {sending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
        </ActionButton>
        <input 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handleImageSelect}
          ref={fileInputRef}
          disabled={loading || !chat}
        />
      </ChatInput>
      
      {/* Image Modal */}
      <Modal $isOpen={modalOpen} onClick={closeImageModal}>
        <ModalContent $isOpen={modalOpen} onClick={(e) => e.stopPropagation()}>
          <img src={modalImage} alt={t('dashboard.support.fullSizeImage') || 'Full size image'} />
          <CloseButton onClick={closeImageModal}>
            <FaTimes />
          </CloseButton>
        </ModalContent>
      </Modal>
    </ChatContainer>
  );
};

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  
  .spinner {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    animation: ${spin} 1.2s linear infinite;
    color: #9d50bb;
  }
  
  p {
    font-size: 1.1rem;
    font-weight: 500;
    background: linear-gradient(135deg, #6e48aa, #9d50bb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1; /* Take up all available space */
  color: #888;
  text-align: center;
  padding: 2rem;
  margin: auto 0; /* Center vertically */
  
  svg {
    font-size: 3rem;
    color: #ccc;
    margin-bottom: 1rem;
    opacity: 0.7;
  }
  
  p {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  span {
    font-size: 0.9rem;
    opacity: 0.7;
  }
`;

const PendingIndicator = styled.span`
  display: inline-block;
  margin-left: 8px;
  
  .spinner {
    font-size: 0.8rem;
    animation: ${spin} 1s linear infinite;
    color: ${props => props.isSent ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.4)'};
  }
`;

export default SupportChat;
