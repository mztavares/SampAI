import { StyleSheet } from 'react-native';

// Cores do modo escuro (atual)
export const darkColors = {
  // Cores principais
  background: '#2D2D2D',
  surface: '#3A3A3A',
  primary: '#FFA500',
  secondary: '#00A9A5',
  
  // Cores de texto
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textDisabled: '#666666',
  
  // Cores de status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Cores de interface
  border: '#555555',
  divider: '#444444',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Cores específicas do app
  accent: '#FFA500',
  roteiro: '#00A9A5',
  card: '#3A3A3A',
  button: '#FFA500',
  buttonText: '#2D2D2D',
  input: '#3A3A3A',
  inputText: '#F5F5F5',
  placeholder: '#A0A0A0',
};

// Cores do modo claro
export const lightColors = {
  // Cores principais
  background: '#FFFFFF',
  surface: '#F5F5F5',
  primary: '#FFA500',
  secondary: '#00A9A5',
  
  // Cores de texto - melhor contraste
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textDisabled: '#8A8A8A',
  
  // Cores de status
  success: '#2E7D32',
  warning: '#F57C00',
  error: '#D32F2F',
  info: '#1976D2',
  
  // Cores de interface - melhor contraste
  border: '#CCCCCC',
  divider: '#E0E0E0',
  overlay: 'rgba(0, 0, 0, 0.6)',
  
  // Cores específicas do app
  accent: '#FFA500',
  roteiro: '#00A9A5',
  card: '#FFFFFF',
  cardBorder: '#E0E0E0',
  button: '#FFA500',
  buttonText: '#FFFFFF',
  buttonSecondary: '#F5F5F5',
  buttonSecondaryText: '#1A1A1A',
  input: '#F8F8F8',
  inputText: '#1A1A1A',
  inputBorder: '#CCCCCC',
  placeholder: '#8A8A8A',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Sistema de temas
export const createTheme = (isDark = true) => {
  const colors = isDark ? darkColors : lightColors;
  
  return {
    colors,
    isDark,
    
    // Estilos comuns que se adaptam ao tema
    commonStyles: StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderWidth: isDark ? 0 : 1,
        borderColor: isDark ? 'transparent' : colors.cardBorder,
        shadowColor: isDark ? '#000' : colors.shadow,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: isDark ? 0.25 : 0.15,
        shadowRadius: 3.84,
        elevation: isDark ? 5 : 3,
      },
      button: {
        backgroundColor: colors.button,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: isDark ? '#000' : colors.shadow,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: isDark ? 0.25 : 0.15,
        shadowRadius: 3.84,
        elevation: isDark ? 5 : 3,
      },
      buttonSecondary: {
        backgroundColor: colors.buttonSecondary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      },
      buttonText: {
        color: colors.buttonText,
        fontSize: 16,
        fontWeight: '600',
      },
      buttonSecondaryText: {
        color: colors.buttonSecondaryText,
        fontSize: 16,
        fontWeight: '600',
      },
      input: {
        backgroundColor: colors.input,
        borderColor: isDark ? colors.border : colors.inputBorder,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: colors.inputText,
        fontSize: 16,
      },
      text: {
        color: colors.text,
        fontSize: 16,
      },
      textSecondary: {
        color: colors.textSecondary,
        fontSize: 14,
      },
      title: {
        color: colors.text,
        fontSize: 24,
        fontWeight: 'bold',
      },
      subtitle: {
        color: colors.textSecondary,
        fontSize: 18,
        fontWeight: '600',
      },
      divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 16,
      },
    }),
  };
};

// Tema padrão (modo escuro)
export const defaultTheme = createTheme(true);

// Exportar cores para compatibilidade
export const COLORS = darkColors;
