// Serviço de API para comunicação com o backend SampAI
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, TIMEOUT_CONFIG, DEFAULT_HEADERS, ERROR_MESSAGES, HTTP_STATUS } from '../config/api';

// Classe para gerenciar requisições HTTP
class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.token = null;
  }

  // Método para definir token de autenticação
  async setToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
    } else {
      await AsyncStorage.removeItem('auth_token');
    }
  }

  // Método para obter token do storage
  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  // Método genérico para fazer requisições HTTP
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const token = await this.getToken();

      const config = {
        headers: {
          ...DEFAULT_HEADERS,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        timeout: TIMEOUT_CONFIG.REQUEST_TIMEOUT,
        ...options,
      };

      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Tratar erros específicos
        switch (response.status) {
          case HTTP_STATUS.UNAUTHORIZED:
            await this.setToken(null);
            throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
          case HTTP_STATUS.FORBIDDEN:
            throw new Error(ERROR_MESSAGES.FORBIDDEN);
          case HTTP_STATUS.NOT_FOUND:
            throw new Error(ERROR_MESSAGES.NOT_FOUND);
          case HTTP_STATUS.INTERNAL_SERVER_ERROR:
            throw new Error(ERROR_MESSAGES.SERVER_ERROR);
          default:
            throw new Error(data.message || `HTTP ${response.status}`);
        }
      }

      console.log(`✅ API Response: ${url}`, data);
      return data;

    } catch (error) {
      // Não logar erros esperados de favoritos
      if (!endpoint.includes('/api/favoritos') || 
          !error.message.includes('já está nos favoritos')) {
        console.error(`❌ API Error: ${endpoint}`, error);
      }
      
      // Tratar erros de rede
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      throw error;
    }
  }

  // Métodos de autenticação
  async register(userData) {
    try {
      const url = `${this.baseURL}/api/register`;
      const config = {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(userData),
      };

      console.log(`🌐 API Request: POST ${url}`);

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Para registro, não tratar 401 como sessão expirada
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (data.success && data.data.id) {
        // Usar o ID do usuário como token por simplicidade
        await this.setToken(data.data.id.toString());
      }

      console.log(`✅ API Response: ${url}`, data);
      return data;

    } catch (error) {
      // Não logar erros de registro esperados
      if (!error.message.includes('Este email já está em uso') && 
          !error.message.includes('Formato de email inválido') &&
          !error.message.includes('Todos os campos são obrigatórios')) {
        console.error(`❌ API Error: /api/register`, error);
      }
      
      // Tratar erros de rede
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      throw error;
    }
  }

  async login(email, password) {
    try {
      const url = `${this.baseURL}/api/login`;
      const config = {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ email, senha: password }),
      };

      console.log(`🌐 API Request: POST ${url}`);

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Para login, não tratar 401 como sessão expirada
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (data.success && data.data.id) {
        // Usar o ID do usuário como token por simplicidade
        await this.setToken(data.data.id.toString());
      }

      console.log(`✅ API Response: ${url}`, data);
      return data;

    } catch (error) {
      // Não logar erros de autenticação esperados (email/senha inválidos)
      if (!error.message.includes('Email ou senha inválidos') && 
          !error.message.includes('Formato de email inválido')) {
        console.error(`❌ API Error: /api/login`, error);
      }
      
      // Tratar erros de rede
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      throw error;
    }
  }

  async logout() {
    await this.setToken(null);
  }

  // Métodos de perfil
  async getProfile() {
    return this.request('/api/profile');
  }

  async updateProfile(profileData) {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Métodos de roteiros
  async saveItinerary(itineraryData) {
    return this.request('/api/roteiros', {
      method: 'POST',
      body: JSON.stringify(itineraryData),
    });
  }

  async removeItinerary(roteiroId) {
    return this.request(`/api/roteiros/${roteiroId}`, {
      method: 'DELETE',
    });
  }

  async loadItinerary(itineraryId) {
    return this.request(`/api/roteiros/${itineraryId}`, {
      method: 'GET',
    });
  }

  async addFavorite(favoriteData) {
    return this.request('/api/favoritos', {
      method: 'POST',
      body: JSON.stringify(favoriteData),
    });
  }

  // Métodos de favoritos
  async removeFavorite(favoriteId) {
    return this.request(`/api/favoritos/${favoriteId}`, {
      method: 'DELETE',
    });
  }

  // Métodos de usuário
  async getUserStats() {
    return this.request('/api/profile');
  }

  // Método para verificar se está autenticado
  async isAuthenticated() {
    try {
      const token = await this.getToken();
      if (!token) return false;

      await this.getProfile();
      return true;
    } catch (error) {
      console.log('Usuário não autenticado:', error.message);
      await this.setToken(null);
      return false;
    }
  }

  // Método para inicializar token do storage
  async initializeAuth() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        this.token = token;
        // Verificar se o token ainda é válido
        const isValid = await this.isAuthenticated();
        if (!isValid) {
          await this.setToken(null);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
    }
  }
}

// Instância única do serviço
const apiService = new ApiService();

export default apiService;
