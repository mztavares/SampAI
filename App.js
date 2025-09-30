import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
// Importações mantidas de AMBAS as versões do seu código
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
// Renomeei os componentes para evitar conflito com as importações
import GeneratingScreenComponent from './src/pages/GeneratingScreen'; 
import ItineraryScreenComponent from './src/pages/ItineraryScreen';
import ProfileScreen from './src/pages/ProfileScreen';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';

// --- CONFIGURAÇÃO ---
const BACKEND_URL = 'https://sampai.onrender.com';

// --- ÍCONES SIMULADOS ---
const BotIcon = () => <Text style={styles.iconStyle}>🤖</Text>;
const MicIcon = () => <Text style={styles.iconStyle}>🎤</Text>;


// --- COMPONENTES DA ARQUITETURA DE VOZ (DEFINIDOS FORA DO APP) ---

const VoiceOnboarding = ({ onComplete }) => {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, listening, thinking
    const conversationHistory = useRef([]);
    const scrollViewRef = useRef();

    useEffect(() => {
        handleConversation(null, true); 
    }, []);

    const handleConversation = async (userText, isInitial = false) => {
        if (!isInitial && userText) {
            conversationHistory.current.push({ role: "user", parts: [{ text: userText }] });
        }
        setStatus('thinking');
        try {
            // CORREÇÃO: A string do prompt precisa estar entre crases (``)
            const systemPrompt = `Você é a consciência digital de Oscar Niemeyer. Sua missão é ser um amigo e parceiro de viagem para quem explora São Paulo. Fale com poesia, calor e bom humor. Reaja às respostas do usuário de forma natural. Faça UMA pergunta de cada vez para entender os desejos do usuário. Quando tiver informações suficientes, finalize com a frase EXATA: 'Perfeito. A base do nosso projeto está definida. Permita-me um momento para desenhar as linhas do seu roteiro...'`;
            
            // CORREÇÃO: Template literal com crases para a URL
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationHistory: conversationHistory.current, systemPrompt })
            });

            if (!response.ok) {
                 const errorText = await response.text();
                 // CORREÇÃO: Template literal com crases para o erro
                 throw new Error(`Falha na comunicação com o backend: ${errorText}`);
            }
            
            const data = await response.json();
            const { text: aiTextResponse, audio: audioBase64 } = data;

            conversationHistory.current.push({ role: "model", parts: [{ text: aiTextResponse }] });
            setMessages(prev => [...prev, { from: 'ai', text: aiTextResponse }]);
            
            if (aiTextResponse.includes("desenhar as linhas do seu roteiro")) {
                setTimeout(() => onComplete({ conversation: conversationHistory.current }), 1000);
            }
        } catch (error) {
            console.error('Erro na conversa:', error);
            setMessages(prev => [...prev, { from: 'ai', text: 'Meu caro, parece que tivemos uma pequena falha na estrutura. Podemos tentar de novo?' }]);
        } finally {
            setStatus('idle');
        }
    };

    const handleMicPress = () => {
      const simulatedUserText = "Vim para um show de rock e ficarei 3 dias. Gosto de parques e comida japonesa.";
      setMessages(prev => [...prev, { from: 'user', text: simulatedUserText }]);
      handleConversation(simulatedUserText);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.chatContainer}
                onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
            >
                {messages.map((msg, index) => (
                    <View key={index} style={[styles.messageBubble, msg.from === 'user' ? styles.userBubble : styles.aiBubble]}>
                        {msg.from === 'ai' && <BotIcon />}
                        <Text style={msg.from === 'user' ? styles.userText : styles.aiText}>{msg.text}</Text>
                    </View>
                ))}
            </ScrollView>
            <View style={styles.micContainer}>
                <TouchableOpacity onPress={handleMicPress} style={styles.micButton} disabled={status !== 'idle'}>
                    {status === 'thinking' ? <ActivityIndicator color="#fff" /> : <MicIcon />}
                </TouchableOpacity>
                {/* CORREÇÃO: Template literal com crases para o status */}
                <Text style={styles.statusText}>{status === 'idle' ? 'Pressione para falar' : `${status}...`}</Text>
            </View>
        </SafeAreaView>
    );
};

