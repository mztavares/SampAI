// Serviço para gerar roteiros baseado nas respostas do usuário
// TODO: Integrar com Google Places API

// SEM dados mock - apenas API real do Google Maps

// Função para extrair valor real das respostas (remove objetos de evento)
const extractAnswerValue = (answer) => {
  if (!answer) return null;
  if (typeof answer === 'string') return answer;
  if (typeof answer === 'number') return answer.toString();
  
  // Se for um objeto de evento React, retorna null (não conseguimos extrair valor útil)
  if (answer._dispatchInstances || answer._dispatchListeners || answer._targetInst) {
    return null;
  }
  
  // Se for um objeto de evento, tenta extrair o valor
  if (answer.nativeEvent && answer.nativeEvent.text) return answer.nativeEvent.text;
  if (answer.target && answer.target.value) return answer.target.value;
  
  return null;
};

// Função para calcular compatibilidade baseada nas respostas
const calculateCompatibility = (location, userAnswers) => {
  let score = 0;
  
  // Compatibilidade por tipo de atividade
  const activities = extractAnswerValue(userAnswers.activities);
  if (activities) {
    const activityTypes = activities.toLowerCase();
    if (activityTypes.includes('cultura') && location.types.includes('culture')) score += 3;
    if (activityTypes.includes('gastronomia') && location.types.includes('restaurant')) score += 3;
    if (activityTypes.includes('natureza') && location.types.includes('park')) score += 3;
    if (activityTypes.includes('arte') && location.types.includes('museum')) score += 3;
    if (activityTypes.includes('vida noturna') && location.types.includes('nightlife')) score += 3;
  }

  // Compatibilidade por faixa etária
  const age = extractAnswerValue(userAnswers.age);
  if (age) {
    const ageNum = parseInt(age);
    if (ageNum < 25 && location.types.includes('nightlife')) score += 2;
    if (ageNum >= 25 && ageNum < 50 && location.types.includes('culture')) score += 2;
    if (ageNum >= 50 && location.types.includes('park')) score += 2;
  }

  // Compatibilidade por duração da viagem
  const duration = extractAnswerValue(userAnswers.duration);
  if (duration) {
    const durationNum = parseInt(duration);
    if (durationNum <= 1 && location.duration <= 120) score += 2; // Viagem curta, atividades rápidas
    if (durationNum >= 3 && location.duration >= 180) score += 2; // Viagem longa, atividades demoradas
  }

  // Compatibilidade por orçamento (priceLevel)
  const budget = extractAnswerValue(userAnswers.budget);
  if (budget) {
    const budgetStr = budget.toLowerCase();
    if (budgetStr.includes('econômico') && location.priceLevel <= 1) score += 2;
    if (budgetStr.includes('médio') && location.priceLevel <= 2) score += 2;
    if (budgetStr.includes('alto') && location.priceLevel >= 3) score += 2;
  }

  return score;
};

// Função para gerar roteiro baseado nas respostas
export const generateItinerary = async (userAnswers) => {
  console.log('Gerando roteiro com respostas:', userAnswers);
  
  // Simula delay da API
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // SEMPRE usar Google Places API se as respostas forem válidas
  if (userAnswers && Object.keys(userAnswers).length > 0) {
    try {
      console.log('🗺️ Usando Google Places API para gerar roteiro personalizado');
      const { generatePersonalizedItinerary } = require('./googlePlacesService');
      const apiResult = await generatePersonalizedItinerary(userAnswers);
      
      if (apiResult && apiResult.length > 0) {
        console.log('✅ Roteiro gerado pela API:', apiResult.length, 'locais');
        return {
          name: `Roteiro personalizado para ${userAnswers.activities || 'São Paulo'}`,
          items: apiResult,
          totalDuration: apiResult.reduce((sum, loc) => sum + (loc.duration || 120), 0),
          userAnswers: userAnswers
        };
      } else {
        console.log('⚠️ API retornou vazio, usando fallback');
      }
    } catch (error) {
      console.error('❌ Erro ao usar Google Places API:', error);
    }
  }
  
  // SEM dados mock - apenas API real
  console.log('❌ API falhou - retornando vazio');
  return {
    name: 'Nenhum roteiro disponível',
    items: [],
    totalDuration: 0,
    userAnswers: userAnswers
  };
};

// Função para buscar locais por query usando Google Places API
export const searchLocations = async (query, userLocation = null) => {
  console.log(`Buscando locais: "${query}"`);
  
  if (!query) return [];
  
  try {
    const { searchPlaces } = require('./googlePlacesService');
    return await searchPlaces(query, userLocation);
  } catch (error) {
    console.error('Erro ao buscar locais:', error);
    return [];
  }
};

// TODO: Integração futura com Google Places API
export const generateItineraryWithPlacesAPI = async (userAnswers, googleApiKey) => {
  console.log('🗺️ Usando Google Places API para gerar roteiro');
  console.log('API Key:', googleApiKey ? 'Configurada' : 'Não configurada');
  
  try {
    const { generatePersonalizedItinerary } = require('./googlePlacesService');
    return await generatePersonalizedItinerary(userAnswers);
  } catch (error) {
    console.error('Erro ao usar Google Places API:', error);
    // Fallback para método mock
    return generateItinerary(userAnswers);
  }
};
