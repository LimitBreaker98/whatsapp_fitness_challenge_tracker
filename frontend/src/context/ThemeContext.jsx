import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [hasUserOverride, setHasUserOverride] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light' || saved === 'dark';
  });
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (hasUserOverride) {
      localStorage.setItem('theme', theme);
    } else {
      localStorage.removeItem('theme');
    }
  }, [theme, hasUserOverride]);

  useEffect(() => {
    if (hasUserOverride) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [hasUserOverride]);

  const toggleTheme = () => {
    setHasUserOverride(true);
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
