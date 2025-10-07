import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, FlatList, StatusBar, Alert, TextInput, Modal, ActivityIndicator, Image, ScrollView, PanResponder, Dimensions, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Svg, Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { styles, COLORS } from './styles';
import { GOOGLE_MAPS_API_KEY, MAP_CONFIG } from '../../config/googleMaps';
import apiService from '../../services/apiService';

// SEM dados mock - apenas API real do Google Maps

// --- Constantes para o Radar ---
const PLACE_TYPES = [
  { value: 'restaurant', label: 'Restaurante', icon: '🍽️' },
  { value: 'bar', label: 'Bar', icon: '🍺' },
  { value: 'night_club', label: 'Balada', icon: '🎵' },
  { value: 'park', label: 'Parque', icon: '🌳' },
  { value: 'museum', label: 'Museu', icon: '🏛️' },
  { value: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
  { value: 'gym', label: 'Academia', icon: '💪' },
  { value: 'cafe', label: 'Café', icon: '☕' },
  { value: 'tourist_attraction', label: 'Turismo', icon: '📸' },
  { value: 'hospital', label: 'Hospital', icon: '🏥' }
];

const PRICE_LEVELS = [
  { value: 0, label: 'Grátis', icon: '💰' },
  { value: 1, label: 'Barato', icon: '💰$' },
  { value: 2, label: 'Moderado', icon: '💰$$' },
  { value: 3, label: 'Caro', icon: '💰$$$' },
  { value: 4, label: 'Muito Caro', icon: '💰$$$$' }
];

const SORT_OPTIONS = [
  { value: 'proximos', label: 'Mais próximos', icon: '📍' },
  { value: 'avaliados', label: 'Melhores avaliados', icon: '⭐' },
  { value: 'baratos', label: 'Mais baratos', icon: '💰' },
  { value: 'caros', label: 'Mais caros', icon: '💎' }
];

// --- Ícones em SVG ---
const createIcons = (colors) => ({
  coffee: <Svg width="16" height="16" viewBox="0 0 24 24"><Path fill={colors.text} d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.31 2.69 6 6 6h2c3.31 0 6-2.69 6-6V5c0-1.1-.9-2-2-2zm-1 6H13v-2h4.5v2zM6.5 9H11V7H6.5v2zM20 15h-2v4h2v-4zm-6 4H8v-2c-2.21 0-4-1.79-4-4V5h16v8c0 2.21-1.79 4-4 4z"/></Svg>,
  walk: <Svg width="16" height="16" viewBox="0 0 24 24"><Path fill={colors.text} d="M14.5 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM8.5 12H10v6H8v-4H6v4H4v-6h1.5c1.1 0 2-.9 2-2H2v-2h8.5c.83 0 1.5.67 1.5 1.5V12zM15.5 12c.83 0 1.5.67 1.5 1.5V18h1.5v-4.5c0-1.65-1.35-3-3-3H11v2h4.5z"/></Svg>,
  food: <Svg width="16" height="16" viewBox="0 0 24 24"><Path fill={colors.text} d="M16 5V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H3v2h2.22l2.03 8.13c.22.87 1 1.47 1.91 1.34.82-.12 1.43-.73 1.55-1.55L14.78 7H19V5h-3zm-6-1h4v1h-4V4zM4.03 17.02l-1.13 4.5c-.13.51.2.98.71.98h13.78c.51 0 .84-.47.71-.98l-1.13-4.5C16.8 17.58 15.3 20 12 20s-4.8-2.42-4.97-2.98z"/></Svg>,
  museum: <Svg width="16" height="16" viewBox="0 0 24 24"><Path fill={colors.text} d="M12 1L2 6v2h20V6L12 1zM4 10v10h2v-4h4v4h2V10H4zm12 10h2V10h-2v10z"/></Svg>,
  theater: <Svg width="16" height="16" viewBox="0 0 24 24"><Path fill={colors.text} d="M12 3C6.48 3 2 7.48 2 13h20c0-5.52-4.48-10-10-10zm-8 12c0-4.42 3.58-8 8-8s8 3.58 8 8H4zm4 2h10v2H8v-2zm-3-4h16v2H5v-2z"/></Svg>,
  warning: <Svg width="16" height="16" viewBox="0 0 24 24"><Path fill={colors.warning} d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></Svg>,
  remove: <Svg width="18" height="18" viewBox="0 0 24 24"><Path fill={colors.textSecondary} d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></Svg>,
  add: <Svg width="16" height="16" viewBox="0 0 24 24"><Path fill={colors.text} d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></Svg>,
});

// --- Caminhos dos Ícones do Menu ---
const NAV_ICON_PATHS = {
  Roteiro: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  Mapa: "M20.5 3l-6.37 18.99-1.63-7.23-7.22-1.63L20.5 3zM15 9l-4 4-1-4 4-1 1 1z",
  Radar: "M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z",
  Social: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  Perfil: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
};

// --- Função para adicionar minutos a um horário (HH:mm) ---
const addMinutesToTime = (timeStr, minutes) => {
  try {
    if (!timeStr || typeof timeStr !== 'string') {
      console.error('❌ TimeStr inválido:', timeStr);
      return '09:00';
    }
    
  const [hours, mins] = timeStr.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(mins)) {
      console.error('❌ Horas ou minutos inválidos:', { hours, mins });
      return '09:00';
    }
    
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  const newHours = String(date.getHours()).padStart(2, '0');
  const newMins = String(date.getMinutes()).padStart(2, '0');
  return `${newHours}:${newMins}`;
  } catch (error) {
    console.error('💥 Erro em addMinutesToTime:', error);
    return '09:00';
  }
};

// Função para formatar horário com dois pontos fixos
const formatTimeInput = (text) => {
  // Remove tudo que não é número
  const numbers = text.replace(/\D/g, '');
  
  // Limita a 4 dígitos
  const limitedNumbers = numbers.slice(0, 4);
  
  if (limitedNumbers.length === 0) {
    return '';
  } else if (limitedNumbers.length <= 2) {
    return limitedNumbers;
  } else {
    // Adiciona os dois pontos após 2 dígitos
    return limitedNumbers.slice(0, 2) + ':' + limitedNumbers.slice(2);
  }
};

// Função para validar horário formatado
const validateTimeFormat = (timeStr) => {
  if (!timeStr) return false;
  
  // Verifica se tem formato HH:MM
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
};

// Função para truncar nome do roteiro
const truncateRouteName = (name, maxLength = 30) => {
  if (!name) return 'Roteiro do SampAI';
  
  // Se o nome é muito longo, trunca e adiciona "..."
  if (name.length > maxLength) {
    return name.substring(0, maxLength - 3) + '...';
  }
  
  return name;
};

