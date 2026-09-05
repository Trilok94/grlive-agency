import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaUserCheck, FaUsers, FaBuilding, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaEye, FaTimes, FaSearch, FaCoins, FaDollarSign, FaMoneyBillWave, FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Parse from 'parse';
import AgencyApplication from '../../models/AgencyApplication';
import { convertDiamondsToUsdFormat, getCountryNameByCode } from '../../utils/helpers';
import Agent from '../../models/Agent';
import User from '../../models/User';
import { toast } from 'react-toastify';

// Styled Components
const Container = styled.div`
  width: 100%;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;
    
    &.purple {
      background-color: rgba(99, 102, 241, 0.1);
      color: #6366f1;
    }
    
    &.green {
      background-color: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
    
    &.blue {
      background-color: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }
    
    &.orange {
      background-color: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
    
    &.red {
      background-color: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    
    svg {
      font-size: 24px;
    }
  }
  
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
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
`;

const AgenciesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #eaeaea;
  }
  
  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #333;
  }
  
  tr:hover {
    background-color: #f8f9fa;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  .action-cell {
    width: 100px;
    text-align: center;
  }
  
  .action-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #6366f1;
    padding: 5px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(99, 102, 241, 0.1);
    }
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
  
  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const InfoLabel = styled.div`
  width: 200px;
  font-weight: 500;
  color: #666;
  
  @media (max-width: 768px) {
    width: 100%;
    margin-bottom: 5px;
  }
`;

