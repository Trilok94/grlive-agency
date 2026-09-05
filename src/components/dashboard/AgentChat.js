import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import Parse from 'parse';
import { 
  FaSearch, 
  FaPaperPlane, 
  FaImage, 
  FaSpinner, 
  FaTimes, 
  FaEllipsisV,
  FaCircle,
  FaChevronLeft
} from 'react-icons/fa';
import { Chat } from '../../models/Chat';
import { Message } from '../../models/Message';
import UserModel from '../../models/User';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

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

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Main container
const ChatPageContainer = styled.div`
  display: flex;
  height: calc(100vh - 120px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: ${fadeIn} 0.5s ease-out;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    height: calc(100vh - 100px);
    border-radius: 12px;
  }
`;

// Chat list sidebar
const ChatListSidebar = styled.div`
  width: 320px;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  
  @media (max-width: 768px) {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 20;
    transform: translateX(${props => props.$mobileVisible ? '0' : '-100%'});
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-right: none;
  }
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(135deg, #4776E6, #8E54E9);
  
  h2 {
    margin: 0 0 10px 0;
    color: white;
    font-weight: 600;
    font-size: 1.2rem;
  }
`;

const SearchContainer = styled.div`
  padding: 15px;
  position: relative;
  
  input {
    width: 100%;
    padding: 12px 15px 12px 40px;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    font-size: 14px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    
    &:focus {
      outline: none;
      border-color: #9d50bb;
      box-shadow: 0 4px 12px rgba(157, 80, 187, 0.1);
    }
    
    &::placeholder {
      color: #aaa;
    }
  }
  
  svg {
    position: absolute;
    left: 30px;
    top: 50%;
    transform: translateY(-50%);
    color: #aaa;
    font-size: 14px;
  }
`;

const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  
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

const ChatItem = styled.div`
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  position: relative;
  
  ${props => props.$active && css`
    background: rgba(157, 80, 187, 0.05);
    border-left-color: #9d50bb;
  `}
  
  ${props => props.$unread && css`
    background: rgba(157, 80, 187, 0.08);
    border-left-color: #9d50bb;
  `}
  
  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
  
  .avatar {
    width: 48px;
    height: 48px;
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
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e2e8f0;
    flex-shrink: 0;
  }
  
  .chat-info {
    flex: 1;
    min-width: 0;
    
    .name {
      font-weight: 600;
      color: #334155;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .username {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 70%;
      }
      
      .time {
        font-size: 12px;
        color: #94a3b8;
        font-weight: normal;
        flex-shrink: 0;
      }
    }
    
    .preview {
      font-size: 13px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      ${props => props.$unread && css`
        font-weight: 600;
        color: #334155;
      `}
    }
  }
`;

// Define pulse animation for unread indicator
const pulseAnimation = keyframes`
  0% {
    transform: translateY(-50%) scale(0.95);
    box-shadow: 0 0 0 0 rgba(157, 80, 187, 0.7);
  }
  70% {
    transform: translateY(-50%) scale(1);
    box-shadow: 0 0 0 6px rgba(157, 80, 187, 0);
  }
  100% {
    transform: translateY(-50%) scale(0.95);
    box-shadow: 0 0 0 0 rgba(157, 80, 187, 0);
  }
`;

const UnreadIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9d50bb;
  position: absolute;
  top: 18px;
  right: 15px;
  transform: translateY(-50%);
  box-shadow: 0 0 0 2px white;
  animation: ${pulseAnimation} 2s infinite;
`;

// Chat area (reusing much of SupportChat styling)
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ChatHeader = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #4776E6, #8E54E9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    padding: 15px;
  }

  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h2 {
    margin: 0;
    color: white;
    font-weight: 600;
  }
  
  p {
    margin: 5px 0 0 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  .back-button {
    display: none;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    margin-right: 5px;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  @media (max-width: 768px) {
    .back-button {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .host-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
  
  .host-info {
    h2 {
      font-size: 1.1rem;
      margin: 0;
    }
    
    p {
      font-size: 0.8rem;
      margin: 3px 0 0 0;
      opacity: 0.8;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
`;

const HeaderButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
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
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 0.9rem;
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

