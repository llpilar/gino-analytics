import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'cyber-neon' | 'midnight-purple' | 'ocean-deep' | 'ember-glow' | 'forest-night' | 'rose-gold' | 'arctic-ice' | 'sunset-vibes';

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
    id: 'midnight-purple' as ThemePreset,
    name: 'Midnight Purple',
    description: 'Roxo profundo com gradientes violeta',
    colors: ['#a855f7', '#6366f1', '#0f0a1a', '#1e1b4b']
  },
  {
    id: 'ocean-deep' as ThemePreset,
    name: 'Ocean Deep',
    description: 'Azul oceânico com tons de teal',
    colors: ['#0ea5e9', '#06b6d4', '#0a1628', '#164e63']
  },
  {
    id: 'ember-glow' as ThemePreset,
    name: 'Ember Glow',
    description: 'Laranja e vermelho vibrantes',
    colors: ['#f97316', '#ef4444', '#1a0a05', '#451a03']
  },
  {
    id: 'forest-night' as ThemePreset,
    name: 'Forest Night',
    description: 'Verde floresta com tons naturais',
    colors: ['#22c55e', '#84cc16', '#0a1a0f', '#14532d']
  },
  {
    id: 'rose-gold' as ThemePreset,
    name: 'Rose Gold',
    description: 'Rosa elegante com dourado sutil',
    colors: ['#f472b6', '#fbbf24', '#1a0a14', '#4c1d2f']
  },
  {
    id: 'arctic-ice' as ThemePreset,
    name: 'Arctic Ice',
    description: 'Azul gelo com branco cristalino',
    colors: ['#38bdf8', '#e0f2fe', '#0c1929', '#1e3a5f']
  },
  {
    id: 'sunset-vibes' as ThemePreset,
    name: 'Sunset Vibes',
    description: 'Gradiente do pôr do sol laranja ao rosa',
    colors: ['#fb923c', '#ec4899', '#1a0f0a', '#78350f']
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
