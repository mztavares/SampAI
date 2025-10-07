import { StyleSheet, Platform } from 'react-native';

const COLORS = {
  background: '#2D2D2D',
  accent: '#FFA500',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  cardBackground: '#393939',
  buttonDisabled: '#4A4A4A',
  optionBorder: '#555555',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  chatContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBubble: {
    backgroundColor: COLORS.cardBackground,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-end',
    borderTopRightRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  aiText: {
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 8,
    flexShrink: 1,
  },
  userText: {
    color: COLORS.background,
    fontSize: 16,
  },
  micContainer: {
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderColor: COLORS.optionBorder,
    alignItems: 'center',
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  statusText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  progressText: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  iconStyle: {
    fontSize: 24,
    color: COLORS.background,
  },
  welcomeContainer: {
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderColor: COLORS.optionBorder,
  },

  welcomeText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    lineHeight: 22,
  },

  welcomeHighlight: {
    color: COLORS.accent,
    fontFamily: 'Poppins_700Bold',
  },
});