const MessageBubble = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 70%;
  align-self: ${props => props.$isSent ? 'flex-end' : 'flex-start'};
  animation: ${slideUp} 0.3s ease-out;
  margin-bottom: 12px;
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
  font-size: 12px;
  color: #94a3b8;
  ${props => props.$isSent ? 'justify-content: flex-end; padding-right: 10px;' : 'justify-content: flex-start; padding-left: 10px;'}
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

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  
  .spinner {
    animation: ${spin} 1s linear infinite;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #9d50bb;
  }
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
  
  @media (max-width: 768px) {
    padding: 12px 15px;
    gap: 8px;
  }
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
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 14px;
    border-radius: 20px;
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const ActionButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$primary ? 'linear-gradient(135deg, #6e48aa, #9d50bb)' : '#f1f5f9'};
  color: ${props => props.$primary ? 'white' : '#64748b'};
  box-shadow: ${props => props.$primary 
    ? '0 4px 12px rgba(110, 72, 170, 0.2)' 
    : '0 2px 8px rgba(0, 0, 0, 0.05)'};
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${props => props.$primary 
    ? '0 6px 16px rgba(110, 72, 170, 0.3)' 
    : '0 4px 12px rgba(0, 0, 0, 0.08)'};
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    min-width: 40px; /* Ensure good touch target */
    min-height: 40px; /* Ensure good touch target */
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .spinner {
    animation: ${spin} 1s linear infinite;
  }
