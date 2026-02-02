import React, { Suspense, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../config';

interface LanguageProviderProps {
  children: React.ReactNode;
  /** Optional loading component while translations load */
  fallback?: React.ReactNode;
}

/**
 * Provider component that wraps the app with i18n context
 */
export function LanguageProvider({ 
  children, 
  fallback = <LanguageLoadingFallback /> 
}: LanguageProviderProps) {
  // Set document language attribute on mount and language change
  useEffect(() => {
    const updateDocumentLang = () => {
      document.documentElement.lang = i18n.language;
    };
    
    updateDocumentLang();
    i18n.on('languageChanged', updateDocumentLang);
    
    return () => {
      i18n.off('languageChanged', updateDocumentLang);
    };
  }, []);
  
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </I18nextProvider>
  );
}

/**
 * Default loading fallback while translations are loading
 */
function LanguageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
