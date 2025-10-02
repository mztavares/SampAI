import { StyleSheet } from 'react-native';

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
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginHorizontal: 20,
    marginTop: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Montserrat_500Medium',
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginHorizontal: 20,
    marginTop: 4,
    fontSize: 12,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    margin: 20,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-between',
  },
  headerText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subHeaderText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  questionText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 24,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: COLORS.optionBorder,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  optionText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopColor: '#4F4F4F',
    borderTopWidth: 1,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  nextButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  nextButtonDisabled: {
    backgroundColor: '#8C5B00',
  },
  nextButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.background,
  },
});
