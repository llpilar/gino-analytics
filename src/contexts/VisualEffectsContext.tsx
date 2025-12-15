import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface VisualEffectsContextType {
  premiumEffects: boolean;
  setPremiumEffects: (value: boolean) => void;
}

const VisualEffectsContext = createContext<VisualEffectsContextType | undefined>(undefined);

export const VisualEffectsProvider = ({ children }: { children: ReactNode }) => {
  const [premiumEffects, setPremiumEffectsState] = useState(() => {
    const stored = localStorage.getItem("premiumEffects");
    return stored !== null ? JSON.parse(stored) : true;
  });

  const setPremiumEffects = (value: boolean) => {
    setPremiumEffectsState(value);
    localStorage.setItem("premiumEffects", JSON.stringify(value));
  };

  useEffect(() => {
    const stored = localStorage.getItem("premiumEffects");
    if (stored !== null) {
      setPremiumEffectsState(JSON.parse(stored));
    }
  }, []);

  return (
    <VisualEffectsContext.Provider value={{ premiumEffects, setPremiumEffects }}>
      {children}
    </VisualEffectsContext.Provider>
  );
};

export const useVisualEffects = () => {
  const context = useContext(VisualEffectsContext);
  if (!context) {
    throw new Error("useVisualEffects must be used within a VisualEffectsProvider");
  }
  return context;
};
