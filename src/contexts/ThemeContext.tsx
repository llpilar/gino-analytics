import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'neon-green' | 'liquid-glass' | 'twitter-blue';

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
    description: 'Estilo Apple com efeito de vidro líquido',
    colors: ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
  },
  {
    id: 'twitter-blue' as ThemePreset,
    name: 'Twitter Blue',
    description: 'Visual clean inspirado no X/Twitter',
    colors: ['#1da1f2', '#00b87a', '#f7b928', '#e0245e']
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
