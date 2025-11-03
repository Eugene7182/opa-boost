import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('oppo-theme');
    return (saved as Theme) || 'system';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      root.classList.remove('light', 'dark');
      root.classList.add(isDark ? 'dark' : 'light');
      setActualTheme(isDark ? 'dark' : 'light');
    };

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(systemTheme.matches);

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      systemTheme.addEventListener('change', listener);
      return () => systemTheme.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('oppo-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};