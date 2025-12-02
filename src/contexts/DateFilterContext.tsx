import React, { createContext, useContext, useState, ReactNode } from 'react';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export type DateFilterPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'max';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateFilterContextType {
  period: DateFilterPeriod;
  dateRange: DateRange;
  setPeriod: (period: DateFilterPeriod) => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

const getDateRangeForPeriod = (period: DateFilterPeriod): DateRange => {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return {
        from: startOfDay(now),
        to: endOfDay(now)
      };
    
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday)
      };
    
    case 'week':
      return {
        from: startOfWeek(now, { weekStartsOn: 0 }),
        to: endOfWeek(now, { weekStartsOn: 0 })
      };
    
    case 'month':
      return {
        from: startOfMonth(now),
        to: endOfMonth(now)
      };
    
    case 'max':
      // Últimos 90 dias
      return {
        from: subDays(now, 90),
        to: endOfDay(now)
      };
    
    default:
      return {
        from: startOfDay(now),
        to: endOfDay(now)
      };
  }
};

export const DateFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [period, setPeriodState] = useState<DateFilterPeriod>('today');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeForPeriod('today'));

  const setPeriod = (newPeriod: DateFilterPeriod) => {
    setPeriodState(newPeriod);
    setDateRange(getDateRangeForPeriod(newPeriod));
  };

  return (
    <DateFilterContext.Provider value={{ period, dateRange, setPeriod }}>
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (context === undefined) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
};
