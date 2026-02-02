import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_NAMES, 
  LANGUAGE_FLAGS,
  type SupportedLanguage 
} from '../config';

export interface UseLanguageReturn {
  /** Current language code */
  currentLanguage: SupportedLanguage;
  /** Change the current language */
  changeLanguage: (lng: SupportedLanguage) => Promise<void>;
  /** List of supported languages with metadata */
  languages: Array<{
    code: SupportedLanguage;
    name: string;
    flag: string;
    isActive: boolean;
  }>;
  /** Check if a language is supported */
  isSupported: (lng: string) => lng is SupportedLanguage;
}

export function useLanguage(): UseLanguageReturn {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.language as SupportedLanguage;
  
  const changeLanguage = useCallback(async (lng: SupportedLanguage) => {
    if (SUPPORTED_LANGUAGES.includes(lng)) {
      await i18n.changeLanguage(lng);
      // Update document direction for RTL languages (future support)
      document.documentElement.lang = lng;
    }
  }, [i18n]);
  
  const languages = SUPPORTED_LANGUAGES.map((code) => ({
    code,
    name: LANGUAGE_NAMES[code],
    flag: LANGUAGE_FLAGS[code],
    isActive: code === currentLanguage,
  }));
  
  const isSupported = useCallback((lng: string): lng is SupportedLanguage => {
    return SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage);
  }, []);
  
  return {
    currentLanguage,
    changeLanguage,
    languages,
    isSupported,
  };
}
