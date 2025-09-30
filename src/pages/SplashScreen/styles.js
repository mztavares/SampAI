import { StyleSheet } from 'react-native';

const COLORS = {
  background: '#2D2D2D',
  accent: '#FFA500',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
};

export const logoSvg = `
<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M40 0C21.2222 0 6.66663 14.5556 6.66663 33.3333C6.66663 45.0556 12.9444 55.4444 22.2222 61.3333L40 78.8889L57.7777 61.3333C67.0555 55.4444 73.3333 45.0556 73.3333 33.3333C73.3333 14.5556 58.7777 0 40 0ZM40 44.4444C33.7222 44.4444 28.8889 39.6111 28.8889 33.3333C28.8889 27.0556 33.7222 22.2222 40 22.2222C46.2777 22.2222 51.1111 27.0556 51.1111 33.3333C51.1111 39.6111 46.2777 44.4444 40 44.4444Z" fill="${COLORS.accent}"/>
</svg>
`;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 42,
    color: COLORS.text,
    marginTop: 16,
  },
  logoHighlight: {
    color: COLORS.accent,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingMessage: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 20,
  },
});
