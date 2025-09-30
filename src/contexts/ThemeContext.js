import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTheme } from '../config/theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [theme, setTheme] = useState(createTheme(true));

  // Carregar preferência salva
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Atualizar tema quando isDark muda
  useEffect(() => {
    setTheme(createTheme(isDark));
  }, [isDark]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        const isDarkTheme = savedTheme === 'dark';
        setIsDark(isDarkTheme);
      }
    } catch (error) {
      console.error('Erro ao carregar preferência de tema:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newIsDark = !isDark;
      setIsDark(newIsDark);
      await AsyncStorage.setItem('theme_preference', newIsDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Erro ao salvar preferência de tema:', error);
    }
  };

  const setThemeMode = async (darkMode) => {
    try {
      setIsDark(darkMode);
      await AsyncStorage.setItem('theme_preference', darkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Erro ao definir modo de tema:', error);
    }
  };

  const value = {
    isDark,
    theme,
    toggleTheme,
    setThemeMode,
    colors: theme.colors,
    commonStyles: theme.commonStyles,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