// Renomeei os componentes para não haver conflito de nomes
const GeneratingScreenVoice = () => (
    <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.generatingTitle}>Desenhando seu projeto...</Text>
        <Text style={styles.generatingSubtitle}>Analisando as curvas da cidade e garantindo um percurso seguro.</Text>
    </View>
);

const ItineraryScreenVoice = ({ itinerary }) => {
    if (!itinerary) {
        return <GeneratingScreenVoice />;
    }
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.itineraryContainer}>
                <Text style={styles.itineraryTitle}>{itinerary.titulo}</Text>
                {itinerary.dias.map(dia => (
                    <View key={dia.dia} style={styles.dayContainer}>
                        <Text style={styles.dayTitle}>Dia {dia.dia}: {dia.titulo}</Text>
                        {dia.atividades.map((atv, index) => (
                            <View key={index} style={styles.activityContainer}>
                                <Text style={styles.activityTime}>{atv.hora}</Text>
                                <Text style={styles.activityTitle}>{atv.titulo}</Text>
                                {atv.seguranca && (
                                    // CORREÇÃO: Template literal para o estilo dinâmico
                                    <View style={[styles.alertBox, styles[`alert${atv.seguranca.nivel}`]]}>
                                        <Text style={styles.alertTitle}>Vigía Urbano: Alerta {atv.seguranca.nivel}</Text>
                                        <Text style={styles.alertText}>{atv.seguranca.recomendacoes}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const SplashScreenVoice = ({ onFinish }) => {
    useEffect(() => {
        const timer = setTimeout(onFinish, 2500);
        return () => clearTimeout(timer);
    }, [onFinish]);
    return (
        <View style={[styles.container, styles.center, { backgroundColor: '#007bff' }]}>
            <Text style={styles.splashTitle}>SampAI</Text>
        </View>
    );
};


// --- COMPONENTE PRINCIPAL UNIFICADO ---
export default function App() {
  // Estados de AMBAS as versões
  const [isLoading, setIsLoading] = useState(true);
  const [formStep, setFormStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [appState, setAppState] = useState('splash'); // splash, onboarding, loading, main
  const [itinerary, setItinerary] = useState(null);

  // Hooks movidos para dentro do componente App
  let [fontsLoaded, fontError] = useFonts({
    Poppins_700Bold,
    Montserrat_500Medium,
    Montserrat_400Regular,
  });

  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('REQUEST_DENIED') && errorMessage.includes('Billing')) {
        console.log('⚠️ API do Google Places requer billing - usando dados locais');
        return;
      }
      originalConsoleError(...args);
    };
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  if (fontError) {
    console.error('❌ Erro ao carregar fontes:', fontError);
  }

  // --- Funções da lógica de FORMULÁRIO ---
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
  
  // --- Função da lógica de VOZ ---
  const handleOnboardingComplete = async (userData) => {
    setAppState('loading');
    try {
        const response = await fetch(`${BACKEND_URL}/api/finalizar-onboarding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        const conversationId = data.conversationId;

        const roteiroResponse = await fetch(`${BACKEND_URL}/api/gerar-roteiro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId })
        });
        const roteiroData = await roteiroResponse.json();
        setItinerary(roteiroData);
        setAppState('main');
    } catch (error) {
        console.error("Erro ao finalizar onboarding e gerar roteiro:", error);
        setAppState('onboarding');
    }
  };

  // --- Renderizadores de CADA fluxo ---
  
  // Lógica de renderização do FLUXO DE FORMULÁRIO (mantida)
  const renderFormStep = () => {
    switch (formStep) {
      case 0: return <OnboardingScreen onNext={() => setFormStep(1)} />;
      case 1: return <RegionScreen onNext={(answer) => { handleAnswer('region', answer); setFormStep(2); }} onBack={() => setFormStep(0)} />;
      case 2: return <FoodScreen onNext={(answer) => { handleAnswer('food', answer); setFormStep(3); }} onBack={() => setFormStep(1)} />;
      case 3: return <ActivitiesScreen onNext={(answer) => { handleAnswer('activities', answer); setFormStep(4); }} onBack={() => setFormStep(2)} />;
      case 4: return <AgeScreen onNext={(answer) => { handleAnswer('age', answer); setFormStep(5); }} onBack={() => setFormStep(3)} />;
      case 5: return <DurationScreen onNext={(answer) => { handleAnswer('duration', answer); setFormStep(6); }} onBack={() => setFormStep(4)} />;
      case 6: return <StayScreen onNext={(answer) => { handleAnswer('stay', answer); setFormStep(7); }} onBack={() => setFormStep(5)} />;
      case 7: return <ScheduleScreen onNext={(answer) => { handleAnswer('schedule', answer); setFormStep(8); }} onBack={() => setFormStep(6)} />;
      case 8: return <GeneratingScreenComponent onComplete={handleGenerateComplete} userAnswers={userAnswers} />;
      case 9: return <ItineraryScreenComponent generatedItinerary={generatedItinerary} />;
      case 10: return <ProfileScreen />;
      default: return <ItineraryScreenComponent generatedItinerary={generatedItinerary} />;
    }
  };

  // Lógica de renderização do FLUXO DE VOZ (mantida)
  const renderContent = () => {
      switch (appState) {
        case 'splash': return <SplashScreenVoice onFinish={() => setAppState('onboarding')} />;
        case 'onboarding': return <VoiceOnboarding onComplete={handleOnboardingComplete} />;
        case 'loading': return <GeneratingScreenVoice />;
        case 'main': return <ItineraryScreenVoice itinerary={itinerary} />;
        default: return <SplashScreenVoice onFinish={() => setAppState('onboarding')} />;
      }
  };

  if (isLoading && !fontsLoaded) {
    // Usando o SplashScreen importado para a lógica de formulário como padrão
    return <SplashScreen onFinishLoading={() => setIsLoading(false)} />;
  }
  
  // --- Retorno final do Componente App ---
  // Ele pode retornar um ou outro fluxo.
  // Atualmente está retornando o FLUXO DE VOZ (renderContent).
  // Para usar o FLUXO DE FORMULÁRIO, troque `renderContent()` por `renderFormStep()`.
  return (
    <ThemeProvider>
      {renderContent()}
    </ThemeProvider>
  );
}


// Estilos (mantidos e unificados)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7', paddingTop: Platform.OS === 'android' ? 25 : 0 },
    center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    splashTitle: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
    chatContainer: { padding: 10, paddingBottom: 120 },
    messageBubble: { padding: 12, borderRadius: 18, marginBottom: 10, maxWidth: '85%', flexDirection: 'row', alignItems: 'center' },
    aiBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderTopLeftRadius: 5, elevation: 1 },
    userBubble: { backgroundColor: '#007bff', alignSelf: 'flex-end', borderTopRightRadius: 5, elevation: 1 },
    aiText: { color: '#333', fontSize: 16, marginLeft: 8, flexShrink: 1 },
    userText: { color: '#fff', fontSize: 16 },
    micContainer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e7e7e7', alignItems: 'center' },
    micButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    statusText: { marginTop: 10, color: '#666' },
    iconStyle: { fontSize: 24, color: '#fff' },
    generatingTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, color: '#333' },
    generatingSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
    itineraryContainer: { padding: 20 },
    itineraryTitle: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    dayContainer: { marginBottom: 25 },
    dayTitle: { fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 15 },
    activityContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, },
    activityTime: { fontSize: 14, color: '#666', fontWeight: 'bold' },
    activityTitle: { fontSize: 18, color: '#333', fontWeight: '500', marginTop: 5 },
    alertBox: { marginTop: 10, borderRadius: 8, padding: 10, borderWidth: 1 },
    alertElevado: { backgroundColor: '#fffbe6', borderColor: '#ffc107' },
    alertMédio: { backgroundColor: '#e6f7ff', borderColor: '#1890ff' },
    alertBaixo: { backgroundColor: '#f6ffed', borderColor: '#52c41a' },
    alertTitle: { fontWeight: 'bold', marginBottom: 5 },
    alertText: {},
});