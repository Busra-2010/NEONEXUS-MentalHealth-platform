import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageSelectorProps {
  showInDropdown?: boolean;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  showInDropdown = false, 
  className = '' 
}) => {
  const { currentLanguage, setLanguage, availableLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  if (showInDropdown) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Globe className="w-4 h-4 mr-3" />
          <span className="flex-1 text-left">{t('language', 'Language')}</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs">{currentLang?.flag}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute left-full top-0 ml-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              {t('language', 'Select Language')}
            </div>
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  setLanguage(language.code);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-lg mr-3">{language.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">{language.nativeName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{language.name}</div>
                </div>
                {currentLanguage === language.code && (
                  <Check className="w-4 h-4 text-neon-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Standalone button version
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
        title={t('language', 'Language')}
      >
        <Globe className="w-5 h-5" />
        <span className="text-lg">{currentLang?.flag}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            {t('language', 'Select Language')}
          </div>
          {availableLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                setLanguage(language.code);
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-xl mr-3">{language.flag}</span>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 dark:text-white">{language.nativeName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{language.name}</div>
              </div>
              {currentLanguage === language.code && (
                <Check className="w-4 h-4 text-neon-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;