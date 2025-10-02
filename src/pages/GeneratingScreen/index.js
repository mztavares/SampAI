import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { styles, COLORS } from './styles';
import { generateItinerary } from '../../services/itineraryService';

const GeneratingScreen = ({ onComplete, userAnswers = {} }) => {
  const { colors, isDark } = useTheme();
  const [progress, setProgress] = useState('Analisando suas preferências...');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Analisando suas preferências...',
    'Buscando os melhores locais...',
    'Calculando distâncias e horários...',
    'Personalizando seu roteiro...',
    'Finalizando...'
  ];

  useEffect(() => {
    const generateItineraryAsync = async () => {
      try {
        // Simula progresso
        const progressInterval = setInterval(() => {
          setCurrentStep(prev => {
            const next = prev + 1;
            if (next < steps.length) {
              setProgress(steps[next]);
              return next;
            }
            return prev;
          });
        }, 600);

        // Gera o roteiro
        const itinerary = await generateItinerary(userAnswers);
        
        clearInterval(progressInterval);
        setProgress('Roteiro pronto!');
        
        // Passa o roteiro gerado para a próxima tela
        setTimeout(() => {
          onComplete(itinerary);
        }, 500);

      } catch (error) {
        console.error('Erro ao gerar roteiro:', error);
        setProgress('Erro ao gerar roteiro. Tente novamente.');
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    };

    generateItineraryAsync();
  }, [onComplete, userAnswers]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.title, { color: colors.text }]}>A gerar o seu roteiro...</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{progress}</Text>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { 
            backgroundColor: colors.accent,
            width: `${((currentStep + 1) / steps.length) * 100}%` 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>{currentStep + 1} de {steps.length}</Text>
      </View>
    </SafeAreaView>
  );
};

export default GeneratingScreen;