import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Parse from 'parse';
import { FaCalendarAlt, FaClock, FaUsers, FaGem } from 'react-icons/fa';
import { format } from 'date-fns';
import Stream from '../../models/Stream';
import { convertDiamondsToUsdFormat } from '../../utils/helpers';

const StreamsContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 12px;
    
    &:hover {
      transform: none;
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.25rem;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1a2a6c 0%, #2a4858 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const PeriodFilter = styled.select`
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
  
  @media (max-width: 768px) {
    width: 100%;
    padding: 0.8rem 1rem;
    font-size: 0.9rem;
    min-height: 44px;
    touch-action: manipulation;
  }
`;

const Badge = styled.span`
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  
  &.public {
    background-color: #e2e8f0;
    color: #475569;
  }

  &.private {
    background-color: #fef3c7;
    color: #92400e;
  }

  &.premium {
    background-color: #fee2e2;
    color: #991b1b;
  }
  
  @media (max-width: 768px) {
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    white-space: nowrap;
  }
`;

const IconCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: #64748b;
    font-size: 1rem;
    flex-shrink: 0;
  }

  span {
    flex: 1;
  }
  
  @media (max-width: 768px) {
    gap: 0.5rem;
    
    svg {
      font-size: 0.9rem;
    }
    
    span {
      font-size: 0.85rem;
      white-space: nowrap;
    }
  }
`;

const StreamsTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 1rem;
  table-layout: fixed;
  
  th, td {
    padding: 1.2rem;
    text-align: left;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.95rem;
  }

  thead tr {
    background: linear-gradient(to right, #f8fafc, #f1f5f9);
    border-radius: 12px;
  }

  th {
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    padding: 1rem 1.2rem;

    &:first-child {
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
    }

    &:last-child {
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
    }
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
  
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-top: 0.5rem;
    
    th, td {
      padding: 0.8rem;
      font-size: 0.85rem;
    }
    
    th {
      font-size: 0.75rem;
      padding: 0.8rem;
    }
  }

  .earnings {
    font-weight: 600;
    color: #059669;
    transition: color 0.2s ease;

    &:hover {
      color: #047857;
    }

    svg {
      color: #059669;
      transition: all 0.2s ease;
    }

    &:hover svg {
      color: #047857;
      transform: scale(1.1) rotate(-15deg);
    }
  }

  .viewers {
    font-weight: 600;
    color: #64748b;
    transition: color 0.2s ease;

    &:hover {
      color: #64748b;
    }

    svg {
      color: #64748b;
      transition: all 0.2s ease;
    }

    &:hover svg {
      color: #64748b;
      transform: scale(1.1) rotate(-15deg);
    }
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 1.1rem;
  font-weight: 500;
  background-color: #f8fafc;
  border-radius: 12px;
  margin: 1rem 0;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
    font-size: 1rem;
    border-radius: 8px;
    margin: 0.75rem 0;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-style: italic;
  font-size: 1.1rem;
  font-weight: 500;
  background-color: #f8fafc;
  border-radius: 12px;
  margin: 1rem 0;
  border: 2px dashed #e2e8f0;
  transition: all 0.3s ease;

  &:hover {
    border-color: #cbd5e1;
    background-color: #f1f5f9;
  }
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
    font-size: 1rem;
    border-radius: 8px;
    margin: 0.75rem 0;
  }
`;

const StreamsList = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState(Stream.periodsKeys.thisWeek);
  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState([]);

  const periods = [
    { value: Stream.periodsKeys.today, label: t('dashboard.stats.periods.today') },
    { value: Stream.periodsKeys.yesterday, label: t('dashboard.stats.periods.yesterday') },
    { value: Stream.periodsKeys.thisWeek, label: t('dashboard.stats.periods.thisWeek') },
    { value: Stream.periodsKeys.lastWeek, label: t('dashboard.stats.periods.lastWeek') },
    { value: Stream.periodsKeys.thisMonth, label: t('dashboard.stats.periods.thisMonth') },
    { value: Stream.periodsKeys.lastMonth, label: t('dashboard.stats.periods.lastMonth') },
    { value: Stream.periodsKeys.last30Days, label: t('dashboard.stats.periods.last30Days') },
    { value: Stream.periodsKeys.last90Days, label: t('dashboard.stats.periods.last90Days') },
  ];

  useEffect(() => {
    const fetchStreams = async () => {
      setLoading(true);
      try {
        const recentStreams = await Stream.getStreamsByPeriod(period, 10);
        setStreams(recentStreams.map(stream => ({
          id: stream.id,
          date: stream.createdAt,
          duration: stream.formatDuration(),
          viewers: stream.getViewersTotal().length,
          diamonds: Number(stream.getDiamonds()),
          type: stream.get('type') || Stream.STREAM_TYPE.LIVE,
          audienceType: stream.get('audienceType') || Stream.AUDIENCE_TYPE.PUBLIC
        })));
      } catch (error) {
        console.error('Error fetching streams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, [period]);

  // This would normally come from props, using placeholder data for now
  if (loading) {
    return (
      <StreamsContainer>
        <Header>
          <Title>{t('dashboard.streams.title')}</Title>
        </Header>
        <LoadingMessage>{t('common.loading')}</LoadingMessage>
      </StreamsContainer>
    );
  }

  if (!streams || streams.length === 0) {
    return (
      <StreamsContainer>
        <Header>
          <Title>{t('dashboard.streams.title')}</Title>
          <PeriodFilter value={period} onChange={(e) => setPeriod(e.target.value)}>
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </PeriodFilter>
        </Header>
        <EmptyMessage>{t('dashboard.streams.noStreams')}</EmptyMessage>
      </StreamsContainer>
    );
  }



  return (
    <StreamsContainer>
      <Header>
        <Title>{t('dashboard.streams.title')}</Title>
        <PeriodFilter value={period} onChange={(e) => setPeriod(e.target.value)}>
          {periods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </PeriodFilter>
      </Header>

      <StreamsTable>
        <thead>
          <tr>
            <th>{t('dashboard.stats.date')}</th>
            <th>{t('dashboard.stats.duration')}</th>
            <th>{t('dashboard.stats.viewers')}</th>
            <th>{t('dashboard.stats.earnings')}</th>
            <th>{t('dashboard.stats.streamType')}</th>
            <th>{t('dashboard.stats.audienceType')}</th>
          </tr>
        </thead>
        {<tbody>
          {streams.map((stream) => {
            const date = format(new Date(stream.date), 'MMM dd, HH:mm');
            return (
              <tr key={stream.id}>
                <td className="viewers">
                  <IconCell>
                    <FaCalendarAlt />
                    <span>{date}</span>
                  </IconCell>
                </td>
                <td className="viewers">
                  <IconCell>
                    <FaClock />
                    <span>{stream.duration}</span>
                  </IconCell>
                </td>
                <td className="viewers">
                  <IconCell>
                    <FaUsers />
                    <span>{stream.viewers.toLocaleString()}</span>
                  </IconCell>
                </td>
                <td className="earnings">
                  <IconCell>
                    <FaGem />
                    <span>{convertDiamondsToUsdFormat(stream.diamonds)}</span>
                  </IconCell>
                </td>
                <td className="viewers">
                  <span>{t(`dashboard.stats.types.${stream.type}`)}</span>
                </td>
                <td className="viewers">
                  <Badge className={stream.audienceType.toLowerCase()}>
                    {t(`dashboard.stats.audience.${stream.audienceType}`)}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>}
      </StreamsTable>
    </StreamsContainer>
  );
};

export default StreamsList;
