import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';

const LanguageContainer = styled.div`
  position: relative;
  display: inline-block;
  height: 40px;
`;

const LanguageButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  border-radius: 50px;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  height: 40px;
  min-width: 120px;
  font-weight: 500;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: white;
  }
`;

const LanguageDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  z-index: 100;
  min-width: 150px;
  display: ${props => (props.isOpen ? 'block' : 'none')};
`;

const LanguageOption = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &.active {
    font-weight: bold;
    color: #1a2a6c;
    background-color: #f0f0f0;
  }
`;

// Available languages
 // Uncomment these as translations become available
const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  //{ code: 'it', name: 'Italiano' },
  // { code: 'pt', name: 'Português' },
  // { code: 'es', name: 'Español' },
  // { code: 'de', name: 'Deutsch' },
  // { code: 'zh', name: '中文' },
  // { code: 'ja', name: '日本語' },
  // { code: 'ko', name: '한국어' },
  // { code: 'ru', name: 'Русский' },
  // { code: 'ar', name: 'العربية' }
];

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { i18n, t } = useTranslation();
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    // Save language preference to localStorage
    localStorage.setItem('i18nextLng', langCode);
  };
  
  // Get current language
  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  return (
    <LanguageContainer>
      <LanguageButton onClick={toggleDropdown}>
        <FaGlobe /> {t(`language.${currentLang.code}`)}
      </LanguageButton>
      
      <LanguageDropdown isOpen={isOpen}>
        {languages.map(lang => (
          <LanguageOption
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'active' : ''}
          >
            {t(`language.${lang.code}`)}
          </LanguageOption>
        ))}
      </LanguageDropdown>
    </LanguageContainer>
  );
};

export default LanguageSelector;
