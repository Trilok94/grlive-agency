import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  FaUsers, 
  FaChartLine, 
  FaMoneyBillWave, 
  FaStream, 
  FaEye, 
  FaArrowRight,
  FaCircle 
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Parse from 'parse';
import Agent from '../../models/Agent';
import AgentStats from '../../models/AgentStats';
import HostStreamStats from '../../models/HostStreamStats';
import { diamondsToUsd } from '../../utils/helpers';

// Format stream time from seconds to hours and minutes
const formatStreamTime = (seconds) => {
  if (!seconds) return '0h 0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${hours}h ${minutes}m`;
};

const AgentDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    activeHosts: 0,
    totalRevenue: 0,
    performance: 0,
    lastMonthHosts: 0,
    lastMonthRevenue: 0
  });
  const [managedHosts, setManagedHosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      setIsLoading(true);
      try {
        const currentUser = Parse.User.current();
        if (!currentUser) return;

        const agent = await Agent.getAgentByAuthorId(currentUser.id);
        if (!agent) return;

        // Get current month's dates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Get last month's dates
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

        // Get stats for current and last month
        const [currentMonthStats, lastMonthStats, hostsData] = await Promise.all([
          HostStreamStats.getAgentDashboardStats(agent, startOfMonth, endOfMonth),
          HostStreamStats.getAgentDashboardStats(agent, startOfLastMonth, endOfLastMonth),
          HostStreamStats.getManagedHostsData(agent, startOfMonth, endOfMonth)
        ]);

        // Calculate totals
        const totalHosts = agent.hostIds?.length || 0;
        
        // Calculate month-over-month growth with reasonable caps
        const calculateGrowth = (current, previous) => {
          if (previous === 0) {
            return current > 0 ? 100 : 0; // Cap at 100% if starting from zero
          }
          
          const growth = ((current - previous) / previous * 100);
          
          // Cap growth at reasonable values (-100% to +200%)
          if (growth > 200) return 200;
          if (growth < -100) return -100;
          return growth;
        };
        
        const hostGrowth = calculateGrowth(currentMonthStats.activeHosts, lastMonthStats.activeHosts);
        const revenueGrowth = calculateGrowth(currentMonthStats.totalRevenue, lastMonthStats.totalRevenue);
        
        setStats({
          activeHosts: currentMonthStats.activeHosts,
          totalRevenue: currentMonthStats.totalRevenue,
          performance: Math.round((hostGrowth + revenueGrowth) / 2),
          lastMonthHosts: lastMonthStats.activeHosts,
          lastMonthRevenue: lastMonthStats.totalRevenue
        });
        
        setManagedHosts(hostsData);

      } catch (error) {
        console.error('Error fetching agent data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentData();
  }, []);

  return (
    <>
      <StatsGrid>
        <StatCard>
          <div className="title">
            <FaUsers />
            {t('dashboard.stats.activeHosts')}
          </div>
          <div className="value">{stats.activeHosts}</div>
          <div className={`change ${stats.activeHosts >= stats.lastMonthHosts ? 'positive' : 'negative'}`}>
            <FaChartLine /> {((stats.activeHosts - stats.lastMonthHosts) / stats.lastMonthHosts * 100 || 0).toFixed(1)}% {t('dashboard.stats.fromLastMonth')}
          </div>
        </StatCard>
        
        <StatCard>
          <div className="title">
            <FaMoneyBillWave />
            {t('dashboard.stats.totalRevenue')}
          </div>
          <div className="value">${diamondsToUsd(stats.totalRevenue)}</div>
          <div className={`change ${stats.totalRevenue >= stats.lastMonthRevenue ? 'positive' : 'negative'}`}>
            <FaChartLine /> {
              stats.lastMonthRevenue === 0
                ? (stats.totalRevenue > 0 ? '100' : '0')
                : ((stats.totalRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)
            }% {t('dashboard.stats.fromLastMonth')}
          </div>
        </StatCard>
        
        <StatCard>
          <div className="title">
            <FaChartLine />
            {t('dashboard.stats.performance')}
          </div>
          <div className="value">{stats.performance}%</div>
          <div className={`change ${stats.performance >= 0 ? 'positive' : 'negative'}`}>
            <FaChartLine /> {stats.performance ? stats.performance.toFixed(1) : '0'}% {t('dashboard.stats.fromLastMonth')}
          </div>
        </StatCard>
      </StatsGrid>

      <ContentCard>
        <div className="card-header">
          <div className="card-title">
            <FaUsers />
            {t('dashboard.stats.managedHosts')}
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
              <th>{t('dashboard.stats.revenue')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  {t('dashboard.hosts.loading')}
                </td>
              </tr>
            ) : managedHosts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  {t('dashboard.hosts.noActiveHosts')}
                </td>
              </tr>
            ) : (
              managedHosts.map(host => {
                
                // Determine status based on last activity
                let status = host.status;
                
                // Get avatar initials
                const initials = host.name
                  ? host.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                  : '??'; // Fallback if name is undefined
                
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
                          <div className="name">{host.name}</div>
                          <div className="id">ID: {host.uid}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge className={status}>
                        <FaCircle /> {t(`dashboard.hosts.statusTypes.${status}`)}
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
                        <FaMoneyBillWave /> ${diamondsToUsd(host.totalEarnings)}
                      </div>
                    </td>
                    <td>
                      <div className="metrics-cell">
                        <FaMoneyBillWave /> ${diamondsToUsd(host.totalRevenue)}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </ContentCard>
    </>
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    &:hover {
      transform: translateY(-3px);
    }
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
    margin-bottom: 1rem;
    letter-spacing: -0.5px;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  .change {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.95rem;
    color: #10b981;
    font-weight: 500;

    svg {
      font-size: 1.1rem;
    }

    &.negative {
      color: #ef4444;
    }
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
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    width: 100%;
    justify-content: center;
  }

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
`;

export default AgentDashboard;
