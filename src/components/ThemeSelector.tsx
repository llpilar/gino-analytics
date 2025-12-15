import { useTheme, ThemePreset } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Check, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function ThemeSelector() {
  const { theme, setTheme, themes, isDarkMode, toggleDarkMode } = useTheme();

  const currentTheme = themes.find(t => t.id === theme);
  const showDarkModeToggle = currentTheme?.supportsDarkMode;

  return (
    <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle className="text-foreground">Tema do Dashboard</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Escolha o visual do seu dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setTheme(preset.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-300 text-left group",
                theme === preset.id
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                  : "border-border bg-card/50 hover:border-muted-foreground hover:bg-accent/50"
              )}
            >
              {/* Check indicator */}
              {theme === preset.id && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              {/* Color preview */}
              <div className="flex gap-2 mb-3">
                {preset.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-border shadow-lg"
                    style={{ 
                      backgroundColor: color,
                      boxShadow: `0 0 10px ${color}40`
                    }}
                  />
                ))}
              </div>

              {/* Theme info */}
              <h3 className={cn(
                "font-semibold mb-1 transition-colors",
                theme === preset.id ? "text-primary" : "text-foreground group-hover:text-primary"
              )}>
                {preset.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {preset.description}
              </p>

              {/* Supports dark mode badge */}
              {preset.supportsDarkMode && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                  <Moon className="w-3 h-3" />
                  <span>Suporta modo escuro</span>
                </div>
              )}

              {/* Preview bar */}
              <div className="mt-3 h-2 rounded-full overflow-hidden bg-muted">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: theme === preset.id ? '100%' : '0%',
                    background: `linear-gradient(90deg, ${preset.colors[0]}, ${preset.colors[1]})`
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Dark mode toggle - only shows when current theme supports it */}
        {showDarkModeToggle && (
          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card/50">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              <div>
                <Label htmlFor="dark-mode" className="text-foreground font-medium cursor-pointer">
                  Modo Escuro
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isDarkMode ? 'Tema escuro ativado' : 'Tema claro ativado'}
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
