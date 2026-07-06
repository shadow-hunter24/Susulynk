import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'react-native';
import { LightColors, DarkColors } from '../theme/colors';

const THEME_KEY = 'susulynk_dark_mode';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  // Restore persisted preference on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_KEY);
        if (stored === 'true') setIsDark(true);
      } catch (_) {}
    })();
  }, []);

  const toggleDark = useCallback(async () => {
    setIsDark(prev => {
      const next = !prev;
      SecureStore.setItemAsync(THEME_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const Colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, Colors }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
