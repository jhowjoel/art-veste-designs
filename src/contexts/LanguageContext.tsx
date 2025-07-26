import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt-BR' | 'en-US' | 'de-DE' | 'es-ES';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
  country: string;
}

export const languages: LanguageOption[] = [
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷', country: 'Brasil' },
  { code: 'en-US', name: 'English', flag: '🇺🇸', country: 'Estados Unidos' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪', country: 'Alemanha' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸', country: 'Espanha' },
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred-language');
    return (saved as Language) || 'pt-BR';
  });

  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const module = await import(`../translations/${currentLanguage}.ts`);
        setTranslations(module.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to Portuguese if translation fails
        const fallbackModule = await import('../translations/pt-BR.ts');
        setTranslations(fallbackModule.default);
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred-language', language);
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};