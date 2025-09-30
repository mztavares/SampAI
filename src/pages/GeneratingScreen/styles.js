import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#2D2D2D',
  accent: '#FFA500',
  roteiro: '#00A9A5',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  progressContainer: {
    width: '80%',
    marginTop: 32,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    marginTop: 8,
  },
});
