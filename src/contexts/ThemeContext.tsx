import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'neon-green' | 'liquid-glass';

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
    description: 'Tema escuro com verde neon vibrante',
    colors: ['#a3e635', '#22d3ee', '#a855f7', '#f97316']
  },
  {
    id: 'liquid-glass' as ThemePreset,
    name: 'Liquid Glass',
    description: 'Visual elegante com efeito de vidro líquido',
    colors: ['#7dd3fc', '#a78bfa', '#5eead4', '#f0abfc']
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
