import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaVideo, FaUsers, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Host from '../../models/Host';
import Stream from '../../models/Stream';
import HostSupporterStats from '../../models/HostSupporterStats';
import { format} from 'date-fns';
import {convertDiamondsToUsdFormat} from '../../utils/helpers';
import User from '../../models/User';

const HostDashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingSupporters, setLoadingSupporters] = useState(false);
  const [hostData, setHostData] = useState(null);
  const [recentStreams, setRecentStreams] = useState([]);
  const [topSupporters, setTopSupporters] = useState([]);
  const [supportersPeriod, setSupportersPeriod] = useState(HostSupporterStats.periodsKeys.last30Days);
  const [stats, setStats] = useState({
    totalStreams: 0,
    totalViewers: 0,
    totalEarnings: 0,
    streamHours: 0
  });

  const fetchHostData = async () => {
    if (!currentUser) return;

    try {
      // Get host data
      const host = await Host.getHostByAuthorId(currentUser.id);
      if (!host) return;
      
      setHostData(host);

      // Calculate stats
      const totalStreams = host.streams?.length || 0;
      const totalSeconds = host.getDuration || 0;  // Get the total duration in seconds

      // Calculate hours and minutes
      const hours = Math.floor(totalSeconds / 3600); // Get hours
      const minutes = Math.floor((totalSeconds % 3600) / 60); // Get remaining minutes
      
      // Format as "Xh Y min"
      const formattedTime = `${hours}h ${minutes}min`;

      const totalEarnings = host.getEarnedCoins;

      setStats({
        totalStreams,
        totalViewers: host.viewers?.length || 0, // This will need to be calculated from stream data
        totalEarnings,
        streamHours: formattedTime
      });

      // Fetch recent streams
      const recentStreams = await Stream.getRecentStreamsByAuthorId(currentUser.id, 5);
      setRecentStreams(recentStreams.map(stream => ({
        date: stream.createdAt,
        duration: stream.formatDuration(),
        viewers: stream.getViewersTotal().length,
        earnings: Number(stream.getDiamonds())
      })));

      if (!loadingSupporters) {
        // Fetch top supporters
        const supporters = await HostSupporterStats.getTopSupporters(currentUser.id, supportersPeriod, 5);
        setTopSupporters(supporters);
      }
    } catch (error) {
      console.error('Error fetching host data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupporters = async () => {
    if (!currentUser) return;
    
    setLoadingSupporters(true);
    try {
      const supporters = await HostSupporterStats.getTopSupporters(currentUser.id, supportersPeriod, 5);
      setTopSupporters(supporters);
    } catch (error) {
      console.error('Error fetching supporters:', error);
    } finally {
      setLoadingSupporters(false);
    }
  };

  useEffect(() => {
    fetchHostData();
  }, [currentUser]);

  useEffect(() => {
    fetchSupporters();
  }, [supportersPeriod, currentUser]);
  return (
    <>
      <StatsGrid>
        <StatCard>
          <div className="title">{t('dashboard.stats.totalStreams')}</div>
          <div className="value">{stats.totalStreams || 0}</div>
          <div className="change positive">
            <FaVideo /> {t('dashboard.stats.totalStreams')}
          </div>
        </StatCard>
        
        <StatCard>
          <div className="title">{t('dashboard.stats.totalViewers')}</div>
          <div className="value">{stats.totalViewers || 0}</div>
          <div className="change positive">
            <FaUsers /> {t('dashboard.stats.uniqueViews')}
          </div>
        </StatCard>
        
        <StatCard>
          <div className="title">{t('dashboard.stats.totalEarnings')}</div>
          <div className="value">{convertDiamondsToUsdFormat(currentUser.get(User.keys.DIAMONDS_TOTAL))}</div>
          <div className="change positive">
            <FaMoneyBillWave /> {t('dashboard.stats.thisMonth')}
          </div>
        </StatCard>

        <StatCard>
          <div className="title">{t('dashboard.stats.streamTime')}</div>
          <div className="value">{stats.streamHours || 0}</div>
          <div className="change positive">
            <FaClock /> {t('dashboard.stats.totalHours')}
          </div>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <ContentCard>
          <div className="card-title">{t('dashboard.stats.recentStreams')}</div>
          {loading ? (
            <LoadingMessage>{t('common.loading')}...</LoadingMessage>
          ) : recentStreams.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <th>{t('dashboard.stats.date')}</th>
                  <th>{t('dashboard.stats.duration')}</th>
                  <th>{t('dashboard.stats.viewers')}</th>
                  <th>{t('dashboard.stats.earnings')}</th>
                </tr>
              </thead>
              <tbody>
                {recentStreams.map((stream, index) => (
                  <tr key={index}>
                    <td>{format(stream.date, 'yyyy-MM-dd')}</td>
                    <td>{stream.duration}</td>
                    <td>{stream.viewers.toLocaleString()}</td>
                    <td>{convertDiamondsToUsdFormat(stream.earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyMessage>{t('dashboard.stats.noStreams')}</EmptyMessage>
          )}
        </ContentCard>

        {<ContentCard>
          <div className="card-header">
            <div className="card-title">{t('dashboard.stats.topSupporters')}</div>
            <Select value={supportersPeriod} onChange={(e) => setSupportersPeriod(e.target.value)}>
              <option value="today">{t('dashboard.stats.periods.today')}</option>
              <option value="yesterday">{t('dashboard.stats.periods.yesterday')}</option>
              <option value="thisWeek">{t('dashboard.stats.periods.thisWeek')}</option>
              <option value="lastWeek">{t('dashboard.stats.periods.lastWeek')}</option>
              <option value="thisMonth">{t('dashboard.stats.periods.thisMonth')}</option>
              <option value="lastMonth">{t('dashboard.stats.periods.lastMonth')}</option>
              <option value="last30Days">{t('dashboard.stats.periods.last30Days')}</option>
              <option value="last90Days">{t('dashboard.stats.periods.last90Days')}</option>
            </Select>
          </div>
          {loadingSupporters ? (
            <LoadingMessage>{t('common.loading')}...</LoadingMessage>
          ) : topSupporters.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <th>{t('dashboard.stats.user')}</th>
                  <th>{t('dashboard.stats.revenue')}</th>
                  <th>{t('dashboard.stats.diamonds')}</th>
                  <th>{t('dashboard.stats.gifts')}</th>
                </tr>
              </thead>
              <tbody>
                {topSupporters.map((supporter, index) => (
                  <tr key={index}>
                    <td>{supporter.user}</td>
                    <td>{supporter.totalSupport}</td>
                    <td>{supporter.totalDiamonds}</td>
                    <td>{supporter.totalGifts.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyMessage>{t('dashboard.stats.noSupporters')}</EmptyMessage>
          )}
        </ContentCard>}
      </ContentGrid>
    </>
  );
};

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 0.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 0.25rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 0.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    padding: 0.25rem;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.8rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0,0,0,0.1);
  }

  .title {
    color: #6b7280;
    font-size: 0.95rem;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #1a2a6c 0%, #2a4858 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.75rem;
    letter-spacing: -0.5px;
  }

  .change {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9rem;
    color: #059669;
    font-weight: 500;

    svg {
      font-size: 1.1rem;
    }
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 12px;
    
    &:hover {
      transform: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    
    .title {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .value {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }
    
    .change {
      font-size: 0.85rem;
      gap: 0.5rem;
      
      svg {
        font-size: 1rem;
      }
    }
  }
`;

const ContentCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.8rem;
  }

  .card-title {
    font-size: 1.3rem;
    font-weight: 700;
    background: linear-gradient(135deg, #1a2a6c 0%, #2a4858 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    
    &:hover {
      transform: none;
    }
    
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    
    .card-title {
      font-size: 1.2rem;
    }
  }
`;

const Select = styled.select`
  padding: 0.7rem 1.2rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  min-width: 180px;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236B7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 10.5l4-4H4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;

  &:hover {
    border-color: #1a2a6c;
    background-color: #f8fafc;
  }

  &:focus {
    outline: none;
    border-color: #1a2a6c;
    box-shadow: 0 0 0 3px rgba(26, 42, 108, 0.1);
    background-color: #f8fafc;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1rem 0;
  
  th, td {
    padding: 1.2rem;
    text-align: left;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.95rem;
  }

  th {
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
  }

  td {
    color: #334155;
  }

  tbody tr {
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f8fafc;
    }

    &:last-child td {
      border-bottom: none;
    }
  }

  tbody td:first-child {
    font-weight: 500;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1.1rem;
  font-weight: 500;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-style: italic;
  font-size: 1.1rem;
  font-weight: 500;
  background-color: #f8fafc;
  border-radius: 12px;
  margin: 1rem 0;
`;

export default HostDashboard;
