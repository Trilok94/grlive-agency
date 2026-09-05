import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaUserCheck, FaUsers, FaHourglassHalf, FaTimesCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Parse from 'parse';
import AdminPanel from './AdminPanel';
import AgencyApplication from '../../models/AgencyApplication';

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const StatGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
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
    
    &.yellow {
      background-color: rgba(234, 179, 8, 0.1);
      color: #eab308;
    }
    
    &.indigo {
      background-color: rgba(79, 70, 229, 0.1);
      color: #4f46e5;
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
  
  .change {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    
    &.positive {
      color: #10b981;
    }
    
    &.negative {
      color: #ef4444;
    }
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
`;

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Get counts for each status in the application workflow
        const pendingQuery = new Parse.Query(AgencyApplication);
        pendingQuery.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.PENDING);
        const pending = await pendingQuery.count();
        
        const acceptedQuery = new Parse.Query(AgencyApplication);
        acceptedQuery.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.ACCEPTED);
        const accepted = await acceptedQuery.count();
        
        const completedQuery = new Parse.Query(AgencyApplication);
        completedQuery.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.COMPLETED);
        const completed = await completedQuery.count();
        
        const rejectedQuery = new Parse.Query(AgencyApplication);
        rejectedQuery.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.REJECTED);
        const rejected = await rejectedQuery.count();
        
        setStats({
          pending,
          accepted,
          completed,
          rejected
        });
      } catch (error) {
        console.error('Error fetching application stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <Container>
      <SectionTitle>{t('admin.applications.title')}</SectionTitle>
      
      <StatsContainer>
        <StatCard>
          <div className="icon purple">
            <FaUsers />
          </div>
          <div className="title">{t('admin.dashboard.pendingApplications')}</div>
          <div className="value">{loading ? '--' : stats.pending}</div>
        </StatCard>
        
        <StatCard>
          <div className="icon yellow">
            <FaHourglassHalf />
          </div>
          <div className="title">{t('admin.dashboard.inProcessApplications')}</div>
          <div className="value">{loading ? '--' : (stats.accepted + stats.completed)}</div>
        </StatCard>
        
        <StatCard>
          <div className="icon orange">
            <FaTimesCircle />
          </div>
          <div className="title">{t('admin.dashboard.rejectedApplications')}</div>
          <div className="value">{loading ? '--' : stats.rejected}</div>
        </StatCard>
      </StatsContainer>
      
      <AdminPanel />
    </Container>
  );
};

export default AdminDashboard;
