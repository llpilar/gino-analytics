import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type RefreshInterval = 5000 | 10000 | 30000 | 60000;
export type ViewMode = "normal" | "compact" | "combined";

interface DashboardSettingsContextType {
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
  refreshInterval: RefreshInterval;
  setRefreshInterval: (value: RefreshInterval) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
}

const DashboardSettingsContext = createContext<DashboardSettingsContextType | undefined>(undefined);

export const DashboardSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("viewMode");
    return stored !== null ? JSON.parse(stored) : "combined";
  });

  // compactMode is derived from viewMode for backwards compatibility
  const compactMode = viewMode === "compact" || viewMode === "combined";

  const [refreshInterval, setRefreshIntervalState] = useState<RefreshInterval>(() => {
    const stored = localStorage.getItem("refreshInterval");
    return stored !== null ? JSON.parse(stored) : 30000;
  });

  const setCompactMode = (value: boolean) => {
    // Legacy support - converts boolean to viewMode
    setViewModeState(value ? "compact" : "normal");
    localStorage.setItem("viewMode", JSON.stringify(value ? "compact" : "normal"));
  };

  const setViewMode = (value: ViewMode) => {
    setViewModeState(value);
    localStorage.setItem("viewMode", JSON.stringify(value));
  };

  const setRefreshInterval = (value: RefreshInterval) => {
    setRefreshIntervalState(value);
    localStorage.setItem("refreshInterval", JSON.stringify(value));
  };

  return (
    <DashboardSettingsContext.Provider value={{ 
      compactMode, 
      setCompactMode, 
      refreshInterval, 
      setRefreshInterval,
      viewMode,
      setViewMode
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
