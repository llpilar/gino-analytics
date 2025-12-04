import React, { createContext, useContext, useState, ReactNode } from 'react';
import { startOfDay, endOfDay } from 'date-fns';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateFilterContextType {
  dateRange: DateRange;
  setCustomRange: (from: Date | undefined, to: Date | undefined) => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export const DateFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });

  const setCustomRange = (from: Date | undefined, to: Date | undefined) => {
    setDateRange({
      from: from ? startOfDay(from) : undefined,
      to: to ? endOfDay(to) : undefined
    });
  };

  return (
    <DateFilterContext.Provider value={{ dateRange, setCustomRange }}>
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
