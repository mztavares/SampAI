import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';
import { Audio } from 'expo-av';
import { styles } from './styles';

// --- CONFIGURAÇÃO ---
const BACKEND_URL = 'https://sampai.onrender.com'; 

// Ícones simples
const BotIcon = () => <Text style={styles.iconStyle}>🤖</Text>;
const MicIcon = () => <Text style={styles.iconStyle}>🎤</Text>;

// --- MAPEAMENTO DE PERGUNTAS PARA O FORMATO ESPERADO ---
const PERGUNTAS_ROTEIRO = [
  {
    id: 'motivo_visita',
    pergunta: 'Qual o motivo principal da sua visita em SP ou o que gostaria de fazer na cidade?',
    opcoes: [
      'Turismo',
      'Trabalho',
      'Visitar familiares ou amigos',
      'Evento (show, festival...)',
      'É morador e pretende explorar mais a cidade',
    ],
    mapearPara: 'reason'
  },
  {
    id: 'regiao',
    pergunta: 'Qual região de SP pretende se instalar?',
    opcoes: [
      'Região central da cidade',
      'Zonas periféricas da cidade',
      'Zona comercial',
      'Próximo de parques',
    ],
    mapearPara: 'region'
  },
  {
    id: 'tipo_comida',
    pergunta: 'Qual tipo de restaurante/comida você mais gosta?',
    opcoes: [
      'Brasileira',
      'Italiana',
      'Japonesa',
      'Fast Food',
      'Culinária Internacional',
      'Vegetariana/Vegana',
    ],
    mapearPara: 'food'
  },
  {
    id: 'interesses',
    pergunta: 'O que você costuma procurar mais no local novo?',
    opcoes: [
      'Bares/Restaurantes',
      'Shows/Eventos',
      'Baladas',
      'Museus e exposições',
      'Parques',
      'Teatro/Orquestras',
      'Arquitetura/Locais onde viveram grandes artistas',
    ],
    mapearPara: 'activities'
  },
  {
    id: 'faixa_etaria',
    pergunta: 'Qual a sua idade?',
    opcoes: [
      '15 a 19 anos',
      '20 a 30 anos',
      '30 a 50 anos',
      '50 anos ou mais',
    ],
    mapearPara: 'age'
  },
  {
    id: 'tempo_lazer',
    pergunta: 'Quanto tempo do seu dia você costuma gastar ao visitar algum local por lazer?',
    opcoes: [
      '1 a 2 horas',
      '2 a 4 horas',
      '5 a 8 horas',
    ],
    mapearPara: 'duration'
  },
  {
    id: 'tempo_estadia',
    pergunta: 'Por quanto tempo você vai ficar em São Paulo?',
    opcoes: [
      '1 dia',
      '2-3 dias',
      '4-7 dias',
      'Mais de uma semana',
      'Moro aqui',
    ],
    mapearPara: 'stay'
  },
  {
    id: 'periodo_preferido',
    pergunta: 'Qual período do dia você prefere para suas atividades?',
    opcoes: [
      'Manhã',
      'Tarde',
      'Noite',
      'Madrugada',
      'Flexível',
    ],
    mapearPara: 'schedule'
  }
];

