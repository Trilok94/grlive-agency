import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { 
  FaIdBadge, 
  FaSearch, 
  FaUsers, 
  FaBuilding, 
  FaChartLine, 
  FaMoneyBillWave, 
  FaHeadset, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle, 
  FaArrowLeft, 
  FaSpinner,
  FaHandshake,
  FaTimes,
  FaCheck,
  FaLink,
  FaShieldAlt,
  FaUserPlus,
  FaRegLightbulb,
  FaRegCommentDots
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Parse from 'parse';

// Services
import { agencyService } from '../../services/agencyService';
import { authService } from '../../services/ParseService';

// Models
import Host from '../../models/Host';
import AgencyInvitation from '../../models/AgencyInvitation';
import SystemMessage from '../../models/SystemMessage';
import User from '../../models/User';
import Agent from '../../models/Agent';

// Global styles with animations
const GlobalStyle = createGlobalStyle`
  @keyframes fadeInAnimation {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideInAnimation {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 300px;
  animation: fadeInAnimation 0.3s ease-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(74, 144, 226, 0.1);
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  animation: fadeInAnimation 0.5s ease-out;
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin: 1rem auto;
  }
`;

const Section = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  
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
    margin-bottom: 1.5rem;
    border-radius: 12px;
    
    &::before {
      border-radius: 12px 12px 0 0;
    }
  }
`;

const CodeForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const CodeInput = styled.input`
  flex-grow: 1;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
  }
`;

const SubmitButton = styled.button`
  padding: 0.9rem 1.5rem;
  background: linear-gradient(90deg, #4a90e2, #63b3ed);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(74, 144, 226, 0.2);
  position: relative;
  overflow: hidden;
  
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

const Divider = styled.div`
  text-align: center;
  margin: 2rem 0;
  color: #718096;
  position: relative;
  font-size: 0.95rem;

  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 45%;
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
`;

const SearchContainer = styled.div`
  max-width: 700px;
  margin: 2rem auto;
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    margin: 1.5rem auto;
  }
`;

const SearchInput = styled.input`
  flex-grow: 1;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
  }
`;

const SearchButton = styled(SubmitButton)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 120px;
  justify-content: center;
  
  svg {
    font-size: 1rem;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    min-height: 48px;
  }
`;

const AgencyCard = styled.div`
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  opacity: ${props => props.$animate ? 1 : 0};
  transform: ${props => props.$animate ? 'translateY(0)' : 'translateY(20px)'};
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
    z-index: 1;
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    border-radius: 12px;
    
    &:hover {
      transform: none;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.05);
    }
    
    img {
      height: 160px;
    }
  }

  .content {
    padding: 1.5rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;

    h3 {
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
      color: #2d3748;
      font-weight: 600;
    }

    p {
      margin: 0 0 1.25rem;
      color: #4a5568;
      font-size: 0.95rem;
      line-height: 1.6;
      flex-grow: 1;
    }

    .stats {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #718096;
      font-size: 0.9rem;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.05);

      svg {
        font-size: 1rem;
        color: #4a90e2;
      }
    }
    
    @media (max-width: 768px) {
      padding: 1.25rem;
      
      h3 {
        font-size: 1.1rem;
        margin: 0 0 0.5rem;
      }
      
      p {
        margin: 0 0 1rem;
        font-size: 0.9rem;
      }
      
      .stats {
        padding-top: 0.75rem;
        font-size: 0.85rem;
        gap: 0.5rem;
        flex-wrap: wrap;
        
        svg {
          font-size: 0.9rem;
        }
      }
    }
  }
`;

const AgenciesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1400px;
  margin: 2rem auto;
  
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
    margin: 1.5rem auto;
  }
`;

const AgencyDetailsContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  animation: fadeInAnimation 0.3s ease-out;
`;

const AgencyDetailsHeader = styled.div`
  background: #fff;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    
    h2 {
      font-size: 1.25rem;
    }
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
  animation: fadeInAnimation 0.4s ease-out;
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

