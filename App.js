import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
// Substitua pelas suas importações de contexto e componentes de tela
import { ThemeProvider } from './src/contexts/ThemeContext';
import SplashScreen from './src/pages/SplashScreen';
// Adicione as importações de bibliotecas nativas que precisará
import Voice from '@react-native-voice/voice';
import { Audio } from 'expo-av';

// --- CONFIGURAÇÃO ---
// ATENÇÃO: Substitua pela URL que o Render.com te dará após o deploy.
// Para testar localmente, substitua 'localhost' pelo IP da sua máquina na rede.
const BACKEND_URL = 'https://sampai.onrender.com'; 

// --- ÍCONES SIMULADOS ---
const BotIcon = () => <Text style={styles.iconStyle}>🤖</Text>;
const MicIcon = () => <Text style={styles.iconStyle}>🎤</Text>;

// --- COMPONENTES DA NOVA ARQUITETURA ---

const VoiceOnboarding = ({ onComplete }) => {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, listening, thinking
    const conversationHistory = useRef([]);
    const scrollViewRef = useRef();

    useEffect(() => {
        // Mensagem inicial do Niemeyer
        handleConversation(null, true); 
    }, []);

    const handleConversation = async (userText, isInitial = false) => {
        if (!isInitial && userText) {
            conversationHistory.current.push({ role: "user", parts: [{ text: userText }] });
        }
        setStatus('thinking');

        try {
            const systemPrompt = `Você é a consciência digital de Oscar Niemeyer. Sua missão é ser um amigo e parceiro de viagem para quem explora São Paulo. Fale com poesia, calor e bom humor. Reaja às respostas do usuário de forma natural. Faça UMA pergunta de cada vez para entender os desejos do usuário. Quando tiver informações suficientes, finalize com a frase EXATA: 'Perfeito. A base do nosso projeto está definida. Permita-me um momento para desenhar as linhas do seu roteiro...'`;
            
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationHistory: conversationHistory.current, systemPrompt })
            });

            if (!response.ok) {
                 const errorText = await response.text();
                 throw new Error(`Falha na comunicação com o backend: ${errorText}`);
            }
            
            const data = await response.json();
            const { text: aiTextResponse, audio: audioBase64 } = data;

            conversationHistory.current.push({ role: "model", parts: [{ text: aiTextResponse }] });
            setMessages(prev => [...prev, { from: 'ai', text: aiTextResponse }]);
            
            // Lógica para tocar o áudio recebido do backend (requer expo-av)
            // const { Sound } = require('expo-av');
            // const { sound } = await Sound.createAsync({ uri: `data:audio/mpeg;base64,${audioBase64}` });
            // await sound.playAsync();

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
    
    // Função para simular o reconhecimento de voz
    const handleMicPress = () => {
      // Em um app real, aqui você iniciaria o Voice.start('pt-BR')
      // e o resultado seria passado para handleConversation no evento onSpeechResults
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
                <Text style={styles.statusText}>{status === 'idle' ? 'Pressione para falar' : `${status}...`}</Text>
            </View>
        </SafeAreaView>
    );
};

const GeneratingScreen = () => (
    <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.generatingTitle}>Desenhando seu projeto...</Text>
        <Text style={styles.generatingSubtitle}>Analisando as curvas da cidade e garantindo um percurso seguro.</Text>
    </View>
);

const ItineraryScreen = ({ itinerary }) => {
    if (!itinerary) {
        return <GeneratingScreen />;
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

const SplashScreenComponent = ({ onFinish }) => {
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

export default function App() {
  const [appState, setAppState] = useState('splash'); // splash, onboarding, loading, main
  const [itinerary, setItinerary] = useState(null);

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
        setAppState('onboarding'); // Volta ao onboarding em caso de erro
    }
  };
  
  const renderContent = () => {
      switch (appState) {
          case 'splash':
              return <SplashScreenComponent onFinish={() => setAppState('onboarding')} />;
          case 'onboarding':
              return <VoiceOnboarding onComplete={handleOnboardingComplete} />;
          case 'loading':
              return <GeneratingScreen />;
          case 'main':
              // Aqui você integraria sua navegação principal (Tab Navigator, etc.)
              // Por enquanto, exibimos diretamente a tela do roteiro.
              return <ItineraryScreen itinerary={itinerary} />;
          default:
              return <SplashScreenComponent onFinish={() => setAppState('onboarding')} />;
      }
  };

  return (
    // <ThemeProvider> // Descomente se você estiver usando seu ThemeProvider
      <View style={styles.container}>
        {renderContent()}
      </View>
    // </ThemeProvider>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7', paddingTop: Platform.OS === 'android' ? 25 : 0 },
    center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    splashTitle: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
    chatContainer: { padding: 10, paddingBottom: 20 },
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

