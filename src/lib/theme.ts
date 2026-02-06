// lib/theme.ts - Theme configuration and utilities

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    textInverse: string;
    border: string;
    borderHover: string;
  };
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#4f46e5', // indigo-600
    primaryHover: '#4338ca', // indigo-700
    secondary: '#6366f1', // indigo-500
    background: '#f8fafc', // slate-50
    surface: '#ffffff',
    surfaceElevated: '#f1f5f9', // slate-100
    text: '#0f172a', // slate-900
    textMuted: '#64748b', // slate-500
    textInverse: '#ffffff',
    border: '#e2e8f0', // slate-200
    borderHover: '#cbd5e1', // slate-300
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#6366f1', // indigo-500
    primaryHover: '#818cf8', // indigo-400
    secondary: '#4f46e5', // indigo-600
    background: '#0f172a', // slate-900
    surface: '#1e293b', // slate-800
    surfaceElevated: '#334155', // slate-700
    text: '#f8fafc', // slate-50
    textMuted: '#94a3b8', // slate-400
    textInverse: '#0f172a',
    border: '#334155', // slate-700
    borderHover: '#475569', // slate-600
  },
};

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getActiveTheme(mode: ThemeMode): Theme {
  if (mode === 'system') {
    return getSystemTheme() === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
}