const InfoValue = styled.div`
  flex: 1;
  color: #333;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const SearchBar = styled.div`
  margin-bottom: 20px;
  
  input {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #eaeaea;
    border-radius: 5px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 5px;
`;

const PageButton = styled.button`
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #eaeaea;
  background: ${props => props.$active ? '#6366f1' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? '#6366f1' : '#f5f5f5'};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

// Trading coins styled components
const CoinBalanceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const CoinBalanceValue = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  
  .coin-icon {
    color: #f59e0b;
    margin-right: 8px;
    font-size: 18px;
  }
  
  .balance {
    font-size: 18px;
  }
`;

const SendCoinsButton = styled.button`
  margin-left: 15px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(99, 102, 241, 0.2);
  
  &:hover {
    background-color: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(99, 102, 241, 0.2);
  }
  
  svg {
    font-size: 14px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  
  .spinner {
    animation: spin 1.2s linear infinite;
    font-size: 32px;
    margin-bottom: 20px;
    color: #6366f1;
    filter: drop-shadow(0 4px 6px rgba(99, 102, 241, 0.2));
  }
  
  p {
    font-size: 16px;
    color: #4b5563;
    font-weight: 500;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ConfirmationContainer = styled.div`
  padding: 24px;
  text-align: center;
  
  h3 {
    margin-bottom: 24px;
    color: #111827;
    font-size: 22px;
    font-weight: 600;
  }
  
  p {
    margin-bottom: 24px;
    color: #4b5563;
    font-size: 16px;
    line-height: 1.5;
  }
`;

const PackageInfo = styled.div`
  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  
  .package-name {
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 16px;
    color: #111827;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .package-details {
    display: flex;
    justify-content: space-around;
    padding-top: 8px;
    
    span {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      
      &.coins {
        color: #111827;
        
        svg {
          color: #f59e0b;
          font-size: 18px;
        }
      }
      
      &.price {
        color: #111827;
        
        svg {
          color: #4f46e5;
          font-size: 18px;
        }
      }
    }
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
`;

const CancelButton = styled.button`
  background-color: #f9fafb;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
  
  &:active {
    background-color: #e5e7eb;
    transform: translateY(1px);
  }
`;

const ConfirmButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 28px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);
  min-width: 160px;
  
  &:hover {
    background-color: #4f46e5;
    box-shadow: 0 6px 10px rgba(79, 70, 229, 0.3);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const ProductCard = styled.div`
  border: 1px solid #eaeaea;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    border-color: #6366f1;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    pointer-events: none;
  }
  
  &:hover::before {
    border-color: #6366f1;
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-bottom: 1px solid #eaeaea;
  transition: all 0.3s ease;
  
  ${ProductCard}:hover & {
    filter: brightness(1.05);
  }
`;

const ProductInfo = styled.div`
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: linear-gradient(to bottom, #ffffff, #fafafa);
`;

const ProductName = styled.h4`
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
  line-height: 1.3;
`;

const ProductPrice = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 8px;
  
  svg {
    color: #4f46e5;
  }
`;

const ProductCoins = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  color: #4b5563;
  margin-top: auto;
  padding-top: 12px;
  
  svg {
    color: #f59e0b;
  }
`;

// LoadingState is already defined above

const Admin = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total: 0,
    activated: 0,
    suspended: 0
  });
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [agencyDetails, setAgencyDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Trading coins feature state
  const [showCoinsModal, setShowCoinsModal] = useState(false);
  const [stripeProducts, setStripeProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sendingCoins, setSendingCoins] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [allAgents, setAllAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const itemsPerPage = 10;
  
  // Fetch statistics only once on component mount
  useEffect(() => {
    const fetchStatsAndAgents = async () => {
      setLoading(true);
      try {
        // Get agency application stats
        const query = new Parse.Query(AgencyApplication);
        const total = await query.count();
        
        const activatedQuery = new Parse.Query(AgencyApplication);
        activatedQuery.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.ACTIVATED);
        const activated = await activatedQuery.count();
        
        const suspendedQuery = new Parse.Query(AgencyApplication);
        suspendedQuery.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.SUSPENDED);
        const suspended = await suspendedQuery.count();
        
        setStats({
          total,
          activated,
          suspended
        });
        
        // Fetch all agents at once
        const agentQuery = new Parse.Query(Agent.className);
        agentQuery.equalTo(Agent.keys.STATUS, Agent.status.ACTIVATED);
        agentQuery.descending(Agent.keys.CREATED_AT);
        agentQuery.include(Agent.keys.AUTHOR);
        agentQuery.limit(1000); // Increase this if needed, but consider performance
        
        const agents = await agentQuery.find();
        console.log('Total agents loaded:', agents.length);
        
        // Store all agents
        setAllAgents(agents);
        
        // Initialize the filtered list with all agents
        setFilteredAgents(agents);
        setTotalPages(Math.ceil(agents.length / itemsPerPage));
      } catch (error) {
        console.error('Error fetching stats and agents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatsAndAgents();
  }, []); // Empty dependency array means this runs once on mount
  
  // Filter agents when search query changes
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set a new timeout to delay the filtering
    const timeout = setTimeout(() => {
      filterAgents();
    }, 300); // 300ms delay to avoid filtering on every keystroke
    
    setSearchTimeout(timeout);
    
    // Cleanup function
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);
  
  // Update the displayed agents when page changes
  useEffect(() => {
    // No need to refetch, just update what's displayed from our filtered list
    const pageAgencies = getCurrentPageAgencies();
    setAgencies(pageAgencies);
  }, [currentPage, filteredAgents]);
  
  // This additional useEffect ensures agencies are populated initially even without any search
  useEffect(() => {
    if (!loading && allAgents.length > 0 && agencies.length === 0) {
      setAgencies(getCurrentPageAgencies());
    }
  }, [loading, allAgents, agencies.length]);
  
  // Filter agents based on search query
  const filterAgents = () => {
    if (!searchQuery.trim()) {
      // If search query is empty, use all agents
      setFilteredAgents(allAgents);
      setTotalPages(Math.ceil(allAgents.length / itemsPerPage));
    } else {
      // Filter agents based on search query
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = allAgents.filter(agent => {
        const companyName = agent.get(Agent.keys.COMPANY_NAME) || '';
        const contactEmail = agent.get(Agent.keys.EMAIL) || '';
        const name = agent.get(Agent.keys.NAME) || '';
        
        return (
          companyName.toLowerCase().includes(lowercaseQuery) ||
          contactEmail.toLowerCase().includes(lowercaseQuery) ||
          name.toLowerCase().includes(lowercaseQuery)
        );
      });
      
      setFilteredAgents(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      // Reset to first page when search changes
      setCurrentPage(1);
    }
  };
  
  // Get agencies for the current page from filtered list
  const getCurrentPageAgencies = () => {
    // If filteredAgents is empty but allAgents has data, use allAgents instead
    const sourceAgents = (filteredAgents.length === 0 && allAgents.length > 0) ? allAgents : filteredAgents;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageAgents = sourceAgents.slice(startIndex, endIndex);
    
    return pageAgents.map(agent => ({
      agent: agent,
      application: null
    }));
  };
  
  const fetchAgencyDetails = async (agencyData) => {
    setLoadingDetails(true);
    try {
      const agent = agencyData.agent;
      const application = agencyData.application;
      
      if (agent) {
        // Fetch hosts count
        const hostsQuery = new Parse.Query('_User');
        hostsQuery.equalTo('agentId', agent.id);
        hostsQuery.equalTo('role', 'host');
        const hostsCount = await hostsQuery.count();
        
        // Get diamonds total from agency
        const diamondsTotal = agent.get(Agent.keys.DIAMONDS_TOTAL) || 0;
        
        // If we don't have an application yet, try to find it
        let appData = application;
        if (!appData) {
          const applicationQuery = new Parse.Query(AgencyApplication);
          applicationQuery.equalTo(AgencyApplication.keys.AGENT_ID, agent.id);
          appData = await applicationQuery.first();
        }
        
        // Fetch the author User object to get trading coins
        let author = null;
        if (agent.get(Agent.keys.AUTHOR_ID)) {
          const userQuery = new Parse.Query(User);
          userQuery.equalTo('objectId', agent.get(Agent.keys.AUTHOR_ID));
          author = await userQuery.first();
        }
        
        setAgencyDetails({
          agent,
          application: appData,
          hostsCount,
          diamonds: diamondsTotal,
          author
        });
      }
    } catch (error) {
      console.error('Error fetching agency details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const handleViewAgencyDetails = async (agencyData) => {
    setSelectedAgency(agencyData);
    await fetchAgencyDetails(agencyData);
    setShowDetailsModal(true);
  };
  
  // Trading coins feature methods
  const handleSendCoins = () => {
    setLoadingProducts(true);
    setShowCoinsModal(true);
    
    // Fetch Stripe products from Cloud Code
    Parse.Cloud.run('stripe_products')
      .then(result => {
        // Filter out recurring products
        const nonRecurringProducts = result.filter(product => !product.interval);
        setStripeProducts(nonRecurringProducts);
      })
      .catch(error => {
        console.error('Error fetching Stripe products:', error);
        toast.error(t('admin.dashboard.errorFetchingProducts'));
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  };
  
  const closeCoinsModal = () => {
    setShowCoinsModal(false);
    setSelectedProduct(null);
    setShowConfirmation(false);
  };
  
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setShowConfirmation(true);
  };
  
  const handleConfirmSendCoins = () => {
    if (!selectedProduct || !agencyDetails) return;
    
    setSendingCoins(true);
    
    // Call cloud function to send coins
    Parse.Cloud.run('send_agency_coins', {
      adminId: Parse.User.current().id,
      agencyId: agencyDetails.agent.get(Agent.keys.AUTHOR_ID), // Using author ID instead of agent ID
      packageId: selectedProduct.stripeProductId,
      amountUsd: selectedProduct.price,
      coinsAmount: selectedProduct.coins
    })
      .then(() => {
        toast.success(t('admin.dashboard.coinsSentSuccessfully'));
        closeCoinsModal();
        
        // Refresh the agency details to show updated coin balance
        if (agencyDetails && agencyDetails.agent) {
          fetchAgencyDetails(agencyDetails);
        }
      })
      .catch(error => {
        console.error('Error sending coins:', error);
        toast.error(t('admin.dashboard.errorSendingCoins'));
      })
      .finally(() => {
        setSendingCoins(false);
      });
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAgency(null);
    setAgencyDetails(null);
  };

  return (
    <Container>
      <SectionTitle>{t('admin.dashboard.title')}</SectionTitle>
      
      <StatsContainer>
        <StatCard>
          <div className="icon blue">
            <FaBuilding />
          </div>
          <div className="title">{t('admin.dashboard.totalAgencies')}</div>
          <div className="value">{loading ? '--' : stats.total}</div>
        </StatCard>
        
        <StatCard>
          <div className="icon green">
            <FaCheckCircle />
          </div>
          <div className="title">{t('admin.dashboard.activeAgencies')}</div>
          <div className="value">{loading ? '--' : stats.activated}</div>
        </StatCard>
        
        <StatCard>
          <div className="icon red">
            <FaExclamationTriangle />
          </div>
          <div className="title">{t('admin.dashboard.suspendedAgencies')}</div>
          <div className="value">{loading ? '--' : stats.suspended}</div>
        </StatCard>
      </StatsContainer>
      
      <SectionTitle>{t('admin.dashboard.activeAgenciesList')}</SectionTitle>
      
      {loading ? (
        <LoadingState>
          <p>{t('common.loading')}</p>
        </LoadingState>
      ) : (
        <>
          <SearchBar>
            <input 
              type="text" 
              placeholder={t('admin.applications.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBar>
          
          {agencies.length > 0 ? (
            <>
              <AgenciesTable>
                <thead>
                  <tr>
                    <th>{t('admin.dashboard.agencyName')}</th>
                    <th>{t('admin.dashboard.agencyEmail')}</th>
                    <th>{t('admin.dashboard.hostsCount')}</th>
                    <th>{t('admin.dashboard.totalEarnings')}</th>
                    <th className="action-cell">{t('admin.dashboard.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {agencies.map((agencyData, index) => {
                    const agent = agencyData.agent;
                    return (
                      <tr key={index}>
                        <td>{agent.get(Agent.keys.COMPANY_NAME) || agent.get(Agent.keys.NAME) || '-'}</td>
                        <td>{agent.get(Agent.keys.EMAIL) || '-'}</td>
                        <td>{agent.get(Agent.keys.HOST_IDS)?.length || 0}</td>
                        <td>{convertDiamondsToUsdFormat(agent.get(Agent.keys.DIAMONDS_TOTAL) || 0)}</td>
                        <td className="action-cell">
                          <button 
                            className="action-button"
                            onClick={() => handleViewAgencyDetails(agencyData)}
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </AgenciesTable>
              
              {totalPages > 1 && (
                <Pagination>
                  <PageButton 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </PageButton>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PageButton 
                      key={page}
                      $active={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PageButton>
                  ))}
                  
                  <PageButton 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </PageButton>
                </Pagination>
              )}
            </>
          ) : searchQuery ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p>{t('admin.dashboard.noSearchResults')} "{searchQuery}"</p>
              <button 
                className="secondary" 
                onClick={() => setSearchQuery('')}
                style={{ 
                  marginTop: '15px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #6366f1',
                  borderRadius: '5px',
                  color: '#6366f1',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {t('common.clearSearch')}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p>{t('admin.dashboard.noActiveAgencies')}</p>
            </div>
          )}
        </>
      )}
      
      {/* Agency Details Modal */}
      {showDetailsModal && selectedAgency && (
        <Modal onClick={(e) => e.target === e.currentTarget && closeDetailsModal()}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{t('admin.dashboard.agencyDetails')}</ModalTitle>
              <CloseButton onClick={closeDetailsModal}><FaTimes /></CloseButton>
            </ModalHeader>
            <ModalBody>
              {loadingDetails ? (
                <LoadingState>
                  <p>{t('common.loading')}</p>
                </LoadingState>
              ) : agencyDetails ? (
                <>
                  <SectionTitle>{t('admin.dashboard.agencyInformation')}</SectionTitle>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.agencyName')}</InfoLabel>
                    <InfoValue>
                      {agencyDetails.agent.get(Agent.keys.COMPANY_NAME) || agencyDetails.agent.get(Agent.keys.NAME) || '-'}
                    </InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.contactEmail')}</InfoLabel>
                    <InfoValue>
                      {agencyDetails.agent.get(Agent.keys.EMAIL) || 
                      (agencyDetails.application ? agencyDetails.application.get(AgencyApplication.keys.CONTACT_EMAIL) : '') || 
                      '-'}
                    </InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.createdAt')}</InfoLabel>
                    <InfoValue>
                      {agencyDetails.agent.get(Agent.keys.CREATED_AT) ? 
                        new Date(agencyDetails.agent.get(Agent.keys.CREATED_AT)).toLocaleDateString() : 
                        '-'}
                    </InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.companyRegistrationNumber')}</InfoLabel>
                    <InfoValue>{agencyDetails.agent.get(Agent.keys.COMPANY_REGISTRATION_NUMBER) || '-'}</InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.companyTaxId')}</InfoLabel>
                    <InfoValue>{agencyDetails.agent.get(Agent.keys.COMPANY_TAX_ID) || '-'}</InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.companyAddress')}</InfoLabel>
                    <InfoValue>{agencyDetails.agent.get(Agent.keys.COMPANY_ADDRESS) || '-'}</InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.companyLocation')}</InfoLabel>
                    <InfoValue>
                      {agencyDetails.agent.get(Agent.keys.COMPANY_COUNTRY) && agencyDetails.agent.get(Agent.keys.COMPANY_CITY) ? 
                        `${agencyDetails.agent.get(Agent.keys.COMPANY_CITY)}, ${getCountryNameByCode(agencyDetails.agent.get(Agent.keys.COMPANY_COUNTRY))}` : 
                        '-'}
                    </InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.companyWebsite')}</InfoLabel>
                    <InfoValue>
                      {agencyDetails.agent.get(Agent.keys.COMPANY_WEBSITE) ? 
                        <a href={agencyDetails.agent.get(Agent.keys.COMPANY_WEBSITE)} target="_blank" rel="noopener noreferrer">
                          {agencyDetails.agent.get(Agent.keys.COMPANY_WEBSITE)}
                        </a> : 
                        '-'}
                    </InfoValue>
                  </InfoRow>
                  
                  <SectionTitle>{t('admin.dashboard.agencyPerformance')}</SectionTitle>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.hostsCount')}</InfoLabel>
                    <InfoValue>{agencyDetails.hostsCount || agencyDetails.agent.get(Agent.keys.HOST_IDS)?.length || 0}</InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.totalEarnings')}</InfoLabel>
                    <InfoValue>{convertDiamondsToUsdFormat(agencyDetails.diamonds || 0)}</InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>{t('admin.dashboard.tradingCoins')}</InfoLabel>
                    <CoinBalanceContainer>
                      <CoinBalanceValue>
                        <FaCoins className="coin-icon" />
                        <span className="balance">
                          {agencyDetails.author ? agencyDetails.author.get(User.keys.CREDITS_TRADE) || 0 : 0}
                        </span>
                      </CoinBalanceValue>
                      <SendCoinsButton onClick={handleSendCoins}>
                        <FaCoins /> {t('admin.dashboard.sendCoins')}
                      </SendCoinsButton>
                    </CoinBalanceContainer>
                  </InfoRow>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <p>{t('admin.dashboard.agencyDetailsError')}</p>
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
      
      {/* Trading Coins Modal */}
      {showCoinsModal && (
        <Modal onClick={(e) => e.target === e.currentTarget && closeCoinsModal()}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{t('admin.dashboard.sendTradingCoins')}</ModalTitle>
              <CloseButton onClick={closeCoinsModal}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              {loadingProducts ? (
                <LoadingContainer>
                  <FaSpinner className="spinner" />
                  <p>{t('admin.dashboard.loadingProducts')}</p>
                </LoadingContainer>
              ) : showConfirmation ? (
                <ConfirmationContainer>
                  <h3>{t('admin.dashboard.confirmSendCoins')}</h3>
                  <p>
                    {t('admin.dashboard.sendingCoinsTo')} <strong>
                      {agencyDetails.author ? agencyDetails.author.get(User.keys.FULL_NAME) || agencyDetails.author.get(User.keys.USERNAME) : agencyDetails.agent.get(Agent.keys.NAME)}
                    </strong>
                  </p>
                  <PackageInfo>
                    <div className="package-name">{selectedProduct.name}</div>
                    <div className="package-details">
                      <span className="coins"><FaCoins /> {selectedProduct.coins} {t('admin.dashboard.coins')}</span>
                      <span className="price"><FaDollarSign /> {selectedProduct.price} {selectedProduct.currency.toUpperCase()}</span>
                    </div>
                  </PackageInfo>
                  <ButtonsContainer>
                    <CancelButton onClick={() => setShowConfirmation(false)}>
                      {t('common.cancel')}
                    </CancelButton>
                    <ConfirmButton onClick={handleConfirmSendCoins} disabled={sendingCoins}>
                      {sendingCoins ? (
                        <>
                          <FaSpinner className="spinner" /> {t('admin.dashboard.sending')}
                        </>
                      ) : (
                        <>
                          <FaMoneyBillWave /> {t('admin.dashboard.sendCoins')}
                        </>
                      )}
                    </ConfirmButton>
                  </ButtonsContainer>
                </ConfirmationContainer>
              ) : (
                <>
                  <p>{t('admin.dashboard.selectPackage')}</p>
                  <ProductsGrid>
                    {stripeProducts.map(product => (
                      <ProductCard key={product.stripeProductId} onClick={() => handleProductSelect(product)}>
                        {product.image && (
                          <ProductImage src={product.image} alt={product.name} />
                        )}
                        <ProductInfo>
                          <ProductName>{product.name}</ProductName>
                          <ProductPrice>
                            <FaDollarSign /> {product.price} {product.currency.toUpperCase()}
                          </ProductPrice>
                          <ProductCoins>
                            <FaCoins /> {product.coins} {t('admin.dashboard.coins')}
                          </ProductCoins>
                        </ProductInfo>
                      </ProductCard>
                    ))}
                  </ProductsGrid>
                </>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default Admin;