`;

const ImagePreviewContainer = styled.div`
  align-self: center;
  margin: 10px 0;
  position: relative;
  max-width: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(157, 80, 187, 0.3);
  
  img {
    width: 100%;
    display: block;
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: scale(1.1);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  cursor: pointer;
`;

const modalAnimation = css`
  @keyframes modalOpen {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const ModalContent = styled.div`
  max-width: 90%;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: default;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: ${props => props.$isOpen ? 'modalOpen 0.3s ease-out forwards' : 'none'};
  ${modalAnimation}
  
  img {
    max-width: 100%;
    max-height: 90vh;
    display: block;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: scale(1.1);
  }
  
  svg {
    font-size: 1rem;
  }
`;

// Main AgentChat component
const AgentChat = () => {
  // State for mobile view
  const [showMobileList, setShowMobileList] = useState(true);
  const { t, i18n } = useTranslation();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  
  const chatMessagesRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Load chats for the current user
  useEffect(() => {
    const loadChats = async () => {
      setLoading(true);
      try {
        const currentUser = Parse.User.current();
        if (!currentUser) return;
        
        const userChats = await Chat.getChatsForUser(currentUser);
        setChats(userChats);
        
        // Don't auto-select the first chat
        // Let the user choose which chat to view
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChats();
  }, []);
  
  // Load messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) return;
    
    const loadMessages = async () => {
      setLoading(true);
      try {
        // Using the correct method name from the Message model
        const messages = await Message.getMessages(selectedChat.id);
        // Reverse the order to show recent messages at the bottom
        setMessages(messages.reverse());
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [selectedChat]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    // Find the other participant (not the current user)
    const currentUser = Parse.User.current();
    const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
    
    if (!otherParticipant) return false;
    
    const name = otherParticipant.get(UserModel.keys.FULL_NAME) || otherParticipant.get(UserModel.keys.USERNAME) || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Format timestamp for chat list
  const formatChatTimestamp = (date) => {
    if (!date) return '';
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return t('common.yesterday');
    } else {
      return format(date, 'MM/dd/yyyy');
    }
  };
  
  // Get the other participant in a chat
  const getOtherParticipant = (chat) => {
    if (!chat) return null;
    
    const currentUser = Parse.User.current();
    return chat.participants.find(p => p.id !== currentUser.id);
  };
  
  // Handle selecting a chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    // Hide chat list on mobile after selection
    if (window.innerWidth <= 768) {
      setShowMobileList(false);
    }
  };
  
  // Mark a single message as read
  const setMessageRead = async (message) => {
    
    if (!message.get(Message.KEY_READ)) {
      message.set(Message.KEY_READ, true);
      await message.save();
      
      // Refresh the chat list to update unread indicators
      try {
        const currentUser = Parse.User.current();
        const userChats = await Chat.getChatsForUser(currentUser);
        setChats(userChats);
      } catch (error) {
        console.error('Error refreshing chats:', error);
      }
    }
  };
  
  // Handle sending a message
  const handleSend = async () => {
    if ((!messageText.trim() && !selectedImage) || !selectedChat) return;
    
    setSending(true);
    try {
      const currentUser = Parse.User.current();
      
      if (selectedImage) {
        // Create a Parse File
        const name = `image_${Date.now()}.jpg`;
        const parseFile = new Parse.File(name, selectedImage);
        await parseFile.save();
        
        // Send image message
        const sentImageMessage = await Message.sendImageMessage(
          selectedChat.id, 
          parseFile, 
          null, 
          currentUser, 
          selectedChat.participants
        );
        
        // Update the last message in the chat
        selectedChat.lastMessage = sentImageMessage;
        await selectedChat.save();
        
        setMessages(prevMessages => [...prevMessages, sentImageMessage]);
        setSelectedImage(null);
      } else {
        // Send text message
        const sentMessage = await Message.sendTextMessage(
          selectedChat.id, 
          messageText, 
          currentUser, 
          selectedChat.participants
        );

        // Update the last message in the chat
        selectedChat.lastMessage = sentMessage;
        await selectedChat.save();
        
        setMessages(prevMessages => [...prevMessages, sentMessage]);
        setMessageText('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };
  
  // Handle image selection
  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  // Handle removing selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle key press in input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Open image modal
  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    setModalOpen(true);
  };
  
  // Close image modal
  const closeImageModal = () => {
    setModalOpen(false);
  };
  
  // Format message timestamp
  const formatMessageTimestamp = (date) => {
    if (!date) return '';
    
    const locale = i18n.language === 'fr' ? fr : enUS;
    
    if (isToday(date)) {
      return `${t('common.today')} ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `${t('common.yesterday')} ${format(date, 'HH:mm')}`;
    } else {
      const dayName = format(date, 'EEEE', { locale });
      const isWithinWeek = date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      if (isWithinWeek) {
        return `${dayName} ${format(date, 'HH:mm')}`;
      } else {
        return `${format(date, 'dd/MM/yyyy')} ${format(date, 'HH:mm')}`;
      }
    }
  };
  
  // Render chat list items
  const renderChatItems = () => {
    if (loading && chats.length === 0) {
      return <div className="loading-state">{t('common.loading')}</div>;
    }
    
    if (filteredChats.length === 0) {
      return <div className="empty-state">{t('dashboard.agent.noChatsFound')}</div>;
    }
    
    return filteredChats.map(chat => {
      const otherParticipant = getOtherParticipant(chat);
      const name = otherParticipant?.get(UserModel.keys.FULL_NAME) || otherParticipant?.get(UserModel.keys.USERNAME) || t('dashboard.agent.unknownUser');
      const lastMessage = chat.lastMessage;
      
      // Get the appropriate last message preview based on message type
      let lastMessageText = '';
      if (lastMessage) {
        const messageType = lastMessage.get(Message.KEY_MESSAGE_TYPE);
        if (messageType === Message.MESSAGE_TYPE_IMAGE) {
          lastMessageText = t('dashboard.support.sharedImage');
        } else if (messageType === Message.MESSAGE_TYPE_TEXT) {
          lastMessageText = lastMessage.get(Message.KEY_TEXT_MESSAGE) || '';
        }
      }
      
      const lastMessageTime = lastMessage ? formatChatTimestamp(lastMessage.createdAt) : '';
      
      // Check if there are unread messages
      const isUnread = lastMessage ? 
        (lastMessage.get(Message.KEY_SENDER_ID) !== Parse.User.current().id && 
         !lastMessage.get(Message.KEY_READ)) : false;
      
      return (
        <ChatItem 
          key={chat.id} 
          $active={selectedChat?.id === chat.id}
          $unread={isUnread}
          onClick={() => handleSelectChat(chat)}
        >
          {otherParticipant?.get(UserModel.keys.AVATAR_FILE) ? (
            <img 
              className="avatar-img" 
              src={otherParticipant.get(UserModel.keys.AVATAR_FILE).url()} 
              alt={name}
            />
          ) : (
            <div className="avatar">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="chat-info">
            <div className="name">
              <span className="username">{name}</span>
              <span className="time">{lastMessageTime}</span>
            </div>
            <div className="preview">{lastMessageText}</div>
          </div>
          {isUnread && <UnreadIndicator />}
        </ChatItem>
      );
    });
  };
  
  return (
    <ChatPageContainer>
      {/* Chat List Sidebar */}
      <ChatListSidebar $mobileVisible={showMobileList}>
        <SidebarHeader>
          <h2>{t('dashboard.agent.conversations')}</h2>
          <SearchContainer>
            <input 
              type="text" 
              placeholder={t('dashboard.agent.searchHosts')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch />
          </SearchContainer>
        </SidebarHeader>
        <ChatList>
          {renderChatItems()}
        </ChatList>
      </ChatListSidebar>
      
      {/* Chat Area */}
      <ChatContainer>
        {selectedChat ? (
          <>
            <ChatHeader>
              <HeaderInfo>
                <button 
                  className="back-button" 
                  onClick={() => setShowMobileList(true)}
                  aria-label="Back to chat list"
                >
                  <FaChevronLeft />
                </button>
                {getOtherParticipant(selectedChat)?.get(UserModel.keys.AVATAR_FILE) ? (
                  <img 
                    className="host-avatar" 
                    src={getOtherParticipant(selectedChat).get(UserModel.keys.AVATAR_FILE).url()} 
                    alt={getOtherParticipant(selectedChat)?.get(UserModel.keys.FULL_NAME) || t('dashboard.agent.unknownUser')}
                  />
                ) : (
                  <div className="host-avatar">
                    {getOtherParticipant(selectedChat)?.get(UserModel.keys.AVATAR_FILE)?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="host-info">
                  <h2>{getOtherParticipant(selectedChat)?.get(UserModel.keys.FULL_NAME) || t('dashboard.agent.unknownUser')}</h2>
                  <p>{getOtherParticipant(selectedChat)?.get(UserModel.keys.EMAIL) || ''}</p>
                </div>
              </HeaderInfo>
              <HeaderActions>
                <HeaderButton title={t('common.moreOptions')}>
                  <FaEllipsisV />
                </HeaderButton>
              </HeaderActions>
            </ChatHeader>
            
            {/* Chat Messages */}
            <ChatMessages ref={chatMessagesRef}>
              {loading ? (
                <LoadingState>
                  <FaSpinner className="spinner" />
                  <p>{t('common.loading')}</p>
                </LoadingState>
              ) : messages.length === 0 ? (
                <EmptyState>
                  <FaPaperPlane />
                  <p>{t('dashboard.agent.startConversation')}</p>
                  <span>{t('dashboard.agent.sendFirstMessage')}</span>
                </EmptyState>
              ) : (
                messages.map(message => {
                  const currentUser = Parse.User.current();
                  const isSent = message.get(Message.KEY_SENDER_ID) === currentUser.id;
                  const timestamp = formatMessageTimestamp(message.createdAt);
                  
                  // Mark message as read if it's not from the current user and not read yet
                  if (!isSent && !message.get(Message.KEY_READ)) {
                    setMessageRead(message);
                  }
                  
                  // Check message type and use the correct field names from the Message model
                  const messageType = message.get(Message.KEY_MESSAGE_TYPE);
                  let content = null;
                  
                  if (messageType === Message.MESSAGE_TYPE_IMAGE) {
                    // For image messages, use the media field
                    const imageFile = message.get(Message.KEY_MEDIA_FILE);
                    const imageUrl = imageFile ? imageFile.url() : null;
                    
                    if (imageUrl) {
                      content = (
                        <ImageMessageContent $isSent={isSent} onClick={() => openImageModal(imageUrl)}>
                          <img src={imageUrl} alt={t('dashboard.support.sharedImage')} />
                        </ImageMessageContent>
                      );
                    }
                  } else {
                    // For text messages, use the message field
                    const text = message.get(Message.KEY_TEXT_MESSAGE);
                    if (text) {
                      content = (
                        <MessageContent $isSent={isSent}>
                          {text}
                        </MessageContent>
                      );
                    }
                  }
                  
                  return content ? (
                    <MessageBubble key={message.id} $isSent={isSent}>
                      {content}
                      <MessageStatus $isSent={isSent}>
                        <span>{timestamp}</span>
                      </MessageStatus>
                    </MessageBubble>
                  ) : null;
                })
              )}
              
              {selectedImage && imagePreview && (
                <ImagePreviewContainer>
                  <img 
                    src={imagePreview} 
                    alt={t('dashboard.support.selectedImage')} 
                  />
                  <RemoveImageButton onClick={handleRemoveImage}>
                    <FaTimes />
                  </RemoveImageButton>
                </ImagePreviewContainer>
              )}
            </ChatMessages>
            
            {/* Chat Input */}
            <ChatInput>
              <ActionButton 
                onClick={() => fileInputRef.current?.click()} 
                disabled={loading || !selectedChat}
                title={t('dashboard.support.attachImage')}
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
                disabled={loading || !selectedChat}
              />
              <ActionButton 
                $primary 
                onClick={handleSend} 
                disabled={(!messageText.trim() && !selectedImage) || sending || loading || !selectedChat}
              >
                {sending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
              </ActionButton>
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageSelect}
                ref={fileInputRef}
                disabled={loading || !selectedChat}
              />
            </ChatInput>
          </>
        ) : (
          <EmptyState>
            <FaPaperPlane />
            <p>{t('dashboard.agent.selectConversation')}</p>
            <span>{t('dashboard.agent.chooseHostToChat')}</span>
          </EmptyState>
        )}
      </ChatContainer>
      
      {/* Image Modal */}
      <Modal $isOpen={modalOpen} onClick={closeImageModal}>
        <ModalContent $isOpen={modalOpen} onClick={(e) => e.stopPropagation()}>
          {modalImage && <img src={modalImage} alt={t('dashboard.support.fullSizeImage')} />}
          <CloseButton onClick={closeImageModal}>
            <FaTimes />
          </CloseButton>
        </ModalContent>
      </Modal>
    </ChatPageContainer>
  );
};

export default AgentChat;
