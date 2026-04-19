import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  availableLanguages: Array<{
    code: Language;
    name: string;
    nativeName: string;
    flag: string;
  }>;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const availableLanguages = [
  {
    code: 'en' as Language,
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'hi' as Language,
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳'
  },
  {
    code: 'ur' as Language,
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇵🇰'
  },
  {
    code: 'ks' as Language,
    name: 'Kashmiri',
    nativeName: 'कॉशुर',
    flag: '🏔️'
  },
  {
    code: 'doi' as Language,
    name: 'Dogri',
    nativeName: 'डोगरी',
    flag: '🏔️'
  }
];

// Basic translations for common UI elements
const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    chat: 'Chat Support',
    appointments: 'Appointments',
    resources: 'Resources',
    community: 'Community',
    profile: 'Profile Settings',
    privacy: 'Privacy Settings',
    language: 'Language',
    signOut: 'Sign out',
    notifications: 'Notifications',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    search: 'Search',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    welcome: 'Welcome',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    moodCheckIn: 'Mood Check-in',
    quickActions: 'Quick Actions',
    recentActivity: 'Recent Activity',
    mentalHealthScreening: 'Mental Health Screening',
    bookSession: 'Book Session',
    browseResources: 'Browse Resources',
    joinCommunity: 'Join Community',
    howFeelingToday: 'How are you feeling today?',
    submitMood: 'Submit Mood',
    bookAppointment: 'Book Appointment',
    chatSupport: 'Chat Support',
    takePHQGAD: 'Take PHQ-9, GAD-7 assessments',
    talkToAI: 'Talk to our AI assistant',
    scheduleWithCounselor: 'Schedule with a counselor',
    educationalContent: 'Educational content library',
    connectPeerSupport: 'Connect with peer support'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    chat: 'चैट सहायता',
    appointments: 'अपॉइंटमेंट',
    resources: 'संसाधन',
    community: 'समुदाय',
    profile: 'प्रोफ़ाइल सेटिंग्स',
    privacy: 'गोपनीयता सेटिंग्स',
    language: 'भाषा',
    signOut: 'साइन आउट',
    notifications: 'सूचनाएं',
    settings: 'सेटिंग्स',
    help: 'मदद',
    about: 'के बारे में',
    search: 'खोजें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    welcome: 'स्वागत है',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    moodCheckIn: 'मूड चेक-इन',
    quickActions: 'त्वरित कार्य',
    recentActivity: 'हाल की गतिविधि',
    mentalHealthScreening: 'मानसिक स्वास्थ्य जांच',
    bookSession: 'सेशन बुक करें',
    browseResources: 'संसाधन देखें',
    joinCommunity: 'समुदाय में शामिल हों',
    howFeelingToday: 'आज आप कैसा महसूस कर रहे हैं?',
    submitMood: 'मूड सबमिट करें',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    chatSupport: 'चैट सहायता',
    takePHQGAD: 'PHQ-9, GAD-7 आकलन लें',
    talkToAI: 'हमारे AI असिस्टेंट से बात करें',
    scheduleWithCounselor: 'काउंसलर के साथ समय निर्धारित करें',
    educationalContent: 'शिक्षा सामग्री लाइब्रेरी',
    connectPeerSupport: 'साथी सहायता से जुड़ें'
  },
  ur: {
    dashboard: 'ڈیش بورڈ',
    chat: 'چیٹ سپورٹ',
    appointments: 'اپائنٹمنٹس',
    resources: 'وسائل',
    community: 'کمیونٹی',
    profile: 'پروفائل سیٹنگز',
    privacy: 'پرائیویسی سیٹنگز',
    language: 'زبان',
    signOut: 'سائن آؤٹ',
    notifications: 'نوٹیفیکیشنز',
    settings: 'سیٹنگز',
    help: 'مدد',
    about: 'کے بارے میں',
    search: 'تلاش کریں',
    cancel: 'منسوخ',
    save: 'محفوظ کریں',
    edit: 'ترمیم',
    delete: 'حذف کریں',
    welcome: 'خوش آمدید',
    loading: 'لوڈ ہو رہا ہے...',
    error: 'خرابی',
    success: 'کامیابی',
    moodCheckIn: 'موڈ چیک-ان',
    quickActions: 'فوری اعمال',
    recentActivity: 'حالیہ سرگرمی',
    mentalHealthScreening: 'ذہنی صحت کی جانچ',
    bookSession: 'سیشن بک کریں',
    browseResources: 'وسائل دیکھیں',
    joinCommunity: 'کمیونٹی میں شامل ہوں',
    howFeelingToday: 'آج آپ کیسا محسوس کر رہے ہیں؟',
    submitMood: 'موڈ جمع کریں',
    bookAppointment: 'اپائنٹمنٹ بک کریں',
    chatSupport: 'چیٹ سپورٹ',
    takePHQGAD: 'PHQ-9, GAD-7 تشخیص لیں',
    talkToAI: 'ہمارے AI اسسٹنٹ سے بات کریں',
    scheduleWithCounselor: 'کاؤنسلر کے ساتھ وقت مقرر کریں',
    educationalContent: 'تعلیمی مواد کی لائبریری',
    connectPeerSupport: 'ساتھی سپورٹ سے جڑیں'
  },
  ks: {
    dashboard: 'ڈیش بورڈ',
    chat: 'چیٹ مدد',
    appointments: 'ملاقات',
    resources: 'وسائل',
    community: 'برادری',
    profile: 'پروفائل سیٹنگ',
    privacy: 'رازداری سیٹنگ',
    language: 'زبان',
    signOut: 'سائن آؤٹ',
    notifications: 'اطلاعات',
    settings: 'سیٹنگ',
    help: 'مدد',
    about: 'بارے میں',
    search: 'تلاش',
    cancel: 'منسوخ',
    save: 'محفوظ کرو',
    edit: 'ترمیم',
    delete: 'حذف',
    welcome: 'خوش آمدید',
    loading: 'لوڈ کران...',
    error: 'خرابی',
    success: 'کامیابی',
    moodCheckIn: 'موڈ چیک کرن',
    quickActions: 'فوری کام',
    recentActivity: 'حالیہ سرگرمی',
    mentalHealthScreening: 'ذہنی صحت جانچ',
    bookSession: 'سیشن بک کرو',
    browseResources: 'وسائل دیکھو',
    joinCommunity: 'برادری میں شامل',
    howFeelingToday: 'اج تسی کیا محسوس کران؟',
    submitMood: 'موڈ جمع کرو',
    bookAppointment: 'ملاقات بک کرو',
    chatSupport: 'چیٹ مدد',
    takePHQGAD: 'PHQ-9, GAD-7 جانچ کرو',
    talkToAI: 'اسہ AI مددگار نال گل کرو',
    scheduleWithCounselor: 'مشاور نال وقت رکھو',
    educationalContent: 'تعلیمی مواد',
    connectPeerSupport: 'ساتھی مدد نال جڑو'
  },
  doi: {
    dashboard: 'ڈیش بورڈ',
    chat: 'چیٹ مدد',
    appointments: 'ملاقات',
    resources: 'وسائل',
    community: 'برادری',
    profile: 'پروفائل سیٹنگ',
    privacy: 'رازداری سیٹنگ',
    language: 'بولی',
    signOut: 'سائن آؤٹ',
    notifications: 'اطلاعات',
    settings: 'سیٹنگ',
    help: 'مدد',
    about: 'بارے',
    search: 'لبھو',
    cancel: 'رد',
    save: 'بچاؤ',
    edit: 'بدلو',
    delete: 'مٹاؤ',
    welcome: 'جی آیاں نوں',
    loading: 'لوڈ اودا...',
    error: 'خرابی',
    success: 'کامیابی',
    moodCheckIn: 'موڈ چیک',
    quickActions: 'جلدی کام',
    recentActivity: 'نویں گتی',
    mentalHealthScreening: 'مانسک صحت جانچ',
    bookSession: 'سیشن بک کرو',
    browseResources: 'وسائل دیکھو',
    joinCommunity: 'برادری وچ آؤ',
    howFeelingToday: 'اج تسی کیا محسوس کرا؟',
    submitMood: 'موڈ جمع کرو',
    bookAppointment: 'ملاقات بک کرو',
    chatSupport: 'چیٹ مدد',
    takePHQGAD: 'PHQ-9, GAD-7 جانچ کرو',
    talkToAI: 'ساڈے AI مددگار نال گل کرو',
    scheduleWithCounselor: 'کاؤنسلر نال وقت رکھو',
    educationalContent: 'پڑھائی دا مال',
    connectPeerSupport: 'برابری دی مدد نال جڑو'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('neonexus-language') as Language;
    if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLanguage = navigator.language.split('-')[0] as Language;
      if (availableLanguages.some(lang => lang.code === browserLanguage)) {
        setCurrentLanguage(browserLanguage);
      }
    }
  }, []);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('neonexus-language', language);
    
    // Update document direction for RTL languages
    const rtlLanguages: Language[] = ['ur', 'ks'];
    document.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  };

  // Translation function
  const t = (key: string, fallback?: string): string => {
    return translations[currentLanguage]?.[key] || fallback || key;
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage,
    availableLanguages,
    t
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};