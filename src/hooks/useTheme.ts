import { useState, useEffect, useCallback } from 'react';

type Theme = 'auto' | 'light' | 'dark';

interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'horizon-theme';

/**
 * Custom hook for managing theme state with system preference detection
 * 
 * Features:
 * - Auto-detects system preference
 * - Persists user choice in localStorage
 * - Applies theme to document element
 * - Provides toggle functionality
 */
export const useTheme = (): UseThemeReturn => {
  // Get initial theme from localStorage or default to 'auto'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'auto';
    
    const saved = localStorage.getItem(STORAGE_KEY) as Theme;
    return saved && ['auto', 'light', 'dark'].includes(saved) ? saved : 'auto';
  });

  // Track system preference
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Calculate resolved theme (what actually gets applied)
  const resolvedTheme: 'light' | 'dark' = theme === 'auto' ? systemPreference : theme;

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  // Toggle between light and dark (skips auto)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback for older browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme attributes
    root.removeAttribute('data-theme');
    
    // Apply new theme
    if (resolvedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    }
    
    // Also set a class for compatibility
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Prevent flash of wrong theme on initial load
  useEffect(() => {
    // This effect runs after hydration to ensure the theme is applied immediately
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    
    if (currentTheme !== resolvedTheme) {
      if (resolvedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    }
  }, []); // Run only once on mount

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
};
