import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'neon-green' | 'cyberpunk-blue';

interface ThemeContextType {
  theme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
  themes: { id: ThemePreset; name: string; description: string; colors: string[] }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themePresets = [
  {
    id: 'neon-green' as ThemePreset,
    name: 'Neon Green',
    description: 'Tema atual com verde neon vibrante',
    colors: ['#a3e635', '#22d3ee', '#a855f7', '#f97316']
  },
  {
    id: 'cyberpunk-blue' as ThemePreset,
    name: 'Cyberpunk Blue',
    description: 'Visual futurista com azul neon intenso',
    colors: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899']
  }
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('dashboard-theme');
    return (saved as ThemePreset) || 'neon-green';
  });

  const setTheme = (newTheme: ThemePreset) => {
    setThemeState(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: themePresets }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
