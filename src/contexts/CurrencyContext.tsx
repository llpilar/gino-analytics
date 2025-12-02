import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'COP' | 'BRL';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (value: number) => string;
  convertValue: (value: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const COP_TO_BRL_RATE = 0.0014;

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>('COP');

  const convertValue = (value: number): number => {
    if (currency === 'BRL') {
      return value * COP_TO_BRL_RATE;
    }
    return value;
  };

  const formatCurrency = (value: number): string => {
    const convertedValue = convertValue(value);
    
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(convertedValue);
    }
    
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertedValue).replace('COP', '$');
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, convertValue }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
