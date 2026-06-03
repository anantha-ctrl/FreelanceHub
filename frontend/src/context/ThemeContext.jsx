import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { authAPI } from '../utils/api';

const ThemeContext = createContext();

const accents = {
  blue: {
    dark: { neon: '#3b82f6', light: '#60a5fa', glow: 'rgba(59,130,246,0.25)', border: 'rgba(59,130,246,0.3)' },
    light: { neon: '#2563eb', light: '#3b82f6', glow: 'rgba(37,99,235,0.2)', border: 'rgba(59,130,246,0.4)' }
  },
  purple: {
    dark: { neon: '#8b5cf6', light: '#a78bfa', glow: 'rgba(139,92,246,0.25)', border: 'rgba(139,92,246,0.3)' },
    light: { neon: '#7c3aed', light: '#8b5cf6', glow: 'rgba(124,58,237,0.2)', border: 'rgba(124,58,237,0.4)' }
  },
  green: {
    dark: { neon: '#10b981', light: '#34d399', glow: 'rgba(16,185,129,0.25)', border: 'rgba(16,185,129,0.3)' },
    light: { neon: '#059669', light: '#10b981', glow: 'rgba(5,150,105,0.2)', border: 'rgba(5,150,105,0.4)' }
  },
  amber: {
    dark: { neon: '#f59e0b', light: '#fbbf24', glow: 'rgba(245,158,11,0.25)', border: 'rgba(245,158,11,0.3)' },
    light: { neon: '#d97706', light: '#f59e0b', glow: 'rgba(217,119,6,0.2)', border: 'rgba(217,119,6,0.4)' }
  },
  rose: {
    dark: { neon: '#ec4899', light: '#f472b6', glow: 'rgba(236,72,153,0.25)', border: 'rgba(236,72,153,0.3)' },
    light: { neon: '#db2777', light: '#ec4899', glow: 'rgba(219,39,119,0.2)', border: 'rgba(219,39,119,0.4)' }
  }
};

export const ThemeProvider = ({ children }) => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('blue');
  const [density, setDensity] = useState('standard');

  // Load theme from user database profile
  useEffect(() => {
    if (isAuthenticated && user?.theme) {
      setTheme(user.theme);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // Apply accent colors dynamically
  useEffect(() => {
    const values = accents[accentColor]?.[theme] || accents.blue[theme];
    const root = document.documentElement;
    root.style.setProperty('--neon', values.neon);
    root.style.setProperty('--neon-light', values.light);
    root.style.setProperty('--neon-glow', values.glow);
    root.style.setProperty('--border-neon', values.border);
  }, [theme, accentColor]);

  // Apply density classes dynamically
  useEffect(() => {
    document.documentElement.classList.remove('density-standard', 'density-compact');
    document.documentElement.classList.add(`density-${density}`);
  }, [density]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (isAuthenticated) {
      try {
        await authAPI.updateProfile({ theme: nextTheme });
        updateUser({ theme: nextTheme });
      } catch (err) {
        console.error('Failed to update theme in database:', err);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === 'dark',
      accentColor,
      setAccentColor,
      density,
      setDensity
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