const StatSection = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  background-color: #f7fafc;
  border: 1px solid rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    margin-top: 1.5rem;
    border-radius: 8px;
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
      font-size: 0.9rem;
    }
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
`;

const TabButton = styled.button`
  background: none;
  border: none;
  padding: 1.25rem 2rem;
  font-size: 0.95rem;
  cursor: pointer;
  color: #718096;
  transition: all 0.3s ease;
  position: relative;
  white-space: nowrap;

  &:hover {
    color: #4a90e2;
  }

  &.active {
    color: #4a90e2;
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #4a90e2, #63b3ed);
    }
  }
  
  @media (max-width: 768px) {
    padding: 1rem 1.25rem;
    font-size: 0.85rem;
    
    svg {
      font-size: 0.9rem;
      margin-right: 0.25rem;
    }
  }
`;

const TabContent = styled.div`
  padding: 2rem;
  line-height: 1.6;
  color: #4a5568;
  
  p {
    margin: 0 0 1.5rem;
    font-size: 1rem;
  }
  
  img {
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    
    p {
      margin: 0 0 1rem;
      font-size: 0.95rem;
    }
    
    img {
      border-radius: 8px;
      margin-bottom: 1rem;
    }
  }
`;

const JoinButton = styled(SubmitButton)`
  width: calc(100% - 4rem);
  margin: 2rem;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  
  svg {
    font-size: 1.1rem;
  }
  
  @media (max-width: 768px) {
    width: calc(100% - 2.5rem);
    margin: 1.25rem;
    padding: 0.9rem;
    min-height: 48px;
    font-size: 0.95rem;
    
    svg {
      font-size: 1rem;
    }
  }
`;

const NoAgenciesMessage = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  color: #718096;
  padding: 2rem;
  background: #f7fafc;
  border-radius: 16px;
  border: 1px dashed rgba(0, 0, 0, 0.1);
  font-size: 1.1rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    font-size: 1rem;
    border-radius: 12px;
  }
`;

const AgencyInfo = styled.div`
  h3 {
    margin: 0 0 0.75rem 0;
    color: #2d3748;
    font-weight: 600;
    font-size: 1.25rem;
  }

  p {
    color: #4a5568;
    margin-bottom: 1.25rem;
    line-height: 1.6;
  }
`;

const ConfirmationModal = styled.div`
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
  animation: fadeInAnimation 0.3s ease-out;
`;

const ConfirmationContent = styled.div`
  background: #1a1a1a;
  padding: 2.5rem;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1200;
  color: #ffffff;
  animation: fadeInAnimation 0.4s ease-out;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    width: 95%;
    border-radius: 12px;
  }
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #4a90e2, #63b3ed);
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
  }

  h3 {
    color: #ffffff !important;
    margin-bottom: 1.75rem;
    font-weight: 600;
    font-size: 1.5rem;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin-bottom: 2rem;

    li {
      padding: 0.75rem 1rem;
      margin-bottom: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #ffffff;
      font-size: 1rem;
      transition: all 0.2s ease;
      border-left: 3px solid #4a90e2;
      
      &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateX(2px);
      }

      &:before {
        content: '\2022';
        color: #4a90e2;
        font-weight: bold;
        margin-right: 10px;
      }
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 1rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    justify-content: center;
    width: 100%;
    
    &:hover {
      transform: none;
    }
  }
`;

const ConfirmButton = styled(SubmitButton)`
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    font-size: 1rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    justify-content: center;
    width: 100%;
  }
`;