const OnboardingScreen = ({ onNext }) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const conversationHistory = useRef([]);
  const scrollViewRef = useRef();
  const perguntaAtualIndex = useRef(0);
  const respostasValidadas = useRef({});

  useEffect(() => {
    Voice.onSpeechResults = async (event) => {
      const text = event.value[0];
      setMessages(prev => [...prev, { from: 'user', text }]);
      try {
        await Voice.stop();
      } catch (e) {
        console.warn("Erro ao parar reconhecimento:", e);
      }
      handleConversation(text);
    };

    Voice.onSpeechError = (error) => {
      console.log("Erro no reconhecimento de voz:", error);
      setStatus('idle');
    };

    // Iniciar conversa
    // handleConversation('', true);

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const extrairResposta = (textoIA) => {
    const perguntaAtual = PERGUNTAS_ROTEIRO[perguntaAtualIndex.current];
    
    // Tenta encontrar menções às opções no texto da IA
    for (const opcao of perguntaAtual.opcoes) {
      const palavrasChave = opcao.toLowerCase().split(' ');
      const textoLower = textoIA.toLowerCase();
      // Extract text from between # symbols
      const regex = /#(.*?)#/;
      const match = textoLower.match(regex);
      if (match && match[1]) {
        const respostaExtraida = match[1].trim();
        if (perguntaAtual.opcoes.map(o => o.toLowerCase()).includes(respostaExtraida.toLowerCase())) {
          return respostaExtraida;
        }
      
    }
    
    return null;
  }};

  const handleConversation = async (userText, isInitial = false) => {
    if (!isInitial && userText) {
      conversationHistory.current.push({ role: "user", parts: [{ text: userText }] });
    }
    setStatus('thinking');

    try {
      const todasRespostasColetadas = perguntaAtualIndex.current >= PERGUNTAS_ROTEIRO.length;

      if (todasRespostasColetadas) {
        console.log("✅ Todas as respostas coletadas:", respostasValidadas.current);
        
        // Mapear respostas para o formato esperado pelo GeneratingScreen
        const userAnswers = {};
        PERGUNTAS_ROTEIRO.forEach(pergunta => {
          const respostaValidada = respostasValidadas.current[pergunta.id];
          if (respostaValidada && pergunta.mapearPara) {
            userAnswers[pergunta.mapearPara] = respostaValidada;
          }
        });

        console.log("📋 Dados formatados para GeneratingScreen:", userAnswers);

        // Mensagem final antes de avançar
        const mensagemFinal = 'Perfeito! A base do nosso projeto está definida. Permita-me um momento para desenhar as linhas do seu roteiro...';
        setMessages(prev => [...prev, { from: 'ai', text: mensagemFinal }]);
        
        // Tentar reproduzir áudio final (opcional)

        // Avançar para GeneratingScreen após 2 segundos
        setTimeout(() => {
          onNext(userAnswers);
        }, 2000);

        setStatus('idle');
        return;
      }

      const perguntaAtual = PERGUNTAS_ROTEIRO[perguntaAtualIndex.current];
      const proximaPergunta = PERGUNTAS_ROTEIRO[perguntaAtualIndex.current + 1];

      const systemPrompt = `Você é a consciência digital de Oscar Niemeyer. 
Sua missão é ser um amigo e parceiro de viagem para quem explora São Paulo. 
Fale com poesia, calor e bom humor. Seja BREVE e natural.

${isInitial ? `
Faça diretamente a primeira pergunta: "${PERGUNTAS_ROTEIRO[0].pergunta}"

As opções são: ${PERGUNTAS_ROTEIRO[0].opcoes.join(', ')}.
` : `
CONTEXTO: Você está coletando informações para criar um roteiro personalizado em São Paulo.

Pergunta atual: "${perguntaAtual.pergunta}"
Opções válidas: ${perguntaAtual.opcoes.join(', ')}

Resposta do usuário: "${userText}"

INSTRUÇÕES:
1. Analise a resposta do usuário e identifique qual opção ela mais se aproxima
2. Se a resposta for clara e mapear bem para uma das opções:
   - Confirme de forma breve e natural (ex: "Ótimo!", "Perfeito!", "Entendi!")
   - Mencione a opção identificada sutilmente na sua resposta: Sempre coloque a opcao identificada entre # e #
   - Faça imediatamente a próxima pergunta: "${proximaPergunta ? proximaPergunta.pergunta : ''}"
   ${proximaPergunta ? `- As opções da próxima são: ${proximaPergunta.opcoes.join(', ')}` : ''}


3. Se a resposta for ambígua ou não mapear bem:
   - Peça esclarecimento gentilmente
   - Sugira as opções mais próximas

Exemplos de mapeamento:
- "Vim passear" → confirme mencionando "turismo"
- "Trabalho mesmo" → confirme mencionando "trabalho"  
- "Ver meus amigos" → confirme mencionando "visitar familiares ou amigos"
- "Comida japonesa" → confirme mencionando "japonesa"
- "Tenho 25" → confirme com "20 a 30 anos"

Seja NATURAL e CONVERSACIONAL. Não liste opções a menos que necessário.
`}`;

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationHistory: conversationHistory.current, 
          systemPrompt
        })
      });

      const data = await response.json();
      const { text: aiTextResponse, audio: audioBase64 } = data;

      console.log('💬 Resposta da IA:', aiTextResponse);

      conversationHistory.current.push({ role: "model", parts: [{ text: aiTextResponse }] });
      setMessages(prev => [...prev, { from: 'ai', text: aiTextResponse }]);

      // Tentar extrair a resposta validada do texto da IA
      if (!isInitial) {
        const respostaExtraida = extrairResposta(aiTextResponse);
        
        // Se a IA mencionou uma das opções E fez a próxima pergunta, consideramos validado
        const fezProximaPergunta = proximaPergunta && aiTextResponse.toLowerCase().includes(proximaPergunta.pergunta.toLowerCase().substring(0, 20));
        
        // if (respostaExtraida && fezProximaPergunta) {
        //   respostasValidadas.current[perguntaAtual.id] = respostaExtraida;
        //   perguntaAtualIndex.current++;
        //   console.log('✅ Resposta validada:', perguntaAtual.id, '=', respostaExtraida);
        //   console.log(`📊 Progresso: ${perguntaAtualIndex.current}/${PERGUNTAS_ROTEIRO.length}`);
        // }
        if (respostaExtraida) {
          respostasValidadas.current[perguntaAtual.id] = respostaExtraida;
          perguntaAtualIndex.current++;
          console.log('✅ Resposta validada:', perguntaAtual.id, '=', respostaExtraida);
          console.log(`📊 Progresso: ${perguntaAtualIndex.current}/${PERGUNTAS_ROTEIRO.length}`);
        }

      }

      // Reproduzir áudio
      if (audioBase64) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: `data:audio/mpeg;base64,${audioBase64}` }
          );
          await sound.playAsync();
        } catch (audioError) {
          console.warn("Erro ao reproduzir áudio:", audioError);
        }
      }

    } catch (error) {
      console.error('Erro na conversa:', error);
      setMessages(prev => [...prev, { from: 'ai', text: 'Ops! Tivemos um problema. Pode repetir?' }]);
    } finally {
      setStatus('idle');
    }
  };

  const handleMicPress = async () => {
    try {
      setStatus('listening');
      await Voice.start('pt-BR');

      // Timeout de segurança (8s)
      setTimeout(async () => {
        try {
          await Voice.stop();
          setStatus('idle');
        } catch (e) {
          console.warn("Erro ao parar no timeout:", e);
        }
      }, 8000);

    } catch (e) {
      console.error("Erro ao iniciar voz:", e);
      setStatus('idle');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>
          Seja bem-vindo ao <Text style={styles.welcomeHighlight}>SampAI!</Text> 👋{"\n"}
          Vamos criar um roteiro juntos. Primeiro, me diga qual sua intenção em São Paulo?
        </Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => (
          <View key={index} style={[styles.messageBubble, msg.from === 'user' ? styles.userBubble : styles.aiBubble]}>
            {msg.from === 'ai' && <BotIcon />}
            <Text style={msg.from === 'user' ? styles.userText : styles.aiText}>{msg.text}</Text>
          </View>
        ))}
        {status === 'thinking' && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <BotIcon />
            <ActivityIndicator size="small" color="#007bff" style={{ marginLeft: 8 }} />
            <Text style={styles.aiText}>Pensando...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.micContainer}>
        <TouchableOpacity onPress={handleMicPress} style={styles.micButton} disabled={status !== 'idle'}>
          {status === 'thinking' ? <ActivityIndicator color="#fff" /> : <MicIcon />}
        </TouchableOpacity>
        <Text style={styles.statusText}>
          {status === 'idle' ? 'Pressione para falar' : 
           status === 'listening' ? 'Ouvindo...' : 'Pensando...'}
        </Text>
        {/* Indicador de progresso */}
        <Text style={styles.progressText}>
          Pergunta {Math.min(perguntaAtualIndex.current + 1, PERGUNTAS_ROTEIRO.length)} de {PERGUNTAS_ROTEIRO.length}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f0f4f7', paddingTop: Platform.OS === 'android' ? 25 : 0 },
//   chatContainer: { padding: 10, paddingBottom: 20 },
//   messageBubble: { padding: 12, borderRadius: 18, marginBottom: 10, maxWidth: '85%', flexDirection: 'row', alignItems: 'center' },
//   aiBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderTopLeftRadius: 5, elevation: 1 },
//   userBubble: { backgroundColor: '#007bff', alignSelf: 'flex-end', borderTopRightRadius: 5, elevation: 1 },
//   aiText: { color: '#333', fontSize: 16, marginLeft: 8, flexShrink: 1 },
//   userText: { color: '#fff', fontSize: 16 },
//   micContainer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e7e7e7', alignItems: 'center' },
//   micButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center', elevation: 5 },
//   statusText: { marginTop: 10, color: '#666' },
//   progressText: { marginTop: 5, color: '#999', fontSize: 12 },
//   iconStyle: { fontSize: 24, color: '#fff' },
// });