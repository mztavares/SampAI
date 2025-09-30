// Configuração do Google Maps
// Substitua 'SUA_API_KEY_AQUI' pela sua chave real do Google Cloud

export const GOOGLE_MAPS_API_KEY = 'AIzaSyC2JhGeNqfhzqsH7LmHQRiRC4HTrHQDCOg';

// Configurações do mapa
export const MAP_CONFIG = {
  // Região inicial (São Paulo)
  initialRegion: {
    latitude: -23.55052,
    longitude: -46.633308,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  },
  
  // Configurações de estilo do mapa
  mapStyle: [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#242f3e"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#242f3e"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#746855"
        }
      ]
    }
  ]
};

// URLs para APIs do Google (para futura integração)
export const GOOGLE_APIS = {
  PLACES_API: 'https://maps.googleapis.com/maps/api/place',
  DIRECTIONS_API: 'https://maps.googleapis.com/maps/api/directions',
  DISTANCE_MATRIX_API: 'https://maps.googleapis.com/maps/api/distancematrix'
};
