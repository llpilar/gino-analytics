import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'neon-green' | 'netflix-red' | 'twitter-blue' | 'minimal-neutral' | 'purple-modern' | 'orange-bold' | 'dark-blue' | 'emerald-green';

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
    id: 'netflix-red' as ThemePreset,
    name: 'Netflix Red',
    description: 'Visual escuro com vermelho vibrante estilo Netflix',
    colors: ['#e50914', '#ffffff', '#1a1a1a', '#000000']
  },
  {
    id: 'twitter-blue' as ThemePreset,
    name: 'Twitter Blue',
    description: 'Visual clean inspirado no X/Twitter',
    colors: ['#1da1f2', '#00b87a', '#f7b928', '#e0245e']
  },
  {
    id: 'minimal-neutral' as ThemePreset,
    name: 'Minimal Neutral',
    description: 'Estilo minimalista com tons neutros e azul',
    colors: ['#171717', '#3a81f6', '#91c5ff', '#e5e5e5']
  },
  {
    id: 'purple-modern' as ThemePreset,
    name: 'Purple Modern',
    description: 'Visual moderno com roxo vibrante e verde',
    colors: ['#7033ff', '#4ac885', '#fd822b', '#3276e4']
  },
  {
    id: 'orange-bold' as ThemePreset,
    name: 'Orange Bold',
    description: 'Tema vibrante com laranja e azul elétrico',
    colors: ['#ff5600', '#000ce1', '#00da00', '#f4f3ec']
  },
  {
    id: 'dark-blue' as ThemePreset,
    name: 'Dark Blue',
    description: 'Tema escuro com azul profundo e ciano',
    colors: ['#1e40af', '#06b6d4', '#0f172a', '#e2e8f0']
  },
  {
    id: 'emerald-green' as ThemePreset,
    name: 'Emerald Green',
    description: 'Tema escuro com verde esmeralda vibrante',
    colors: ['#10b981', '#34d399', '#022c22', '#d1fae5']
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
