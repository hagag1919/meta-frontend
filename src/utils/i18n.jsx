import { useState, useEffect, createContext, useContext } from 'react';
import { translations } from './i18n.js';
// Using translations provided by i18n.js

const LocalizationContext = createContext();

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('language');
  return savedLanguage || 'en';
};

export const LocalizationProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LocalizationContext.Provider value={{ t, changeLanguage, currentLanguage: language }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useTranslation = () => {
  return useContext(LocalizationContext);
};

