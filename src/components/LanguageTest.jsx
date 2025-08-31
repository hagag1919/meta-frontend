import React from 'react'
import { useTranslation } from '../utils/i18n.jsx'

const LanguageTest = () => {
  const { t, changeLanguage, currentLanguage } = useTranslation()

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">{t('settingsTitle')}</h2>
      <p>{t('settingsDescription')}</p>
      
      <div className="flex space-x-4">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-4 py-2 rounded ${
            currentLanguage === 'en' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('ar')}
          className={`px-4 py-2 rounded ${
            currentLanguage === 'ar' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          العربية
        </button>
      </div>
      
      <div className="space-y-2">
        <p><strong>Dashboard:</strong> {t('dashboard')}</p>
        <p><strong>Projects:</strong> {t('projects')}</p>
        <p><strong>Save:</strong> {t('save')}</p>
        <p><strong>Cancel:</strong> {t('cancel')}</p>
        <p><strong>Administrator:</strong> {t('administrator')}</p>
      </div>
      
      <div className="text-sm text-gray-600">
        Current Language: {currentLanguage}
        <br />
        Direction: {document.documentElement.getAttribute('dir')}
      </div>
    </div>
  )
}

export default LanguageTest
