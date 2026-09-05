import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import Parse from 'parse';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { 
  FaHome, FaUsers, FaVideo, FaMoneyBillWave, FaChartLine, FaChartPie,
  FaCog, FaSignOutAlt, FaBars, FaTimes, FaBell, FaUserCircle, FaAngleDown,
  FaEnvelope, FaComments, FaBuilding
} from 'react-icons/fa';
import { Chat } from '../../models/Chat';
import { Message } from '../../models/Message';
import { authService, userService, UserConstants } from '../../services/ParseService';
import { useAuth } from '../../context/AuthContext';
import AgentDetails from '../../components/dashboard/AgentDetails';
import StreamsList from '../../components/dashboard/StreamsList';
import SupportChat from '../../components/dashboard/SupportChat';
import { useTranslation } from 'react-i18next';
import RoleBasedContent from '../../components/RoleBasedContent';
import AgentDashboard from '../../components/dashboard/AgentDashboard';
import HostDashboard from '../../components/dashboard/HostDashboard';
import HostsManagement from '../../components/hosts/HostsManagement';
import AgencyOptionsPage from '../agency/AgencyOptionsPage';
import AgentChat from '../../components/dashboard/AgentChat';
import HostApplication from '../../components/dashboard/HostApplication';
import AgencySettingsPage from '../settings/AgencySettingsPage';
import FinancialReports from '../../components/reports/FinancialReports';
import AdminDashboard from '../../components/admin/AdminDashboard';
import Admin from '../../components/admin/Admin';

// Import TokLive assets
import tokLiveLogo from '../../assets/icons/ic_logo_white.png';
import tokLiveIcon from '../../assets/icons/ic_icon.png';

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
`;

const TopBar = styled.div`
  position: fixed;
  top: 0;
  left: 280px;
  right: 0;
  height: 70px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: left 0.3s ease;

  @media (max-width: 768px) {
    left: 0 !important;
    padding: 0 15px;
  }
`;

const Sidebar = styled.div.attrs(props => ({
  // Convert React props to HTML attributes
  style: {
    width: props.$isCollapsed ? '70px' : '280px',
    transform: props.$isOpen ? 'translateX(0)' : undefined
  }
}))`
  background-color: #1a2a6c;
  color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    transform: translateX(-280px);
    width: 280px !important;
    &[style*="transform: translateX(0)"] {
      transform: translateX(0) !important;
    }
    will-change: transform;
    overscroll-behavior: contain;
  }
`;

const SidebarHeader = styled.div.attrs(props => ({
  style: {
    padding: props.$isCollapsed ? '1rem' : '1.5rem',
    justifyContent: props.$isCollapsed ? 'center' : 'space-between'
  }
}))`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  min-height: 70px;
`;

const Logo = styled.div.attrs(props => ({
  'data-collapsed': props.$isCollapsed || false
}))`
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: bold;
  
  img {
    height: ${props => props['data-collapsed'] ? '35px' : '50px'};
    margin-right: ${props => props['data-collapsed'] ? '0' : '10px'};
    transition: all 0.3s ease;
  }
  
  span {
    display: ${props => props['data-collapsed'] ? 'none' : 'block'};
    white-space: nowrap;
  }
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 12px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  svg {
    transition: transform 0.3s ease;
    transform: ${props => props.$isCollapsed ? 'rotate(-90deg)' : 'rotate(90deg)'};
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const SidebarMenu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding-bottom: 20px;
  }
`;

const MenuItem = styled.li`
  margin: 8px 12px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  
  button {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: white;
    text-decoration: none;
    transition: all 0.3s ease;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    
    &:hover, &.active {
      background-color: rgba(255, 255, 255, 0.15);
      transform: translateX(4px);
    }
    
    svg {
      min-width: 20px;
      margin-right: ${props => props.$isCollapsed ? '0' : '12px'};
      font-size: 1.2rem;
    }
    
    span {
      display: ${props => props.$isCollapsed ? 'none' : 'block'};
      white-space: nowrap;
    }
  }
  
  .badge {
    position: absolute;
    top: 10px;
    right: ${props => props.$isCollapsed ? '10px' : '16px'};
    background-color: #e74c3c;
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
  
  @media (max-width: 768px) {
    margin: 8px 12px;
    
    button {
      padding: 16px;
      font-size: 1.05rem;
      min-height: 56px; /* Better touch target */
      
      svg {
        font-size: 1.3rem;
        margin-right: 15px;
      }
      
      span {
        display: block;
      }
      
      &:hover, &.active {
        transform: translateX(5px);
      }
      
      &.active {
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background-color: #fff;
          border-radius: 2px 0 0 2px;
        }
      }
    }
    
    /* Improve touch feedback */
    &:active button {
      background-color: rgba(255, 255, 255, 0.15);
    }
  }