const JoinAgencyPage = () => {
  const navigate = useNavigate();
  const [agencyCode, setAgencyCode] = useState('');
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Debounced search function
  const debouncedSearchAgencies = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        await loadInitialAgencies();
        return;
      }

      try {
        setLoading(true);
        const fetchedAgencies = await agencyService.searchAgencies(query.trim());

        if (mountedRef.current) {
          setAgencies(fetchedAgencies);

          // If we found exactly one result and it matches a numeric code, show it directly
          const numericCode = Number(query.trim());
          if (fetchedAgencies.length === 1 && !isNaN(numericCode) && fetchedAgencies[0].uid === numericCode) {
            //setSelectedAgency(fetchedAgencies[0]);
            setActiveTab('description');
          }

          if (fetchedAgencies.length === 0) {
            toast.info('No agencies found matching your search');
          }
        }
      } catch (error) {
        console.error('Error searching agencies:', error);
        if (mountedRef.current) {
          toast.error(t('agency.join.searchError'));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }, 500),
    []
  );

  const { t } = useTranslation();

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearchAgencies(query);
  }, [debouncedSearchAgencies]);

  const handleSearchAgencies = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error(t('agency.join.enterSearchQuery'));
      return;
    }

    debouncedSearchAgencies.flush();
  }, [searchQuery, debouncedSearchAgencies]);

  const loadInitialAgencies = useCallback(async () => {
    try {
      if (!mountedRef.current) return;
      setLoading(true);
      const preloadedAgencies = await agencyService.getPreloadedAgencies();

      if (mountedRef.current) {
        setAgencies(preloadedAgencies);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading initial agencies:', error);
      if (mountedRef.current) {
        toast.error(t('agency.join.loading.error'));
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadInitialAgencies();
    
    // Trigger animation after a short delay
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [loadInitialAgencies]);

  const agenciesList = useMemo(() => {
    return agencies.map((agency, index) => (
      <AgencyCard
        key={agency.id || `agency-${index}`}
        onClick={() => setSelectedAgency(agency)}
        $animate={animate}
        $delay={`${index * 0.1}s`}
      >
        <img
          src={agency.logo}
          alt={agency.name}
          onError={(e) => {
            e.target.src = 'default-agency-logo.png';
          }}
        />
        <div className="content">
          <h3>{agency.name}</h3>
          <p>
            <FaUsers />
            {t('agency.join.details.members', { count: agency.memberCount || 0 })}
          </p>
          <p>{agency.description || t('agency.join.details.noDescription')}</p>
          <div className="stats">
            <FaSearch />
            <span>ID: {agency.uid}</span>
          </div>
        </div>
      </AgencyCard>
    ));
  }, [agencies, animate, t]);

  const handleJoinRequest = useCallback(async (agency) => {
    try {

      setShowConfirmation(false); // Close the confirmation modal
      setLoading(true); // Show loading state
      
      // Fetch full agency details with author included
      const query = new Parse.Query(Agent);
      query.equalTo(Agent.keys.UID, agency.uid);
      query.include(Agent.keys.AUTHOR);
      const agent = await query.first();
      
      if (!agent) {
        throw new Error('Agency not found');
      }

      await checkHost(agent);
    } catch (error) {
      console.error('Error joining agency:', error);
      toast.error(t('agency.join.error.joinFailed'));
      setLoading(false);
    }
  }, [t]);

  const checkHost = async (agent) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('No user found');

      // Check if user already has a host
      if (currentUser.get(User.keys.HOST)) {
        await joinAgency(currentUser.get(User.keys.HOST), agent);
        return;
      }

      // Look for existing host
      const query = new Parse.Query(Host);
      query.equalTo(Host.keys.AUTHOR_ID, currentUser.id);
      const existingHost = await query.first();

      if (existingHost) {
        await joinAgency(existingHost, agent);
      } else {
        await createNewHost(agent);
      }
    } catch (error) {
      if (error.code === Parse.Error.OBJECT_NOT_FOUND) {
        await createNewHost(agent);
      } else {
        throw error;
      }
    }
  };

  const createNewHost = async (agent) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    const host = new Host();
    host.setAuthor(currentUser);
    host.setAuthorId = currentUser.id;

    const invitedByUser = currentUser.get('invitedByUser');
    if (invitedByUser) {
      host.setInviterId = invitedByUser;
    }

    const savedHost = await host.save();
    await updateUserHost(savedHost, agent);
  };

  const updateUserHost = async (host, agent) => {
    const query = new Parse.Query(Host);
    query.equalTo(Host.keys.OBJECT_ID, host.id);
    const newHost = await query.first();
    if (!newHost) throw new Error('Host not found');

    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    currentUser.set(User.keys.HOST, newHost);
    currentUser.set(User.keys.HOST_ID, newHost.id);

    await currentUser.save();
    const updatedUser = await authService.refreshUser(['host']);
    
    if (updatedUser) {
      await joinAgency(newHost, agent);
    } else {
      throw new Error('Failed to update user');
    }
  };

  const joinAgency = async (host, agent) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    // Update user properties
    currentUser.setRole(User.roles.HOST);
    currentUser.set(User.keys.AGENCY, agent);
    currentUser.set(User.keys.AGENCY_ID, agent.id);
    currentUser.set(User.keys.LAST_AGENCY_DATE, new Date());

    const updatedUser = await currentUser.save();

    // Add user to Parse Role, this is done via cloud code now
    //await saveHostRole();

    if (updatedUser) {
      await becomeAgencyMember(host, agent);
    } else {
      throw new Error('Failed to update user');
    }
  };

  const saveHostRole = async () => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    const hostRole = await new Parse.Query(Parse.Role).equalTo('name', User.roles.HOST).first();
    if (!hostRole) throw new Error('Host role not found');
    
    const roleUsers = hostRole.getUsers();
    roleUsers.add(currentUser);
    await hostRole.save();
  };  

  const becomeAgencyMember = async (host, agent) => {
    agent.addUnique(Agent.keys.HOST_IDS, host.id);
    await agent.save();
    await registerInvitation(host, agent);
  };

  const registerInvitation = async (host, agent) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    const invitation = new AgencyInvitation();
    invitation.setAgent = agent;
    invitation.setAgentId = agent.id;
    invitation.setHost = host;
    invitation.setHostId = host.id;
    invitation.setHostAuthor = currentUser;
    invitation.setHostAuthorId = currentUser.id;
    invitation.setInvitationType = AgencyInvitation.invitationType.JOIN;
    invitation.setInvitationStatus = AgencyInvitation.invitationStatus.ACCEPTED;

    const savedInvitation = await invitation.save();
    await updateHost(host, agent, savedInvitation);
  };

  const updateHost = async (host, agent, invitation) => {
    host.set(Host.keys.AGENCY, agent);
    await host.save();
    await sendSystemMessage(host, agent, invitation);
  };

  const sendSystemMessage = async (host, agent, invitation) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    const systemMessage = new SystemMessage();
    systemMessage.setMessageType = SystemMessage.systemMessageType.HOST_JOIN_AGENCY;
    systemMessage.setAuthor = currentUser;
    systemMessage.setAgent = agent;
    systemMessage.setReceiver = agent.get('author');
    systemMessage.setHost = host;
    systemMessage.setMessageStatus = SystemMessage.systemMessageStatus.ACCEPTED;
    systemMessage.setInvitation = invitation;
    systemMessage.setRead = false;

    await systemMessage.save();

    toast.success(t('agency.join.success', { agencyName: agent.name }));
    setSelectedAgency(null); // Close the modal after sending the request
    setLoading(false);
    setTimeout(() => window.location.reload(), 2000);
  };

  const handleCodeSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!agencyCode.trim()) {
      toast.error(t('agency.join.enterSearchQuery'));
      return;
    }

    try {
      setLoading(true);
      // Search for agency using the code
      const agency = await agencyService.getAgencyByCode(agencyCode.trim());
      
      if (agency) {
        setSelectedAgency(agency);
        setActiveTab('description');
      } else {
        toast.error(t('agency.join.error.agencyNotFound'));
      }
    } catch (error) {
      console.error('Error finding agency by code:', error);
      if (error.message === 'Agency code must be a valid number') {
        toast.error(t('agency.join.error.invalidCode'));
      } else {
        toast.error(t('agency.join.error.searchFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [agencyCode]);

  // Render loading overlay
  const loadingOverlay = loading && (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeInAnimation 0.3s ease-out'
        }}
      />
      <LoadingDialog>
        <LoadingSpinner />
        <p>{t('agency.join.loading.message')}</p>
      </LoadingDialog>
    </>
  );

  return (
    <>
      <GlobalStyle />
      <Container>
      {loadingOverlay}
      <Section>
        <h2>
          <FaIdBadge style={{ marginRight: '0.5rem' }} />
          {t('agency.join.enterCode')}
        </h2>
        <CodeForm onSubmit={handleCodeSubmit}>
          <CodeInput 
            type="text"
            placeholder={t('agency.join.enterCode')}
            value={agencyCode}
            onChange={(e) => setAgencyCode(e.target.value)}
          />
          <SubmitButton type="submit">
            <FaLink />
            {t('agency.join.joinByCode')}
          </SubmitButton>
        </CodeForm>
      </Section>

      <Divider>{t('agency.join.or')}</Divider>

      <SearchContainer>
        <SearchInput 
          type="text"
          placeholder={t('agency.join.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <SearchButton 
          onClick={handleSearchAgencies} 
          disabled={loading}
        >
          <FaSearch /> 
          {loading ? t('agency.join.searching') : t('agency.join.searchButton')}
        </SearchButton>
      </SearchContainer>

      <AgenciesGrid>
        {agencies.length === 0 ? (
          <NoAgenciesMessage>
            {t('agency.join.noAgenciesFound')}
          </NoAgenciesMessage>
        ) : (
          agenciesList
        )}
      </AgenciesGrid>

      {selectedAgency && (
        <AgencyDetailsContainer>
          <AgencyDetailsContent>
            <AgencyDetailsHeader>
              <h2>
                <FaBuilding style={{ marginRight: '0.5rem', color: '#4a90e2' }} />
                {selectedAgency.name} <span>(ID: {selectedAgency.uid})</span>
              </h2>
              <CloseButton onClick={() => setSelectedAgency(null)}>
                <FaTimes />
                {t('agency.join.close')}
              </CloseButton>
            </AgencyDetailsHeader>

            <TabContainer>
              <TabButton
                className={activeTab === 'description' ? 'active' : ''}
                onClick={() => setActiveTab('description')}
              >
                <FaInfoCircle style={{ marginRight: '0.5rem' }} />
                {t('agency.join.details.tabs.description')}
              </TabButton>
              <TabButton
                className={activeTab === 'rules' ? 'active' : ''}
                onClick={() => setActiveTab('rules')}
              >
                <FaShieldAlt style={{ marginRight: '0.5rem' }} />
                {t('agency.join.details.tabs.rules')}
              </TabButton>
              <TabButton
                className={activeTab === 'commissions' ? 'active' : ''}
                onClick={() => setActiveTab('commissions')}
              >
                <FaMoneyBillWave style={{ marginRight: '0.5rem' }} />
                {t('agency.join.details.tabs.commissions')}
              </TabButton>
              <TabButton
                className={activeTab === 'support' ? 'active' : ''}
                onClick={() => setActiveTab('support')}
              >
                <FaHeadset style={{ marginRight: '0.5rem' }} />
                {t('agency.join.details.tabs.support')}
              </TabButton>
            </TabContainer>

            <TabContent>
              {activeTab === 'description' && (
                <>
                  <img
                    src={selectedAgency.logo}
                    alt={selectedAgency.name}
                    style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                  />
                  <p>{selectedAgency.description || t('agency.join.details.noDescription')}</p>
                  <StatSection>
                    <StatItem>
                      <FaUsers />
                      <span>{t('agency.join.details.members', { count: selectedAgency.memberCount || 0 })}</span>
                    </StatItem>
                    <StatItem>
                      <FaChartLine />
                      <span>{t('agency.join.details.established')}</span>
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
                  <p>{selectedAgency.rules || t('agency.join.details.noRules')}</p>
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
                  <p>{selectedAgency.commissions || t('agency.join.details.noCommissions')}</p>
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
                  <p>{selectedAgency.support || t('agency.join.details.noSupport')}</p>
                  <StatSection>
                    <StatItem>
                      <FaRegCommentDots />
                      <span>{t('agency.join.details.supportAvailable')}</span>
                    </StatItem>
                  </StatSection>
                </>
              )}
            </TabContent>

            <JoinButton onClick={() => setShowConfirmation(true)}>
              <FaHandshake />
              {t('agency.join.requestToJoin')}
            </JoinButton>

            {showConfirmation && (
              <ConfirmationModal>
                <ConfirmationContent style={{ color: '#E24A4AFF' }}>
                  <h3>
                    <FaUserPlus style={{ marginRight: '0.5rem' }} />
                    {t('agency.join.confirmJoin.title')}
                  </h3>
                  <ul>
                    <li>{t('agency.join.confirmJoin.notes.leaveReason')}</li>
                    <li>{t('agency.join.confirmJoin.notes.multipleAgents')}</li>
                    <li>{t('agency.join.confirmJoin.notes.otherAgents')}</li>
                  </ul>
                  <ButtonGroup>
                    <CancelButton onClick={() => setShowConfirmation(false)}>
                      <FaTimes />
                      {t('agency.join.confirmJoin.cancel')}
                    </CancelButton>
                    <ConfirmButton onClick={() => handleJoinRequest(selectedAgency)}>
                      <FaCheck />
                      {t('agency.join.confirmJoin.confirm')}
                    </ConfirmButton>
                  </ButtonGroup>
                </ConfirmationContent>
              </ConfirmationModal>
            )}
          </AgencyDetailsContent>
        </AgencyDetailsContainer>
      )}
    </Container>
    </>
  );
};

export default React.memo(JoinAgencyPage);