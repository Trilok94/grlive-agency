import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaUpload, 
  FaSpinner, 
  FaTrash, 
  FaCheckCircle, 
  FaBuilding, 
  FaEnvelope, 
  FaFileAlt, 
  FaInfoCircle,
  FaUser,
  FaCalendarAlt,
  FaGlobe,
  FaMapMarkerAlt,
  FaIdCard,
  FaChevronDown
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Parse from 'parse';
import { useTranslation } from 'react-i18next';
import { agencyService } from '../../services/agencyService';
import { authService } from '../../services/ParseService';
import { countries } from '../../utils/helpers';

const RegisterAgencyForm = ({ onSuccessfulSubmission }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    agencyName: '',
    description: '',
    contactEmail: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    country: '',
    address: '',
    identityDocuments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('idle'); // idle, submitting, submitted
  const [documentPreviews, setDocumentPreviews] = useState([]);
  const [documentError, setDocumentError] = useState('');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        contactEmail: currentUser.get('email') || ''
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      setDocumentError(t('agency.register.errors.invalidDocumentType'));
      return;
    }
    
    if (file.size > maxSize) {
      setDocumentError(t('agency.register.errors.documentTooLarge'));
      return;
    }
    
    setDocumentError('');
    
    // Create preview URL
    const preview = {
      id: Date.now(), // Add unique ID for each file
      file,
      preview: URL.createObjectURL(file),
      type: file.type
    };
    
    // Add to existing documents array
    setFormData(prev => ({
      ...prev,
      identityDocuments: [...prev.identityDocuments, file]
    }));
    
    // Add to previews array
    setDocumentPreviews(prev => [...prev, preview]);
  };

  const removeDocument = (id) => {
    // Remove from previews
    const updatedPreviews = documentPreviews.filter(preview => preview.id !== id);
    setDocumentPreviews(updatedPreviews);
    
    // Find index of the file to remove
    const indexToRemove = documentPreviews.findIndex(preview => preview.id === id);
    
    // Remove from form data
    if (indexToRemove !== -1) {
      setFormData(prev => ({
        ...prev,
        identityDocuments: prev.identityDocuments.filter((_, index) => index !== indexToRemove)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus('submitting');

    // Validate document upload
    if (formData.identityDocuments.length === 0) {
      setDocumentError(t('agency.register.errors.documentUpload'));
      setIsSubmitting(false);
      return;
    }

    try {
      // Get current user and ensure it's a proper Parse.User instance
      let currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error(t('agency.register.errors.notLoggedIn'));
      }
      
      // Make sure we have a proper Parse.User instance
      if (!(currentUser instanceof Parse.User)) {
        console.warn('User is not a Parse.User instance, fetching proper user instance');
        try {
          // Get the user ID and fetch a proper User instance
          const userId = currentUser.id || currentUser.objectId;
          if (!userId) throw new Error('No user ID available');
          
          const userQuery = new Parse.Query(Parse.User);
          currentUser = await userQuery.get(userId);
          
          if (!(currentUser instanceof Parse.User)) {
            throw new Error('Failed to get a proper Parse.User instance');
          }
        } catch (userError) {
          console.error('Error getting proper user instance:', userError);
          throw new Error(t('agency.register.errors.userInstanceError'));
        }
      }

      // Convert all files to Parse.File objects with correct extensions
      const parseFiles = await Promise.all(formData.identityDocuments.map(async (file, index) => {
        // Determine the correct file extension based on file type
        const fileType = file.type;
        let fileExtension = '.jpg';
        
        if (fileType === 'application/pdf') {
          fileExtension = '.pdf';
        } else if (fileType === 'image/png') {
          fileExtension = '.png';
        }
        
        // Create Parse.File with correct extension
        const parseFile = new Parse.File(`identity_document_${index}${fileExtension}`, file);
        await parseFile.save();
        return parseFile;
      }));
      
      // Convert dateOfBirth string to Date object
      const dateOfBirthObj = formData.dateOfBirth ? new Date(formData.dateOfBirth) : null;

      // Submit agency registration
      const result = await agencyService.submitAgencyRegistration({
        user: currentUser,
        agencyName: formData.agencyName,
        agencyDescription: formData.description,
        contactEmail: formData.contactEmail,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: dateOfBirthObj,
        country: formData.country,
        address: formData.address,
        paymentMethod: 'bank_transfer', // Default to bank transfer
        docsFiles: parseFiles // Save all files in the docsFiles array
      });

      setSubmissionStatus('submitted');
      if (onSuccessfulSubmission) {
        onSuccessfulSubmission(result);
      }
    } catch (error) {
      console.error('Error submitting agency registration:', error);
      toast.error(t('agency.register.errors.submission') || 'Error submitting registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render submission review screen
  if (submissionStatus === 'submitted') {
    return (
      <Container>
        <SubmissionReviewContainer>
          <FaCheckCircle style={{ color: '#4CAF50', fontSize: '5rem', marginBottom: '1rem' }} />
          <h2>{t('agency.register.submissionStatus.submitted')}</h2>
          <StatusMessage $status="in_review">
            <FaInfoCircle /> {t('agency.register.submissionStatus.inReview')}
          </StatusMessage>
          <ReviewDetails>
            <h3>{t('agency.register.submissionStatus.detailsTitle')}</h3>
            <ul>
              <li><FaBuilding /> {formData.agencyName}</li>
              <li><FaEnvelope /> {formData.contactEmail}</li>
            </ul>
          </ReviewDetails>
          <p style={{ fontWeight: '500', color: '#1a2a6c' }}>
            {t('agency.register.submissionStatus.reviewMessage')}
          </p>
        </SubmissionReviewContainer>
      </Container>
    );
  }

  // Render submission form
  return (
    <Container>
      <h1>{t('agency.register.title')}</h1>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="agencyName"><FaBuilding /> {t('agency.register.formFields.agencyName')} *</Label>
          <Input
            type="text"
            id="agencyName"
            name="agencyName"
            value={formData.agencyName}
            onChange={handleInputChange}
            required
            placeholder={t('agency.register.formFields.agencyNamePlaceholder') || 'Enter your agency name'}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description"><FaFileAlt /> {t('agency.register.formFields.description')} *</Label>
          <TextArea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder={t('agency.register.formFields.descriptionPlaceholder') || 'Describe your agency and its services'}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="firstName"><FaUser /> {t('agency.register.formFields.firstName') || 'First Name'} *</Label>
          <Input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            placeholder={t('agency.register.formFields.firstNamePlaceholder') || 'Enter your first name'}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="lastName"><FaUser /> {t('agency.register.formFields.lastName') || 'Last Name'} *</Label>
          <Input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            placeholder={t('agency.register.formFields.lastNamePlaceholder') || 'Enter your last name'}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="dateOfBirth"><FaCalendarAlt /> {t('agency.register.formFields.dateOfBirth') || 'Date of Birth'} *</Label>
          <Input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="country"><FaGlobe /> {t('agency.register.formFields.country') || 'Country'} *</Label>
          <SelectWrapper>
            <CountrySelect
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('agency.register.formFields.countryPlaceholder') || 'Select your country'}</option>
              {countries.map(country => (
                <option key={country.value} value={country.value}>{country.label}</option>
              ))}
            </CountrySelect>
            <SelectIcon>
              <FaChevronDown />
            </SelectIcon>
          </SelectWrapper>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="address"><FaMapMarkerAlt /> {t('agency.register.formFields.address') || 'Address'} *</Label>
          <TextArea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            placeholder={t('agency.register.formFields.addressPlaceholder') || 'Enter your address'}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="contactEmail"><FaEnvelope /> {t('agency.register.formFields.contactEmail')} *</Label>
          <Input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleInputChange}
            required
            placeholder={t('agency.register.formFields.contactEmailPlaceholder') || 'Enter your contact email'}
          />
        </FormGroup>

        <FormGroup>
          <Label><FaIdCard /> {t('agency.register.formFields.identityDocument') || 'Identity Document'} *</Label>
          <FileUploadContainer>
            <FileInput 
              type="file" 
              id="identityDocument" 
              name="identityDocument"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange} 
            />
            <FileInputLabel htmlFor="identityDocument">
              <FaUpload /> {t('agency.register.formFields.uploadIdentity') || 'Upload Identity Document'}
            </FileInputLabel>
            
            <DocumentPreviewContainer>
              {documentPreviews.map(preview => (
                <DocumentPreviewItem key={preview.id}>
                  {preview.type.includes('pdf') ? (
                    <PDFPlaceholder>
                      <FaFileAlt />
                      PDF
                    </PDFPlaceholder>
                  ) : (
                    <img src={preview.preview} alt="Document preview" />
                  )}
                  <RemoveButton onClick={() => removeDocument(preview.id)}>
                    <FaTrash /> 
                  </RemoveButton>
                </DocumentPreviewItem>
              ))}
            </DocumentPreviewContainer>
          </FileUploadContainer>
          <DocumentInstructions>
            {t('agency.register.formFields.identityDocumentInstructions') || 'Please upload a clear image of your identity document (passport, ID card, driver\'s license)'}
          </DocumentInstructions>
          {documentError && <ErrorMessage><FaInfoCircle /> {documentError}</ErrorMessage>}
        </FormGroup>

        <SubmitButton 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="spinner" />
              {t('agency.register.submissionStatus.submitting')}
            </>
          ) : (
            t('agency.register.submissionStatus.idle')
          )}
        </SubmitButton>
      </Form>
    </Container>
  );
};