const ItineraryScreen = ({ generatedItinerary: propItinerary }) => {
  const { theme, colors, commonStyles, toggleTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('Roteiro');
  const [dayTitle, setDayTitle] = useState(truncateRouteName(propItinerary?.name) || 'Roteiro do SampAI');
  const [itinerary, setItinerary] = useState([]);
  const [alerts, setAlerts] = useState('');
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortMode, setSortMode] = useState('todos'); // 'proximos' | 'avaliados' | 'baratos' | 'todos'
  const [userLocation, setUserLocation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isTimeEditModalVisible, setIsTimeEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newTime, setNewTime] = useState('');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTimeSelectionModalVisible, setIsTimeSelectionModalVisible] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [isLocationDetailsModalVisible, setIsLocationDetailsModalVisible] = useState(false);
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Estados para o Radar
  const [selectedPlaceType, setSelectedPlaceType] = useState('restaurant');
  const [minRating, setMinRating] = useState(3);
  const [maxPriceLevel, setMaxPriceLevel] = useState(2);
  const [accessibilityFilter, setAccessibilityFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const [maxDistance, setMaxDistance] = useState(5);
  const [sliderActive, setSliderActive] = useState(false);
  const [radarResults, setRadarResults] = useState([]);
  const [isSearchingRadar, setIsSearchingRadar] = useState(false);
  
  // Estados para detalhes do radar
  const [isRadarDetailsModalVisible, setIsRadarDetailsModalVisible] = useState(false);
  const [selectedRadarLocation, setSelectedRadarLocation] = useState(null);
  const [isLoadingRadarDetails, setIsLoadingRadarDetails] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [isTimeModalVisible, setIsTimeModalVisible] = useState(false);
  const [selectedLocationForRoute, setSelectedLocationForRoute] = useState(null);
  
  // Estados para autenticação e usuário
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  
  // Estados para formulário de cadastro
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  // Estados para formulário de login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Estados para slider arrastável
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const mapRef = useRef(null);

  const [expanded, setExpanded] = useState(false);


  // Não inicializar autenticação automaticamente
  // useEffect(() => {
  //   initializeAuth();
  // }, []);


  const initializeAuth = async () => {
    try {
      const isAuth = await apiService.isAuthenticated();
      if (isAuth) {
        const userResponse = await apiService.getProfile();
        if (userResponse.success) {
          setIsAuthenticated(true);
          setUser(userResponse.data.usuario);
          await loadUserData();
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
    }
  };
  
  // Estados para filtros do radar
  const [radarSortMode, setRadarSortMode] = useState('proximos');
  const [isSortDropdownVisible, setIsSortDropdownVisible] = useState(false);

  // PanResponder para slider arrastável
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
      console.log('🎛️ Iniciando arrastar slider');
    },
    onPanResponderMove: (evt, gestureState) => {
      if (sliderWidth > 0) {
        const { moveX } = gestureState;
        const sliderX = sliderRef.current?.getBoundingClientRect?.()?.left || 0;
        const relativeX = moveX - sliderX;
        const percentage = Math.max(0, Math.min(1, relativeX / sliderWidth));
        const newDistance = Math.round(1 + (percentage * 29)); // 1-30km
        setMaxDistance(newDistance);
        console.log('🎛️ Arrastando slider:', newDistance, 'km');
      }
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
      console.log('🎛️ Parando de arrastar slider');
    },
  });

  useEffect(() => {
    console.log('📋 ItineraryScreen recebeu propItinerary:', propItinerary);
    const itemsToUse = propItinerary?.items || [];
    console.log('📋 Itens que serão usados:', itemsToUse);
    if (itinerary.length === 0 && itemsToUse.length > 0) {
        console.log('📋 Atualizando roteiro com itens:', itemsToUse);
        recalculateAndUpdateItinerary(itemsToUse);
    }
  }, [propItinerary]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (e) {
        // silenciosamente ignora
      }
    })();
  }, []);
  
  const handleRemoveItem = (idToRemove) => {
    const updatedItems = itinerary.filter(item => item.id !== idToRemove);
    recalculateAndUpdateItinerary(updatedItems);
  };




  
  const handleSelectLocation = (location) => {
    console.log('📍 handleSelectLocation chamada');
    
    try {
      // Verificação básica
      if (!location) {
        console.error('❌ Location é null ou undefined');
        return;
      }
      
      console.log('📍 Location recebido:', location.name || location.title);
      console.log('📍 Location com foto?', !!location.photos?.length);
      
      // Salvar local pendente e abrir modal de seleção de horário
      setPendingLocation(location);
      setSelectedTime('09:00'); // Horário padrão
      setIsTimeSelectionModalVisible(true);
      
      // Fechar modal de busca
      setIsSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
      
      console.log('📍 Modal de seleção de horário aberto');
      
    } catch (error) {
      console.error('💥 Erro ao selecionar local:', error);
    }
  };
  
  const recalculateAndUpdateItinerary = (items) => {
    try {
      console.log('📋 recalculateAndUpdateItinerary chamada');
      
      if (!Array.isArray(items)) {
        console.error('❌ Items não é um array');
        return;
      }
      
      if (items.length === 0) {
        setItinerary([]);
        return;
      }
      
      // Processar itens de forma simples
      const processedItems = items.map((item, index) => {
        return {
          ...item,
          id: item.id || `item-${Date.now()}-${index}`,
          name: item.name || 'Nome não disponível',
          time: item.time || '09:00',
          duration: item.duration || 120,
          // Garantir que temos place_id para favoritos
          placeId: item.placeId || item.place_id || `generated_${Date.now()}_${index}`,
          place_id: item.placeId || item.place_id || `generated_${Date.now()}_${index}`,
          // Garantir que temos endereço
          address: item.address || item.formatted_address || 'Endereço não disponível'
        };
      });
      
      setItinerary(processedItems);
      console.log('✅ recalculateAndUpdateItinerary concluído');
      
    } catch (error) {
      console.error('💥 Erro em recalculateAndUpdateItinerary:', error);
    }
  };


  // Função para verificar conflito de horário
  const checkTimeConflict = (timeToCheck) => {
    const existingLocation = itinerary.find(item => item.time === timeToCheck);
    return existingLocation;
  };

  // Função para sugerir horários alternativos
  const suggestAlternativeTime = (originalTime) => {
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const minutesToTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const originalMinutes = timeToMinutes(originalTime);
    const occupiedTimes = itinerary.map(item => timeToMinutes(item.time)).sort((a, b) => a - b);
    
    // Tentar horários próximos (±30 minutos em intervalos de 15 minutos)
    const intervals = [-30, -15, 15, 30, -45, 45, -60, 60];
    
    for (const interval of intervals) {
      const newMinutes = originalMinutes + interval;
      
      // Verificar se está dentro do horário comercial (6:00 - 23:00)
      if (newMinutes >= 360 && newMinutes <= 1380) { // 6:00 = 360min, 23:00 = 1380min
        const newTime = minutesToTime(newMinutes);
        
        // Verificar se não há conflito
        if (!checkTimeConflict(newTime)) {
          return newTime;
        }
      }
    }
    
    // Se não encontrou, sugerir próximo horário livre após o último item
    const lastTime = Math.max(...occupiedTimes, originalMinutes);
    const suggestedMinutes = lastTime + 60; // 1 hora após o último
    
    if (suggestedMinutes <= 1380) { // Antes das 23:00
      return minutesToTime(suggestedMinutes);
    }
    
    return '09:00'; // Fallback para manhã do próximo dia
  };

  const handleConfirmAddLocation = () => {
    console.log('📍 handleConfirmAddLocation chamada');
    
    try {
      // Verificação básica
      if (!pendingLocation) {
        console.error('❌ Nenhum local pendente');
        return;
      }
      
      console.log('📍 Local pendente:', pendingLocation.name || pendingLocation.title);
      console.log('📍 Horário selecionado:', selectedTime);
      
      // Validar e formatar horário
      let validTime = selectedTime;
      
      // Se o usuário digitou formato 24h sem dois pontos (ex: 1300), converter para HH:MM
      if (/^([0-1]?[0-9]|2[0-3])[0-5][0-9]$/.test(selectedTime)) {
        const hours = selectedTime.slice(0, -2);
        const minutes = selectedTime.slice(-2);
        validTime = `${hours.padStart(2, '0')}:${minutes}`;
      }
      // Se já está no formato HH:MM, manter
      else if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(selectedTime)) {
        validTime = selectedTime;
      }
      // Se formato inválido, usar padrão
      else {
        validTime = '09:00';
      }
      
      console.log('📍 Horário validado:', validTime);
      
      // Verificar conflito de horário
      const conflictingLocation = checkTimeConflict(validTime);
      if (conflictingLocation) {
        console.log('⚠️ Conflito de horário detectado:', conflictingLocation.name);
        
        // Sugerir horário alternativo
        const suggestedTime = suggestAlternativeTime(validTime);
        
        Alert.alert(
          'Horário Ocupado',
          `Já existe um local agendado para ${validTime}: "${conflictingLocation.name}".\n\nSugestão: Que tal às ${suggestedTime}?`,
          [
            {
              text: 'Usar Sugestão',
              onPress: () => {
                console.log('📍 Usuário aceitou sugestão:', suggestedTime);
                setSelectedTime(suggestedTime);
              }
            },
            {
              text: 'Escolher Outro',
              style: 'cancel',
              onPress: () => {
                console.log('📍 Usuário vai escolher outro horário');
                setSelectedTime('09:00');
              }
            }
          ]
        );
        return;
      }
      
      // Se não há conflito, adicionar diretamente
      addLocationToItinerary(validTime);
      
    } catch (error) {
      console.error('💥 Erro ao confirmar adição:', error);
      console.error('💥 Stack trace:', error.stack);
    }
  };

  // Função para adicionar local ao roteiro (extraída para reutilização)
  const addLocationToItinerary = async (validTime) => {
    try {
      // Roteiro principal: adicionar local sem necessidade de login
      
      // Criar item com fotos preservadas de forma segura
      const newItem = {
        id: `item-${Date.now()}`,
        name: pendingLocation.name || pendingLocation.title || 'Nome não disponível',
        description: pendingLocation.description || 'Descrição não disponível',
        time: validTime,
        duration: 120,
        icon: 'walk',
        address: pendingLocation.address || pendingLocation.formatted_address || 'Endereço não disponível',
        rating: pendingLocation.rating || 0,
        priceLevel: pendingLocation.priceLevel || 0,
        location: pendingLocation.location || { lat: -23.5505, lng: -46.6333 },
        photos: pendingLocation.photos || [], // Preservar fotos de forma segura
        openNow: pendingLocation.openNow || false,
        userRatingsTotal: pendingLocation.userRatingsTotal || 0,
        types: pendingLocation.types || [],
        // Adicionar place_id para favoritos
        placeId: pendingLocation.place_id || pendingLocation.placeId || `local_${Date.now()}`,
        place_id: pendingLocation.place_id || pendingLocation.placeId || `local_${Date.now()}`
      };
      
      console.log('📍 Novo item criado:', {
        name: newItem.name,
        time: newItem.time,
        hasPhotos: !!newItem.photos?.length,
        photosCount: newItem.photos?.length || 0,
        address: newItem.address,
        location: newItem.location,
        locationLat: newItem.location?.lat,
        locationLng: newItem.location?.lng,
        locationLatType: typeof newItem.location?.lat,
        locationLngType: typeof newItem.location?.lng,
        pendingLocationOriginal: pendingLocation.location
      });
      
      // Salvar no backend apenas se usuário estiver logado
      if (isAuthenticated) {
        try {
          // Criar roteiro se não existir
          if (itinerary.length === 0) {
            const routeData = {
              name: dayTitle,
              description: 'Roteiro criado automaticamente',
              locations: [{
                name: newItem.name,
                address: newItem.address,
                time: newItem.time,
                placeId: pendingLocation.place_id,
                rating: newItem.rating,
                priceLevel: newItem.priceLevel,
                coordinates: newItem.location,
                notes: newItem.description
              }]
            };
            
            const response = await apiService.createRoute(routeData);
            if (response.success) {
              console.log('✅ Roteiro criado no backend');
              Alert.alert('Sucesso', 'Roteiro salvo com sucesso!');
            }
          } else {
            // Adicionar local ao roteiro existente
            const locationData = {
              name: newItem.name,
              address: newItem.address,
              time: newItem.time,
              placeId: pendingLocation.place_id,
              rating: newItem.rating,
              priceLevel: newItem.priceLevel,
              coordinates: newItem.location,
              notes: newItem.description
            };
            
            // Aqui você precisaria do ID do roteiro atual
            // Por enquanto, apenas adiciona localmente
            console.log('📍 Local adicionado ao roteiro existente');
          }
        } catch (error) {
          console.error('❌ Erro ao salvar no backend:', error);
          Alert.alert('Erro', 'Falha ao salvar roteiro. Tente novamente.');
          return;
        }
      } else {
        console.log('📍 Usuário não logado - adicionando apenas localmente');
      }
      
      // Adicionar ao itinerary na posição cronológica correta
      setItinerary(prev => {
        try {
          // Função para converter horário em minutos para comparação
          const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          };

          const newItemMinutes = timeToMinutes(validTime);
          
          // Encontrar a posição correta para inserir o novo item
          let insertIndex = prev.length; // Por padrão, adicionar no final
          
          for (let i = 0; i < prev.length; i++) {
            const currentItemMinutes = timeToMinutes(prev[i].time);
            if (newItemMinutes < currentItemMinutes) {
              insertIndex = i;
              break;
            }
          }
          
          // Criar novo array com o item inserido na posição correta
          const newItinerary = [
            ...prev.slice(0, insertIndex),
            newItem,
            ...prev.slice(insertIndex)
          ];
          
          console.log('📍 Itinerary atualizado:', newItinerary.length, 'itens');
          console.log('📍 Novo item inserido na posição:', insertIndex, 'com horário:', validTime);
          console.log('📍 Ordem cronológica:', newItinerary.map(item => ({
            name: item.name,
            time: item.time,
            hasLocation: !!(item.location && item.location.lat && item.location.lng)
          })));
          
          return newItinerary;
        } catch (error) {
          console.error('💥 Erro ao atualizar itinerary:', error);
          return prev;
        }
      });
      
      // Fechar modal
      setIsTimeSelectionModalVisible(false);
      setPendingLocation(null);
      setSelectedTime('09:00');
      
      console.log('✅ Local adicionado com sucesso');
      
    } catch (error) {
      console.error('💥 Erro ao adicionar local ao roteiro:', error);
      console.error('💥 Stack trace:', error.stack);
    }
  };

  const handleCancelAddLocation = () => {
    console.log('📍 Cancelando adição do local');
    setIsTimeSelectionModalVisible(false);
    setPendingLocation(null);
    setSelectedTime('09:00');
  };

  // Função para salvar roteiro completo
  const handleSaveItinerary = async () => {
    if (!saveTitle.trim()) {
      Alert.alert('Erro', 'Título é obrigatório');
      return;
    }

    // Verificar se usuário está logado
    if (!isAuthenticated) {
      Alert.alert('Login Necessário', 'Faça login para salvar roteiros');
      return;
    }

    // Verificar limite de roteiros salvos
    if (savedRoutes.length >= 3) {
      Alert.alert(
        '🔒 SampAI Plus Necessário',
        'Você atingiu o limite de 3 roteiros salvos do plano gratuito.\n\nAssine o SampAI Plus para roteiros ilimitados e recursos exclusivos!',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Assinar Plus', 
            onPress: () => {
              Alert.alert('SampAI Plus', 'Funcionalidade de assinatura em breve!');
            }
          }
        ]
      );
      return;
    }

    try {
      setSaving(true);
      
      const response = await apiService.saveItinerary({
        titulo: saveTitle.trim(),
        descricao: saveDescription.trim(),
        locais: itinerary
      });

      if (response.success) {
        Alert.alert('Sucesso', 'Roteiro salvo com sucesso!');
        setShowSaveModal(false);
        setSaveTitle('');
        setSaveDescription('');
        
        // Atualizar lista de roteiros salvos
        await loadUserData();
      } else {
        Alert.alert('Erro', response.message || 'Falha ao salvar roteiro');
      }
    } catch (error) {
      console.error('Erro ao salvar roteiro:', error);
      Alert.alert('Erro', 'Falha ao salvar roteiro');
    } finally {
      setSaving(false);
    }
  };

  // Função para ajustar o mapa para mostrar todos os pontos
  const fitMapToCoordinates = (locations) => {
    if (!mapRef.current || !locations || locations.length === 0) return;
    
    const validLocations = locations.filter(item => 
      item.location && item.location.lat && item.location.lng
    );
    
    if (validLocations.length === 0) return;
    
    if (validLocations.length === 1) {
      // Se há apenas um ponto, centralizar nele
      const location = validLocations[0].location;
      mapRef.current.animateToRegion({
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } else {
      // Se há múltiplos pontos, ajustar para mostrar todos
      const coordinates = validLocations.map(item => ({
        latitude: parseFloat(item.location.lat),
        longitude: parseFloat(item.location.lng),
      }));
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // Função para iniciar navegação no Google Maps
  const handleStartNavigation = async () => {
    try {
      const sortedItinerary = getSortedItinerary();
      if (sortedItinerary.length === 0) {
        Alert.alert('Aviso', 'Nenhum local no roteiro para navegar');
        return;
      }

      // Obter localização atual do usuário
      let userLocation = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          userLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          };
        }
      } catch (error) {
        console.log('⚠️ Não foi possível obter localização atual');
      }

      // Construir lista de coordenadas para a rota completa
      const routeCoordinates = sortedItinerary.map(item => 
        `${item.location.lat},${item.location.lng}`
      );

      console.log('🗺️ Locais do roteiro:', sortedItinerary.map(item => item.name));
      console.log('🗺️ Coordenadas da rota:', routeCoordinates);

      // Construir URL do Google Maps com rota completa
      let mapsUrl = '';
      
      if (Platform.OS === 'ios') {
        // URL para iOS (Apple Maps) - usar formato de múltiplos destinos
        if (userLocation && routeCoordinates.length > 0) {
          // Localização atual como origem + todos os locais como destinos
          const origin = `${userLocation.latitude},${userLocation.longitude}`;
          const destinations = routeCoordinates.join('+to:');
          mapsUrl = `http://maps.apple.com/?saddr=${origin}&daddr=${destinations}`;
        } else if (routeCoordinates.length > 0) {
          // Apenas os locais do roteiro (primeiro como origem, resto como destinos)
          const origin = routeCoordinates[0];
          const destinations = routeCoordinates.slice(1).join('+to:');
          mapsUrl = destinations ? `http://maps.apple.com/?saddr=${origin}&daddr=${destinations}` : `http://maps.apple.com/?daddr=${origin}`;
        }
      } else {
        // URL para Android (Google Maps) - usar formato de direções
        if (userLocation && routeCoordinates.length > 0) {
          // Localização atual como origem + todos os locais como waypoints/destino
          const origin = `${userLocation.latitude},${userLocation.longitude}`;
          const waypoints = routeCoordinates.slice(0, -1).join('/'); // Todos exceto o último
          const destination = routeCoordinates[routeCoordinates.length - 1]; // Último como destino final
          
          if (waypoints) {
            mapsUrl = `https://www.google.com/maps/dir/${origin}/${waypoints}/${destination}`;
          } else {
            mapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
          }
        } else if (routeCoordinates.length > 0) {
          // Apenas os locais do roteiro
          mapsUrl = `https://www.google.com/maps/dir/${routeCoordinates.join('/')}`;
        }
      }

      console.log('🗺️ Abrindo navegação:', mapsUrl);

      // Tentar abrir o app de mapas
      const supported = await Linking.canOpenURL(mapsUrl);
      if (supported) {
        await Linking.openURL(mapsUrl);
      } else {
        // Fallback: abrir no navegador com URL web do Google Maps
        let webUrl = '';
        if (userLocation && routeCoordinates.length > 0) {
          const origin = `${userLocation.latitude},${userLocation.longitude}`;
          webUrl = `https://www.google.com/maps/dir/${origin}/${routeCoordinates.join('/')}/`;
        } else if (routeCoordinates.length > 0) {
          webUrl = `https://www.google.com/maps/dir/${routeCoordinates.join('/')}/`;
        }
        
        console.log('🗺️ Fallback - abrindo no navegador:', webUrl);
        await Linking.openURL(webUrl);
      }

      Alert.alert(
        'Navegação Iniciada',
        `Rota com ${sortedItinerary.length} locais aberta no app de mapas!`
      );

    } catch (error) {
      console.error('❌ Erro ao iniciar navegação:', error);
      Alert.alert('Erro', 'Não foi possível abrir a navegação. Verifique se você tem um app de mapas instalado.');
    }
  };

  // Função para favoritar local
  const handleFavoriteLocation = async (location) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Necessário',
        'Você precisa estar logado para favoritar locais. Deseja fazer login?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Fazer Login', 
            onPress: () => {
              setShowLoginModal(true);
            }
          }
        ]
      );
      return;
    }

    try {
      setFavoriting(true);
      
      // Tentar adicionar favorito (deixar backend verificar duplicação)
      const placeId = location.placeId || location.place_id || location.id;
      
      console.log('📍 ROTEIRO - Dados completos do location:', location);
      console.log('📍 ROTEIRO - Tentando adicionar favorito:', {
        placeId,
        nome: location.name,
        endereco: location.address,
        tipos: location.types
      });
      
      const response = await apiService.addFavorite({
        place_id: placeId,
        nome: location.name,
        endereco: location.address,
        tipo: location.types?.[0] || 'local',
        rating: location.rating || 0
      });

      if (response.success) {
        Alert.alert('Sucesso', 'Local adicionado aos favoritos!');
        await loadUserData(); // Recarregar dados do usuário para atualizar favoritos
      } else {
        // Verificar se é erro de duplicação
        if (response.message && response.message.includes('já está nos favoritos')) {
          Alert.alert('Aviso', 'Este local já está na sua lista de favoritos!');
      } else {
        Alert.alert('Erro', response.message || 'Falha ao favoritar local');
        }
      }
    } catch (error) {
      // Não logar erros esperados no console
      if (!error.message.includes('Login Necessário') && 
          !error.message.includes('Token de acesso necessário') &&
          !error.message.includes('já está nos favoritos')) {
      console.error('Erro ao favoritar local:', error);
      }
      
      // Verificar se é erro de duplicação
      if (error.message && error.message.includes('já está nos favoritos')) {
        Alert.alert('Aviso', 'Este local já está na sua lista de favoritos!');
      } else {
        Alert.alert('Erro', error.message || 'Falha ao favoritar local');
      }
    } finally {
      setFavoriting(false);
    }
  };

  // Função para lidar com clique em item do roteiro
  const handleLocationClick = async (item) => {
    try {
      console.log('📍 Item clicado:', item.name);
      console.log('📍 Place ID:', item.id);
      
      setIsLoadingDetails(true);
      setIsLocationDetailsModalVisible(true);
      
      // Se o item tem um ID do Google Places, buscar detalhes completos
      if (item.id && item.id.startsWith('ChIJ')) {
        console.log('🔍 Buscando detalhes do Google Places...');
        const { getPlaceDetails, getRealLocationHistory } = require('../../services/googlePlacesService');
        const details = await getPlaceDetails(item.id);
        
        if (details) {
          console.log('✅ Detalhes carregados:', details.name);
          
          
          setSelectedLocationDetails(details);
        } else {
          console.log('⚠️ Não foi possível carregar detalhes, usando dados básicos');
          
          setSelectedLocationDetails({
            name: item.name,
            formatted_address: item.address || 'Endereço não disponível',
            rating: item.rating || 0,
            user_ratings_total: item.userRatingsTotal || 0,
            price_level_text: getPriceText(item.priceLevel),
            status_text: item.openNow ? 'Aberto agora' : 'Status não disponível',
            photos: item.photos || [],
            history: `${item.name} é um local de interesse que faz parte da rica história e cultura da região. Este estabelecimento contribui para a identidade única do bairro e da cidade.`
          });
        }
      } else {
        // Para itens adicionados manualmente, usar dados básicos
        console.log('📍 Usando dados básicos do item');
        setSelectedLocationDetails({
          name: item.name,
          formatted_address: item.address || 'Endereço não disponível',
          rating: item.rating || 0,
          user_ratings_total: item.userRatingsTotal || 0,
          price_level_text: getPriceText(item.priceLevel),
          status_text: item.openNow ? 'Aberto agora' : 'Status não disponível',
          photos: item.photos || [],
          history: `${item.name} é um local de interesse que faz parte da rica história e cultura da região. Este estabelecimento contribui para a identidade única do bairro e da cidade.`
        });
      }
      
    } catch (error) {
      console.error('💥 Erro ao carregar detalhes:', error);
      // Em caso de erro, mostrar dados básicos
      setSelectedLocationDetails({
        name: item.name,
        formatted_address: item.address || 'Endereço não disponível',
        rating: item.rating || 0,
        user_ratings_total: item.userRatingsTotal || 0,
        price_level_text: getPriceText(item.priceLevel),
        status_text: 'Status não disponível',
        photos: item.photos || [],
        history: `${item.name} é um local de interesse que faz parte da rica história e cultura da região.`
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Função para fechar modal de detalhes
  const handleCloseLocationDetails = () => {
    setIsLocationDetailsModalVisible(false);
    setSelectedLocationDetails(null);
  };

  // Função para limpar filtros
  const handleClearFilters = () => {
    console.log('🗑️ Limpando filtros - voltando para modo "Todos"');
    setSortMode('todos');
  };

  // Função para lidar com mudança de filtro
  const handleFilterChange = (newSortMode) => {
    console.log('🔄 Mudando filtro para:', newSortMode);
    setSortMode(newSortMode);
  };

  // Funções para o Radar
  const handlePlaceTypeChange = (placeType) => {
    console.log('📍 Mudando tipo de lugar para:', placeType);
    setSelectedPlaceType(placeType);
  };

  const handleRadarSearch = async () => {
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      Alert.alert('Localização Necessária', 'Por favor, permita o acesso à localização para usar o radar.');
      return;
    }

    console.log('🔍 Iniciando busca do radar com distância:', maxDistance, 'km (limite: 30km)');
    console.log('🔍 userLocation:', userLocation);

    setIsSearchingRadar(true);
    setRadarResults([]);

    try {
      // Limitar o raio para 30km (30000 metros)
      const radius = Math.min(maxDistance * 1000, 30000);
      console.log('🔍 Raio de busca:', radius, 'metros');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${userLocation.latitude},${userLocation.longitude}&` +
        `radius=${radius}&` +
        `key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();
      console.log('🔍 Resultados da API:', data);

      if (data.status === 'OK' && data.results) {
        // Ordenar baseado no modo selecionado
        let sortedResults = [...data.results];
        
        console.log('🔍 Ordenando por:', radarSortMode);
        
        switch (radarSortMode) {
          case 'proximos':
            sortedResults = sortedResults.sort((a, b) => {
              const distanceA = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                a.geometry.location.lat,
                a.geometry.location.lng
              );
              const distanceB = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                b.geometry.location.lat,
                b.geometry.location.lng
              );
              return distanceA - distanceB;
            });
            break;
          case 'avaliados':
            sortedResults = sortedResults.sort((a, b) => {
              const ratingA = a.rating || 0;
              const ratingB = b.rating || 0;
              return ratingB - ratingA;
            });
            break;
          case 'baratos':
            sortedResults = sortedResults.sort((a, b) => {
              const priceA = a.price_level || 4;
              const priceB = b.price_level || 4;
              return priceA - priceB;
            });
            break;
          case 'caros':
            sortedResults = sortedResults.sort((a, b) => {
              const priceA = a.price_level || 0;
              const priceB = b.price_level || 0;
              return priceB - priceA;
            });
            break;
          default:
            // Ordenar por proximidade por padrão
            sortedResults = sortedResults.sort((a, b) => {
              const distanceA = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                a.geometry.location.lat,
                a.geometry.location.lng
              );
              const distanceB = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                b.geometry.location.lat,
                b.geometry.location.lng
              );
              return distanceA - distanceB;
            });
        }

        console.log('🔍 Resultados ordenados:', sortedResults.length);
        setRadarResults(sortedResults.slice(0, 10)); // Limitar a 10 resultados
      } else {
        console.log('❌ Erro na API:', data.status, data.error_message);
        Alert.alert('Erro', 'Não foi possível buscar locais. Tente novamente.');
      }
    } catch (error) {
      console.error('💥 Erro na busca do radar:', error);
      Alert.alert('Erro', 'Erro ao buscar locais. Verifique sua conexão.');
    } finally {
      setIsSearchingRadar(false);
    }
  };

  // Funções auxiliares para o Radar
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      console.log('⚠️ Parâmetros inválidos para calculateDistance:', { lat1, lng1, lat2, lng2 });
      return 0;
    }
    
    try {
      const distance = haversineDistance(lat1, lng1, lat2, lng2);
      return Math.round(distance * 10) / 10; // Arredondar para 1 casa decimal
    } catch (error) {
      console.error('❌ Erro ao calcular distância:', error);
      return 0;
    }
  };

  const getPlaceIcon = (type) => {
    const iconMap = {
      'restaurant': '🍽️',
      'bar': '🍺',
      'night_club': '🎵',
      'park': '🌳',
      'museum': '🏛️',
      'shopping_mall': '🛍️',
      'gym': '💪',
      'cafe': '☕',
      'tourist_attraction': '📸',
      'hospital': '🏥',
      'establishment': '📍'
    };
    return iconMap[type] || '📍';
  };

  const getPlaceTypeLabel = (type) => {
    const labelMap = {
      'restaurant': 'Restaurante',
      'bar': 'Bar',
      'night_club': 'Balada',
      'park': 'Parque',
      'museum': 'Museu',
      'shopping_mall': 'Shopping',
      'gym': 'Academia',
      'cafe': 'Café',
      'tourist_attraction': 'Atração',
      'hospital': 'Hospital',
      'establishment': 'Local'
    };
    return labelMap[type] || 'Local';
  };

  // Função para lidar com clique nos locais do radar (versão ultra simplificada)
  const handleRadarLocationClick = async (place) => {
    try {
      console.log('📍 Local do radar clicado:', place?.name || 'Nome não disponível');
      console.log('📍 Dados completos do place:', place);
      
      // Verificação básica de dados
      if (!place) {
        console.error('❌ Place é undefined');
        return;
      }
      
      // Dados básicos primeiro (sem agente de IA)
      const basicDetails = {
        place_id: place.place_id || `radar_${Date.now()}`,
        name: place.name || 'Nome não disponível',
        formatted_address: place.vicinity || 'Endereço não disponível',
        rating: place.rating || 0,
        user_ratings_total: place.user_ratings_total || 0,
        price_level: place.price_level,
        is_open: place.opening_hours?.open_now || false,
        photos: place.photos || [],
        reviews: [],
        website: null,
        phone: null,
        types: place.types || [],
        permanently_closed: false,
        history: 'Carregando história...',
        accessibility: 'Verificar acessibilidade',
        distance: 0.5,
        geometry: {
          location: {
            lat: place.geometry?.location?.lat || userLocation?.latitude || -23.5505,
            lng: place.geometry?.location?.lng || userLocation?.longitude || -46.6333
          }
        },
        vicinity: place.vicinity || 'Endereço não disponível'
      };
      
      console.log('📍 Dados básicos preparados:', basicDetails);
      
      // Abrir modal imediatamente
      setSelectedRadarLocation(basicDetails);
      setIsRadarDetailsModalVisible(true);
      setIsLoadingRadarDetails(false);
      
      console.log('📍 Modal aberto com dados básicos');
      
      // Tentar buscar história em background
      try {
        const { getRealLocationHistory } = require('../../services/googlePlacesService');
        const history = await getRealLocationHistory(place);
        
        // Atualizar com história real
        setSelectedRadarLocation(prev => ({
          ...prev,
          history: history || 'História não disponível'
        }));
        
        console.log('📍 História carregada via IA');
      } catch (historyError) {
        console.error('❌ Erro ao carregar história:', historyError);
        // Manter história básica
        setSelectedRadarLocation(prev => ({
          ...prev,
          history: 'História não disponível no momento'
        }));
      }
      
    } catch (error) {
      console.error('❌ Erro crítico ao abrir modal do radar:', error);
      
      // Fallback de emergência
      const emergencyDetails = {
        place_id: `emergency_${Date.now()}`,
        name: place?.name || 'Local',
        formatted_address: place?.vicinity || 'Endereço não disponível',
        rating: 0,
        user_ratings_total: 0,
        price_level: undefined,
        is_open: false,
        photos: [],
        reviews: [],
        website: null,
        phone: null,
        types: [],
        permanently_closed: false,
        history: 'Erro ao carregar informações',
        accessibility: 'Verificar acessibilidade',
        distance: 0,
        geometry: {
          location: {
            lat: -23.5505,
            lng: -46.6333
          }
        },
        vicinity: 'Endereço não disponível'
      };
      
      setSelectedRadarLocation(emergencyDetails);
      setIsRadarDetailsModalVisible(true);
      setIsLoadingRadarDetails(false);
    }
  };

  // Função para fechar modal de detalhes do radar
  const handleCloseRadarDetails = () => {
    console.log('📍 Fechando modal de detalhes do radar');
    setIsRadarDetailsModalVisible(false);
    setSelectedRadarLocation(null);
  };

  // Função para favoritar/desfavoritar local
  const toggleFavorite = async (place) => {
    try {
      // Verificar se usuário está logado para favoritar
      if (!isAuthenticated) {
        Alert.alert(
          'Login Necessário',
          'Você precisa estar logado para favoritar locais. Deseja fazer login?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Fazer Login', 
              onPress: () => {
                setShowLoginModal(true);
              }
            }
          ]
        );
        return;
      }

      const placeId = place.place_id || place.id;
      const placeName = place.name;
      
      console.log('🔍 Radar - Tentando favoritar:', { placeId, placeName });
      
      // Verificar se já está nos favoritos (verificação simples apenas por place_id)
      const existingFavorite = userFavorites.find(fav => fav.place_id === placeId);
      
      if (existingFavorite) {
        console.log('⚠️ Radar - Local já está nos favoritos, removendo');
        // Remover dos favoritos
        const response = await apiService.removeFavorite(existingFavorite.id);
        if (response.success) {
          console.log('📍 Local removido dos favoritos:', place.name);
          Alert.alert('Sucesso', 'Local removido dos favoritos!');
          await loadUserData(); // Recarregar dados
        }
      } else {
        console.log('✅ Radar - Tentando adicionar novo favorito');
        // Adicionar aos favoritos (deixar backend verificar duplicação)
        const favoriteData = {
          place_id: placeId,
          nome: place.name,
          endereco: place.formatted_address || place.vicinity || 'Endereço não disponível',
          tipo: place.types?.[0] || 'local',
          rating: place.rating || 0
        };
        
        console.log('📍 Radar - Dados do favorito:', favoriteData);
        
        const response = await apiService.addFavorite(favoriteData);
        if (response.success) {
          console.log('✅ Radar - Favorito adicionado com sucesso');
          Alert.alert('Sucesso', 'Local adicionado aos favoritos!');
          await loadUserData(); // Recarregar dados para atualizar a lista
        } else {
          // Verificar se é erro de duplicação
          if (response.message && response.message.includes('já está nos favoritos')) {
            Alert.alert('Aviso', 'Este local já está na sua lista de favoritos!');
          } else {
            Alert.alert('Erro', response.message || 'Falha ao favoritar local');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao favoritar local:', error);
      
      // Verificar se é erro de duplicação
      if (error.message && error.message.includes('já está nos favoritos')) {
        Alert.alert('Aviso', 'Este local já está na sua lista de favoritos!');
      } else {
        Alert.alert('Erro', error.message || 'Falha ao favoritar local. Tente novamente.');
      }
    }
  };

  // Funções de autenticação
  const handleLogin = async (email, password) => {
    try {
      console.log('🔑 Tentando fazer login:', email);
      
      const response = await apiService.login(email, password);
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.data);
        setShowLoginModal(false);
        
        // Carrega dados do usuário
        await loadUserData();
        
        console.log('✅ Login realizado com sucesso');
        Alert.alert('Sucesso', 'Login realizado com sucesso!');
      } else {
        throw new Error(response.message || 'Falha no login');
      }
      
    } catch (error) {
      // Não logar erros de autenticação esperados
      if (!error.message.includes('Email ou senha inválidos') && 
          !error.message.includes('Formato de email inválido')) {
      console.error('❌ Erro no login:', error);
      }
      Alert.alert('Erro', error.message || 'Falha ao fazer login. Tente novamente.');
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      console.log('📝 Tentando criar conta:', email);
      
      const response = await apiService.register({ nome: name, email, senha: password });
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.data);
        setShowRegisterModal(false);
        
        // Carrega dados do usuário
        await loadUserData();
        
        console.log('✅ Conta criada com sucesso');
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
      } else {
        throw new Error(response.message || 'Falha no registro');
      }
      
    } catch (error) {
      // Não logar erros de registro esperados
      if (!error.message.includes('Este email já está em uso') && 
          !error.message.includes('Formato de email inválido') &&
          !error.message.includes('Todos os campos são obrigatórios')) {
      console.error('❌ Erro no registro:', error);
      }
      Alert.alert('Erro', error.message || 'Falha ao criar conta. Tente novamente.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.logout();
              setIsAuthenticated(false);
              setUser(null);
              setSavedRoutes([]);
              setUserFavorites([]);
              console.log('👋 Usuário deslogado');
              Alert.alert('Logout', 'Você foi desconectado com sucesso!');
            } catch (error) {
              console.error('Erro no logout:', error);
              // Mesmo com erro, limpa os dados locais
              setIsAuthenticated(false);
              setUser(null);
              setSavedRoutes([]);
              setUserFavorites([]);
              Alert.alert('Logout', 'Você foi desconectado!');
            }
          }
        }
      ]
    );
  };

    const loadUserData = async () => {
      try {
        console.log('📊 Carregando dados do usuário');
        
        // Carregar dados do usuário
        const profileResponse = await apiService.getProfile();
        
        if (profileResponse.success) {
          const { roteiros, favoritos } = profileResponse.data;
          
          // Transformar dados para o formato esperado
          const routes = roteiros.map(route => ({
            id: route.id,
            name: route.titulo,
            date: route.data_criacao,
            locations: route.locations || []
          }));
          
          const favorites = favoritos.map(fav => ({
            id: fav.id,
            nome: fav.nome,
            name: fav.nome, // Compatibilidade
            endereco: fav.endereco,
            address: fav.endereco, // Compatibilidade
            tipo: fav.tipo,
            rating: fav.rating || 0,
            place_id: fav.place_id,
            data_favorito: fav.data_favorito,
            user_ratings_total: fav.user_ratings_total || 0,
            price_level: fav.price_level || 0,
            descricao: fav.descricao || ''
          }));
          
          setSavedRoutes(routes);
          setUserFavorites(favorites);

          console.log('✅ Dados do usuário carregados:', {
            roteiros: routes.length,
            favoritos: favorites.length,
          });
        }
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error);
      }
    };

  const handleLoadRoute = async (route) => {
    Alert.alert(
      'Carregar Roteiro',
      `Deseja carregar o roteiro "${route.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Carregar', 
          onPress: async () => {
            try {
              console.log('📂 Carregando roteiro:', route.name);
              
              // Carregar roteiro do backend
              const response = await apiService.loadItinerary(route.id);
              
              if (response.success) {
                const routeData = response.data;
                
                // Transformar dados do backend para o formato do frontend
                const loadedItinerary = await Promise.all((routeData.locations || []).map(async (location, index) => {
                  // Tentar buscar fotos se temos informações suficientes
                  let photos = [];
                  try {
                    if (location.name && location.address) {
                      // Buscar fotos usando Google Places API (simulação por enquanto)
                      photos = location.photos || [];
                      
                      // Se não temos fotos salvas, podemos tentar buscar
                      if (photos.length === 0) {
                        // Por enquanto, usar uma foto padrão baseada no tipo
                        const defaultPhotos = [
                          {
                            photo_reference: 'default_photo',
                            height: 400,
                            width: 400,
                            html_attributions: []
                          }
                        ];
                        photos = defaultPhotos;
                      }
                    }
                  } catch (error) {
                    console.log('⚠️ Não foi possível carregar fotos para:', location.name);
                    photos = [];
                  }

                  return {
                    id: `item-${index}`,
                    name: location.name,
                    address: location.address,
                    time: location.time,
                    rating: location.rating || 0,
                    priceLevel: location.priceLevel || 0,
                    location: {
                      lat: location.location?.lat || location.coordinates?.lat || -23.5505,
                      lng: location.location?.lng || location.coordinates?.lng || -46.6333
                    },
                    photos: photos,
                    types: location.types || [],
                    openNow: location.openNow || false,
                    userRatingsTotal: location.userRatingsTotal || 0,
                    placeId: location.placeId || location.place_id || `loaded_${Date.now()}_${index}`,
                    place_id: location.placeId || location.place_id || `loaded_${Date.now()}_${index}`
                  };
                }));
                
                // Atualizar estado
                setItinerary(loadedItinerary);
                setDayTitle(routeData.titulo || 'Roteiro do SampAI');
                setAlerts(routeData.alertas || '');
                
                // Mudar para a aba do roteiro para mostrar os locais com fotos
                setActiveTab('Roteiro');
                
                // Ajustar região do mapa para mostrar todos os pontos
                if (loadedItinerary.length > 0) {
                  setTimeout(() => {
                    fitMapToCoordinates(loadedItinerary);
                  }, 500);
                }
                
                console.log('✅ Roteiro carregado com sucesso');
                Alert.alert('Sucesso', `Roteiro "${routeData.titulo}" carregado! Veja os locais na aba Roteiro ou visualize a rota no Mapa.`);
              } else {
                throw new Error(response.message || 'Falha ao carregar roteiro');
              }
            } catch (error) {
              console.error('❌ Erro ao carregar roteiro:', error);
              Alert.alert('Erro', 'Falha ao carregar roteiro. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const handleViewFavorite = async (favorite) => {
    try {
      console.log('🔍 Dados do favorito recebido:', favorite);
      
      // Mostrar detalhes do favorito usando os dados completos da API
      const endereco = favorite.endereco || favorite.address || 'Endereço não disponível';
      const nome = favorite.nome || favorite.name;
      const rating = favorite.rating || 0;
      const userRatingsTotal = favorite.user_ratings_total || 0;
      const tipo = favorite.tipo || 'Local';
      const priceLevel = favorite.price_level || 0;
      const descricao = favorite.descricao || '';
      
      // Criar texto de preço baseado no price_level
      const priceText = priceLevel === 0 ? 'Gratuito' : 
                       priceLevel === 1 ? 'Barato ($)' :
                       priceLevel === 2 ? 'Moderado ($$)' :
                       priceLevel === 3 ? 'Caro ($$$)' :
                       priceLevel === 4 ? 'Muito Caro ($$$$)' : 'Não informado';
      
      console.log('🔍 Dados processados:', { endereco, nome, rating, userRatingsTotal, tipo, priceLevel });
      
      // Criar mensagem detalhada
      let detailsMessage = `📍 ${nome}\n\n`;
      detailsMessage += `🏠 Endereço: ${endereco}\n\n`;
      detailsMessage += `⭐ Avaliação: ${rating}/5 (${userRatingsTotal} avaliações)\n\n`;
      detailsMessage += `🏷️ Categoria: ${tipo}\n\n`;
      detailsMessage += `💰 Preço: ${priceText}`;
      
      if (descricao) {
        detailsMessage += `\n\n📝 Descrição: ${descricao}`;
      }
        
        Alert.alert(
          'Detalhes do Favorito',
          detailsMessage,
          [
            { text: 'Fechar' },
            {
              text: 'Adicionar ao Roteiro',
              onPress: () => {
              console.log('📍 Adicionando favorito ao roteiro:', nome);
              handleAddFavoriteToItinerary(favorite);
              }
            }
          ]
        );
    } catch (error) {
      console.error('❌ Erro ao visualizar favorito:', error);
      Alert.alert('Erro', 'Falha ao visualizar detalhes do favorito.');
    }
  };

  // Função para buscar coordenadas por endereço
  const getCoordinatesFromAddress = async (address) => {
    try {
      if (!address || address === 'Endereço não disponível') {
        return { lat: -23.5505, lng: -46.6333 }; // Coordenadas padrão de SP
      }

      // Usar Google Geocoding API
      const apiKey = 'AIzaSyC2JhGeNqfhzqsH7LmHQRiRC4HTrHQDCOg'; // Mesma chave do Maps
      const encodedAddress = encodeURIComponent(address + ', São Paulo, Brasil');
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
      
      console.log('🌍 Buscando coordenadas para:', address);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('✅ Coordenadas encontradas:', location);
        return {
          lat: location.lat,
          lng: location.lng
        };
      } else {
        console.log('⚠️ Coordenadas não encontradas, usando padrão');
        return { lat: -23.5505, lng: -46.6333 };
      }
    } catch (error) {
      console.error('❌ Erro ao buscar coordenadas:', error);
      return { lat: -23.5505, lng: -46.6333 };
    }
  };

  // Função para buscar detalhes do Google Places
  const getPlaceDetailsFromGoogle = async (placeId) => {
    try {
      const apiKey = 'AIzaSyC2JhGeNqfhzqsH7LmHQRiRC4HTrHQDCOg';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=pt-BR&fields=name,formatted_address,geometry,photos,editorial_summary,types`;
      
      console.log('🔍 Buscando detalhes do Google Places para:', placeId);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        console.log('✅ Detalhes encontrados no Google Places');
        return {
          ...data.result,
          description: data.result.editorial_summary?.overview || null
        };
      } else {
        console.log('⚠️ Detalhes não encontrados no Google Places');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes do Google Places:', error);
      return null;
    }
  };

  // Função para gerar descrição do local
  const generateLocationDescription = (name, type) => {
    const descriptions = {
      'restaurant': `${name} é um estabelecimento gastronômico que oferece uma experiência culinária única em São Paulo.`,
      'tourist_attraction': `${name} é uma atração turística imperdível que faz parte da rica cultura e história de São Paulo.`,
      'museum': `${name} é um museu que preserva e exibe importantes aspectos da cultura e história brasileira.`,
      'park': `${name} é um espaço verde que oferece momentos de lazer e contato com a natureza no coração da cidade.`,
      'shopping_mall': `${name} é um centro comercial que oferece diversas opções de compras, alimentação e entretenimento.`,
      'church': `${name} é um templo religioso que representa a arquitetura e a fé da comunidade local.`,
      'art_gallery': `${name} é uma galeria que exibe obras de arte e promove a cultura artística da região.`,
      'default': `${name} é um local interessante que vale a pena conhecer durante sua visita a São Paulo.`
    };
    
    return descriptions[type] || descriptions['default'];
  };

  // Função para adicionar favorito ao roteiro
  const handleAddFavoriteToItinerary = async (favorite) => {
    try {
      console.log('📍 Preparando para adicionar favorito ao roteiro:', favorite);
      
      // Verificar se o local já está no roteiro (verificação mais robusta)
      const favoriteName = favorite.nome || favorite.name;
      const favoritePlaceId = favorite.place_id;
      
      console.log('🔍 Verificando duplicação no roteiro:', {
        favoriteName,
        favoritePlaceId,
        itinerary: itinerary.map(i => ({ name: i.name, placeId: i.placeId, place_id: i.place_id }))
      });
      
      const isAlreadyInItinerary = itinerary.some(item => {
        const sameName = item.name === favoriteName;
        const samePlaceId = (item.placeId === favoritePlaceId) || (item.place_id === favoritePlaceId);
        
        console.log('🔍 Comparando item do roteiro:', {
          itemName: item.name,
          itemPlaceId: item.placeId || item.place_id,
          sameName,
          samePlaceId
        });
        
        return sameName || samePlaceId;
      });
      
      if (isAlreadyInItinerary) {
        console.log('⚠️ Local já está no roteiro');
        Alert.alert('Aviso', `O local "${favoriteName}" já está incluído no seu roteiro atual!`);
        return;
      }
      
      // Buscar coordenadas reais se temos endereço
      const endereco = favorite.endereco || favorite.address;
      const coordinates = await getCoordinatesFromAddress(endereco);
      
      // Tentar buscar mais detalhes do local usando Google Places API se temos place_id
      let enhancedData = {};
      if (favorite.place_id && favorite.place_id.startsWith('ChIJ')) {
        try {
          // Buscar detalhes completos do Google Places
          const placeDetails = await getPlaceDetailsFromGoogle(favorite.place_id);
          if (placeDetails) {
            enhancedData = {
              photos: placeDetails.photos || [],
              description: placeDetails.description || generateLocationDescription(favoriteName, favorite.tipo),
              address: placeDetails.formatted_address || endereco,
              location: {
                lat: placeDetails.geometry?.location?.lat || coordinates.lat,
                lng: placeDetails.geometry?.location?.lng || coordinates.lng
              }
            };
          }
        } catch (error) {
          console.log('⚠️ Não foi possível buscar detalhes do Google Places:', error.message);
        }
      }
      
      // Criar objeto no formato esperado pelo modal de horário
      const favoriteAsLocation = {
        name: favoriteName,
        title: favoriteName, // Compatibilidade
        address: enhancedData.address || endereco || 'Endereço não disponível',
        rating: favorite.rating || 0,
        types: favorite.tipo ? [favorite.tipo] : ['local'],
        photos: enhancedData.photos || [],
        place_id: favorite.place_id || `favorite_${favorite.id}`,
        placeId: favorite.place_id || `favorite_${favorite.id}`, // Compatibilidade
        priceLevel: 0, // Favoritos não têm preço por padrão
        openNow: true, // Assumir que está aberto
        userRatingsTotal: 0,
        location: enhancedData.location || coordinates,
        description: enhancedData.description || generateLocationDescription(favoriteName, favorite.tipo)
      };
      
      console.log('📍 Objeto favorito convertido:', favoriteAsLocation);
      console.log('📍 Coordenadas obtidas:', favoriteAsLocation.location);
      
      // Definir como local pendente e abrir modal de horário
      setPendingLocation(favoriteAsLocation);
      setIsTimeSelectionModalVisible(true);
      setSelectedTime('09:00');
      
      console.log('📍 Modal de horário aberto para favorito');
      
    } catch (error) {
      console.error('❌ Erro ao preparar favorito para roteiro:', error);
      Alert.alert('Erro', 'Falha ao adicionar favorito ao roteiro. Tente novamente.');
    }
  };

  const handleRemoveFavorite = (favorite) => {
    Alert.alert(
      'Remover Favorito',
      `Deseja remover "${favorite.nome || favorite.name}" dos favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Remover do backend
              await apiService.removeFavorite(favorite.id);
              
              // Atualizar estado local
              setUserFavorites(prev => prev.filter(fav => fav.id !== favorite.id));
              
              console.log('⭐ Favorito removido:', favorite.nome || favorite.name);
              Alert.alert('Sucesso', 'Favorito removido com sucesso!');
            } catch (error) {
              console.error('❌ Erro ao remover favorito:', error);
              Alert.alert('Erro', 'Falha ao remover favorito. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  // Função para abrir modal de horário
  const handleAddToRoute = (place) => {
    console.log('📍 Abrindo modal de horário para:', place.name);
    console.log('📍 Dados do place:', place);
    
    // Fechar modal de detalhes primeiro
    setIsRadarDetailsModalVisible(false);
    
    // Aguardar um momento e abrir modal de horário
    setTimeout(() => {
      setSelectedLocationForRoute(place);
      setIsTimeModalVisible(true);
      console.log('📍 Modal de horário aberto');
    }, 100);
  };

  // Função para confirmar adição ao roteiro
  const handleConfirmAddToRoute = () => {
    if (!selectedTime || !selectedLocationForRoute) return;

    // Verificar conflito de horário
    const conflictingLocation = checkTimeConflict(selectedTime);
    if (conflictingLocation) {
      console.log('⚠️ Radar - Conflito de horário detectado:', conflictingLocation.name);
      
      // Sugerir horário alternativo
      const suggestedTime = suggestAlternativeTime(selectedTime);
      
      Alert.alert(
        'Horário Ocupado',
        `Já existe um local agendado para ${selectedTime}: "${conflictingLocation.name}".\n\nSugestão: Que tal às ${suggestedTime}?`,
        [
          {
            text: 'Usar Sugestão',
            onPress: () => {
              console.log('📍 Radar - Usuário aceitou sugestão:', suggestedTime);
              setSelectedTime(suggestedTime);
            }
          },
          {
            text: 'Escolher Outro',
            style: 'cancel',
            onPress: () => {
              console.log('📍 Radar - Usuário vai escolher outro horário');
              setSelectedTime('09:00');
            }
          }
        ]
      );
      return;
    }

    // Se não há conflito, adicionar diretamente
    addRadarLocationToItinerary();
  };

  // Função para adicionar local do radar ao roteiro
  const addRadarLocationToItinerary = async () => {
    if (!selectedLocationForRoute) {
      console.log('❌ selectedLocationForRoute não está definido');
      return;
    }

    // Radar: verificar se usuário está logado
    if (!isAuthenticated) {
      Alert.alert(
        'Login Necessário',
        'Você precisa estar logado para adicionar locais do radar ao roteiro. Deseja fazer login?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Fazer Login', 
            onPress: () => {
              setIsTimeModalVisible(false);
              setSelectedLocationForRoute(null);
              setShowLoginModal(true);
            }
          }
        ]
      );
      return;
    }

    console.log('📍 Adicionando local ao roteiro:', selectedLocationForRoute.name);
    console.log('📍 Dados do local:', selectedLocationForRoute);

    const newItem = {
      id: selectedLocationForRoute.place_id || `radar_${Date.now()}`,
      name: selectedLocationForRoute.name || 'Nome não disponível',
      address: selectedLocationForRoute.vicinity || selectedLocationForRoute.formatted_address || 'Endereço não disponível',
      time: selectedTime,
      rating: selectedLocationForRoute.rating || 0,
      userRatingsTotal: selectedLocationForRoute.user_ratings_total || 0,
      priceLevel: selectedLocationForRoute.price_level,
      openNow: selectedLocationForRoute.opening_hours?.open_now || selectedLocationForRoute.is_open || false,
      photos: selectedLocationForRoute.photos || [],
      types: selectedLocationForRoute.types || [],
      location: {
        lat: selectedLocationForRoute.geometry?.location?.lat || userLocation?.latitude || -23.5505,
        lng: selectedLocationForRoute.geometry?.location?.lng || userLocation?.longitude || -46.6333
      }
    };

    console.log('📍 Novo item criado:', newItem);

    // Salvar no backend apenas se usuário estiver logado
    if (isAuthenticated) {
      try {
        // Criar roteiro se não existir
        if (itinerary.length === 0) {
          const routeData = {
            name: dayTitle,
            description: 'Roteiro criado automaticamente',
            locations: [{
              name: newItem.name,
              address: newItem.address,
              time: newItem.time,
              placeId: selectedLocationForRoute.place_id,
              rating: newItem.rating,
              priceLevel: newItem.priceLevel,
              coordinates: newItem.location,
              notes: selectedLocationForRoute.description || ''
            }]
          };
          
          const response = await apiService.createRoute(routeData);
          if (response.success) {
            console.log('✅ Roteiro criado no backend');
            Alert.alert('Sucesso', 'Roteiro salvo com sucesso!');
          }
        } else {
          // Adicionar local ao roteiro existente
          const locationData = {
            name: newItem.name,
            address: newItem.address,
            time: newItem.time,
            placeId: selectedLocationForRoute.place_id,
            rating: newItem.rating,
            priceLevel: newItem.priceLevel,
            coordinates: newItem.location,
            notes: selectedLocationForRoute.description || ''
          };
          
          // Aqui você precisaria do ID do roteiro atual
          // Por enquanto, apenas adiciona localmente
          console.log('📍 Local adicionado ao roteiro existente');
        }
      } catch (error) {
        console.error('❌ Erro ao salvar no backend:', error);
        Alert.alert('Erro', 'Falha ao salvar roteiro. Tente novamente.');
        return;
      }
    } else {
      console.log('📍 Usuário não logado - adicionando apenas localmente');
    }

    // Adicionar ao itinerary na posição cronológica correta
    setItinerary(prev => {
      try {
        // Função para converter horário em minutos para comparação
        const timeToMinutes = (timeStr) => {
          if (!timeStr) return 0;
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const newItemMinutes = timeToMinutes(selectedTime);
        
        // Encontrar a posição correta para inserir o novo item
        let insertIndex = prev.length; // Por padrão, adicionar no final
        
        for (let i = 0; i < prev.length; i++) {
          const currentItemMinutes = timeToMinutes(prev[i].time);
          if (newItemMinutes < currentItemMinutes) {
            insertIndex = i;
            break;
          }
        }
        
        // Criar novo array com o item inserido na posição correta
        const newItinerary = [
          ...prev.slice(0, insertIndex),
          newItem,
          ...prev.slice(insertIndex)
        ];
        
        console.log('📍 Radar - Itinerary atualizado:', newItinerary.length, 'itens');
        console.log('📍 Radar - Novo item inserido na posição:', insertIndex, 'com horário:', selectedTime);
        console.log('📍 Radar - Ordem cronológica:', newItinerary.map(item => ({
          name: item.name,
          time: item.time
        })));
        
        return newItinerary;
      } catch (error) {
        console.error('💥 Erro ao atualizar itinerary do radar:', error);
        return [...prev, newItem]; // Fallback: adicionar no final
      }
    });
    
    setIsTimeModalVisible(false);
    setSelectedTime('');
    setSelectedLocationForRoute(null);
    setIsRadarDetailsModalVisible(false);
    
    console.log('📍 Local adicionado ao roteiro:', newItem.name);
    Alert.alert('Sucesso', 'Local adicionado ao roteiro!');
  };

  // Função para gerar história do local
  const generateLocationHistory = (name, type) => {
    const histories = {
      'restaurant': `${name} é um estabelecimento gastronômico que contribui para a rica cena culinária da região. Este local faz parte da identidade gastronômica da cidade, oferecendo experiências únicas aos visitantes.`,
      'bar': `${name} é um ponto de encontro que faz parte da vida noturna da região. Este estabelecimento contribui para a cultura local e oferece momentos de descontração e socialização.`,
      'park': `${name} é um espaço verde que faz parte do patrimônio natural da cidade. Este parque contribui para a qualidade de vida dos moradores e visitantes, oferecendo momentos de lazer e contato com a natureza.`,
      'museum': `${name} é uma instituição cultural que preserva e compartilha o patrimônio histórico e artístico da região. Este museu contribui para a educação e cultura local.`,
      'tourist_attraction': `${name} é um ponto turístico que faz parte da identidade cultural da região. Este local atrai visitantes e contribui para o turismo local.`,
      'establishment': `${name} é um estabelecimento que faz parte da vida cotidiana da região. Este local contribui para a comunidade local e oferece serviços importantes aos moradores.`
    };
    return histories[type] || `${name} é um local de interesse que faz parte da rica história e cultura da região. Este estabelecimento contribui para a identidade única do bairro e da cidade.`;
  };


  const handleSearch = async () => {
    try {
      console.log('🔍 Iniciando busca para:', searchQuery);
      
      if (!searchQuery) {
        console.log('❌ Query vazia, cancelando busca');
        return;
      }
      
    setIsSearching(true);
      console.log('🔍 Estado de busca definido como true');
      
      // Usar API real do Google Places
      console.log('🔍 Importando searchPlaces...');
      const { searchPlaces } = require('../../services/googlePlacesService');
      console.log('🔍 searchPlaces importado:', typeof searchPlaces);
      
      console.log('🔍 Chamando searchPlaces com query:', searchQuery);
      const results = await searchPlaces(searchQuery);
      console.log('🔍 Resultados recebidos:', results.length);
      console.log('🔍 Primeiros resultados:', results.slice(0, 3).map(r => ({ name: r.name, id: r.id })));
      
    setSearchResults(results);
      console.log('🔍 SearchResults atualizado');
    } catch (error) {
      console.error('💥 Erro ao buscar locais:', error);
      console.error('💥 Stack trace:', error.stack);
      setSearchResults([]);
    } finally {
      console.log('🔍 Finalizando busca, setIsSearching(false)');
    setIsSearching(false);
    }
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Raio da Terra em km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Retorna distância em km
  };

  const getPriceText = (priceLevel) => {
    switch(priceLevel) {
      case 0: return '💰 Grátis';
      case 1: return '💰$ Barato';
      case 2: return '💰$$ Moderado';
      case 3: return '💰$$$ Caro';
      case 4: return '💰$$$$ Muito Caro';
      default: return '💰$ Barato';
    }
  };

  // Função para otimizar rota baseada na distância (preservando refeições)
  const optimizeRouteByDistance = () => {
    if (itinerary.length < 2) return;
    
    console.log('🗺️ Otimizando rota por distância (preservando refeições)...');
    
    // Separar refeições de outros locais
    const meals = [];
    const otherLocations = [];
    
    itinerary.forEach(item => {
      const types = item.types || [];
      const isMeal = types.some(type => 
        ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar'].includes(type)
      ) || item.name?.toLowerCase().includes('restaurante') || 
        item.name?.toLowerCase().includes('café') ||
        item.name?.toLowerCase().includes('bar');
      
      if (isMeal) {
        meals.push(item);
        console.log('🍽️ Refeição identificada:', item.name);
      } else {
        otherLocations.push(item);
        console.log('📍 Local não-refeição:', item.name);
      }
    });
    
    console.log(`📊 Total: ${meals.length} refeições, ${otherLocations.length} outros locais`);
    
    // Se temos localização do usuário, usar como ponto de partida
    const startPoint = userLocation || { latitude: -23.5505, longitude: -46.6333 };
    
    // Otimizar apenas os locais não-refeição por distância
    const optimizedOtherLocations = [];
    const remaining = [...otherLocations];
    let currentPoint = startPoint;
    
    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      
      remaining.forEach((item, index) => {
        if (item.location) {
          const distance = haversineDistance(
            currentPoint.latitude, currentPoint.longitude,
            item.location.lat, item.location.lng
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        }
      });
      
      const nearestItem = remaining.splice(nearestIndex, 1)[0];
      optimizedOtherLocations.push(nearestItem);
      currentPoint = nearestItem.location;
    }
    
    // Criar sequência inteligente que intercala refeições e locais
    const finalOptimized = [];
    
    // Estratégia: Manhã (locais) -> Almoço -> Tarde (locais) -> Jantar
    const morningLocations = optimizedOtherLocations.slice(0, Math.ceil(optimizedOtherLocations.length / 2));
    const afternoonLocations = optimizedOtherLocations.slice(Math.ceil(optimizedOtherLocations.length / 2));
    
    console.log('🌅 Locais da manhã:', morningLocations.map(l => l.name));
    console.log('🌆 Locais da tarde:', afternoonLocations.map(l => l.name));
    
    // Adicionar locais da manhã
    morningLocations.forEach(location => {
      finalOptimized.push(location);
      console.log('📍 Adicionado local da manhã:', location.name);
    });
    
    // Adicionar almoço se houver
    if (meals.length > 0) {
      finalOptimized.push(meals[0]);
      console.log('🍽️ Adicionado almoço:', meals[0].name);
    }
    
    // Adicionar locais da tarde
    afternoonLocations.forEach(location => {
      finalOptimized.push(location);
      console.log('📍 Adicionado local da tarde:', location.name);
    });
    
    // Adicionar jantar se houver
    if (meals.length > 1) {
      finalOptimized.push(meals[1]);
      console.log('🍽️ Adicionado jantar:', meals[1].name);
    }
    
    console.log('✅ Sequência final otimizada:', finalOptimized.map((item, i) => `${i}: ${item.name}`));
    
    // Recalcular horários de forma inteligente
    const recalculatedItems = [];
    let currentTime = 9; // Começar às 9h
    let mealCount = 0;
    
    finalOptimized.forEach((item, index) => {
      const types = item.types || [];
      const isMeal = types.some(type => 
        ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar'].includes(type)
      ) || item.name?.toLowerCase().includes('restaurante') || 
        item.name?.toLowerCase().includes('café') ||
        item.name?.toLowerCase().includes('bar');
      
      let timeString;
      
      if (isMeal) {
        // Refeições em horários fixos apropriados
        if (mealCount === 0) {
          timeString = '12:00'; // Almoço
          currentTime = 13; // Próximo horário após almoço
        } else {
          timeString = '19:00'; // Jantar
          currentTime = 20; // Próximo horário após jantar
        }
        mealCount++;
        console.log(`🍽️ Refeição ${mealCount} agendada para: ${timeString}`);
      } else {
        // Locais distribuídos ao longo do dia
        if (currentTime >= 12 && mealCount === 0) {
          // Se chegou no horário de almoço e ainda não teve refeição, pular para depois
          currentTime = 13;
        }
        
        timeString = `${currentTime.toString().padStart(2, '0')}:00`;
        currentTime += 2; // 2 horas por local
        console.log(`📍 Local agendado para: ${timeString}`);
      }
      
      recalculatedItems.push({
        ...item,
        time: timeString
      });
    });
    
    console.log('⏰ Horários finais:', recalculatedItems.map(item => `${item.time} - ${item.name}`));
    setItinerary(recalculatedItems);
    
    Alert.alert(
      'Rota Otimizada', 
      `Roteiro reorganizado!\n\n✅ ${meals.length} refeições mantidas em horários apropriados\n✅ ${otherLocations.length} locais otimizados por distância`
    );
  };

  // Função para mover item para cima
  const moveItemUp = (index) => {
    console.log('⬆️ Movendo item para cima:', index);
    console.log('📋 Estado atual do roteiro:', itinerary.map((item, i) => `${i}: ${item.name}`));
    
    if (index === 0) {
      console.log('❌ Item já está no topo');
      Alert.alert('Aviso', 'Este item já está no topo da lista!');
      return;
    }
    
    if (index >= itinerary.length) {
      console.log('❌ Índice inválido');
      return;
    }
    
    const newItinerary = [...itinerary];
    const item = newItinerary.splice(index, 1)[0];
    newItinerary.splice(index - 1, 0, item);
    
    console.log('✅ Nova ordem após mover para cima:', newItinerary.map((item, i) => `${i}: ${item.name}`));
    
    // Recalcular horários para a nova ordem
    const recalculatedItems = newItinerary.map((item, newIndex) => {
      const startTime = '09:00';
      const timePerItem = 120; // 2 horas por item
      const hours = 9 + (newIndex * 2);
      const timeString = `${hours.toString().padStart(2, '0')}:00`;
      
      return {
        ...item,
        time: timeString
      };
    });
    
    console.log('⏰ Horários recalculados:', recalculatedItems.map(item => `${item.time} - ${item.name}`));
    setItinerary(recalculatedItems);
  };

  // Função para mover item para baixo
  const moveItemDown = (index) => {
    console.log('⬇️ Movendo item para baixo:', index);
    console.log('📋 Estado atual do roteiro:', itinerary.map((item, i) => `${i}: ${item.name}`));
    
    if (index === itinerary.length - 1) {
      console.log('❌ Item já está no final');
      Alert.alert('Aviso', 'Este item já está no final da lista!');
      return;
    }
    
    if (index >= itinerary.length) {
      console.log('❌ Índice inválido');
      return;
    }
    
    const newItinerary = [...itinerary];
    const item = newItinerary.splice(index, 1)[0];
    newItinerary.splice(index + 1, 0, item);
    
    console.log('✅ Nova ordem após mover para baixo:', newItinerary.map((item, i) => `${i}: ${item.name}`));
    
    // Recalcular horários para a nova ordem
    const recalculatedItems = newItinerary.map((item, newIndex) => {
      const startTime = '09:00';
      const timePerItem = 120; // 2 horas por item
      const hours = 9 + (newIndex * 2);
      const timeString = `${hours.toString().padStart(2, '0')}:00`;
      
      return {
        ...item,
        time: timeString
      };
    });
    
    console.log('⏰ Horários recalculados:', recalculatedItems.map(item => `${item.time} - ${item.name}`));
    setItinerary(recalculatedItems);
  };

  // Função para abrir modal de edição de horário
  const openTimeEditModal = (item, index) => {
    console.log('⏰ Abrindo edição de horário para:', item.name);
    setEditingItem({ ...item, index });
    setNewTime(item.time || '09:00');
    setIsTimeEditModalVisible(true);
  };

  // Função para salvar novo horário
  const saveNewTime = () => {
    if (!editingItem || !newTime) return;
    
    console.log('💾 Salvando novo horário:', newTime, 'para:', editingItem.name);
    
    const updatedItinerary = [...itinerary];
    updatedItinerary[editingItem.index] = {
      ...updatedItinerary[editingItem.index],
      time: newTime
    };
    
    // Reordenar por horário após edição
    const sortedItinerary = updatedItinerary.sort((a, b) => {
      const timeA = parseInt((a.time || '00:00').split(':')[0]);
      const timeB = parseInt((b.time || '00:00').split(':')[0]);
      return timeA - timeB;
    });
    
    setItinerary(sortedItinerary);
    setIsTimeEditModalVisible(false);
    setEditingItem(null);
    setNewTime('');
  };

  // Função para abrir modal de imagem
  const openImageModal = (item) => {
    if (item.photos && item.photos.length > 0) {
      console.log('🖼️ Abrindo modal de imagem para:', item.name);
      setSelectedImage({
        name: item.name,
        photo: item.photos[0],
        address: item.address
      });
      setIsImageModalVisible(true);
    } else {
      Alert.alert('Sem Foto', 'Este local não possui foto disponível.');
    }
  };


  const getSortedItinerary = () => {
    if (activeTab !== 'Mapa') return itinerary;
    
    console.log('🗺️ Total de itens no roteiro:', itinerary.length);
    console.log('🗺️ Itens completos:', itinerary.map(item => ({
      name: item.name,
      hasLocation: !!(item.location && item.location.lat && item.location.lng),
      hasAddress: !!item.address,
      location: item.location,
      locationLat: item.location?.lat,
      locationLng: item.location?.lng,
      locationLatType: typeof item.location?.lat,
      locationLngType: typeof item.location?.lng
    })));
    
    // Filtra apenas itens que têm location válida
    const validItems = itinerary.filter(item => {
      if (!item) {
        console.log('❌ Item é null/undefined');
        return false;
      }
      
      if (!item.location) {
        console.log('❌ Item sem location:', item.name);
        return false;
      }
      
      const lat = item.location.lat;
      const lng = item.location.lng;
      
      // Verificar se lat e lng existem e são números válidos
      const hasValidLat = lat !== null && lat !== undefined && !isNaN(parseFloat(lat));
      const hasValidLng = lng !== null && lng !== undefined && !isNaN(parseFloat(lng));
      
      if (!hasValidLat || !hasValidLng) {
        console.log('❌ Item com coordenadas inválidas:', {
          name: item.name,
          lat: lat,
          lng: lng,
          latType: typeof lat,
          lngType: typeof lng,
          latValid: hasValidLat,
          lngValid: hasValidLng
        });
        return false;
      }
      
      console.log('✅ Item válido:', item.name, 'lat:', lat, 'lng:', lng);
      return true;
    });
    
    console.log('✅ Itens válidos para o mapa:', validItems.length);
    console.log('✅ Nomes dos itens válidos:', validItems.map(item => item.name));
    
    // Se não há itens válidos, retornar array vazio
    if (validItems.length === 0) {
      console.log('⚠️ Nenhum item válido encontrado para o mapa');
      return [];
    }
    
    // Garantir que sempre temos itens para o mapa
    let items = [...validItems];
    
    // Aplicar filtro baseado no modo selecionado
    console.log('🔍 Aplicando filtro:', sortMode);
    
    if (sortMode === 'avaliados') {
      // Filtrar apenas os melhores avaliados (rating >= 4.0 ou top 3)
      console.log('📊 Itens antes do filtro de avaliação:', items.map(item => ({ name: item.name, rating: item.rating })));
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      const topRated = items.filter(item => (item.rating || 0) >= 4.0);
      items = topRated.length > 0 ? topRated : items.slice(0, 3);
      console.log('📊 Filtrando por melhores avaliados:', items.length, 'itens');
      console.log('📊 Itens filtrados:', items.map(item => ({ name: item.name, rating: item.rating })));
    } else if (sortMode === 'baratos') {
      // Filtrar apenas os mais baratos (priceLevel <= 2 ou top 3)
      console.log('💰 Itens antes do filtro de preço:', items.map(item => ({ name: item.name, priceLevel: item.priceLevel })));
      items.sort((a, b) => (a.priceLevel ?? 5) - (b.priceLevel ?? 5) || (b.rating || 0) - (a.rating || 0));
      const cheapest = items.filter(item => (item.priceLevel ?? 5) <= 2);
      items = cheapest.length > 0 ? cheapest : items.slice(0, 3);
      console.log('💰 Filtrando por mais baratos:', items.length, 'itens');
      console.log('💰 Itens filtrados:', items.map(item => ({ name: item.name, priceLevel: item.priceLevel })));
    } else if (sortMode === 'proximos' && userLocation) {
      // Filtrar apenas os mais próximos (top 5 ou distância <= 5km)
      console.log('📍 Itens antes do filtro de proximidade:', items.map(item => ({ name: item.name, location: item.location })));
      items.sort((a, b) => {
        const da = haversineDistance(userLocation.latitude, userLocation.longitude, a.location.lat, a.location.lng);
        const db = haversineDistance(userLocation.latitude, userLocation.longitude, b.location.lat, b.location.lng);
        return da - db;
      });
      const nearby = items.filter(item => {
        const distance = haversineDistance(userLocation.latitude, userLocation.longitude, item.location.lat, item.location.lng);
        console.log(`📍 Distância para ${item.name}: ${distance.toFixed(2)}km`);
        return distance <= 5; // 5km
      });
      items = nearby.length > 0 ? nearby : items.slice(0, 5);
      console.log('📍 Filtrando por proximidade:', items.length, 'itens');
      console.log('📍 Itens filtrados:', items.map(item => ({ name: item.name, location: item.location })));
    } else if (sortMode === 'todos') {
      console.log('📋 Mostrando todos os itens');
      // Mostrar todos os itens ordenados por horário
      items.sort((a, b) => {
        const timeA = parseInt((a.time || '00:00').split(':')[0]);
        const timeB = parseInt((b.time || '00:00').split(':')[0]);
        return timeA - timeB;
      });
    } else {
      console.log('📅 Mostrando todos os itens (padrão)');
      // Mostrar todos os itens ordenados por horário
      items.sort((a, b) => {
        const timeA = parseInt((a.time || '00:00').split(':')[0]);
        const timeB = parseInt((b.time || '00:00').split(':')[0]);
        return timeA - timeB;
      });
    }
    
    // Mapear title para name se necessário
    const mappedItems = items.map(item => ({
      ...item,
      name: item.name || item.title || 'Nome não disponível'
    }));
    
    console.log('🗺️ Itens finais para o mapa:', mappedItems.length);
    console.log('🗺️ Nomes finais:', mappedItems.map(item => item.name));
    console.log('🗺️ Detalhes dos itens:', mappedItems.map(item => ({
      id: item.id,
      name: item.name,
      title: item.title,
      hasLocation: !!item.location
    })));
    
    return mappedItems;
  };

  const renderItem = ({ item, index }) => {
    const mappedItem = {
      ...item,
      name: item.name || item.title || 'Nome não disponível'
    };
    
    console.log(`🔍 Renderizando item ${index}:`, {
      name: mappedItem.name,
      time: mappedItem.time,
      description: mappedItem.description,
      types: mappedItem.types,
      hasPhotos: !!mappedItem.photos?.length,
      photosCount: mappedItem.photos?.length || 0,
      photosData: mappedItem.photos?.slice(0, 1).map(p => ({ 
        photo_reference: p.photo_reference?.substring(0, 20) + '...',
        hasReference: !!p.photo_reference 
      })) || [],
      originalName: item.name,
      originalTitle: item.title
    });
    
    return (
    <TouchableOpacity 
      style={styles.itineraryItemContainer}
      onPress={() => handleLocationClick(mappedItem)}
      activeOpacity={0.7}
    >
      <View style={styles.timelineContainer}>
          <TouchableOpacity onPress={() => openTimeEditModal(mappedItem, index)}>
            <Text style={[styles.timeText, isEditMode && styles.timeTextEditable]}>{mappedItem.time}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconContainer} 
            onPress={() => openImageModal(mappedItem)}
          >
            {mappedItem.photos && mappedItem.photos.length > 0 && mappedItem.photos[0].photo_reference ? (
              <Image 
                source={{ 
                  uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photoreference=${mappedItem.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}` 
                }}
                style={styles.locationPhoto}
                onError={(error) => {
                  console.log('❌ Erro ao carregar foto:', error.nativeEvent.error);
                }}
                onLoad={() => {
                  console.log('✅ Foto carregada com sucesso para:', mappedItem.name);
                }}
              />
            ) : (
              createIcons(colors)[mappedItem.icon] || createIcons(colors).food
            )}
          </TouchableOpacity>
        {index < itinerary.length - 1 && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitle}>{mappedItem.name}</Text>
            <Text style={styles.itemDescription}>{mappedItem.description}</Text>
            {mappedItem.address && (
              <Text style={styles.itemAddress}>📍 {mappedItem.address}</Text>
            )}
          </View>
          <View style={styles.itemActionsContainer}>
            {isEditMode && (
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.editButton, 
                    index === 0 && styles.editButtonDisabled
                  ]} 
                  onPress={() => {
                    console.log('🔼 Botão UP clicado para índice:', index);
                    moveItemUp(index);
                  }}
                  disabled={index === 0}
                >
                  <Text style={[
                    styles.editButtonText,
                    index === 0 && styles.editButtonTextDisabled
                  ]}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.editButton, 
                    index === itinerary.length - 1 && styles.editButtonDisabled
                  ]} 
                  onPress={() => {
                    console.log('🔽 Botão DOWN clicado para índice:', index);
                    moveItemDown(index);
                  }}
                  disabled={index === itinerary.length - 1}
                >
                  <Text style={[
                    styles.editButtonText,
                    index === itinerary.length - 1 && styles.editButtonTextDisabled
                  ]}>↓</Text>
                </TouchableOpacity>
        </View>
            )}
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem(mappedItem.id)}>
          {createIcons(colors).remove}
        </TouchableOpacity>
          </View>
      </View>
    </TouchableOpacity>
  );
  };

  const renderNavBar = () => (
    <View style={styles.navContainer}>
      {['Roteiro', 'Mapa', 'Radar', 'Social', 'Perfil'].map((tab) => {
        const isActive = activeTab === tab;
        const color = isActive ? COLORS.accent : COLORS.text;
        return (
          <TouchableOpacity key={tab} style={styles.navButton} onPress={() => setActiveTab(tab)}>
            <Svg height="24" width="24" viewBox="0 0 24 24">
              <Path d={NAV_ICON_PATHS[tab]} fill={color} />
            </Svg>
            <Text style={[styles.navLabel, { color: color }]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* --- Modal de Imagem Expandida --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <View style={styles.imageModalContent}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>{selectedImage?.name}</Text>
              <TouchableOpacity onPress={() => setIsImageModalVisible(false)}>
                <Text style={styles.imageModalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ 
                    uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${selectedImage.photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}` 
                  }}
                  style={styles.expandedImage}
                  resizeMode="cover"
                />
                {selectedImage.address && (
                  <Text style={styles.imageModalAddress}>📍 {selectedImage.address}</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* --- Modal de Edição de Horário --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isTimeEditModalVisible}
        onRequestClose={() => setIsTimeEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Horário</Text>
              <TouchableOpacity onPress={() => setIsTimeEditModalVisible(false)}>
                <Text style={styles.closeButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.editTimeLabel, { color: colors.text }]}>Horário para: {editingItem?.name}</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="HH:MM"
              placeholderTextColor={COLORS.textSecondary}
              value={newTime}
              onChangeText={setNewTime}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.saveTimeButton} onPress={saveNewTime}>
              <Text style={styles.saveTimeButtonText}>Salvar Horário</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* --- Modal de Busca --- */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isSearchModalVisible}
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <SafeAreaView style={styles.fullScreenModalContainer}>
          <KeyboardAvoidingView 
            style={styles.fullScreenModalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Local</Text>
              <TouchableOpacity onPress={() => setIsSearchModalVisible(false)}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquise um local em SP..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch} // Permite buscar com o "Enter" do teclado
            />
            {isSearching ? (
              <ActivityIndicator size="large" color={COLORS.accent} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => item.id || `search-result-${index}`}
                renderItem={({ item }) => (
                  <View style={styles.searchResultItem}>
                    <View style={styles.searchResultTextContainer}>
                        <Text style={[styles.searchResultTitle, { color: colors.text }]}>{item.name || item.title || 'Nome não disponível'}</Text>
                        <Text style={[styles.searchResultDescription, { color: colors.textSecondary }]}>
                          {item.address || item.formattedAddress || 'Endereço não disponível'}
                        </Text>
                        <Text style={styles.searchResultRating}>
                          ⭐ {item.rating || 'N/A'} • {getPriceText(item.priceLevel)} • 👥 {item.userRatingsTotal || 0} avaliações
                        </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.addResultButton} 
                      onPress={() => {
                        console.log('🔘 Botão Adicionar clicado para:', item.name || item.title);
                        handleSelectLocation(item);
                      }}
                    >
                       <Text style={styles.addResultButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptySearchText}>Nenhum resultado encontrado. Tente outra busca.</Text>}
              />
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Modal de Seleção de Horário */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isTimeSelectionModalVisible}
        onRequestClose={handleCancelAddLocation}
      >
        <SafeAreaView style={styles.fullScreenModalContainer}>
          <KeyboardAvoidingView 
            style={styles.fullScreenModalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolher Horário</Text>
              <TouchableOpacity onPress={handleCancelAddLocation}>
                <Text style={styles.closeButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
            
            {pendingLocation && (
              <View style={styles.locationPreviewContainer}>
                <Text style={styles.locationPreviewTitle}>
                  {pendingLocation.name || pendingLocation.title || 'Nome não disponível'}
                </Text>
                <Text style={styles.locationPreviewAddress}>
                  {pendingLocation.address || pendingLocation.formattedAddress || 'Endereço não disponível'}
                </Text>
              </View>
            )}
            
            <View style={styles.timeSelectionContainer}>
              <Text style={[styles.timeSelectionLabel, { color: colors.text }]}>Escolha o horário:</Text>
              <TextInput
                style={styles.timeInput}
                value={selectedTime}
                onChangeText={(text) => {
                  const formatted = formatTimeInput(text);
                  setSelectedTime(formatted);
                }}
                placeholder="HH:MM"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                maxLength={5}
              />
              <Text style={styles.timeSelectionHint}>
                Digite apenas números (ex: 1530) e os dois pontos serão adicionados automaticamente
              </Text>
            </View>
            
            <View style={styles.timeSelectionButtons}>
              <TouchableOpacity 
                style={styles.cancelTimeButton} 
                onPress={handleCancelAddLocation}
              >
                <Text style={styles.cancelTimeButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmTimeButton} 
                onPress={handleConfirmAddLocation}
              >
                <Text style={styles.confirmTimeButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Modal de Detalhes do Local */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isLocationDetailsModalVisible}
        onRequestClose={handleCloseLocationDetails}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes do Local</Text>
              <TouchableOpacity onPress={handleCloseLocationDetails}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
            
            {isLoadingDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Carregando detalhes...</Text>
              </View>
            ) : selectedLocationDetails ? (
              <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                {/* Nome e Status */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsTitle}>{selectedLocationDetails.name}</Text>
                  <View style={styles.statusContainer}>
                    <Text style={[
                      styles.statusText,
                      selectedLocationDetails.is_open === true ? styles.statusOpen : 
                      selectedLocationDetails.is_open === false ? styles.statusClosed : styles.statusUnknown
                    ]}>
                      {selectedLocationDetails.status_text}
                    </Text>
                  </View>
                </View>

                {/* Endereço */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>📍 Endereço</Text>
                  <Text style={styles.detailsText}>{selectedLocationDetails.formatted_address}</Text>
                </View>

                {/* Avaliação e Preço */}
                <View style={styles.detailsSection}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.sectionTitle}>⭐ Avaliação</Text>
                    <Text style={styles.ratingText}>
                      {selectedLocationDetails.rating}/5 ({selectedLocationDetails.user_ratings_total} avaliações)
                    </Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.sectionTitle}>💰 Preço</Text>
                    <Text style={styles.priceText}>{selectedLocationDetails.price_level_text}</Text>
                  </View>
                </View>

                {/* Horários de Funcionamento */}
                {selectedLocationDetails.opening_hours && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>🕒 Horários de Funcionamento</Text>
                    {selectedLocationDetails.opening_hours.weekdayText ? (
                      selectedLocationDetails.opening_hours.weekdayText.map((schedule, index) => (
                        <Text key={index} style={styles.scheduleText}>{schedule}</Text>
                      ))
                    ) : (
                      <Text style={styles.detailsText}>Horários não disponíveis</Text>
                    )}
                  </View>
                )}

                {/* Acessibilidade */}
                {selectedLocationDetails.accessibility && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>♿ Acessibilidade</Text>
                    <View style={styles.accessibilityContainer}>
                      <View style={styles.accessibilityItem}>
                        <Text style={styles.accessibilityIcon}>
                          {selectedLocationDetails.accessibility.wheelchairAccessible ? '♿' : '🚫'}
                        </Text>
                        <Text style={[
                          styles.accessibilityText,
                          selectedLocationDetails.accessibility.wheelchairAccessible ? styles.accessibilityAvailable : styles.accessibilityUnavailable
                        ]}>
                          {selectedLocationDetails.accessibility.wheelchairAccessible ? 'Entrada acessível para cadeirantes' : 'Entrada não acessível para cadeirantes'}
                        </Text>
                      </View>
                      
                      <View style={styles.accessibilityItem}>
                        <Text style={styles.accessibilityIcon}>
                          {selectedLocationDetails.accessibility.hasAccessibleParking ? '🅿️' : '🚫'}
                        </Text>
                        <Text style={[
                          styles.accessibilityText,
                          selectedLocationDetails.accessibility.hasAccessibleParking ? styles.accessibilityAvailable : styles.accessibilityUnavailable
                        ]}>
                          {selectedLocationDetails.accessibility.hasAccessibleParking ? 'Estacionamento acessível disponível' : 'Estacionamento acessível não disponível'}
                        </Text>
                      </View>
                      
                      <View style={styles.accessibilityItem}>
                        <Text style={styles.accessibilityIcon}>
                          {selectedLocationDetails.accessibility.hasAccessibleRestroom ? '🚻' : '🚫'}
                        </Text>
                        <Text style={[
                          styles.accessibilityText,
                          selectedLocationDetails.accessibility.hasAccessibleRestroom ? styles.accessibilityAvailable : styles.accessibilityUnavailable
                        ]}>
                          {selectedLocationDetails.accessibility.hasAccessibleRestroom ? 'Banheiro acessível disponível' : 'Banheiro acessível não disponível'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Contato */}
                {(selectedLocationDetails.formatted_phone_number || selectedLocationDetails.website) && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>📞 Contato</Text>
                    {selectedLocationDetails.formatted_phone_number && (
                      <Text style={styles.contactText}>📞 {selectedLocationDetails.formatted_phone_number}</Text>
                    )}
                    {selectedLocationDetails.website && (
                      <Text style={styles.contactText}>🌐 {selectedLocationDetails.website}</Text>
                    )}
                  </View>
                )}


                {/* Descrição do Local */}
                {selectedLocationDetails.description && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>📝 Sobre o Local</Text>
                    <Text style={styles.descriptionText}>{selectedLocationDetails.description}</Text>
                  </View>
                )}

                {/* História do Local */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>📖 História</Text>
                  <Text style={styles.historyText}>{selectedLocationDetails.history}</Text>
                </View>

                {/* Ações */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>⚡ Ações</Text>
                  <View style={{ flexDirection: 'row', gap: 15 }}>
                    <TouchableOpacity
                      onPress={() => handleFavoriteLocation(selectedLocationDetails)}
                      disabled={favoriting}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFA500',
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        borderRadius: 20,
                        flex: 1,
                        justifyContent: 'center',
                        opacity: favoriting ? 0.6 : 1
                      }}
                    >
                      {favoriting ? (
                        <ActivityIndicator size="small" color="#2D2D2D" />
                      ) : (
                        <>
                          <Text style={{ 
                            fontSize: 18, 
                            color: '#2D2D2D',
                            marginRight: 5
                          }}>
                            ⭐
                          </Text>
                          <Text style={{ 
                            fontSize: 14, 
                            color: '#2D2D2D',
                            fontWeight: '600'
                          }}>
                            Favoritar
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Fotos */}
                {selectedLocationDetails.photos && selectedLocationDetails.photos.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>📸 Fotos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
                      {selectedLocationDetails.photos.slice(0, 5).map((photo, index) => (
                        <Image
                          key={index}
                          source={{
                            uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                          }}
                          style={styles.detailPhoto}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Avaliações */}
                {selectedLocationDetails.reviews && selectedLocationDetails.reviews.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>💬 Avaliações Recentes</Text>
                    {selectedLocationDetails.reviews.slice(0, 3).map((review, index) => (
                      <View key={index} style={styles.reviewContainer}>
                        <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                        <Text style={styles.reviewRating}>⭐ {review.rating}/5</Text>
                        <Text style={styles.reviewText}>{review.text}</Text>
                        <Text style={styles.reviewDate}>{review.relative_time_description}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Erro ao carregar detalhes</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <View style={[styles.mainContentWrapper, { backgroundColor: colors.background }]}>
        {activeTab !== 'Perfil' && (
        <View style={styles.headerContainer}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Seu Roteiro de Turismo em SP</Text>
            <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Um plano inteligente criado pela SampAI para você!</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={[styles.saveButton, { 
              backgroundColor: colors.accent,
              shadowColor: isDark ? '#000' : colors.shadow,
              shadowOpacity: isDark ? 0.25 : 0.15,
              elevation: isDark ? 5 : 3
            }]} onPress={() => {
              if (!isAuthenticated) {
                Alert.alert('Login Necessário', 'Faça login para salvar roteiros');
                return;
              }
              setShowSaveModal(true);
            }}>
              <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>
                {isAuthenticated ? 'Salvar Roteiro' : '🔒 Login p/ Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        )}

        {activeTab === 'Roteiro' && (
        <FlatList
          data={itinerary}
          renderItem={renderItem}
            keyExtractor={(item, index) => item.id || `itinerary-item-${index}`}
          style={styles.scrollView}
          ListHeaderComponent={
              <View>
            <View style={styles.titleContainer}>
              <View style={styles.titleHeader}>
                <TouchableOpacity 
                  onPress={toggleTheme}
                  style={[styles.themeToggle, { 
                    backgroundColor: colors.surface,
                    borderWidth: isDark ? 0 : 1,
                    borderColor: isDark ? 'transparent' : colors.border,
                    shadowColor: isDark ? '#000' : colors.shadow,
                    shadowOpacity: isDark ? 0.25 : 0.15,
                    elevation: isDark ? 5 : 3
                  }]}
                >
                  <Text style={[styles.themeToggleText, { color: colors.text }]}>
                    {isDark ? '🌞' : '🌚'}
                  </Text>
                </TouchableOpacity>
              </View>
            <Text style={[styles.dayTitle, { color: colors.text }]}>
              {dayTitle}
            </Text>
            </View>
                <View style={styles.editControlsContainer}>
                  <TouchableOpacity 
                    style={[styles.editModeButton, isEditMode && styles.editModeButtonActive]} 
                    onPress={() => setIsEditMode(!isEditMode)}
                  >
                    <Text style={[styles.editModeButtonText, isEditMode && styles.editModeButtonTextActive]}>
                      {isEditMode ? 'Finalizar Edição' : 'Editar Roteiro'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.optimizeButton} 
                    onPress={optimizeRouteByDistance}
                  >
                    <Text style={styles.optimizeButtonText}>Otimizar Rota</Text>
                  </TouchableOpacity>
                </View>
              </View>
          }
          ListFooterComponent={
            <View style={styles.footerContainer}>
                <View style={styles.alertContainer}>
                  {createIcons(colors).warning}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertText, { fontFamily: 'Poppins_700Bold' }]}>
                    Dica de Segurança da SampAI:{' '}
                  </Text>

                  {/* Texto com fallback e expandir */}
                  <Text
                    style={[styles.alertText, { fontFamily: 'Poppins_400Regular' }]}
                    numberOfLines={expanded ? undefined : 3}
                    ellipsizeMode="tail"
                  >
                    {alerts && alerts.trim().length > 0
                      ? alerts
                      : 'Mantenha sempre seus pertences seguros e evite locais isolados.'}
                  </Text>

                  {/* Mostrar mais / menos */}
                  {(alerts && alerts.trim().length > 120) && (
                    <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                      <Text style={[styles.alertText, { fontFamily: 'Poppins_700Bold' }]}>
                        {expanded ? 'Mostrar menos ▲' : 'Mostrar mais ▼'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsSearchModalVisible(true)}
              >
                {createIcons(colors).add}
                <Text style={styles.addButtonText}>Adicionar Local</Text>
              </TouchableOpacity>
            </View>
          }

        />
        )}

        {activeTab === 'Mapa' && (
          <View style={styles.mapWrapper}>
            <View style={styles.sortRowContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.sortRow}
                contentContainerStyle={styles.sortRowContent}
                bounces={false}
                decelerationRate="fast"
              >
              <TouchableOpacity onPress={() => handleFilterChange('proximos')} style={[styles.sortButton, sortMode === 'proximos' && styles.sortButtonActive]}>
                <Text style={[styles.sortButtonText, sortMode === 'proximos' && styles.sortButtonTextActive]}>📍 Próximos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFilterChange('avaliados')} style={[styles.sortButton, sortMode === 'avaliados' && styles.sortButtonActive]}>
                <Text style={[styles.sortButtonText, sortMode === 'avaliados' && styles.sortButtonTextActive]}>⭐ Top Avaliados</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFilterChange('baratos')} style={[styles.sortButton, sortMode === 'baratos' && styles.sortButtonActive]}>
                <Text style={[styles.sortButtonText, sortMode === 'baratos' && styles.sortButtonTextActive]}>💰 Mais Baratos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFilterChange('todos')} style={[styles.sortButton, sortMode === 'todos' && styles.sortButtonActive]}>
                <Text style={[styles.sortButtonText, sortMode === 'todos' && styles.sortButtonTextActive]}>📋 Todos</Text>
              </TouchableOpacity>
              </ScrollView>
            </View>
            
            {/* Botão de Limpar Filtros */}
            {sortMode !== 'todos' && (
              <View style={styles.clearFiltersContainer}>
                <TouchableOpacity 
                  onPress={handleClearFilters} 
                  style={styles.clearFiltersButton}
                >
                  <Text style={styles.clearFiltersText}>🗑️ Limpar Filtros</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Mapa do Google Maps com marcadores */}
            <View style={{ flex: 1, backgroundColor: '#f0f0f0' }}>
              <View style={[
                styles.mapInfoContainer,
                sortMode !== 'todos' && styles.mapInfoContainerFiltered
              ]}>
                <Text style={styles.mapInfoTitle}>
                  {sortMode === 'proximos' ? '📍 Locais Próximos' :
                   sortMode === 'avaliados' ? '⭐ Melhores Avaliados' :
                   sortMode === 'baratos' ? '💰 Mais Baratos' :
                   '📋 Todos os Locais'}
              </Text>
                <Text style={[styles.mapInfoSubtitle, { color: colors.textSecondary }]}>
                  {sortMode === 'todos' ? 
                    `${getSortedItinerary().length} locais no roteiro` :
                    `${getSortedItinerary().length} de ${itinerary.length} locais (filtrado)`
                  }
                </Text>
              </View>
              <MapView
                ref={mapRef}
                style={{ flex: 1, margin: 10, borderRadius: 10 }}
                initialRegion={{
                  latitude: -23.5505,
                  longitude: -46.6333,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                followsUserLocation={false}
              >
           {getSortedItinerary().map((item, index) => {
             console.log(`🗺️ Renderizando marcador ${index}:`, {
               name: item.name,
               location: item.location,
               hasLocation: !!(item.location && item.location.lat && item.location.lng)
             });
             
             if (!item.location || !item.location.lat || !item.location.lng) {
               console.log('❌ Marcador sem coordenadas válidas:', item.name);
               return null;
             }
             
             return (
             <Marker
               key={`${item.id}-${index}`}
               coordinate={{
                 latitude: parseFloat(item.location.lat),
                 longitude: parseFloat(item.location.lng)
               }}
               title={item.name}
                 description={`⭐ ${item.rating || 'N/A'} • ${getPriceText(item.priceLevel)} • ⏰ ${item.time || 'N/A'}${item.address ? `\n📍 ${item.address}` : ''}${item.openNow ? '\n🟢 Aberto agora' : '\n🔴 Fechado'}${item.userRatingsTotal ? `\n👥 ${item.userRatingsTotal} avaliações` : ''}`}
             />
             );
           })}
           
           {/* Linha da rota conectando os pontos */}
           {getSortedItinerary().length > 1 && (
             <Polyline
               coordinates={getSortedItinerary()
                 .filter(item => item.location && item.location.lat && item.location.lng)
                 .map(item => ({
                   latitude: parseFloat(item.location.lat),
                   longitude: parseFloat(item.location.lng)
                 }))
               }
               strokeColor={colors.accent}
               strokeWidth={3}
               strokePattern={[1]}
             />
           )}
              </MapView>
              
              {/* Botão Iniciar Rota */}
              {getSortedItinerary().length > 0 && (
                <View style={styles.startRouteContainer}>
                  <TouchableOpacity 
                    style={[styles.startRouteButton, { backgroundColor: colors.accent }]}
                    onPress={handleStartNavigation}
                  >
                    <Text style={[styles.startRouteButtonText, { color: colors.buttonText }]}>
                      🧭 Iniciar Rota
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'Radar' && (
          <View style={styles.radarWrapper}>
            {/* Header do Radar */}
            <View style={styles.radarHeader}>
              <Text style={[styles.radarTitle, { color: colors.text }]}>Radar de Proximidade</Text>
              <Text style={[styles.radarSubtitle, { color: colors.textSecondary }]}>Encontre os melhores lugares perto de você agora.</Text>
            </View>

            {/* Slider de Distância */}
            <View style={styles.distanceSection}>
              <Text style={[styles.distanceLabel, { color: colors.text }]}>
                Distância: <Text style={[styles.distanceValue, { color: colors.accent }]}>{maxDistance} km</Text>
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>0km</Text>
                <View 
                  ref={sliderRef}
                  style={styles.sliderTrack}
                  onLayout={(event) => {
                    const { width } = event.nativeEvent.layout;
                    setSliderWidth(width);
                    console.log('🎛️ Largura do slider:', width);
                  }}
                  {...panResponder.panHandlers}
                >
                  <View style={[styles.sliderProgress, { width: `${(maxDistance / 30) * 100}%` }]} />
                  <TouchableOpacity
                    style={[
                      styles.sliderThumb, 
                      { left: `${(maxDistance / 30) * 100}%` },
                      isDragging && styles.sliderThumbActive
                    ]}
                    onPress={() => {
                      // Incrementar distância ao clicar
                      const newDistance = maxDistance >= 30 ? 1 : maxDistance + 1;
                      setMaxDistance(newDistance);
                      console.log('📏 Distância alterada para:', newDistance, 'km');
                    }}
                    onLongPress={() => {
                      // Reset para 1km ao segurar
                      setMaxDistance(1);
                      console.log('📏 Distância resetada para: 1km');
                    }}
                  />
                </View>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>30km</Text>
              </View>
              
              {/* Botões de controle rápido */}
              <View style={styles.quickControls}>
                <TouchableOpacity 
                  style={styles.quickButton}
                  onPress={() => {
                    const newDistance = Math.max(1, maxDistance - 5);
                    setMaxDistance(newDistance);
                    console.log('📏 Distância diminuída para:', newDistance, 'km');
                  }}
                >
                  <Text style={styles.quickButtonText}>-5km</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickButton}
                  onPress={() => {
                    const newDistance = Math.min(30, maxDistance + 5);
                    setMaxDistance(newDistance);
                    console.log('📏 Distância aumentada para:', newDistance, 'km');
                  }}
                >
                  <Text style={styles.quickButtonText}>+5km</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickButton}
                  onPress={() => {
                    setMaxDistance(10);
                    console.log('📏 Distância definida para: 10km');
                  }}
                >
                  <Text style={styles.quickButtonText}>10km</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Seção de Locais Encontrados */}
            <View style={styles.foundSection}>
              <View style={styles.foundHeader}>
                <Text style={styles.foundTitle}>Encontrados</Text>
                <View style={styles.sortDropdownContainer}>
                  <TouchableOpacity 
                    style={styles.sortDropdown}
                    onPress={() => setIsSortDropdownVisible(!isSortDropdownVisible)}
                  >
                    <Text style={styles.sortText}>
                      {SORT_OPTIONS.find(option => option.value === radarSortMode)?.label || 'Mais próximos'}
                    </Text>
                    <Text style={styles.sortArrow}>{isSortDropdownVisible ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  
                  {isSortDropdownVisible && (
                    <View style={styles.sortDropdownMenu}>
                      {SORT_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.sortOption,
                            radarSortMode === option.value && styles.sortOptionActive
                          ]}
                          onPress={() => {
                            setRadarSortMode(option.value);
                            setIsSortDropdownVisible(false);
                            console.log('🔍 Modo de ordenação alterado para:', option.value);
                            // Re-ordenar resultados existentes
                            if (radarResults.length > 0) {
                              const reorderedResults = [...radarResults].sort((a, b) => {
                                switch (option.value) {
                                  case 'proximos':
                                    const distanceA = calculateDistance(
                                      userLocation.latitude,
                                      userLocation.longitude,
                                      a.geometry.location.lat,
                                      a.geometry.location.lng
                                    );
                                    const distanceB = calculateDistance(
                                      userLocation.latitude,
                                      userLocation.longitude,
                                      b.geometry.location.lat,
                                      b.geometry.location.lng
                                    );
                                    return distanceA - distanceB;
                                  case 'avaliados':
                                    const ratingA = a.rating || 0;
                                    const ratingB = b.rating || 0;
                                    return ratingB - ratingA;
                                  case 'baratos':
                                    const priceA = a.price_level || 4;
                                    const priceB = b.price_level || 4;
                                    return priceA - priceB;
                                  case 'caros':
                                    const priceA2 = a.price_level || 0;
                                    const priceB2 = b.price_level || 0;
                                    return priceB2 - priceA2;
                                  default:
                                    return 0;
                                }
                              });
                              setRadarResults(reorderedResults);
                            }
                          }}
                        >
                          <Text style={styles.sortOptionIcon}>{option.icon}</Text>
                          <Text style={[
                            styles.sortOptionText,
                            radarSortMode === option.value && styles.sortOptionTextActive
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Lista de Locais */}
              <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
                {radarResults.length > 0 ? (
                  radarResults.map((place, index) => (
                    <TouchableOpacity 
                      key={`radar-${place.place_id}-${index}`} 
                      style={styles.locationCard}
                      onPress={() => {
                        console.log('📍 Card clicado:', place.name);
                        console.log('📍 Place ID:', place.place_id);
                        console.log('📍 Índice:', index);
                        console.log('📍 Chamando handleRadarLocationClick...');
                        handleRadarLocationClick(place);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.locationIcon}>
                        {place.photos && place.photos.length > 0 ? (
                          <Image 
                            source={{ 
                              uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}` 
                            }}
                            style={styles.locationImage}
                            onError={() => {
                              console.log('❌ Erro ao carregar imagem do local:', place.name);
                            }}
                          />
                        ) : (
                          <Text style={styles.locationIconText}>
                            {getPlaceIcon(place.types?.[0] || 'establishment')}
                          </Text>
                        )}
                      </View>
                      <View style={styles.locationInfo}>
                        <Text style={[styles.locationName, { color: colors.text }]}>{place.name}</Text>
                        <Text style={[styles.locationType, { color: colors.textSecondary }]}>{getPlaceTypeLabel(place.types?.[0] || 'establishment')}</Text>
                        <View style={styles.locationDetails}>
                          <View style={styles.locationDetail}>
                            <Text style={styles.detailIcon}>📍</Text>
                            <Text style={styles.detailText}>
                              {userLocation && userLocation.latitude && userLocation.longitude && place.geometry && place.geometry.location ? 
                                `${calculateDistance(
                                  userLocation.latitude,
                                  userLocation.longitude,
                                  place.geometry.location.lat,
                                  place.geometry.location.lng
                                )}km` : 
                                'N/A'
                              }
                            </Text>
                          </View>
                          <View style={styles.locationDetail}>
                            <Text style={styles.detailIcon}>⭐</Text>
                            <Text style={styles.detailText}>{place.rating || 'N/A'}</Text>
                          </View>
                          <View style={styles.locationDetail}>
                            <Text style={styles.detailText}>{getPriceText(place.price_level)}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>
                      {isSearchingRadar ? '🔍 Buscando locais...' : '📍 Nenhum local encontrado'}
                    </Text>
                    <TouchableOpacity
                      onPress={handleRadarSearch}
                      style={styles.searchButton}
                      disabled={isSearchingRadar}
                    >
                      <Text style={styles.searchButtonText}>🔍 Buscar Locais</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {activeTab === 'Social' && (
          <View style={styles.placeholderWrapper}>
            <Text style={styles.placeholderText}>Social em breve</Text>
          </View>
        )}

        {activeTab === 'Perfil' && (
          <View style={styles.profileContainer}>
            {!isAuthenticated ? (
              // Tela de Login/Cadastro
              <View style={styles.authContainer}>
                <View style={styles.authHeader}>
                  <Text style={[styles.authTitle, { color: colors.text }]}>Bem-vindo ao SampAI</Text>
                  <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
                    Faça login ou cadastre-se para salvar seus roteiros e favoritos
                  </Text>
                </View>
                
                <View style={styles.authButtons}>
                  <TouchableOpacity
                    style={styles.authButton}
                    onPress={() => setShowLoginModal(true)}
                  >
                    <Text style={styles.authButtonText}>Fazer Login</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.authButton, styles.registerButton]}
                    onPress={() => setShowRegisterModal(true)}
                  >
                    <Text style={[styles.authButtonText, styles.registerButtonText]}>
                      Criar Conta
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.authFeatures}>
                  <Text style={styles.featuresTitle}>✨ Com uma conta você pode:</Text>
                  <View style={styles.featuresList}>
                    <Text style={styles.featureItem}>💾 Salvar seus roteiros</Text>
                    <Text style={styles.featureItem}>⭐ Sincronizar favoritos</Text>
                    <Text style={styles.featureItem}>📱 Acessar de qualquer dispositivo</Text>
                    <Text style={styles.featureItem}>🔄 Backup automático</Text>
                  </View>
                </View>
              </View>
            ) : (
              // Tela do Usuário Logado
              <View style={styles.userContainer}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.nome || 'Usuário'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutButtonText}>Sair</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.userContent} showsVerticalScrollIndicator={false}>
                  {/* Roteiros Salvos */}
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>💾 Roteiros Salvos</Text>
                      <Text style={styles.sectionCounter}>
                        {savedRoutes.length}/3 {savedRoutes.length >= 3 ? '🔒' : ''}
                      </Text>
                    </View>
                    {savedRoutes.length === 0 ? (
                      <View style={styles.emptySection}>
                        <Text style={styles.emptyText}>Nenhum roteiro salvo ainda</Text>
                        <Text style={styles.emptySubtext}>
                          Crie roteiros na aba "Roteiro" e salve-os aqui
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.routesList}>
                        {savedRoutes.map((route, index) => (
                          <TouchableOpacity
                            key={`route-${index}`}
                            style={styles.routeCard}
                            onPress={() => handleLoadRoute(route)}
                          >
                            <View style={styles.routeCardHeader}>
                              <Text style={styles.routeCardName}>{route.name}</Text>
                              <Text style={styles.routeCardDate}>
                                {route.date ? new Date(route.date).toLocaleDateString('pt-BR') : 'Data não disponível'}
                              </Text>
                            </View>
                            <Text style={styles.routeCardLocations}>
                              📍 {route.totalLocais || route.locations?.length || 0} locais
                            </Text>
                          </TouchableOpacity>
                        ))}
          </View>
        )}
                  </View>
                  
                  {/* Favoritos do Usuário */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>⭐ Meus Favoritos</Text>
                    {userFavorites.length === 0 ? (
                      <View style={styles.emptySection}>
                        <Text style={styles.emptyText}>Nenhum favorito ainda</Text>
                        <Text style={styles.emptySubtext}>
                          Favoritize locais nos detalhes para vê-los aqui
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.favoritesList}>
                        {userFavorites.map((favorite, index) => (
                          <TouchableOpacity
                            key={`favorite-${index}`}
                            style={[styles.favoriteCard, { 
                              backgroundColor: colors.cardBackground,
                              borderColor: colors.optionBorder 
                            }]}
                            onPress={() => handleViewFavorite(favorite)}
                          >
                            <View style={styles.favoriteCardContent}>
                              <View style={styles.favoriteCardMain}>
                                <Text style={[styles.favoriteCardName, { color: colors.text }]} numberOfLines={2}>
                                  {favorite.name}
                                </Text>
                                {favorite.address && (
                                  <Text style={[styles.favoriteCardAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                                    📍 {favorite.address}
                                  </Text>
                                )}
                                {favorite.rating > 0 && (
                                  <View style={styles.favoriteCardRatingContainer}>
                                    <Text style={[styles.favoriteCardRating, { color: colors.accent }]}>
                                      ⭐ {favorite.rating.toFixed(1)}
                                    </Text>
                                    <Text style={[styles.favoriteCardRatingText, { color: colors.textSecondary }]}>
                                      / 5.0
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <TouchableOpacity
                                onPress={() => handleRemoveFavorite(favorite)}
                                style={[styles.favoriteRemoveButton, { backgroundColor: colors.error + '20' }]}
                              >
                                <Text style={[styles.favoriteRemoveText, { color: colors.error }]}>🗑️</Text>
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  
                  {/* Estatísticas */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.accent }]}>{savedRoutes.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Roteiros Salvos</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.accent }]}>{userFavorites.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favoritos</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

      </View>
      {renderNavBar()}

      {/* Modal de Login */}
      {showLoginModal && (
        <Modal
          visible={showLoginModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLoginModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.authModalContainer}>
              <View style={styles.authModalHeader}>
                <Text style={styles.authModalTitle}>Fazer Login</Text>
                <TouchableOpacity onPress={() => {
                  setShowLoginModal(false);
                  setLoginEmail('');
                  setLoginPassword('');
                }}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.authModalContent}>
                <TextInput
                  style={styles.authInput}
                  placeholder="Email"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                />
                <TextInput
                  style={styles.authInput}
                  placeholder="Senha"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />
                
                <TouchableOpacity
                  style={styles.authSubmitButton}
                  onPress={() => {
                    if (!loginEmail.trim() || !loginPassword.trim()) {
                      Alert.alert('Erro', 'Email e senha são obrigatórios');
                      return;
                    }
                    handleLogin(loginEmail, loginPassword);
                  }}
                >
                  <Text style={styles.authSubmitButtonText}>Entrar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.authSwitchButton}
                  onPress={() => {
                    setShowLoginModal(false);
                    setLoginEmail('');
                    setLoginPassword('');
                    setShowRegisterModal(true);
                  }}
                >
                  <Text style={styles.authSwitchButtonText}>
                    Não tem conta? Criar conta
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Cadastro */}
      {showRegisterModal && (
        <Modal
          visible={showRegisterModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowRegisterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.authModalContainer}>
              <View style={styles.authModalHeader}>
                <Text style={styles.authModalTitle}>Criar Conta</Text>
                <TouchableOpacity onPress={() => {
                  setShowRegisterModal(false);
                  setRegisterName('');
                  setRegisterEmail('');
                  setRegisterPassword('');
                  setRegisterConfirmPassword('');
                }}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.authModalContent}>
                <TextInput
                  style={styles.authInput}
                  placeholder="Nome completo"
                  placeholderTextColor={COLORS.textSecondary}
                  value={registerName}
                  onChangeText={setRegisterName}
                />
                <TextInput
                  style={styles.authInput}
                  placeholder="Email"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={registerEmail}
                  onChangeText={setRegisterEmail}
                />
                <TextInput
                  style={styles.authInput}
                  placeholder="Senha"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                />
                <TextInput
                  style={styles.authInput}
                  placeholder="Confirmar senha"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  value={registerConfirmPassword}
                  onChangeText={setRegisterConfirmPassword}
                />
                
                <TouchableOpacity
                  style={styles.authSubmitButton}
                  onPress={() => {
                    if (registerPassword !== registerConfirmPassword) {
                      Alert.alert('Erro', 'As senhas não coincidem');
                      return;
                    }
                    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
                      Alert.alert('Erro', 'Todos os campos são obrigatórios');
                      return;
                    }
                    handleRegister(registerName, registerEmail, registerPassword);
                  }}
                >
                  <Text style={styles.authSubmitButtonText}>Criar Conta</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.authSwitchButton}
                  onPress={() => {
                    setShowRegisterModal(false);
                    setRegisterName('');
                    setRegisterEmail('');
                    setRegisterPassword('');
                    setRegisterConfirmPassword('');
                    setShowLoginModal(true);
                  }}
                >
                  <Text style={styles.authSwitchButtonText}>
                    Já tem conta? Fazer login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Detalhes do Radar - Versão Responsiva */}
      {isRadarDetailsModalVisible && (
        <Modal
          visible={isRadarDetailsModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={handleCloseRadarDetails}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#2D2D2D' }}>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingHorizontal: 20,
              paddingVertical: 15,
              backgroundColor: '#393939',
              borderBottomWidth: 1,
              borderBottomColor: '#555555'
            }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#F5F5F5' }}>Detalhes do Local</Text>
              <TouchableOpacity 
                onPress={handleCloseRadarDetails} 
                style={{ 
                  padding: 10,
                  borderRadius: 20,
                  backgroundColor: '#555555'
                }}
              >
                <Text style={{ fontSize: 18, color: '#A0A0A0' }}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Conteúdo */}
            {selectedRadarLocation && (
              <ScrollView style={{ flex: 1, padding: 20 }}>
                {/* Nome do Local */}
                <View style={{ 
                  backgroundColor: '#393939', 
                  padding: 20, 
                  borderRadius: 12, 
                  marginBottom: 15,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3
                }}>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: '#F5F5F5',
                    marginBottom: 10,
                    lineHeight: 26
                  }}>
                    {selectedRadarLocation.name}
                  </Text>
                  
                  <Text style={{ 
                    fontSize: 16, 
                    color: '#A0A0A0',
                    lineHeight: 22
                  }}>
                    📍 {selectedRadarLocation.formatted_address}
                  </Text>
                </View>

                {/* Informações Principais */}
                <View style={{ 
                  backgroundColor: '#393939', 
                  padding: 20, 
                  borderRadius: 12, 
                  marginBottom: 15,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3
                }}>
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: '#F5F5F5',
                    marginBottom: 15
                  }}>
                    Informações
                  </Text>
                  
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, color: '#A0A0A0', marginBottom: 4 }}>
                      ⭐ Avaliação: {selectedRadarLocation.rating}/5
                    </Text>
                    <Text style={{ fontSize: 14, color: '#8E8E93' }}>
                      ({selectedRadarLocation.user_ratings_total} avaliações)
                    </Text>
                  </View>
                  
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, color: '#A0A0A0' }}>
                      💰 {getPriceText(selectedRadarLocation.price_level)}
                    </Text>
                  </View>
                  
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ 
                      fontSize: 16, 
                      color: selectedRadarLocation.is_open ? '#FFA500' : '#FF6B6B',
                      fontWeight: '600'
                    }}>
                      🕒 {selectedRadarLocation.is_open ? 'Aberto agora' : 'Fechado'}
                    </Text>
                  </View>
                  
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, color: '#A0A0A0' }}>
                      📏 {selectedRadarLocation.distance}km de distância
                    </Text>
                  </View>
                </View>

                {/* História */}
                <View style={{ 
                  backgroundColor: '#393939', 
                  padding: 20, 
                  borderRadius: 12,
                  marginBottom: 15,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3
                }}>
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: '#F5F5F5',
                    marginBottom: 10
                  }}>
                    📝 Sobre o Local
                  </Text>
                  <Text style={{ 
                    fontSize: 16, 
                    color: '#A0A0A0',
                    lineHeight: 24
                  }}>
                    {selectedRadarLocation.history}
                  </Text>
                </View>

                {/* Botões de Ação */}
                <View style={{ 
                  backgroundColor: '#393939', 
                  padding: 20, 
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3
                }}>
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: '#F5F5F5',
                    marginBottom: 15
                  }}>
                    Ações
                  </Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Botão Favoritar */}
                    <TouchableOpacity
                      onPress={() => toggleFavorite(selectedRadarLocation)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: favorites.includes(selectedRadarLocation.place_id) ? '#FFA500' : '#555555',
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        borderRadius: 20,
                        flex: 1,
                        marginRight: 10
                      }}
                    >
                      <Text style={{ 
                        fontSize: 18, 
                        color: favorites.includes(selectedRadarLocation.place_id) ? '#2D2D2D' : '#A0A0A0',
                        marginRight: 5
                      }}>
                        {favorites.includes(selectedRadarLocation.place_id) ? '⭐' : '☆'}
                      </Text>
                      <Text style={{ 
                        fontSize: 13, 
                        color: favorites.includes(selectedRadarLocation.place_id) ? '#2D2D2D' : '#A0A0A0',
                        fontWeight: '600',
                        textAlign: 'center',
                        flex: 1
                      }}>
                        {favorites.includes(selectedRadarLocation.place_id) ? 'Favoritado' : 'Favoritar'}
                      </Text>
                    </TouchableOpacity>

                    {/* Botão Adicionar ao Roteiro */}
                    <TouchableOpacity
                      onPress={() => handleAddToRoute(selectedRadarLocation)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFA500',
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        borderRadius: 20,
                        flex: 1
                      }}
                    >
                      <Text style={{ 
                        fontSize: 18, 
                        color: '#2D2D2D',
                        marginRight: 5
                      }}>
                        ➕
                      </Text>
                      <Text style={{ 
                        fontSize: 13, 
                        color: '#2D2D2D',
                        fontWeight: '600',
                        textAlign: 'center',
                        flex: 1
                      }}>
                        Adicionar ao Roteiro
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
      )}

      {/* Modal de Seleção de Horário para Radar */}
      {isTimeModalVisible && (
        <Modal
          visible={isTimeModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setIsTimeModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#2D2D2D' }}>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingHorizontal: 20,
              paddingVertical: 15,
              backgroundColor: '#393939',
              borderBottomWidth: 1,
              borderBottomColor: '#555555'
            }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#F5F5F5' }}>
                Adicionar ao Roteiro
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setIsTimeModalVisible(false);
                  setSelectedTime('');
                  setSelectedLocationForRoute(null);
                }}
                style={{ 
                  padding: 10,
                  borderRadius: 20,
                  backgroundColor: '#555555'
                }}
              >
                <Text style={{ fontSize: 18, color: '#A0A0A0' }}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Conteúdo */}
            <ScrollView style={{ flex: 1, padding: 20 }}>
              {/* Informações do Local */}
              <View style={{ 
                backgroundColor: '#393939', 
                padding: 20, 
                borderRadius: 12, 
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3
              }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  color: '#F5F5F5',
                  marginBottom: 10
                }}>
                  📍 Local Selecionado
                </Text>
                <Text style={{ 
                  fontSize: 16, 
                  color: '#A0A0A0',
                  lineHeight: 22
                }}>
                  {selectedLocationForRoute?.name}
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: '#8E8E93',
                  marginTop: 5
                }}>
                  {selectedLocationForRoute?.vicinity || selectedLocationForRoute?.formatted_address}
                </Text>
              </View>

              {/* Seleção de Horário */}
              <View style={{ 
                backgroundColor: '#393939', 
                padding: 20, 
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3
              }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  color: '#F5F5F5',
                  marginBottom: 15
                }}>
                  🕒 Horário de Visita
                </Text>
                
                <Text style={{ 
                  fontSize: 16, 
                  color: '#A0A0A0',
                  marginBottom: 10
                }}>
                  Digite o horário desejado:
                </Text>
                
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#555555',
                    borderRadius: 8,
                    padding: 15,
                    fontSize: 16,
                    marginBottom: 15,
                    backgroundColor: '#2D2D2D',
                    color: '#F5F5F5'
                  }}
                  placeholder="HH:MM"
                  placeholderTextColor="#8E8E93"
                  value={selectedTime}
                  onChangeText={(text) => {
                    const formatted = formatTimeInput(text);
                    setSelectedTime(formatted);
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                />
                
                <Text style={{ 
                  fontSize: 12, 
                  color: '#8E8E93',
                  fontStyle: 'italic',
                  marginBottom: 20
                }}>
                  💡 Dica: Digite apenas números (ex: 1530) e os dois pontos serão adicionados automaticamente
                </Text>
                
                {/* Botões de Ação */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setIsTimeModalVisible(false);
                      setSelectedTime('');
                      setSelectedLocationForRoute(null);
                    }}
                    style={{
                      backgroundColor: '#555555',
                      paddingHorizontal: 20,
                      paddingVertical: 15,
                      borderRadius: 8,
                      flex: 1,
                      marginRight: 10
                    }}
                  >
                    <Text style={{ 
                      color: '#A0A0A0', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      fontSize: 16
                    }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleConfirmAddToRoute}
                    style={{
                      backgroundColor: '#FFA500',
                      paddingHorizontal: 20,
                      paddingVertical: 15,
                      borderRadius: 8,
                      flex: 1,
                      marginLeft: 10
                    }}
                  >
                    <Text style={{ 
                      color: '#2D2D2D', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      fontSize: 16
                    }}>
                      Adicionar ao Roteiro
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Modal para Salvar Roteiro */}
      {showSaveModal && (
        <Modal
          visible={showSaveModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSaveModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Salvar Roteiro
              </Text>
              
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder="Título do roteiro"
                placeholderTextColor={colors.textSecondary}
                value={saveTitle}
                onChangeText={setSaveTitle}
              />
              
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder="Descrição (opcional)"
                placeholderTextColor={colors.textSecondary}
                value={saveDescription}
                onChangeText={setSaveDescription}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowSaveModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveItinerary}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.saveModalButtonText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
};

export default ItineraryScreen;
