import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Language,
  CalendarSystem,
  translations,
} from '@/locales/translations';
import {
  formatCalendarDate,
  toEthiopianDate,
  PRESET_ETHIOPIAN_ACADEMIC_YEARS,
  AcademicYearOption,
} from '@/lib/ethiopianCalendar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  calendarSystem: CalendarSystem;
  setCalendarSystem: (cal: CalendarSystem) => void;
  t: (key: keyof typeof translations.en | string, fallback?: string) => string;
  formatDate: (
    dateInput: Date | string | null | undefined,
    options?: { includeTime?: boolean; short?: boolean }
  ) => string;
  currentEthiopianYear: number;
  ethiopianYearOptions: AcademicYearOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'en';
  });

  const [calendarSystem, setCalendarSystemState] = useState<CalendarSystem>(() => {
    return (localStorage.getItem('app_calendar') as CalendarSystem) || 'dual';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    document.documentElement.lang = lang;
  }, []);

  const setCalendarSystem = useCallback((cal: CalendarSystem) => {
    setCalendarSystemState(cal);
    localStorage.setItem('app_calendar', cal);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: keyof typeof translations.en | string, fallback?: string): string => {
      const dict = translations[language] || translations.en;
      const val = (dict as any)[key];
      if (val !== undefined) return val;
      const enVal = (translations.en as any)[key];
      if (enVal !== undefined) return enVal;
      return fallback || key;
    },
    [language]
  );

  const formatDate = useCallback(
    (
      dateInput: Date | string | null | undefined,
      options: { includeTime?: boolean; short?: boolean } = {}
    ): string => {
      return formatCalendarDate(dateInput, {
        locale: language,
        calendar: calendarSystem,
        includeTime: options.includeTime,
        short: options.short,
      });
    },
    [language, calendarSystem]
  );

  const currentEthiopianYear = toEthiopianDate(new Date()).year;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        calendarSystem,
        setCalendarSystem,
        t,
        formatDate,
        currentEthiopianYear,
        ethiopianYearOptions: PRESET_ETHIOPIAN_ACADEMIC_YEARS,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
