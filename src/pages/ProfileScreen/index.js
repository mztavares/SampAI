import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { createIcons } from '../../config/theme';
import { apiService } from '../../services/apiService';

const ProfileScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      
      if (response.success) {
        setProfile(response.data);
      } else {
        Alert.alert('Erro', 'Falha ao carregar perfil');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Falha ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleSaveItinerary = async () => {
    if (!saveTitle.trim()) {
      Alert.alert('Erro', 'Título é obrigatório');
      return;
    }

    try {
      setSaving(true);
      
      // Aqui você pode pegar o roteiro atual da navegação ou estado global
      const currentItinerary = []; // Implementar lógica para pegar roteiro atual
      
      const response = await apiService.saveItinerary({
        titulo: saveTitle.trim(),
        descricao: saveDescription.trim(),
        locais: currentItinerary
      });

      if (response.success) {
        Alert.alert('Sucesso', 'Roteiro salvo com sucesso!');
        setShowSaveModal(false);
        setSaveTitle('');
        setSaveDescription('');
        loadProfile(); // Recarregar perfil
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

  const handleRemoveItinerary = (roteiroId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja remover este roteiro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.removeItinerary(roteiroId);
              if (response.success) {
                Alert.alert('Sucesso', 'Roteiro removido com sucesso!');
                loadProfile();
              } else {
                Alert.alert('Erro', response.message || 'Falha ao remover roteiro');
              }
            } catch (error) {
              console.error('Erro ao remover roteiro:', error);
              Alert.alert('Erro', 'Falha ao remover roteiro');
            }
          }
        }
      ]
    );
  };

  const handleRemoveFavorite = (favoritoId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja remover este favorito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.removeFavorite(favoritoId);
              if (response.success) {
                Alert.alert('Sucesso', 'Favorito removido com sucesso!');
                loadProfile();
              } else {
                Alert.alert('Erro', response.message || 'Falha ao remover favorito');
              }
            } catch (error) {
              console.error('Erro ao remover favorito:', error);
              Alert.alert('Erro', 'Falha ao remover favorito');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Carregando perfil...
          </Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Erro ao carregar perfil
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadProfile}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {profile.usuario.nome.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {profile.usuario.nome}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {profile.usuario.email}
              </Text>
              <Text style={[styles.userDate, { color: colors.textSecondary }]}>
                Membro desde {formatDate(profile.usuario.dataCadastro)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {profile.roteiros.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Roteiros Salvos
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {profile.favoritos.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Favoritos
            </Text>
          </View>
        </View>

        {/* Save Itinerary Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowSaveModal(true)}
        >
          <Text style={styles.saveButtonText}>Salvar Roteiro Atual</Text>
        </TouchableOpacity>

        {/* Saved Itineraries */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Roteiros Salvos ({profile.roteiros.length}/3)
          </Text>
          
          {profile.roteiros.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhum roteiro salvo ainda
              </Text>
            </View>
          ) : (
            profile.roteiros.map((roteiro) => (
              <View key={roteiro.id} style={[styles.itineraryCard, { backgroundColor: colors.card }]}>
                <View style={styles.itineraryHeader}>
                  <Text style={[styles.itineraryTitle, { color: colors.text }]}>
                    {roteiro.titulo}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveItinerary(roteiro.id)}
                    style={styles.removeButton}
                  >
                    {createIcons(colors).trash}
                  </TouchableOpacity>
                </View>
                {roteiro.descricao && (
                  <Text style={[styles.itineraryDescription, { color: colors.textSecondary }]}>
                    {roteiro.descricao}
                  </Text>
                )}
                <Text style={[styles.itineraryDate, { color: colors.textSecondary }]}>
                  Criado em {formatDate(roteiro.dataCriacao)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Favorites */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Locais Favoritos ({profile.favoritos.length})
          </Text>
          
          {profile.favoritos.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhum local favoritado ainda
              </Text>
            </View>
          ) : (
            profile.favoritos.map((favorito) => (
              <View key={favorito.id} style={[styles.favoriteCard, { backgroundColor: colors.card }]}>
                <View style={styles.favoriteHeader}>
                  <View style={styles.favoriteInfo}>
                    <Text style={[styles.favoriteName, { color: colors.text }]}>
                      {favorito.nome}
                    </Text>
                    {favorito.endereco && (
                      <Text style={[styles.favoriteAddress, { color: colors.textSecondary }]}>
                        {favorito.endereco}
                      </Text>
                    )}
                    {favorito.rating && (
                      <Text style={[styles.favoriteRating, { color: colors.primary }]}>
                        ⭐ {favorito.rating}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveFavorite(favorito.id)}
                    style={styles.removeButton}
                  >
                    {createIcons(colors).trash}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.favoriteDate, { color: colors.textSecondary }]}>
                  Favoritado em {formatDate(favorito.dataFavorito)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Save Modal */}
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
    </View>
  );
};

export default ProfileScreen;
