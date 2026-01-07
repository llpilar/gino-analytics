import { createContext, useContext, useState, ReactNode } from "react";

export type RefreshInterval = 5000 | 10000 | 30000 | 60000;

interface DashboardSettingsContextType {
  refreshInterval: RefreshInterval;
  setRefreshInterval: (value: RefreshInterval) => void;
}

const DashboardSettingsContext = createContext<DashboardSettingsContextType | undefined>(undefined);

export const DashboardSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [refreshInterval, setRefreshIntervalState] = useState<RefreshInterval>(() => {
    const stored = localStorage.getItem("refreshInterval");
    return stored !== null ? JSON.parse(stored) : 30000;
  });

  const setRefreshInterval = (value: RefreshInterval) => {
    setRefreshIntervalState(value);
    localStorage.setItem("refreshInterval", JSON.stringify(value));
  };

  return (
    <DashboardSettingsContext.Provider value={{ 
      refreshInterval, 
      setRefreshInterval
    }}>
      {children}
    </DashboardSettingsContext.Provider>
  );
};

export const useDashboardSettings = () => {
  const context = useContext(DashboardSettingsContext);
  if (!context) {
    throw new Error("useDashboardSettings must be used within a DashboardSettingsProvider");
  }
  return context;
};
