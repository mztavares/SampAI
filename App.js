import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import SplashScreen from './src/pages/SplashScreen';
import OnboardingScreen from './src/pages/OnboardingScreen';
import RegionScreen from './src/pages/RegionScreen';
import FoodScreen from './src/pages/FoodScreen';
import ActivitiesScreen from './src/pages/ActivitiesScreen';
import AgeScreen from './src/pages/AgeScreen';
import DurationScreen from './src/pages/DurationScreen';
import StayScreen from './src/pages/StayScreen';
import ScheduleScreen from './src/pages/ScheduleScreen';
import GeneratingScreen from './src/pages/GeneratingScreen';
import ItineraryScreen from './src/pages/ItineraryScreen';
import ProfileScreen from './src/pages/ProfileScreen';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [formStep, setFormStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [generatedItinerary, setGeneratedItinerary] = useState(null);

  // Tratamento de erro global - suprimir erros de billing
  React.useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Suprimir erros de billing da Google Places API
      const errorMessage = args.join(' ');
      if (errorMessage.includes('REQUEST_DENIED') && errorMessage.includes('Billing')) {
        console.log('⚠️ API do Google Places requer billing - usando dados locais');
        return; // Não exibir o erro na interface
      }
      
      // Exibir outros erros normalmente
      originalConsoleError(...args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  let [fontsLoaded, fontError] = useFonts({
    Poppins_700Bold,
    Montserrat_500Medium,
    Montserrat_400Regular,
  });

  // Log de erro das fontes se houver
  if (fontError) {
    console.error('❌ Erro ao carregar fontes:', fontError);
  }

  if (isLoading || !fontsLoaded) {
    return <SplashScreen onFinishLoading={() => setIsLoading(false)} />;
  }

  const handleAnswer = (step, answer) => {
    console.log(`Resposta para ${step}:`, answer);
    setUserAnswers(prev => ({ ...prev, [step]: answer }));
  };

  const handleGenerateComplete = (itinerary) => {
    if (itinerary) {
      setGeneratedItinerary(itinerary);
    }
    setFormStep(9);
  };

  const renderFormStep = () => {
    switch (formStep) {
      case 0:
        return <OnboardingScreen onNext={() => setFormStep(1)} />;
      case 1:
        return <RegionScreen onNext={(answer) => { handleAnswer('region', answer); setFormStep(2); }} onBack={() => setFormStep(0)} />;
      case 2:
        return <FoodScreen onNext={(answer) => { handleAnswer('food', answer); setFormStep(3); }} onBack={() => setFormStep(1)} />;
      case 3:
        return <ActivitiesScreen onNext={(answer) => { handleAnswer('activities', answer); setFormStep(4); }} onBack={() => setFormStep(2)} />;
      case 4:
        return <AgeScreen onNext={(answer) => { handleAnswer('age', answer); setFormStep(5); }} onBack={() => setFormStep(3)} />;
      case 5:
        return <DurationScreen onNext={(answer) => { handleAnswer('duration', answer); setFormStep(6); }} onBack={() => setFormStep(4)} />;
      case 6:
        return <StayScreen onNext={(answer) => { handleAnswer('stay', answer); setFormStep(7); }} onBack={() => setFormStep(5)} />;
      case 7:
        return <ScheduleScreen onNext={(answer) => { handleAnswer('schedule', answer); setFormStep(8); }} onBack={() => setFormStep(6)} />;
      case 8: 
        return <GeneratingScreen onComplete={handleGenerateComplete} userAnswers={userAnswers} />;
      case 9: 
        return <ItineraryScreen generatedItinerary={generatedItinerary} />;
      case 10:
        return <ProfileScreen />;
      default:
        return <ItineraryScreen generatedItinerary={generatedItinerary} />;
    }
  };

  return (
    <ThemeProvider>
      {renderFormStep()}
    </ThemeProvider>
  );
}


