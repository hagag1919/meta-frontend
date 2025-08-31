import { useState, useEffect, createContext, useContext } from 'react';

export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    projects: 'Projects',
    tasks: 'Tasks',
    users: 'Users',
    companies: 'Companies',
    clients: 'Client Management',
    invoices: 'Invoices',
    reports: 'Reports',
    timeTracking: 'Time Tracking',
    chat: 'Chat',
    settings: 'Settings',
    profile: 'Profile',
    
    // Common actions
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    
    // Settings
    settingsTitle: 'Settings',
    settingsDescription: 'Manage application settings and preferences',
    generalSettings: 'General Settings',
    languageSettings: 'Language & Localization',
    brandingSettings: 'Company Branding',
    userManagement: 'User Management',
    permissionManagement: 'Permission Management',
    
    // Language settings
    yourLanguagePreference: 'Your Language Preference',
    systemDefaultLanguage: 'System Default Language',
    rtlSupport: 'RTL Support',
    rtlSupportDescription: 'Arabic language automatically enables Right-to-Left (RTL) layout. The interface will be mirrored to provide a native Arabic experience.',
    
    // Branding
    companyLogo: 'Company Logo',
    brandColors: 'Brand Colors',
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    preview: 'Preview',
    uploadLogo: 'Upload Logo',
    logoRecommendation: 'Recommended: 200x200px, PNG or JPG, max 5MB',
    
    // User roles
    administrator: 'Administrator',
    developer: 'Developer',
    client: 'Client',
    
    // Status
    active: 'Active',
    inactive: 'Inactive',
    
    // Messages
    settingsUpdated: 'Settings updated successfully!',
    languageUpdated: 'Language preference updated successfully!',
    brandingUpdated: 'Branding updated successfully!',
    logoUploaded: 'Logo uploaded successfully!',
    userRoleUpdated: 'User role updated successfully!',
    errorLoadingSettings: 'Failed to load settings',
    errorUpdatingSettings: 'Failed to update settings'
  },
  
  ar: {
    // Navigation
    dashboard: 'لوحة القيادة',
    projects: 'المشاريع',
    tasks: 'المهام',
    users: 'المستخدمون',
    companies: 'الشركات',
    clients: 'إدارة العملاء',
    invoices: 'الفواتير',
    reports: 'التقارير',
    timeTracking: 'تتبع الوقت',
    chat: 'الدردشة',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    
    // Common actions
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    create: 'إنشاء',
    update: 'تحديث',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    
    // Settings
    settingsTitle: 'الإعدادات',
    settingsDescription: 'إدارة إعدادات التطبيق والتفضيلات',
    generalSettings: 'الإعدادات العامة',
    languageSettings: 'اللغة والترجمة',
    brandingSettings: 'هوية الشركة',
    userManagement: 'إدارة المستخدمين',
    permissionManagement: 'إدارة الصلاحيات',
    
    // Language settings
    yourLanguagePreference: 'تفضيل اللغة الخاص بك',
    systemDefaultLanguage: 'اللغة الافتراضية للنظام',
    rtlSupport: 'دعم الكتابة من اليمين لليسار',
    rtlSupportDescription: 'اللغة العربية تفعل تلقائياً تخطيط الكتابة من اليمين إلى اليسار. سيتم عكس الواجهة لتوفير تجربة عربية أصيلة.',
    
    // Branding
    companyLogo: 'شعار الشركة',
    brandColors: 'ألوان العلامة التجارية',
    primaryColor: 'اللون الأساسي',
    secondaryColor: 'اللون الثانوي',
    preview: 'معاينة',
    uploadLogo: 'رفع الشعار',
    logoRecommendation: 'الموصى به: 200x200 بكسل، PNG أو JPG، حد أقصى 5 ميجابايت',
    
    // User roles
    administrator: 'مدير النظام',
    developer: 'مطور',
    client: 'عميل',
    
    // Status
    active: 'نشط',
    inactive: 'غير نشط',
    
    // Messages
    settingsUpdated: 'تم تحديث الإعدادات بنجاح!',
    languageUpdated: 'تم تحديث تفضيل اللغة بنجاح!',
    brandingUpdated: 'تم تحديث الهوية التجارية بنجاح!',
    logoUploaded: 'تم رفع الشعار بنجاح!',
    userRoleUpdated: 'تم تحديث دور المستخدم بنجاح!',
    errorLoadingSettings: 'فشل تحميل الإعدادات',
    errorUpdatingSettings: 'فشل تحديث الإعدادات'
  }
};

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

