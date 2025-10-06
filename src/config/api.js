// Configuração da API do backend SampAI

// URLs do backend
export const API_CONFIG = {
  // Desenvolvimento local
  DEVELOPMENT: 'http://localhost:5000',
  
  // Produção (exemplo com Heroku)
  PRODUCTION: 'https://sampai-backend.herokuapp.com',
  
  // URL atual baseada no ambiente
  // Para desenvolvimento local: use seu IP local
  // Para produção: use o URL do servidor deployado
  BASE_URL: 'https://nice-hounds-repair.loca.lt'
};

// Configurações de timeout
export const TIMEOUT_CONFIG = {
  REQUEST_TIMEOUT: 10000, // 10 segundos
  UPLOAD_TIMEOUT: 30000,  // 30 segundos
};

// Headers padrão
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Configurações de retry
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    REGISTER: '/api/register',
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    PROFILE: '/api/profile',
  },
  
  // Roteiros
  ROUTES: {
    SAVE: '/api/roteiros',
    DELETE: (id) => `/api/roteiros/${id}`,
  },
  
  // Favoritos
  FAVORITES: {
    ADD: '/api/favoritos',
    DELETE: (id) => `/api/favoritos/${id}`,
  },
  
  // Health check
  HEALTH: '/api/health',
};

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  TIMEOUT_ERROR: 'Tempo limite excedido. Tente novamente.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Acesso negado.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.',
};

// Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

export default API_CONFIG;
