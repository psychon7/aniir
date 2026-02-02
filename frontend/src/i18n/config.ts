import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Supported languages
// Note: Only languages with translation files in /locales are supported
// Available: en (English), fr (French), zh (Chinese)
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'zh'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Fallback language
export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

// Namespaces for organizing translations
export const NAMESPACES = [
  'common',
  'navigation',
  'auth',
  'clients',
  'suppliers',
  'products',
  'quotes',
  'orders',
  'invoices',
  'inventory',
  'landedCost',
  'settings',
  'validation',
  'errors',
  'notifications',
] as const;

export type Namespace = typeof NAMESPACES[number];

// Default namespace
export const DEFAULT_NAMESPACE: Namespace = 'common';

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  zh: '中文',
};

// Language flags (emoji)
export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  zh: '🇨🇳',
};

// Date format locales
export const DATE_LOCALES: Record<SupportedLanguage, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  zh: 'zh-CN',
};

// Number format locales
export const NUMBER_LOCALES: Record<SupportedLanguage, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  zh: 'zh-CN',
};

// Currency format options by language
export const CURRENCY_FORMATS: Record<SupportedLanguage, Intl.NumberFormatOptions> = {
  en: { style: 'currency', currency: 'EUR', currencyDisplay: 'symbol' },
  fr: { style: 'currency', currency: 'EUR', currencyDisplay: 'symbol' },
  zh: { style: 'currency', currency: 'CNY', currencyDisplay: 'symbol' },
};

// Initialize i18next
i18n
  // Load translations from backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize configuration
  .init({
    // Fallback language
    fallbackLng: FALLBACK_LANGUAGE,
    
    // Supported languages
    supportedLngs: SUPPORTED_LANGUAGES,
    
    // Default namespace
    defaultNS: DEFAULT_NAMESPACE,
    
    // Namespaces to load
    ns: NAMESPACES,
    
    // Debug mode (disable in production)
    debug: import.meta.env.DEV,
    
    // Interpolation options
    interpolation: {
      // React already escapes values
      escapeValue: false,
      
      // Format function for dates, numbers, etc.
      format: (value, format, lng) => {
        if (value instanceof Date) {
          return formatDate(value, format, lng as SupportedLanguage);
        }
        if (typeof value === 'number') {
          return formatNumber(value, format, lng as SupportedLanguage);
        }
        return value;
      },
    },
    
    // Backend options for loading translations
    backend: {
      // Path to translation files
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      
      // Add timestamp to prevent caching during development
      queryStringParams: import.meta.env.DEV 
        ? { v: Date.now().toString() } 
        : undefined,
    },
    
    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Cache user language in localStorage
      caches: ['localStorage'],
      
      // localStorage key
      lookupLocalStorage: 'erp_language',
      
      // Check whitelist
      checkWhitelist: true,
    },
    
    // React options
    react: {
      // Use Suspense for loading translations
      useSuspense: true,
      
      // Bind i18n instance to all components
      bindI18n: 'languageChanged loaded',
      
      // Bind i18n store to all components
      bindI18nStore: 'added removed',
      
      // Trans component options
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'span'],
    },
    
    // Missing key handling
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (import.meta.env.DEV) {
        console.warn(`Missing translation: [${lngs.join(', ')}] ${ns}:${key}`);
      }
    },
    
    // Return empty string for missing keys in production
    returnEmptyString: false,
    returnNull: false,
  });

// Helper function to format dates
function formatDate(
  date: Date, 
  format: string | undefined, 
  lng: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  const locale = DATE_LOCALES[lng] || DATE_LOCALES[DEFAULT_LANGUAGE];
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString(locale, { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    case 'long':
      return date.toLocaleDateString(locale, { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    case 'datetime':
      return date.toLocaleString(locale, { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'time':
      return date.toLocaleTimeString(locale, { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    case 'relative':
      return formatRelativeTime(date, lng);
    default:
      return date.toLocaleDateString(locale);
  }
}

// Helper function to format relative time
function formatRelativeTime(date: Date, lng: SupportedLanguage): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const rtf = new Intl.RelativeTimeFormat(DATE_LOCALES[lng], { numeric: 'auto' });
  
  if (diffDays > 0) return rtf.format(-diffDays, 'day');
  if (diffHours > 0) return rtf.format(-diffHours, 'hour');
  if (diffMins > 0) return rtf.format(-diffMins, 'minute');
  return rtf.format(-diffSecs, 'second');
}

// Helper function to format numbers
function formatNumber(
  value: number, 
  format: string | undefined, 
  lng: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  const locale = NUMBER_LOCALES[lng] || NUMBER_LOCALES[DEFAULT_LANGUAGE];
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(locale, CURRENCY_FORMATS[lng]).format(value);
    case 'percent':
      return new Intl.NumberFormat(locale, { 
        style: 'percent', 
        minimumFractionDigits: 2 
      }).format(value / 100);
    case 'decimal':
      return new Intl.NumberFormat(locale, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(value);
    case 'integer':
      return new Intl.NumberFormat(locale, { 
        maximumFractionDigits: 0 
      }).format(value);
    case 'compact':
      return new Intl.NumberFormat(locale, { 
        notation: 'compact' 
      }).format(value);
    default:
      return new Intl.NumberFormat(locale).format(value);
  }
}

export default i18n;
