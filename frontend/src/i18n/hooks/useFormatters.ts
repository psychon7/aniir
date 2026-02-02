import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  DATE_LOCALES, 
  NUMBER_LOCALES, 
  CURRENCY_FORMATS,
  DEFAULT_LANGUAGE,
  type SupportedLanguage 
} from '../config';

export interface UseFormattersReturn {
  /** Format a date */
  formatDate: (date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  /** Format a date as short (DD/MM/YYYY) */
  formatDateShort: (date: Date | string | null | undefined) => string;
  /** Format a date as long (January 1, 2024) */
  formatDateLong: (date: Date | string | null | undefined) => string;
  /** Format a datetime */
  formatDateTime: (date: Date | string | null | undefined) => string;
  /** Format relative time (2 hours ago) */
  formatRelativeTime: (date: Date | string | null | undefined) => string;
  /** Format a number */
  formatNumber: (value: number | null | undefined, options?: Intl.NumberFormatOptions) => string;
  /** Format as currency */
  formatCurrency: (value: number | null | undefined, currency?: string) => string;
  /** Format as percentage */
  formatPercent: (value: number | null | undefined) => string;
  /** Format as compact number (1.2K, 3.4M) */
  formatCompact: (value: number | null | undefined) => string;
  /** Current locale */
  locale: string;
}

export function useFormatters(): UseFormattersReturn {
  const { i18n } = useTranslation();
  const lng = (i18n.language || DEFAULT_LANGUAGE) as SupportedLanguage;
  
  const dateLocale = DATE_LOCALES[lng] || DATE_LOCALES[DEFAULT_LANGUAGE];
  const numberLocale = NUMBER_LOCALES[lng] || NUMBER_LOCALES[DEFAULT_LANGUAGE];
  const currencyFormat = CURRENCY_FORMATS[lng] || CURRENCY_FORMATS[DEFAULT_LANGUAGE];
  
  const parseDate = useCallback((date: Date | string | null | undefined): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }, []);
  
  const formatDate = useCallback((
    date: Date | string | null | undefined, 
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const parsed = parseDate(date);
    if (!parsed) return '-';
    return parsed.toLocaleDateString(dateLocale, options);
  }, [dateLocale, parseDate]);
  
  const formatDateShort = useCallback((date: Date | string | null | undefined): string => {
    return formatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [formatDate]);
  
  const formatDateLong = useCallback((date: Date | string | null | undefined): string => {
    return formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' });
  }, [formatDate]);
  
  const formatDateTime = useCallback((date: Date | string | null | undefined): string => {
    return formatDate(date, { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [formatDate]);
  
  const formatRelativeTime = useCallback((date: Date | string | null | undefined): string => {
    const parsed = parseDate(date);
    if (!parsed) return '-';
    
    const now = new Date();
    const diffMs = now.getTime() - parsed.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    const rtf = new Intl.RelativeTimeFormat(dateLocale, { numeric: 'auto' });
    
    if (Math.abs(diffDays) > 0) return rtf.format(-diffDays, 'day');
    if (Math.abs(diffHours) > 0) return rtf.format(-diffHours, 'hour');
    if (Math.abs(diffMins) > 0) return rtf.format(-diffMins, 'minute');
    return rtf.format(-diffSecs, 'second');
  }, [dateLocale, parseDate]);
  
  const formatNumber = useCallback((
    value: number | null | undefined, 
    options?: Intl.NumberFormatOptions
  ): string => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat(numberLocale, options).format(value);
  }, [numberLocale]);
  
  const formatCurrency = useCallback((
    value: number | null | undefined, 
    currency?: string
  ): string => {
    if (value === null || value === undefined) return '-';
    const options = currency 
      ? { ...currencyFormat, currency } 
      : currencyFormat;
    return new Intl.NumberFormat(numberLocale, options).format(value);
  }, [numberLocale, currencyFormat]);
  
  const formatPercent = useCallback((value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat(numberLocale, { 
      style: 'percent', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  }, [numberLocale]);
  
  const formatCompact = useCallback((value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat(numberLocale, { 
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  }, [numberLocale]);
  
  return useMemo(() => ({
    formatDate,
    formatDateShort,
    formatDateLong,
    formatDateTime,
    formatRelativeTime,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatCompact,
    locale: dateLocale,
  }), [
    formatDate,
    formatDateShort,
    formatDateLong,
    formatDateTime,
    formatRelativeTime,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatCompact,
    dateLocale,
  ]);
}
