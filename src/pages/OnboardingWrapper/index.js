import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import OnboardingScreen from '../OnboardingScreen';
import OnboardingScreenManual from '../OnboardingScreenManual';
import { styles } from './styles'; // ajuste o caminho conforme sua estrutura

const OnboardingWrapper = ({ onNext }) => {
  const [mode, setMode] = useState(null);

  if (mode === 'manual') return <OnboardingScreenManual onNext={onNext} />;
  if (mode === 'voz') return <OnboardingScreen onNext={onNext} />;

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
      <Text
        style={{
          fontFamily: 'Poppins_700Bold',
          fontSize: 26,
          color: '#F5F5F5',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        🌆 Bem-vindo ao SampAI!
      </Text>

      <Text
        style={{
          fontFamily: 'Montserrat_500Medium',
          fontSize: 15,
          color: '#A0A0A0',
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 22,
        }}
      >
        Explore São Paulo de um jeito inteligente.  
        Escolha como deseja começar sua experiência:
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
        <TouchableOpacity
          onPress={() => setMode('voz')}
          style={{
            backgroundColor: '#FFA500',
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 32,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontFamily: 'Poppins_700Bold',
              fontSize: 16,
              color: '#2D2D2D',
            }}
          >
            🎙️ Por Voz
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode('manual')}
          style={{
            backgroundColor: '#393939',
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderWidth: 1,
            borderColor: '#555555',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Poppins_700Bold',
              fontSize: 16,
              color: '#F5F5F5',
            }}
          >
            ✋ Manual
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingWrapper;
