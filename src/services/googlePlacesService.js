// Serviço para integração com Google Places API
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';

// Função para buscar detalhes completos de um local
export const getPlaceDetails = async (placeId) => {
  try {
    console.log('🔍 Buscando detalhes do local:', placeId);
    
    if (!placeId) {
      console.error('❌ Place ID não fornecido');
      return null;
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ API Key não encontrada');
      return null;
    }
    
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      language: 'pt-BR',
      region: 'br',
      fields: 'name,formatted_address,geometry,rating,user_ratings_total,price_level,opening_hours,photos,reviews,website,formatted_phone_number,international_phone_number,types,vicinity,permanently_closed,utc_offset,adr_address,address_components,editorial_summary,business_status,place_id'
    });

    const fullUrl = `${baseUrl}?${params}`;
    console.log('🔍 Buscando detalhes:', placeId);
    console.log('🌐 URL completa:', fullUrl);

    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      console.error('❌ Erro na resposta HTTP:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('📡 Resposta da API de detalhes:', data);
    console.log('📝 Editorial Summary:', data.result?.editorial_summary);
    console.log('📝 Reviews disponíveis:', data.result?.reviews?.length || 0);
    console.log('📝 Business Status:', data.result?.business_status);

    if (data.status === 'OK' && data.result) {
      const place = data.result;
      
      // Processar horários de funcionamento
      const openingHours = place.opening_hours ? {
        openNow: place.opening_hours.open_now,
        periods: place.opening_hours.periods || [],
        weekdayText: place.opening_hours.weekday_text || []
      } : null;
      
      // Processar fotos
      const photos = place.photos ? place.photos.map(photo => ({
        photo_reference: photo.photo_reference,
        height: photo.height,
        width: photo.width,
        html_attributions: photo.html_attributions
      })) : [];
      
      // Processar avaliações
      const reviews = place.reviews ? place.reviews.map(review => ({
        author_name: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relative_time_description: review.relative_time_description
      })) : [];
      
      // Determinar status em tempo real
      const isOpen = openingHours ? openingHours.openNow : null;
      const statusText = isOpen === true ? 'Aberto agora' : 
                        isOpen === false ? 'Fechado agora' : 
                        'Status não disponível';
      
      // Determinar nível de preço
      const priceLevelText = place.price_level === 0 ? 'Gratuito' :
                            place.price_level === 1 ? 'Barato' :
                            place.price_level === 2 ? 'Moderado' :
                            place.price_level === 3 ? 'Caro' :
                            place.price_level === 4 ? 'Muito caro' :
                            'Preço não informado';
      
      // Determinar acessibilidade
      const accessibility = {
        wheelchairAccessible: place.types?.includes('wheelchair_accessible_entrance') || false,
        hasAccessibleParking: place.types?.includes('accessible_parking') || false,
        hasAccessibleRestroom: place.types?.includes('accessible_restroom') || false
      };
      
      const processedPlace = {
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        address_components: place.address_components || [],
        geometry: place.geometry,
        rating: place.rating || 0,
        user_ratings_total: place.user_ratings_total || 0,
        price_level: place.price_level,
        price_level_text: priceLevelText,
        opening_hours: openingHours,
        photos: photos,
        reviews: reviews,
        website: place.website,
        formatted_phone_number: place.formatted_phone_number,
        international_phone_number: place.international_phone_number,
        types: place.types || [],
        vicinity: place.vicinity,
        permanently_closed: place.permanently_closed || false,
        utc_offset: place.utc_offset,
        adr_address: place.adr_address,
        is_open: isOpen,
        status_text: statusText,
        accessibility: accessibility,
        // Adicionar descrição baseada no tipo de local
        description: generateLocationDescription(processedPlace) || 'Descrição não disponível para este local.',
        // Adicionar breve história baseada no tipo de local
        history: await getRealLocationHistory(processedPlace) || generateLocationHistory(processedPlace.name, processedPlace.types, place)
      };
      
      console.log('✅ Detalhes processados:', processedPlace.name);
      return processedPlace;
    } else {
      console.error('❌ Erro na API:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('💥 Erro ao buscar detalhes:', error);
    return null;
  }
};

// Função para gerar descrição do local baseada no tipo
const generateLocationDescription = (place) => {
  try {
    // Verificar se o objeto place existe e tem as propriedades necessárias
    if (!place || typeof place !== 'object') {
      console.log('⚠️ Place object is undefined or invalid');
      return 'Este é um local de interesse que oferece uma experiência única para seus visitantes.';
    }
    
    const name = place.name || 'Local';
    const types = place.types || [];
    const rating = place.rating || 0;
    const priceLevel = place.price_level;
    const editorialSummary = place.editorial_summary;
    const businessStatus = place.business_status;
    
    console.log('🔍 Dados do local para descrição:', {
      name: name,
      types: types,
      rating: rating,
      priceLevel: priceLevel,
      hasEditorialSummary: !!editorialSummary,
      editorialOverview: editorialSummary?.overview,
      reviewsCount: place.reviews?.length || 0,
      businessStatus: businessStatus
    });
    
    // Se temos um resumo editorial da API, usar ele
    if (editorialSummary && editorialSummary.overview) {
      console.log('📝 Usando resumo editorial da API:', editorialSummary.overview);
      return editorialSummary.overview;
    }
    
    // Se temos reviews, usar a primeira como descrição
    if (place.reviews && place.reviews.length > 0) {
      const firstReview = place.reviews[0];
      if (firstReview.text && firstReview.text.length > 30) {
        console.log('📝 Usando review como descrição');
        return firstReview.text.substring(0, 250) + '...';
      }
    }
    
    // Determinar tipo principal
    const mainType = types[0] || '';
    
    let description = '';
    
    if (mainType.includes('restaurant') || mainType.includes('food')) {
    description = `${name} é um estabelecimento gastronômico que oferece uma experiência culinária única. `;
    if (rating >= 4.0) {
      description += `Com excelente avaliação (${rating}/5), este local é altamente recomendado pelos visitantes. `;
    }
    if (priceLevel === 0) {
      description += `O local oferece opções gratuitas ou muito acessíveis.`;
    } else if (priceLevel <= 2) {
      description += `Com preços moderados, é uma ótima opção para uma refeição.`;
    } else {
      description += `Um local mais sofisticado, ideal para ocasiões especiais.`;
    }
  } else if (mainType.includes('museum') || mainType.includes('art_gallery')) {
    description = `${name} é um espaço cultural dedicado à preservação e apresentação de arte e conhecimento. `;
    description += `Este local oferece uma experiência educativa e enriquecedora para visitantes de todas as idades. `;
    if (rating >= 4.0) {
      description += `Com avaliação excepcional (${rating}/5), é considerado um dos melhores espaços culturais da região.`;
    }
  } else if (mainType.includes('park') || mainType.includes('garden')) {
    description = `${name} é um espaço verde que proporciona tranquilidade e contato com a natureza. `;
    description += `Ideal para relaxamento, atividades ao ar livre e momentos de paz no coração da cidade. `;
    if (rating >= 4.0) {
      description += `Com excelente avaliação (${rating}/5), é um dos parques mais apreciados pelos visitantes.`;
    }
  } else if (mainType.includes('shopping_mall') || mainType.includes('store')) {
    description = `${name} é um centro comercial que atende às necessidades da comunidade local. `;
    description += `Oferece uma variedade de lojas, serviços e opções de entretenimento. `;
    if (rating >= 4.0) {
      description += `Com boa avaliação (${rating}/5), é um local confiável para compras e serviços.`;
    }
  } else if (mainType.includes('nightlife') || mainType.includes('bar')) {
    description = `${name} é um estabelecimento de vida noturna que oferece entretenimento e socialização. `;
    description += `Ideal para momentos de descontração e encontros com amigos. `;
    if (rating >= 4.0) {
      description += `Com excelente avaliação (${rating}/5), é um dos locais mais populares da noite.`;
    }
  } else if (mainType.includes('tourist_attraction') || mainType.includes('landmark')) {
    description = `${name} é um ponto turístico importante que representa a identidade e história da região. `;
    description += `Um local imperdível para visitantes que desejam conhecer os principais atrativos da cidade. `;
    if (rating >= 4.0) {
      description += `Com avaliação excepcional (${rating}/5), é considerado um dos melhores pontos turísticos.`;
    }
  } else {
    description = `${name} é um local de interesse que contribui para a rica diversidade da região. `;
    description += `Oferece uma experiência única e autêntica para seus visitantes. `;
    if (rating >= 4.0) {
      description += `Com boa avaliação (${rating}/5), é um local confiável e bem recomendado.`;
    }
  }
  
  // Se chegou até aqui, sempre retornar uma descrição
  if (!description || description.trim().length === 0) {
    description = `${name} é um local interessante que vale a pena visitar. `;
    if (rating > 0) {
      description += `Com avaliação de ${rating}/5 estrelas, é um local bem avaliado pelos visitantes.`;
    }
  }
  
  console.log('📝 Descrição final gerada:', description);
  return description;
  } catch (error) {
    console.error('💥 Erro ao gerar descrição do local:', error);
    return `${name || 'Este local'} é um estabelecimento que oferece uma experiência única e vale a pena conhecer.`;
  }
};

// Função para gerar breve história do local baseada no tipo
const generateLocationHistory = (name, types, place = null) => {
  console.log('📖 Gerando história para:', name, 'Tipos:', types);
  
  // Se temos dados do lugar, tentar usar informações mais específicas
  if (place && place.reviews && place.reviews.length > 0) {
    // Procurar por reviews que mencionem história ou contexto
    const historicalReview = place.reviews.find(review => 
      review.text && (
        review.text.toLowerCase().includes('história') ||
        review.text.toLowerCase().includes('tradição') ||
        review.text.toLowerCase().includes('antigo') ||
        review.text.toLowerCase().includes('clássico') ||
        review.text.toLowerCase().includes('famoso') ||
        review.text.toLowerCase().includes('conhecido') ||
        review.text.toLowerCase().includes('importante') ||
        review.text.toLowerCase().includes('símbolo')
      )
    );
    
    if (historicalReview) {
      console.log('📖 Usando review com contexto histórico');
      return historicalReview.text.substring(0, 300) + '...';
    }
  }
  
  const type = types[0] || '';
  const rating = place?.rating || 0;
  
  // Gerar história mais específica baseada no tipo
  if (type.includes('restaurant') || type.includes('food')) {
    let history = `${name} é um estabelecimento gastronômico que representa a rica cultura culinária da região. `;
    if (rating >= 4.0) {
      history += `Com excelente reputação (${rating}/5 estrelas), este local é conhecido pela qualidade de seus pratos e atendimento. `;
    }
    history += `Oferece uma experiência gastronômica autêntica que combina tradição e inovação.`;
    return history;
  } else if (type.includes('museum') || type.includes('art_gallery')) {
    let history = `${name} é um espaço cultural dedicado à preservação e apresentação de arte e conhecimento. `;
    if (rating >= 4.0) {
      history += `Com avaliação excepcional (${rating}/5 estrelas), é considerado um dos melhores espaços culturais da região. `;
    }
    history += `Este local oferece uma experiência educativa e enriquecedora para visitantes de todas as idades.`;
    return history;
  } else if (type.includes('park') || type.includes('garden')) {
    let history = `${name} é um espaço verde que proporciona tranquilidade e contato com a natureza no coração da cidade. `;
    if (rating >= 4.0) {
      history += `Com excelente avaliação (${rating}/5 estrelas), é um dos parques mais apreciados pelos visitantes. `;
    }
    history += `Ideal para relaxamento, atividades ao ar livre e momentos de paz em meio ao ambiente urbano.`;
    return history;
  } else if (type.includes('shopping_mall') || type.includes('store')) {
    let history = `${name} é um centro comercial que atende às necessidades da comunidade local. `;
    if (rating >= 4.0) {
      history += `Com boa reputação (${rating}/5 estrelas), oferece uma variedade de lojas e serviços de qualidade. `;
    }
    history += `Este estabelecimento faz parte do cotidiano dos moradores da região.`;
    return history;
  } else if (type.includes('tourist_attraction') || type.includes('landmark')) {
    let history = `${name} é um ponto turístico importante que representa a identidade e história da região. `;
    if (rating >= 4.0) {
      history += `Com avaliação excepcional (${rating}/5 estrelas), é considerado um dos melhores pontos turísticos. `;
    }
    history += `Um local imperdível para visitantes que desejam conhecer os principais atrativos da cidade.`;
    return history;
  } else {
    let history = `${name} é um local de interesse que contribui para a rica diversidade da região. `;
    if (rating >= 4.0) {
      history += `Com boa avaliação (${rating}/5 estrelas), é um local confiável e bem recomendado. `;
    }
    history += `Oferece uma experiência única e autêntica para seus visitantes.`;
    return history;
  }
};

// Função para buscar lugares usando Google Places API
export const searchPlaces = async (query, location = null, radius = 5000) => {
  try {
    console.log('🔍 Iniciando busca de lugares para:', query);
    
    if (!query || typeof query !== 'string') {
      console.error('❌ Query inválida:', query);
      return [];
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ API Key não encontrada');
      return [];
    }
    
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const params = new URLSearchParams({
      query: query,
      key: GOOGLE_MAPS_API_KEY,
      language: 'pt-BR',
      region: 'br'
    });

    if (location) {
      params.append('location', `${location.latitude},${location.longitude}`);
      params.append('radius', radius.toString());
    }

    const fullUrl = `${baseUrl}?${params}`;
    console.log('🔍 Buscando lugares:', query);
    console.log('🌐 URL completa:', fullUrl);
    console.log('🔑 API Key (primeiros 10 chars):', GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');

    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      console.error('❌ Erro na resposta HTTP:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('📡 Resposta da API:', data);

    if (data.status === 'OK') {
      console.log(`✅ Encontrados ${data.results.length} lugares para "${query}"`);
      
      // Usar dados básicos da Text Search (mais confiável)
      const placesWithDetails = data.results.map((place, index) => {
        try {
          return {
            id: place.place_id || `place-${Date.now()}-${index}`,
            name: place.name || 'Nome não disponível',
            rating: place.rating || 0,
            priceLevel: place.price_level || 0,
            location: {
              lat: place.geometry?.location?.lat || -23.5505,
              lng: place.geometry?.location?.lng || -46.6333
            },
            types: place.types || [],
            address: place.formatted_address || place.vicinity || 'Endereço não disponível',
            formattedAddress: place.formatted_address,
            openNow: place.opening_hours?.open_now || false,
            userRatingsTotal: place.user_ratings_total || 0,
            photos: place.photos || [],
            businessStatus: place.business_status || 'OPERATIONAL'
          };
        } catch (error) {
          console.error('❌ Erro ao processar lugar:', error, place);
          return {
            id: `place-error-${Date.now()}-${index}`,
            name: 'Nome não disponível',
            rating: 0,
            priceLevel: 0,
            location: { lat: -23.5505, lng: -46.6333 },
            types: [],
            address: 'Endereço não disponível',
            formattedAddress: 'Endereço não disponível',
            openNow: false,
            userRatingsTotal: 0,
            photos: [],
            businessStatus: 'OPERATIONAL'
          };
        }
      });
      
      console.log('✅ Lugares processados:', placesWithDetails.length);
      return placesWithDetails;
    } else if (data.status === 'ZERO_RESULTS') {
      console.log(`⚠️ Nenhum resultado encontrado para "${query}"`);
      return [];
    } else {
      console.error('❌ Erro na API do Google Places:', data.status, data.error_message);
      console.error('📋 Detalhes do erro:', data);
      
      // Se for erro de billing, mostrar instruções claras
      if (data.status === 'REQUEST_DENIED' && data.error_message?.includes('Billing')) {
        console.error('💳 ERRO: Billing não habilitado na Google Cloud Console');
        console.error('🔧 SOLUÇÃO: Habilite o billing no Google Cloud Console para usar a API');
      }
      
      return [];
    }
  } catch (error) {
    console.error('💥 Erro ao buscar lugares:', error);
    console.error('💥 Stack trace:', error.stack);
    return [];
  }
};


// Função para buscar lugares baseado nas respostas do usuário
const searchPlacesBasedOnAnswers = async (userAnswers) => {
  const activities = userAnswers.activities || '';
  const food = userAnswers.food || '';
  const region = userAnswers.region || 'São Paulo';
  const age = userAnswers.age || '';
  const schedule = userAnswers.schedule || '';
  
  let searchQueries = [];
  
  // Buscas mais específicas baseadas nas atividades
  if (activities.includes('Museus e exposições')) {
    searchQueries.push('museus em São Paulo');
    searchQueries.push('MASP São Paulo');
    searchQueries.push('Pinacoteca São Paulo');
    searchQueries.push('Museu Catavento São Paulo');
    searchQueries.push('centros culturais em São Paulo');
  }
  
  if (activities.includes('Parques')) {
    searchQueries.push('Parque Ibirapuera São Paulo');
    searchQueries.push('Parque Villa-Lobos São Paulo');
    searchQueries.push('Parque da Água Branca São Paulo');
    searchQueries.push('parques em São Paulo');
  }
  
  if (activities.includes('Bares/Restaurantes')) {
    searchQueries.push('restaurantes em São Paulo');
    searchQueries.push('bares em São Paulo');
    searchQueries.push('cafés em São Paulo');
    searchQueries.push('lanchonetes em São Paulo');
  }
  
  if (activities.includes('Baladas')) {
    searchQueries.push('Vila Madalena São Paulo');
    searchQueries.push('vida noturna em São Paulo');
    searchQueries.push('bares noturnos em São Paulo');
  }
  
  if (activities.includes('Shows/Eventos')) {
    searchQueries.push('Teatro Municipal São Paulo');
    searchQueries.push('teatros em São Paulo');
    searchQueries.push('casas de show em São Paulo');
  }
  
  // Buscas específicas por comida
  if (food && food !== 'Brasileira') {
    searchQueries.push(`restaurantes ${food.toLowerCase()} em São Paulo`);
    searchQueries.push(`comida ${food.toLowerCase()} em São Paulo`);
  }
  
  // Buscas adicionais baseadas na idade
  if (age.includes('Família') || age.includes('Criança')) {
    searchQueries.push('atrações familiares em São Paulo');
    searchQueries.push('parques infantis em São Paulo');
    searchQueries.push('zoológico em São Paulo');
  }
  
  if (age.includes('Jovem')) {
    searchQueries.push('vida noturna jovem em São Paulo');
    searchQueries.push('festas em São Paulo');
  }
  
  // Buscas baseadas no horário
  if (schedule.includes('Manhã')) {
    searchQueries.push('cafés da manhã em São Paulo');
    searchQueries.push('padarias em São Paulo');
  }
  
  if (schedule.includes('Noite')) {
    searchQueries.push('restaurantes noturnos em São Paulo');
    searchQueries.push('bares noturnos em São Paulo');
  }
  
  console.log('🔍 Queries para API:', searchQueries);
  console.log(`📊 Total de queries: ${searchQueries.length}`);
  
  // Buscar lugares usando a API
  const allPlaces = [];
  for (const query of searchQueries) {
    try {
      console.log(`🔍 Buscando: ${query}`);
      const places = await searchPlaces(query);
      console.log(`📍 Encontrados ${places.length} lugares para: ${query}`);
      allPlaces.push(...places);
    } catch (error) {
      console.error(`❌ Erro ao buscar: ${query}`, error);
    }
  }
  
  // Remover duplicatas baseado no ID
  const uniquePlaces = allPlaces.filter((place, index, self) => 
    index === self.findIndex(p => p.id === place.id)
  );
  
  console.log(`✅ Total de lugares únicos encontrados: ${uniquePlaces.length}`);
  console.log('📍 Nomes dos lugares:', uniquePlaces.map(p => p.name));
  
  // Ordenar por relevância (rating + user_ratings_total)
  const sortedPlaces = uniquePlaces.sort((a, b) => {
    const scoreA = (a.rating || 0) * Math.log((a.userRatingsTotal || 1) + 1);
    const scoreB = (b.rating || 0) * Math.log((b.userRatingsTotal || 1) + 1);
    return scoreB - scoreA;
  });
  
  console.log('🏆 Melhores lugares por relevância:', sortedPlaces.slice(0, 10).map(p => `${p.name} (${p.rating}⭐)`));
  
  return sortedPlaces.slice(0, 5); // Retornar apenas os 5 melhores
};

// Função principal para gerar roteiro personalizado
export const generatePersonalizedItinerary = async (userAnswers) => {
  console.log('🎯 Gerando roteiro personalizado para:', userAnswers);
  
  try {
    // Usar API real do Google Places
    const places = await searchPlacesBasedOnAnswers(userAnswers);
    
    console.log('📍 Lugares encontrados pela API:', places.length);
    
    if (places.length === 0) {
      console.log('⚠️ Nenhum lugar encontrado pela API, tentando buscas genéricas...');
      
      // Buscar lugares genéricos como fallback
      const fallbackQueries = [
        'pontos turísticos em São Paulo',
        'atrações em São Paulo',
        'lugares famosos em São Paulo',
        'MASP São Paulo',
        'Parque Ibirapuera São Paulo'
      ];
      
      for (const query of fallbackQueries) {
        const morePlaces = await searchPlaces(query);
        places.push(...morePlaces);
        
        if (places.length >= 5) break;
      }
      
      if (places.length === 0) {
        console.log('❌ Nenhum lugar encontrado mesmo com buscas genéricas');
        return [];
      }
    }
    
    // Limitar a exatamente 5 locais
    const finalItems = places.slice(0, 5);
    console.log('✅ Locais finais no roteiro:', finalItems.length);
    console.log('📍 Nomes dos locais finais:', finalItems.map(p => p.name));
    
    // Adicionar horários inteligentes aos itens
    const itemsWithSchedule = addIntelligentSchedule(finalItems, userAnswers);
    
    return itemsWithSchedule;
  } catch (error) {
    console.error('💥 Erro ao gerar roteiro:', error);
    return [];
  }
};


// Função para adicionar horários inteligentes aos itens
const addIntelligentSchedule = (items, userAnswers) => {
  const schedule = userAnswers.schedule || 'Manhã';
  const duration = userAnswers.duration || '1 a 2 horas';
  const age = userAnswers.age || 'Adulto';
  
  console.log('⏰ Aplicando horários baseados em:', { schedule, duration, age });
  
  // Determinar período de tempo baseado na duração
  let startHour = 9;
  let endHour = 17;
  
  if (schedule.includes('Manhã')) {
    startHour = 8;
    endHour = 12;
  } else if (schedule.includes('Tarde')) {
    startHour = 12;
    endHour = 18;
  } else if (schedule.includes('Noite')) {
    startHour = 18;
    endHour = 23;
  }
  
  // Ajustar baseado na duração
  if (duration.includes('1 a 2 horas')) {
    endHour = startHour + 2;
  } else if (duration.includes('2 a 4 horas')) {
    endHour = startHour + 4;
  } else if (duration.includes('4 a 6 horas')) {
    endHour = startHour + 6;
  }
  
  // Ajustar baseado na idade
  if (age.includes('Criança') || age.includes('Família')) {
    endHour = Math.min(endHour, 20); // Famílias terminam mais cedo
  } else if (age.includes('Jovem')) {
    startHour = Math.max(startHour, 18); // Jovens começam mais tarde
  }
  
  console.log(`⏰ Período de tempo: ${startHour}h às ${endHour}h`);
  
  // Ordenar itens por prioridade (museus primeiro, restaurantes no meio, vida noturna por último)
  const sortedItems = [...items].sort((a, b) => {
    const aTypes = a.types || [];
    const bTypes = b.types || [];
    
    // Museus e parques primeiro
    if (aTypes.includes('museum') || aTypes.includes('park')) return -1;
    if (bTypes.includes('museum') || bTypes.includes('park')) return 1;
    
    // Restaurantes no meio
    if (aTypes.includes('restaurant') || aTypes.includes('food')) return -1;
    if (bTypes.includes('restaurant') || bTypes.includes('food')) return 1;
    
    // Vida noturna por último
    if (aTypes.includes('nightlife') || aTypes.includes('bar')) return 1;
    if (bTypes.includes('nightlife') || bTypes.includes('bar')) return -1;
    
    return 0;
  });
  
  // Criar sequência cronológica lógica com horários únicos
  const usedHours = new Set();
  const itemsWithTimes = sortedItems.map((item, index) => {
    const types = item.types || [];
    let suggestedHour = startHour + index;
    
    // Garantir horário único
    while (usedHours.has(suggestedHour) && suggestedHour < endHour) {
      suggestedHour++;
    }
    
    // Se não conseguir horário único, usar sequencial
    if (suggestedHour >= endHour) {
      suggestedHour = startHour + index;
    }
    
    usedHours.add(suggestedHour);
    
    // Formatar horário
    const timeString = `${suggestedHour.toString().padStart(2, '0')}:00`;
    
    console.log(`📍 ${item.name}: ${timeString} (${types.join(', ')}) - ${schedule}`);
    
    return {
      ...item,
      time: timeString
    };
  });
  
  // Ordenar por horário para garantir sequência cronológica
  const sortedByTime = itemsWithTimes.sort((a, b) => {
    const timeA = parseInt(a.time.split(':')[0]);
    const timeB = parseInt(b.time.split(':')[0]);
    return timeA - timeB;
  });
  
  console.log('⏰ Roteiro ordenado cronologicamente:');
  sortedByTime.forEach((item, index) => {
    console.log(`${index + 1}. ${item.time} - ${item.name}`);
  });
  
  return sortedByTime;
};

// Função auxiliar para determinar duração baseada no tipo de lugar
const getDurationForPlace = (place) => {
  const types = place.types || [];
  
  if (types.includes('museum') || types.includes('art_gallery')) {
    return 120; // 2 horas para museus
  } else if (types.includes('restaurant') || types.includes('food')) {
    return 90; // 1.5 horas para restaurantes
  } else if (types.includes('park') || types.includes('tourist_attraction')) {
    return 120; // 2 horas para parques
  } else if (types.includes('nightlife') || types.includes('bar')) {
    return 180; // 3 horas para vida noturna
  } else if (types.includes('theater') || types.includes('cultural')) {
    return 150; // 2.5 horas para teatros
  }
  
  return 90; // Duração padrão
};

// Função para buscar história real do local via agente de IA avançado
export const getRealLocationHistory = async (placeDetails) => {
  try {
    // Verificar se placeDetails existe
    if (!placeDetails || typeof placeDetails !== 'object') {
      console.log('⚠️ PlaceDetails is undefined or invalid');
      return generateLocationHistory('Local', []);
    }
    
    console.log('🤖 Buscando história para:', placeDetails?.name);
    
    // Primeiro, tentar usar dados da API do Google Places
    if (placeDetails.reviews && placeDetails.reviews.length > 0) {
      console.log('📖 Reviews disponíveis:', placeDetails.reviews.length);
      
      // Procurar por reviews que contenham informações históricas ou contextuais
      const historicalReviews = placeDetails.reviews.filter(review => 
        review.text && review.text.length > 50 && (
          review.text.toLowerCase().includes('história') ||
          review.text.toLowerCase().includes('tradição') ||
          review.text.toLowerCase().includes('antigo') ||
          review.text.toLowerCase().includes('clássico') ||
          review.text.toLowerCase().includes('famoso') ||
          review.text.toLowerCase().includes('conhecido') ||
          review.text.toLowerCase().includes('importante') ||
          review.text.toLowerCase().includes('símbolo') ||
          review.text.toLowerCase().includes('recomendo') ||
          review.text.toLowerCase().includes('excelente')
        )
      );
      
      if (historicalReviews.length > 0) {
        console.log('📖 Usando review histórico da API');
        const bestReview = historicalReviews[0];
        return bestReview.text.substring(0, 400) + '...';
      }
      
      // Se não encontrou reviews históricos, usar qualquer review com boa avaliação
      const goodReviews = placeDetails.reviews.filter(review => 
        review.text && review.text.length > 100 && review.rating >= 4
      );
      
      if (goodReviews.length > 0) {
        console.log('📖 Usando review com boa avaliação');
        const bestReview = goodReviews[0];
        return bestReview.text.substring(0, 300) + '...';
      }
    }
    
    // Se não encontrou reviews úteis, usar história baseada no tipo
    console.log('📖 Usando história baseada no tipo');
    return generateLocationHistory(placeDetails.name, placeDetails.types, placeDetails);
    
  } catch (error) {
    console.error('❌ Erro ao buscar história:', error);
    // Fallback para história genérica
    return generateLocationHistory(placeDetails?.name || 'Local', placeDetails?.types || []);
  }
};