const Container = styled.div`
  max-width: 650px;
  margin: 1rem auto;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: fadeInAnimation 0.5s ease-out;

  h1 {
    color: #1a2a6c;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    text-align: center;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  animation: fadeInAnimation 0.6s ease-out;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    color: #1a2a6c;
  }
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #1a2a6c;
    box-shadow: 0 2px 15px rgba(26, 42, 108, 0.15);
  }
  
  &:hover {
    border-color: rgba(26, 42, 108, 0.5);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 80px;
  resize: vertical;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #1a2a6c;
    box-shadow: 0 2px 15px rgba(26, 42, 108, 0.15);
  }
  
  &:hover {
    border-color: rgba(26, 42, 108, 0.5);
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231a2a6c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 0.8em;

  &:focus {
    outline: none;
    border-color: #1a2a6c;
    box-shadow: 0 2px 15px rgba(26, 42, 108, 0.15);
  }
  
  &:hover {
    border-color: rgba(26, 42, 108, 0.5);
  }
`;

const FileUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  background: linear-gradient(135deg, #1a2a6c, #2a3a7c);
  color: white;
  padding: 8px 15px;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 180px;
  align-self: center;
  box-shadow: 0 3px 10px rgba(26, 42, 108, 0.3);
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.9rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(26, 42, 108, 0.4);
    background: linear-gradient(135deg, #2a3a7c, #3a4a8c);
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  text-align: center;
  margin-top: 10px;
  padding: 8px 12px;
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  animation: fadeInAnimation 0.3s ease-out;
`;

const DocumentPreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
`;

const DocumentInstructions = styled.p`
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
  font-style: italic;
`;

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const CountrySelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
  appearance: none;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #1a2a6c;
    box-shadow: 0 2px 15px rgba(26, 42, 108, 0.15);
  }
  
  &:hover {
    border-color: rgba(26, 42, 108, 0.5);
  }
`;

const SelectIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #666;
  font-size: 0.8rem;
`;


const DocumentPreviewItem = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: fadeInAnimation 0.5s ease-out;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PDFPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
  flex-direction: column;
  gap: 8px;
  
  svg {
    font-size: 2rem;
    color: #1a2a6c;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(231, 76, 60, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e74c3c;
    transform: scale(1.1);
  }
`;

const SubmitButton = styled.button`
  padding: 0.8rem;
  background: linear-gradient(135deg, #1a2a6c, #2a3a7c);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  box-shadow: 0 3px 10px rgba(26, 42, 108, 0.3);
  margin-top: 0.8rem;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #2a3a7c, #3a4a8c);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(26, 42, 108, 0.4);
  }

  &:disabled {
    background: linear-gradient(135deg, #ccc, #ddd);
    cursor: not-allowed;
    box-shadow: none;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const SubmissionReviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  animation: fadeInAnimation 0.5s ease-out;
`;

const ReviewDetails = styled.div`
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  width: 100%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    margin-bottom: 0.8rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    svg {
      color: #1a2a6c;
    }
  }
`;

const StatusMessage = styled.div`
  padding: 1.2rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  animation: fadeInAnimation 0.5s ease-out;

  ${props => {
    switch (props.$status) {
      case 'in_review':
        return 'background: #fff3cd; color: #856404; border-left: 4px solid #ffc107;';
      case 'approved':
        return 'background: #d4edda; color: #155724; border-left: 4px solid #28a745;';
      case 'rejected':
        return 'background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545;';
      default:
        return '';
    }
  }}
`;

export default RegisterAgencyForm;
