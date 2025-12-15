import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'cyber-neon' | 'clean-blue';

interface ThemeContextType {
  theme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
  themes: { id: ThemePreset; name: string; description: string; colors: string[] }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themePresets = [
  {
    id: 'cyber-neon' as ThemePreset,
    name: 'Cyber Neon',
    description: 'Verde neon futurista com toques de ciano',
    colors: ['#00ff88', '#00d4ff', '#0a0a0f', '#1a1a2e']
  },
  {
    id: 'clean-blue' as ThemePreset,
    name: 'Clean Blue',
    description: 'Visual limpo e profissional com azul corporativo',
    colors: ['#0477d1', '#edf6fc', '#ffffff', '#222222']
  }
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('dashboard-theme');
    return (saved as ThemePreset) || 'cyber-neon';
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
