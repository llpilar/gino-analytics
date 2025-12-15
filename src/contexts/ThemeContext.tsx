import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'cyber-neon' | 'clean-blue' | 'royal-blue';

interface ThemeContextType {
  theme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
  themes: { id: ThemePreset; name: string; description: string; colors: string[]; supportsDarkMode?: boolean }[];
  isDarkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themePresets = [
  {
    id: 'cyber-neon' as ThemePreset,
    name: 'Cyber Neon',
    description: 'Verde neon futurista com toques de ciano',
    colors: ['#00ff88', '#00d4ff', '#0a0a0f', '#1a1a2e'],
    supportsDarkMode: false
  },
  {
    id: 'clean-blue' as ThemePreset,
    name: 'Clean Blue',
    description: 'Visual limpo e profissional com azul corporativo',
    colors: ['#0477d1', '#edf6fc', '#ffffff', '#222222'],
    supportsDarkMode: true
  },
  {
    id: 'royal-blue' as ThemePreset,
    name: 'Royal Blue',
    description: 'Azul profundo com acentos em laranja',
    colors: ['#0000bb', '#FFCC91', '#f5f5f5', '#000000'],
    supportsDarkMode: true
  }
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('dashboard-theme');
    return (saved as ThemePreset) || 'cyber-neon';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('dashboard-dark-mode');
    return saved === 'true';
  });

  const setTheme = (newTheme: ThemePreset) => {
    setThemeState(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
  };

  const setDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('dashboard-dark-mode', String(dark));
  };

  const toggleDarkMode = () => {
    setDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Apply dark mode class for themes that support it
    const currentThemeConfig = themePresets.find(t => t.id === theme);
    if (currentThemeConfig?.supportsDarkMode && isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDarkMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: themePresets, isDarkMode, setDarkMode, toggleDarkMode }}>
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
