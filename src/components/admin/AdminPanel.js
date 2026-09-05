import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import { FaCheckCircle, FaTimesCircle, FaEye, FaUser, FaFileAlt, FaEnvelope } from 'react-icons/fa';
import Parse from 'parse';
import { useTranslation } from 'react-i18next';
import AgencyApplication from '../../models/AgencyApplication';
import { getCountryNameByCode } from '../../utils/helpers';

// Styled Components
const Container = styled.div`
  margin-bottom: 30px;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
`;

const Tab = styled.button`
  padding: 10px 20px;
  background: ${props => props.$active ? '#6366f1' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  border-radius: 5px 5px 0 0;
  margin-right: 5px;
  
  &:hover {
    background: ${props => props.$active ? '#6366f1' : '#f0f0f0'};
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardBody = styled.div`
  padding: 20px;
`;

const CardFooter = styled.div`
  padding: 15px 20px;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #eaeaea;
  }
  
  th {
    background-color: #f8f9fa;
    font-weight: 600;
  }
  
  tr:hover {
    background-color: #f8f9fa;
  }
  
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.$status) {
      case AgencyApplication.status.PENDING: return '#fef3c7';
      case AgencyApplication.status.ACCEPTED: return '#d1fae5';
      case AgencyApplication.status.REJECTED: return '#fee2e2';
      case AgencyApplication.status.ACTIVATED: return '#dbeafe';
      case AgencyApplication.status.COMPLETED: return '#e0e7ff';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case AgencyApplication.status.PENDING: return '#92400e';
      case AgencyApplication.status.ACCEPTED: return '#065f46';
      case AgencyApplication.status.REJECTED: return '#b91c1c';
      case AgencyApplication.status.ACTIVATED: return '#1e40af';
      case AgencyApplication.status.COMPLETED: return '#3730a3';
      default: return '#1f2937';
    }
  }};
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &.primary {
    background-color: #6366f1;
    color: white;
    border: none;
    
    &:hover {
      background-color: #4f46e5;
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: #6366f1;
    border: 1px solid #6366f1;
    
    &:hover {
      background-color: #f5f5f5;
    }
  }
  
  &.danger {
    background-color: #ef4444;
    color: white;
    border: none;
    
    &:hover {
      background-color: #dc2626;
    }
  }
  
  &.success {
    background-color: #10b981;
    color: white;
    border: none;
    
    &:hover {
      background-color: #059669;
    }
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  max-width: 600px;
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
  font-size: 18px;
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const ModalFooter = styled.div`
  padding: 15px 20px;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 1;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const InfoLabel = styled.div`
  width: 150px;
  font-weight: 600;
  color: #666;
  
  @media (max-width: 768px) {
    width: 100%;
    margin-bottom: 5px;
  }
`;

const InfoValue = styled.div`
  flex: 1;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
  
  svg {
    font-size: 48px;
    margin-bottom: 10px;
    color: #ccc;
  }
  
  h3 {
    margin: 0 0 10px;
    font-size: 18px;
  }
  
  p {
    margin: 0;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const FilePreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  
  a {
    padding: 8px 12px;
    background: #f0f0f0;
    border-radius: 5px;
    display: flex;
    align-items: center;
    gap: 5px;
    text-decoration: none;
    color: #333;
    font-size: 14px;
    
    &:hover {
      background: #e0e0e0;
    }
  }
`;

const SearchBar = styled.div`
  margin-bottom: 20px;
  
  input {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #eaeaea;
    border-radius: 8px;
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
  width: 36px;
  height: 36px;
  border-radius: 5px;
  background: ${props => props.$active ? '#6366f1' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: 1px solid ${props => props.$active ? '#6366f1' : '#eaeaea'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.$active ? '#6366f1' : '#f0f0f0'};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;
const AdminPanel = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pending');
  
  const handleReturnToCompleted = (application) => {
    // First close the details modal if it's open
    if (showDetailsModal) {
      closeDetailsModal();
    }
    
    confirmAlert({
      title: t('admin.applications.returnToCompletedTitle'),
      message: t('admin.applications.returnToCompletedConfirm'),
      buttons: [
        {
          label: t('common.yes'),
          onClick: async () => {
            try {
              application.set(AgencyApplication.keys.STATUS, AgencyApplication.status.COMPLETED);
              await application.save();
              
              // Refresh the list
              fetchApplications();
              closeDetailsModal();
              toast.success(t('admin.applications.returnToCompletedSuccess'));
            } catch (error) {
              console.error('Error returning to completed status:', error);
              toast.error(t('admin.applications.returnToCompletedError'));
            }
          }
        },
        {
          label: t('common.no'),
          onClick: () => {}
        }
      ]
    });
  };
  
  const handleSuspendApplication = (application) => {
    // First close the details modal if it's open
    if (showDetailsModal) {
      closeDetailsModal();
    }
    
    confirmAlert({
      title: t('admin.applications.suspendAgencyTitle'),
      message: t('admin.applications.suspendAgencyConfirm'),
      buttons: [
        {
          label: t('common.yes'),
          onClick: async () => {
            try {
              application.set(AgencyApplication.keys.STATUS, AgencyApplication.status.SUSPENDED);
              await application.save();
              
              // Try to find and update the associated agent status
              try {
                const applicationId = application.id;
                const authorId = application.get(AgencyApplication.keys.AUTHOR_ID);
                
                // Try to find the agent by application ID first
                const agentQuery = new Parse.Query('Agents');
                agentQuery.equalTo('agencyApplicationId', applicationId);
                let agent = await agentQuery.first();
                
                // If not found, try by author ID as fallback
                if (!agent && authorId) {
                  const authorQuery = new Parse.Query('Agents');
                  authorQuery.equalTo('user', {
                    __type: 'Pointer',
                    className: '_User',
                    objectId: authorId
                  });
                  agent = await authorQuery.first();
                }
                
                if (agent) {
                  // Set agent status to suspended
                  agent.set('status', 'suspended'); 
                  await agent.save(null, { useMasterKey: true });
                }
              } catch (agentError) {
                console.error('Error updating agent status:', agentError);
                // Continue with the process even if agent update fails
              }
              
              // Refresh the list
              fetchApplications();
              closeDetailsModal();
              toast.success(t('admin.applications.suspendAgencySuccess'));
            } catch (error) {
              console.error('Error suspending agency:', error);
              toast.error(t('admin.applications.suspendAgencyError'));
            }
          }
        },
        {
          label: t('common.no'),
          onClick: () => {}
        }
      ]
    });
  };
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch applications based on active tab and search query
  useEffect(() => {
    fetchApplications();
  }, [activeTab, searchQuery, currentPage]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // Create a query for AgencyApplication
      const query = new Parse.Query(AgencyApplication);
      
      // Sort by createdAt in descending order (newest first)
      query.descending('createdAt');
      
      // Apply status filter based on active tab
      if (activeTab === 'pending') {
        query.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.PENDING);
      } else if (activeTab === 'inProcess') {
        query.containedIn(AgencyApplication.keys.STATUS, [
          AgencyApplication.status.ACCEPTED,
          AgencyApplication.status.COMPLETED
        ]);
      } else if (activeTab === 'active') {
        query.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.ACTIVATED);
      } else if (activeTab === 'suspended') {
        query.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.SUSPENDED);
      } else if (activeTab === 'rejected') {
        query.equalTo(AgencyApplication.keys.STATUS, AgencyApplication.status.REJECTED);
      }
      
      // Add search filter if search query exists
      if (searchQuery) {
        // Create an OR query for multiple fields
        const agencyNameQuery = new Parse.Query(AgencyApplication)
          .contains(AgencyApplication.keys.AGENCY_NAME, searchQuery);
        
        const contactEmailQuery = new Parse.Query(AgencyApplication)
          .contains(AgencyApplication.keys.CONTACT_EMAIL, searchQuery);
          
        const firstNameQuery = new Parse.Query(AgencyApplication)
          .contains(AgencyApplication.keys.FIRST_NAME, searchQuery);
          
        const lastNameQuery = new Parse.Query(AgencyApplication)
          .contains(AgencyApplication.keys.LAST_NAME, searchQuery);
          
        // Combine searches with OR
        query._orQuery([agencyNameQuery, contactEmailQuery, firstNameQuery, lastNameQuery]);
      }
      
      // Count total records for pagination
      const count = await query.count();
      setTotalPages(Math.ceil(count / itemsPerPage));
      
      // Add pagination
      query.limit(itemsPerPage);
      query.skip((currentPage - 1) * itemsPerPage);
      
      // Include the author object
      query.include(AgencyApplication.keys.AUTHOR);
      
      // Fetch applications
      const results = await query.find();
      setApplications(results);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const [agentDetails, setAgentDetails] = useState(null);
  const [paymentMethodDetails, setPaymentMethodDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);


  
  const fetchAgencyDetails = async (application) => {
    setLoadingDetails(true);
    try {
      // Get application ID and author ID
      const applicationId = application.id;
      const authorId = application.get(AgencyApplication.keys.AUTHOR_ID);
      
      // Create a query for Agents class (note the plural)
      const agentQuery = new Parse.Query('Agents');
      
      // First try to find agent by application ID directly
      agentQuery.equalTo('agencyApplicationId', applicationId);
      let agent = await agentQuery.first();
      
      // If not found, try the fallback approach with author ID
      if (!agent && authorId) {
        // Reset query and search by user pointer
        const authorQuery = new Parse.Query('Agents');
        authorQuery.equalTo('user', {
          __type: 'Pointer',
          className: '_User',
          objectId: authorId
        });
        
        agent = await authorQuery.first();
      }
      
      setAgentDetails(agent);

      // Now fetch payment method details
      if (agent && authorId) {
        const paymentMethodQuery = new Parse.Query('PayoutMethod');
        paymentMethodQuery.equalTo('user', {
          __type: 'Pointer',
          className: '_User',
          objectId: authorId
        });
        
        const paymentMethod = await paymentMethodQuery.first();
        setPaymentMethodDetails(paymentMethod);
      }
    } catch (error) {
      console.error('Error fetching agency details:', error);
      toast.error('Failed to load detailed agency information');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    fetchAgencyDetails(application);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedApplication(null);
    setAgentDetails(null);
    setPaymentMethodDetails(null);
  };

  const handleApproveApplication = (application) => {
    // First close the details modal if it's open
    if (showDetailsModal) {
      closeDetailsModal();
    }
    
    confirmAlert({
      title: t('admin.applications.confirmApprove'),
      message: t('admin.applications.confirmApproveMessage'),
      buttons: [
        {
          label: t('common.yes'),
          onClick: async () => {
            try {
              // Update application status to ACCEPTED
              application.set(AgencyApplication.keys.STATUS, AgencyApplication.status.ACCEPTED);
              await application.save();
              
              // Refresh the list
              fetchApplications();
              
              // Show success message
              toast.success(t('admin.applications.approveSuccess'));

            } catch (error) {
              console.error('Error approving application:', error);
              toast.error(t('admin.applications.approveError'));
            }
          }
        },
        {
          label: t('common.no'),
          onClick: () => {}
        }
      ]
    });
  };
  
  const handleActivateApplication = (application) => {
    // First close the details modal if it's open
    if (showDetailsModal) {
      closeDetailsModal();
    }
    
    confirmAlert({
      title: t('admin.applications.confirmActivate'),
      message: t('admin.applications.confirmActivateMessage'),
      buttons: [
        {
          label: t('common.yes'),
          onClick: async () => {
            try {
              // Update application status to ACTIVATED
              application.set(AgencyApplication.keys.STATUS, AgencyApplication.status.ACTIVATED);
              await application.save();
              
              try {
                // Update the associated agent status as well if possible
                const applicationId = application.id;
                const authorId = application.get(AgencyApplication.keys.AUTHOR_ID);
                
                // Try to find the agent by application ID first
                const agentQuery = new Parse.Query('Agents');
                agentQuery.equalTo('agencyApplicationId', applicationId);
                let agent = await agentQuery.first();
                
                // If not found, try by author ID as fallback
                if (!agent && authorId) {
                  const authorQuery = new Parse.Query('Agents');
                  authorQuery.equalTo('user', {
                    __type: 'Pointer',
                    className: '_User',
                    objectId: authorId
                  });
                  agent = await authorQuery.first();
                }
                
                if (agent) {
                  // Set agent status to active
                  agent.set('status', 'active'); 
                  // Also ensure the application ID is set
                  agent.set('agencyApplicationId', applicationId);
                  await agent.save(null, { useMasterKey: true });
                }
              } catch (agentError) {
                console.error('Error updating agent status:', agentError);
                // Continue with the process even if agent update fails
              }
              
              // Refresh the list
              fetchApplications();
              
              // Show success message
              toast.success(t('admin.applications.activateAgencySuccess'));

            } catch (error) {
              console.error('Error activating application:', error);
              toast.error(t('admin.applications.activateAgencyError'));
            }
          }
        },
        {
          label: t('common.no'),
          onClick: () => {}
        }
      ]
    });
  };

  const handleRequestMoreDetails = (application) => {
    // First close the details modal if it's open
    if (showDetailsModal) {
      closeDetailsModal();
    }
    
    confirmAlert({
      title: t('admin.applications.confirmRequestMoreDetails'),
      message: t('admin.applications.confirmRequestMoreDetailsMessage'),
      buttons: [
        {
          label: t('common.yes'),
          onClick: async () => {
            try {
              // Update application status to ACCEPTED (request more details)
              application.set(AgencyApplication.keys.STATUS, AgencyApplication.status.ACCEPTED);
              await application.save();
              
              // Refresh the list
              fetchApplications();
              
              // Show success message
              toast.success(t('admin.applications.requestMoreDetailsSuccess'));

            } catch (error) {
              console.error('Error requesting more details:', error);
              toast.error(t('admin.applications.requestMoreDetailsError'));
            }
          }
        },
        {
          label: t('common.no'),
          onClick: () => {}
        }
      ]
    });
  };

  const handleRejectApplication = (application) => {
    // First close the details modal if it's open
    if (showDetailsModal) {
      closeDetailsModal();
    }
    
    // Use customUI to add a text input for rejection reason
    confirmAlert({
      customUI: ({ onClose }) => {
        let rejectionReason = '';
        
        const handleReject = async () => {
          try {
            // Update application status to REJECTED
            application.set(AgencyApplication.keys.STATUS, AgencyApplication.status.REJECTED);
            
            // Set rejection reason in the message field if provided
            if (rejectionReason.trim()) {
              application.set(AgencyApplication.keys.MESSAGE, rejectionReason.trim());
            }
            
            await application.save();
            
            // Refresh the list
            fetchApplications();
            
            // Show success message
            toast.success(t('admin.applications.rejectSuccess'));
            
            onClose();
          } catch (error) {
            console.error('Error rejecting application:', error);
            toast.error(t('admin.applications.rejectError'));
          }
        };
        
        return (
          <div className='custom-ui' style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)' }}>
            <h1 style={{ fontSize: '18px', marginBottom: '10px' }}>{t('admin.applications.confirmReject')}</h1>
            <p style={{ marginBottom: '20px' }}>{t('admin.applications.confirmRejectMessage')}</p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                {t('admin.applications.rejectionReason')} ({t('common.optional')})
              </label>
              <textarea 
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                placeholder={t('admin.applications.rejectionReasonPlaceholder')}
                onChange={(e) => rejectionReason = e.target.value}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReject}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {t('admin.applications.reject')}
              </button>
            </div>
          </div>
        );
      }
    });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    
    // Handle Parse date objects
    if (date && typeof date === 'object' && date.__type === 'Date') {
      return new Date(date.iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Handle regular Date objects or ISO strings
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderApplicationDetails = () => {
    if (!selectedApplication) return null;
    
    return (
      <Modal onClick={(e) => e.target === e.currentTarget && closeDetailsModal()}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t('admin.applications.applicationDetails')}</ModalTitle>
            <CloseButton onClick={closeDetailsModal}>&times;</CloseButton>
          </ModalHeader>
          <ModalBody>
            <InfoRow>
              <InfoLabel>{t('admin.applications.status')}</InfoLabel>
              <InfoValue>
                <Badge $status={selectedApplication.get(AgencyApplication.keys.STATUS)}>
                  {selectedApplication.get(AgencyApplication.keys.STATUS)}
                </Badge>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>{t('admin.applications.applicationDate')}</InfoLabel>
              <InfoValue>{formatDate(selectedApplication.createdAt)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>{t('admin.applications.agencyName')}</InfoLabel>
              <InfoValue>{selectedApplication.get(AgencyApplication.keys.AGENCY_NAME)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>{t('admin.applications.agencyDescription')}</InfoLabel>
              <InfoValue>{selectedApplication.get(AgencyApplication.keys.AGENCY_DESCRIPTION)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>{t('admin.applications.contactEmail')}</InfoLabel>
              <InfoValue>{selectedApplication.get(AgencyApplication.keys.CONTACT_EMAIL)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>{t('admin.applications.fullName')}</InfoLabel>
              <InfoValue>
                {selectedApplication.get(AgencyApplication.keys.FIRST_NAME)} {selectedApplication.get(AgencyApplication.keys.LAST_NAME)}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>{t('admin.applications.dateOfBirth')}</InfoLabel>
              <InfoValue>
                {formatDate(selectedApplication.get(AgencyApplication.keys.DATE_OF_BIRTH))}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>{t('admin.applications.country')}</InfoLabel>
              <InfoValue>{selectedApplication.get(AgencyApplication.keys.COUNTRY) ? getCountryNameByCode(selectedApplication.get(AgencyApplication.keys.COUNTRY)) : '-'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>{t('admin.applications.address')}</InfoLabel>
              <InfoValue>{selectedApplication.get(AgencyApplication.keys.ADDRESS) || '-'}</InfoValue>
            </InfoRow>
            {/* Show message as rejection reason if application is rejected, otherwise as a regular message */}
            <InfoRow>
              <InfoLabel>
                {selectedApplication.get(AgencyApplication.keys.STATUS) === AgencyApplication.status.REJECTED 
                  ? t('admin.applications.rejectionReason')
                  : t('admin.applications.message')
                }
              </InfoLabel>
              <InfoValue style={selectedApplication.get(AgencyApplication.keys.STATUS) === AgencyApplication.status.REJECTED 
                ? { color: '#b91c1c' } 
                : {}
              }>
                {selectedApplication.get(AgencyApplication.keys.MESSAGE) || '-'}
              </InfoValue>
            </InfoRow>
            
            <InfoRow>
              <InfoLabel>{t('admin.applications.documents')}</InfoLabel>
              <InfoValue>
                {selectedApplication.get(AgencyApplication.keys.DOCS_FILES) && 
                selectedApplication.get(AgencyApplication.keys.DOCS_FILES).length > 0 ? (
                  <FilePreview>
                    {selectedApplication.get(AgencyApplication.keys.DOCS_FILES).map((file, index) => (
                      <a href={file.url()} target="_blank" rel="noopener noreferrer" key={index}>
                        <FaFileAlt /> Document {index + 1}
                      </a>
                    ))}
                  </FilePreview>
                ) : (
                  t('admin.applications.noDocuments')
                )}
              </InfoValue>
            </InfoRow>

            {/* Show additional details if available */}
            {agentDetails && (
              <>
                {loadingDetails ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p>{t('common.loading')}</p>
                  </div>
                ) : (
                  <>
                    {agentDetails && (
                      <>
                        <div style={{ margin: '20px 0 10px', borderBottom: '1px solid #eaeaea', paddingBottom: '10px' }}>
                          <h3 style={{ fontSize: '16px', margin: 0 }}>{t('admin.applications.companyDetails')}</h3>
                        </div>
                        
                        {agentDetails.get('logo') && (
                          <InfoRow>
                            <InfoLabel>{t('admin.applications.companyLogo')}</InfoLabel>
                            <InfoValue>
                              <img 
                                src={agentDetails.get('logo').url()} 
                                alt="Company Logo" 
                                style={{ maxWidth: '150px', maxHeight: '150px', border: '1px solid #eaeaea', borderRadius: '4px' }} 
                              />
                            </InfoValue>
                          </InfoRow>
                        )}
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.companyName')}</InfoLabel>
                          <InfoValue>{agentDetails.get('companyName') || '-'}</InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.companyRegistrationNumber')}</InfoLabel>
                          <InfoValue>{agentDetails.get('companyRegistrationNumber') || '-'}</InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.companyTaxId')}</InfoLabel>
                          <InfoValue>{agentDetails.get('companyTaxId') || '-'}</InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.companyAddress')}</InfoLabel>
                          <InfoValue>{agentDetails.get('companyAddress') || '-'}</InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.companyLocation')}</InfoLabel>
                          <InfoValue>
                            {agentDetails.get('companyCity') && agentDetails.get('companyPostalCode') && agentDetails.get('companyCountry') ? 
                              `${agentDetails.get('companyCity')}, ${agentDetails.get('companyPostalCode')}, ${getCountryNameByCode(agentDetails.get('companyCountry'))}` : 
                              '-'}
                          </InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.companyWebsite')}</InfoLabel>
                          <InfoValue>
                            {agentDetails.get('companyWebsite') ? 
                              <a href={agentDetails.get('companyWebsite')} target="_blank" rel="noopener noreferrer">
                                {agentDetails.get('companyWebsite')}
                              </a> : 
                              '-'}
                          </InfoValue>
                        </InfoRow>
                        
                        {agentDetails.get('description') && (
                          <InfoRow>
                            <InfoLabel>{t('admin.applications.description')}</InfoLabel>
                            <InfoValue>{agentDetails.get('description')}</InfoValue>
                          </InfoRow>
                        )}
                        
                        {agentDetails.get('rules') && (
                          <InfoRow>
                            <InfoLabel>{t('admin.applications.rules')}</InfoLabel>
                            <InfoValue style={{ whiteSpace: 'pre-wrap' }}>{agentDetails.get('rules')}</InfoValue>
                          </InfoRow>
                        )}
                        
                        {agentDetails.get('commissions') && (
                          <InfoRow>
                            <InfoLabel>{t('admin.applications.commissions')}</InfoLabel>
                            <InfoValue style={{ whiteSpace: 'pre-wrap' }}>{agentDetails.get('commissions')}</InfoValue>
                          </InfoRow>
                        )}
                        
                        {agentDetails.get('support') && (
                          <InfoRow>
                            <InfoLabel>{t('admin.applications.support')}</InfoLabel>
                            <InfoValue style={{ whiteSpace: 'pre-wrap' }}>{agentDetails.get('support')}</InfoValue>
                          </InfoRow>
                        )}
                      </>
                    )}
                    
                    {paymentMethodDetails && (
                      <>
                        <div style={{ margin: '20px 0 10px', borderBottom: '1px solid #eaeaea', paddingBottom: '10px' }}>
                          <h3 style={{ fontSize: '16px', margin: 0 }}>{t('admin.applications.bankingDetails')}</h3>
                        </div>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.bankAccountHolder')}</InfoLabel>
                          <InfoValue>
                            {paymentMethodDetails.get('accountName') && paymentMethodDetails.get('accountSurname') ? 
                              `${paymentMethodDetails.get('accountName')} ${paymentMethodDetails.get('accountSurname')}` : 
                              '-'}
                          </InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.bankName')}</InfoLabel>
                          <InfoValue>{paymentMethodDetails.get('bankName') || '-'}</InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.accountId')}</InfoLabel>
                          <InfoValue>{paymentMethodDetails.get('accountId') || '-'}</InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.bankingEmail')}</InfoLabel>
                          <InfoValue>{paymentMethodDetails.get('email') || '-'}</InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.phoneNumber')}</InfoLabel>
                          <InfoValue>{paymentMethodDetails.get('phoneNumber') || '-'}</InfoValue>
                        </InfoRow>
                        
                        <InfoRow>
                          <InfoLabel>{t('admin.applications.bankingLocation')}</InfoLabel>
                          <InfoValue>
                            {paymentMethodDetails.get('city') && paymentMethodDetails.get('country') ? 
                              `${paymentMethodDetails.get('city')}, ${getCountryNameByCode(paymentMethodDetails.get('country'))}` : 
                              '-'}
                          </InfoValue>
                        </InfoRow>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedApplication.get(AgencyApplication.keys.STATUS) === AgencyApplication.status.PENDING && (
              <>
                <Button 
                  className="danger" 
                  onClick={() => handleRejectApplication(selectedApplication)}
                >
                  <FaTimesCircle /> {t('admin.applications.reject')}
                </Button>
                <Button 
                  className="success" 
                  onClick={() => handleApproveApplication(selectedApplication)}
                >
                  <FaCheckCircle /> {t('admin.applications.approve')}
                </Button>
              </>
            )}
            {selectedApplication.get(AgencyApplication.keys.STATUS) === AgencyApplication.status.ACTIVATED && (
              <>
                <Button 
                  className="danger" 
                  onClick={() => handleSuspendApplication(selectedApplication)}
                >
                  <FaTimesCircle /> {t('admin.applications.suspendAgency')}
                </Button>
                <Button 
                  className="secondary" 
                  onClick={() => fetchAgencyDetails(selectedApplication)}
                >
                  <FaEye /> {t('admin.applications.viewDetails')}
                </Button>
              </>
            )}
            {selectedApplication.get(AgencyApplication.keys.STATUS) === AgencyApplication.status.COMPLETED && (
              <>
                <Button 
                  className="secondary" 
                  onClick={() => handleRequestMoreDetails(selectedApplication)}
                >
                  <FaEnvelope /> {t('admin.applications.requestMoreDetails')}
                </Button>
                <Button 
                  className="success" 
                  onClick={() => handleActivateApplication(selectedApplication)}
                >
                  <FaCheckCircle /> {t('admin.applications.activateAgency')}
                </Button>
              </>
            )}
            {selectedApplication.get(AgencyApplication.keys.STATUS) === AgencyApplication.status.SUSPENDED && (
              <>
                <Button 
                  className="success" 
                  onClick={() => handleActivateApplication(selectedApplication)}
                >
                  <FaCheckCircle /> {t('admin.applications.activateAgency')}
                </Button>
                <Button 
                  className="secondary" 
                  onClick={() => handleReturnToCompleted(selectedApplication)}
                >
                  <FaFileAlt /> {t('admin.applications.returnToCompleted')}
                </Button>
              </>
            )}
            <Button className="secondary" onClick={closeDetailsModal}>
              {t('common.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderApplications = () => {
    if (loading) {
      return (
        <LoadingState>
          <p>{t('common.loading')}</p>
        </LoadingState>
      );
    }

    if (applications.length === 0) {
      return (
        <EmptyState>
          <FaFileAlt />
          <h3>{t('admin.applications.noApplications')}</h3>
          <p>{t('admin.applications.noApplicationsMessage')}</p>
        </EmptyState>
      );
    }

    return (
      <>
        <Table>
          <thead>
            <tr>
              <th>{t('admin.applications.agencyName')}</th>
              <th>{t('admin.applications.applicant')}</th>
              <th>{t('admin.applications.email')}</th>
              <th>{t('admin.applications.dateApplied')}</th>
              <th>{t('admin.applications.status')}</th>
              <th>{t('admin.applications.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(application => (
              <tr key={application.id}>
                <td>{application.get(AgencyApplication.keys.AGENCY_NAME)}</td>
                <td>
                  {application.get(AgencyApplication.keys.FIRST_NAME)} {application.get(AgencyApplication.keys.LAST_NAME)}
                </td>
                <td>{application.get(AgencyApplication.keys.CONTACT_EMAIL)}</td>
                <td>{formatDate(application.createdAt)}</td>
                <td>
                  <Badge $status={application.get(AgencyApplication.keys.STATUS)}>
                    {application.get(AgencyApplication.keys.STATUS)}
                  </Badge>
                </td>
                <td>
                  <Button 
                    className="secondary" 
                    onClick={() => handleViewDetails(application)}
                  >
                    <FaEye /> {t('common.view')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        
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
    );
  };

  return (
    <Container>
      <TabContainer>
        <Tab 
          $active={activeTab === 'pending'} 
          onClick={() => {
            setActiveTab('pending');
            setCurrentPage(1);
          }}
        >
          {t('admin.applications.pending')}
        </Tab>
        <Tab 
          $active={activeTab === 'inProcess'} 
          onClick={() => {
            setActiveTab('inProcess');
            setCurrentPage(1);
          }}
        >
          {t('admin.applications.inProcess')}
        </Tab>
        <Tab 
          $active={activeTab === 'active'} 
          onClick={() => {
            setActiveTab('active');
            setCurrentPage(1);
          }}
        >
          {t('admin.applications.active')}
        </Tab>
        <Tab 
          $active={activeTab === 'suspended'} 
          onClick={() => {
            setActiveTab('suspended');
            setCurrentPage(1);
          }}
        >
          {t('admin.applications.suspended')}
        </Tab>
        <Tab 
          $active={activeTab === 'rejected'} 
          onClick={() => {
            setActiveTab('rejected');
            setCurrentPage(1);
          }}
        >
          {t('admin.applications.rejected')}
        </Tab>
      </TabContainer>
      
      <SearchBar>
        <input 
          type="text" 
          placeholder={t('admin.applications.search')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </SearchBar>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'pending' && (
              <>{t('admin.applications.pendingApplications')}</>
            )}
            {activeTab === 'inProcess' && (
              <>{t('admin.applications.inProcessApplications')}</>
            )}
            {activeTab === 'active' && (
              <>{t('admin.applications.activeApplications')}</>
            )}
            {activeTab === 'suspended' && (
              <>{t('admin.applications.suspendedApplications')}</>
            )}
            {activeTab === 'rejected' && (
              <>{t('admin.applications.rejectedApplications')}</>
            )}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {renderApplications()}
        </CardBody>
      </Card>
      
      {renderApplicationDetails()}
    </Container>
  );
};

export default AdminPanel;
