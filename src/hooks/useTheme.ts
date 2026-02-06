// hooks/useTheme.ts - Theme management hook

import { useState, useEffect, useCallback } from 'react';
import { ThemeMode, Theme, getActiveTheme, getSystemTheme } from '../lib/theme';

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as ThemeMode) || 'system';
  });

  const [theme, setTheme] = useState<Theme>(() => getActiveTheme(mode));

  useEffect(() => {
    const newTheme = getActiveTheme(mode);
    setTheme(newTheme);
    
    // Apply to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme.mode);
    
    // Save preference
    localStorage.setItem('theme', mode);
  }, [mode]);

  // Listen to system changes
  useEffect(() => {
    if (mode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTheme(getActiveTheme('system'));
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  const setSpecificMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  return {
    mode,
    theme,
    toggleTheme,
    setMode: setSpecificMode,
    isDark: theme.mode === 'dark',
  };
}
