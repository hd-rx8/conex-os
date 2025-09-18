import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'CNY' | 'INR';

interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string; // e.g., 'pt-BR', 'en-US'
}

export const currencies: Currency[] = [
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro', locale: 'pt-BR' },
  { code: 'USD', symbol: '$', name: 'Dólar Americano', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Iene Japonês', locale: 'ja-JP' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco Suíço', locale: 'de-CH' },
  { code: 'CAD', symbol: 'C$', name: 'Dólar Canadense', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Dólar Australiano', locale: 'en-AU' },
  { code: 'CNY', symbol: '¥', name: 'Yuan Chinês', locale: 'zh-CN' },
  { code: 'INR', symbol: '₹', name: 'Rúpia Indiana', locale: 'en-IN' },
];

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrencyCode: (code: CurrencyCode) => void;
  formatCurrency: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      const storedCode = localStorage.getItem('selected-currency-code') as CurrencyCode;
      return currencies.find(c => c.code === storedCode) || currencies[0]; // Default to BRL
    }
    return currencies[0]; // Default to BRL
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected-currency-code', selectedCurrency.code);
    }
  }, [selectedCurrency]);

  const setSelectedCurrencyCode = (code: CurrencyCode) => {
    const currency = currencies.find(c => c.code === code);
    if (currency) {
      setSelectedCurrency(currency);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(selectedCurrency.locale, {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrencyCode, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};