`;

const MainContent = styled.div`
  margin-left: 280px;
  width: calc(100% - 280px);
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    margin-left: 0 !important;
    width: 100% !important;
  }
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoutContainer = styled.div`
  margin-left: auto;
`;

const MenuToggle = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #1a2a6c;
  display: none;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s, transform 0.2s;
  min-height: 44px; /* Better touch target */
  min-width: 44px; /* Better touch target */
  
  &:hover {
    background-color: rgba(26, 42, 108, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: #1a2a6c;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(26, 42, 108, 0.1);
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const NotificationIcon = styled.div`
  position: relative;
  margin-right: 1.5rem;
  cursor: pointer;
  
  .badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: #e74c3c;
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 0.75rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 0.75rem;
    background-color: #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 1.5rem;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .user-info {
    .name {
      font-weight: bold;
    }
    
    .role {
      font-size: 0.75rem;
      color: #666;
    }
  }
  
  @media (max-width: 480px) {
    .user-info {
      display: none;
    }
    
    .avatar {
      margin-right: 0;
    }
  }
`;

const UserProfileContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const UserDropdown = styled.div.attrs(props => ({
  style: {
    display: props.$isOpen ? 'block' : 'none'
  }
}))`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  min-width: 200px;
  z-index: 1000;
  margin-top: 10px;
  overflow: hidden;
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #f4f4f4;
  }
  
  svg {
    margin-right: 10px;
    color: #1a2a6c;
  }
`;

const ContentCard = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  
  .card-title {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #333;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    font-weight: bold;
    color: #666;
  }
  
  tbody tr:hover {
    background-color: #f9f9f9;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: bold;
  
  &.online {
    background-color: #d4edda;
    color: #155724;
  }
  
  &.offline {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  &.streaming {
    background-color: #cce5ff;
    color: #004085;
  }
`;

const UnauthorizedMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const PageTitle = styled.h1`
  margin-bottom: 2rem;
  font-size: 1.8rem;
  color: #333;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  .title {
    color: #666;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
  
  .value {
    font-size: 1.8rem;
    font-weight: bold;
    color: #333;
  }
  
  .change {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    
    &.positive {
      color: #27ae60;
    }
    
    &.negative {
      color: #e74c3c;
    }
  }
`;

const ContentArea = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 90px 20px 20px;
  background-color: #f4f4f4;
  
  @media (max-width: 768px) {
    padding: 85px 15px 15px;
  }
  
  @media (max-width: 480px) {
    padding: 80px 12px 12px;
  }
`;

// AsyncRoleCheck component to handle role-based rendering
const AsyncRoleCheck = ({ user }) => {
  const [hasAnyRole, setHasAnyRole] = useState(null);

  useEffect(() => {
    const checkRoles = async () => {
      try {
        // Get all user roles
        const roles = await authService.getUserRoles(user);
        setHasAnyRole(roles.length > 0);
      } catch (error) {
        console.error('Error checking roles:', error);
        setHasAnyRole(false);
      }
    };

    checkRoles();
  }, [user]);

  // Only show AgencyOptionsPage if we've confirmed the user has no roles
  if (hasAnyRole === false) {
    return <AgencyOptionsPage />;
  }

  return null;
};

const DashboardPage = () => {
  // Touch gesture handling for mobile sidebar
  const sidebarRef = useRef(null);
  const touchStartXRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState('dashboard');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const dropdownRef = useRef(null);
  const [userRole, setUserRole] = useState(null);
  const [unreadAgentMessages, setUnreadAgentMessages] = useState(0);
  const [unreadSupportMessages, setUnreadSupportMessages] = useState(0);

  const getRoleText = () => {
    if (userRole === UserConstants.ROLE_AGENT) return t('dashboard.role.agent');
    if (userRole === UserConstants.ROLE_ADMIN) return t('dashboard.role.admin');
    if (userRole === UserConstants.ROLE_HOST) return t('dashboard.role.host');
    return 'Agency';
  };

  // Fetch full user profile if needed
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        try {
          const profile = await userService.getUserProfile(currentUser.id);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Determine user display information
  const getUserAvatar = () => {
    // Priority: 
    // 1. User profile avatar
    // 2. Current user avatar
    // 3. Default icon
    return userProfile?.avatar || 
           currentUser?.avatar || 
           null;
  };

  const getUserFullName = () => {
    // Priority:
    // 1. User profile full name
    // 2. Current user full name
    // 3. Fallback to 'User'
    return userProfile?.fullName || 
           currentUser?.fullName || 
           currentUser?.name || 
           'User';
  };

  const getUserUid = () => {
    try {
      // Debug the currentUser type
      console.log('currentUser type:', typeof currentUser, currentUser instanceof Parse.User);
      console.log('currentUser value:', currentUser);
      
      // First check if currentUser exists and is actually a Parse.User instance
      if (currentUser && typeof currentUser.get === 'function') {
        // Get the uid safely
        return currentUser.get("uid") || 'Unknown';
      } else if (currentUser && currentUser.uid) {
        // If currentUser has a direct uid property (not using Parse methods)
        return currentUser.uid || 'Unknown';
      } else {
        // Fallback
        return 'Unknown';
      }
    } catch (error) {
      console.error('Error in getUserUid:', error);
      return 'Unknown';
    }
  };

  const handleLogout = () => {
    confirmAlert({
      title: t('dashboard.logout.title'),
      message: t('dashboard.logout.confirmMessage'),
      buttons: [
        {
          label: t('dashboard.logout.yes'),
          onClick: async () => {
            try {
              await authService.logout();
              toast.success(t('dashboard.logout.success'));
              navigate('/');
            } catch (error) {
              console.error('Logout error:', error);
              toast.error(t('dashboard.logout.error'));
            }
          }
        },
        {
          label: t('dashboard.logout.no'),
          onClick: () => {}
        }
      ],
      closeOnEscape: true,
      closeOnClickOutside: true
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if user has host or agent role
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [canViewSidebar, setCanViewSidebar] = useState(false);

  // Function to check for unread messages
  const checkUnreadMessages = async () => {
    if (!currentUser || !userRole) return;
    
    try {
      // Check unread messages for agent chat (if user is agent or admin)
      if (userRole === UserConstants.ROLE_AGENT || userRole === UserConstants.ROLE_ADMIN) {
        const agentChats = await Chat.getChatsForUser(currentUser);
        let unreadCount = 0;
        
        for (const chat of agentChats) {
          const lastMessage = chat.lastMessage;
          if (lastMessage && 
              lastMessage.get(Message.KEY_SENDER_ID) !== currentUser.id && 
              !lastMessage.get(Message.KEY_READ)) {
            unreadCount++;
          }
        }
        
        setUnreadAgentMessages(unreadCount);
      }
      
      // Check unread messages for support chat (if user is host)
      if (userRole === UserConstants.ROLE_HOST) {
        const supportChats = await Chat.getChatsForUser(currentUser);
        let unreadCount = 0;
        
        for (const chat of supportChats) {
          const lastMessage = chat.lastMessage;
          if (lastMessage && 
              lastMessage.get(Message.KEY_SENDER_ID) !== currentUser.id && 
              !lastMessage.get(Message.KEY_READ)) {
            unreadCount++;
          }
        }
        
        setUnreadSupportMessages(unreadCount);
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  useEffect(() => {
    const checkUserRoles = async () => {
      if (!currentUser) {
        setIsAuthorized(false);
        setCanViewSidebar(false);
        return;
      }

      try {
        // Get all user roles
        const userRoles = await authService.getUserRoles(currentUser);

        // Check if user has host or agent role
        setIsAuthorized(
          userRoles.some(role => [
            UserConstants.ROLE_HOST,
            UserConstants.ROLE_AGENT
          ].includes(role))
        );

        // Check if user can view sidebar
        const foundRole = userRoles.find(role => [
          UserConstants.ROLE_AGENT,
          UserConstants.ROLE_ADMIN,
          UserConstants.ROLE_HOST
        ].includes(role));
        
        setCanViewSidebar(!!foundRole);
        setUserRole(foundRole || null);
      } catch (error) {
        console.error('Error checking user roles:', error);
        setIsAuthorized(false);
        setCanViewSidebar(false);
      }
    };

    checkUserRoles();
  }, [currentUser]);
  
  // Effect to check for unread messages periodically
  useEffect(() => {
    if (userRole) {
      // Check immediately when role is set
      checkUnreadMessages();
      
      // Set up interval to check for new messages every 30 seconds
      const intervalId = setInterval(() => {
        checkUnreadMessages();
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [userRole]);
  
  // Function to close sidebar when a menu item is clicked (mobile only)
  const handleMenuItemClick = (menuItem) => {
    setSelectedMenuItem(menuItem);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
      // Add a small delay to allow the animation to complete
      setTimeout(() => {
        // Scroll to top when changing menu items on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  };

  // Backdrop for mobile menu
const Backdrop = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${props => props.$isVisible ? 1 : 0};
  touch-action: none; /* Prevent scrolling while menu is open */
  
  @media (max-width: 768px) {
    display: ${props => props.$isVisible ? 'block' : 'none'};
    backdrop-filter: blur(2px);
  }
`;

return (
    <DashboardContainer>
      {/* Backdrop for mobile menu */}
      {canViewSidebar && (
        <Backdrop 
          $isVisible={sidebarOpen} 
          onClick={() => setSidebarOpen(false)}
          onTouchMove={(e) => e.preventDefault()} /* Prevent scrolling when menu is open */
        />
      )}
      
      {canViewSidebar && (
        <Sidebar ref={sidebarRef} $isOpen={sidebarOpen} $isCollapsed={isCollapsed}>
          <SidebarHeader $isCollapsed={isCollapsed}>
            <Logo $isCollapsed={isCollapsed}>
              <img src={isCollapsed ? tokLiveIcon : tokLiveLogo} alt="LotusLive Logo" />
              <span>{getRoleText()}</span>
            </Logo>
          </SidebarHeader>
          <SidebarMenu>

          <RoleBasedContent roles={[UserConstants.ROLE_AGENT, UserConstants.ROLE_HOST]}>
            <MenuItem $isCollapsed={isCollapsed}>
              <button 
                type="button" 
                className={selectedMenuItem === 'dashboard' ? 'active' : ''}
                onClick={() => handleMenuItemClick('dashboard')}
              >
                <FaHome />
                <span>{t('dashboard.menu.dashboard')}</span>
              </button>
            </MenuItem>
            </RoleBasedContent>
            {/* Menu items for Admins */}
            <RoleBasedContent roles={[UserConstants.ROLE_ADMIN]}>
              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'admin' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('admin')}
                >
                  <FaUsers />
                  <span>{t('dashboard.menu.admin')}</span>
                </button>
              </MenuItem>
              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'agencies' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('agencies')}
                >
                  <FaBuilding />
                  <span>{t('dashboard.menu.agencies')}</span>
                </button>
              </MenuItem>
            </RoleBasedContent>

            {/* Menu items for Agents */}
            <RoleBasedContent roles={[UserConstants.ROLE_AGENT]}>
              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'hosts' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('hosts')}
                >
                  <FaUsers />
                  <span>{t('dashboard.menu.hosts')}</span>
                </button>
              </MenuItem>

              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'hostHistory' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('hostHistory')}
                >
                  <FaChartLine />
                  <span>{t('dashboard.agent.hostHistory')}</span>
                </button>
              </MenuItem>
              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'conversations' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('conversations')}
                >
                  <FaComments />
                  <span>{t('dashboard.agent.conversations')}</span>
                </button>
                {unreadAgentMessages > 0 && (
                  <div className="badge">{unreadAgentMessages > 9 ? '9+' : unreadAgentMessages}</div>
                )}
              </MenuItem>
              
              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'financialReports' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('financialReports')}
                >
                  <FaChartPie />
                  <span>{t('dashboard.menu.financialReports')}</span>
                </button>
              </MenuItem>
              
              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'settings' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('settings')}
                >
                  <FaCog />
                  <span>{t('dashboard.settings')}</span>
                </button>
              </MenuItem>
            </RoleBasedContent>

            {/* Menu items for Hosts */}
            <RoleBasedContent roles={[UserConstants.ROLE_HOST]}>
              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'agent' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('agent')}
                >
                  <FaUserCircle />
                  <span>{t('dashboard.menu.agent')}</span>
                </button>
              </MenuItem>
              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'streams' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('streams')}
                >
                  <FaVideo />
                  <span>{t('dashboard.menu.streams')}</span>
                </button>
              </MenuItem>
              <MenuItem $isCollapsed={isCollapsed}>
                <button 
                  type="button"
                  className={selectedMenuItem === 'support' ? 'active' : ''}
                  onClick={() => handleMenuItemClick('support')}
                >
                  <FaEnvelope />
                  <span>{t('dashboard.menu.support')}</span>
                </button>
                {unreadSupportMessages > 0 && (
                  <div className="badge">{unreadSupportMessages > 9 ? '9+' : unreadSupportMessages}</div>
                )}
              </MenuItem>
            </RoleBasedContent>
          </SidebarMenu>
          <CollapseButton 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            $isCollapsed={isCollapsed}
          >
            <FaAngleDown />
          </CollapseButton>
        </Sidebar>
      )}
      
      <MainContent style={{
        marginLeft: canViewSidebar ? (isCollapsed ? '70px' : '280px') : '0',
        width: canViewSidebar ? (isCollapsed ? 'calc(100% - 70px)' : 'calc(100% - 280px)') : '100%'
      }}>
        <TopBar style={{
          left: canViewSidebar ? (isCollapsed ? '70px' : '280px') : '0'
        }}>
          <TopBarLeft>
            {!isAuthorized && (
              <Logo>
                <img src={tokLiveLogo} alt="LotusLive Logo" />
                Agency
              </Logo>
            )}
            {canViewSidebar && (
              <MenuToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
                <FaBars />
              </MenuToggle>
            )}
          </TopBarLeft>
          <TopBarRight>
            {/* <NotificationIcon>
              <FaBell />
              <span className="badge">3</span>
            </NotificationIcon> */}
            
            <UserProfileContainer ref={dropdownRef}>
              <UserProfile onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="avatar">
                  {getUserAvatar() ? (
                    <img 
                      src={getUserAvatar()} 
                      alt="Profile" 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        objectFit: 'cover' 
                      }} 
                    />
                  ) : (
                    <FaUserCircle />
                  )}
                </div>
                <div className="user-info">
                  <div className="name">{getUserFullName()}</div>
                  <div className="role">{getUserUid()}</div>
                </div>
                <FaAngleDown style={{ marginLeft: '10px' }} />
              </UserProfile>

              <UserDropdown $isOpen={dropdownOpen}>
                <DropdownItem onClick={() => {
                  handleLogout();
                  setDropdownOpen(false);
                }}>
                  <FaSignOutAlt /> {t('dashboard.logout.title')}
                </DropdownItem>
              </UserDropdown>
            </UserProfileContainer>
          </TopBarRight>
        </TopBar>
        
        <ContentArea>
          {/* Show content based on selected menu item */}
          <RoleBasedContent roles={[UserConstants.ROLE_HOST]}>
            {selectedMenuItem === 'agent' && <AgentDetails />}
            {selectedMenuItem === 'streams' && <StreamsList />}
            {selectedMenuItem === 'support' && <SupportChat />}
          </RoleBasedContent>

          <RoleBasedContent roles={[UserConstants.ROLE_ADMIN]}>
            {selectedMenuItem === 'admin' && <Admin />}
            {selectedMenuItem === 'agencies' && <AdminDashboard />}
          </RoleBasedContent>

          <RoleBasedContent roles={[UserConstants.ROLE_AGENT]}>
            {selectedMenuItem === 'hosts' && <HostsManagement />}
            {selectedMenuItem === 'conversations' && <AgentChat />}
            {selectedMenuItem === 'hostHistory' && <HostApplication />}
            {selectedMenuItem === 'financialReports' && <FinancialReports />}
            {selectedMenuItem === 'settings' && <AgencySettingsPage />}
          </RoleBasedContent>

          {selectedMenuItem === 'dashboard' && (
            <>
              {isAuthorized && <PageTitle>{t('dashboard.overview.title')}</PageTitle>}
              <RoleBasedContent roles={[UserConstants.ROLE_AGENT]}>
                <AgentDashboard />
              </RoleBasedContent>

              <RoleBasedContent roles={[UserConstants.ROLE_HOST]}>
                <HostDashboard />
              </RoleBasedContent>
            </>
          )}

          {/* Show agency options for users without any role */}
          {currentUser && (
            <React.Suspense fallback={null}>
              <AsyncRoleCheck user={currentUser} />
            </React.Suspense>
          )}
        </ContentArea>
      </MainContent>
    </DashboardContainer>
  );
};

export default DashboardPage;
