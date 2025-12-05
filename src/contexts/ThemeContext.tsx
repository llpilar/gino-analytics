import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeVariant = "neon" | "glass";

interface ThemeContextType {
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeVariant>(() => {
    const saved = localStorage.getItem("dashboard-theme");
    return (saved as ThemeVariant) || "neon";
  });

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
    
    // Remove previous theme class and add new one
    document.documentElement.classList.remove("theme-neon", "theme-glass");
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
