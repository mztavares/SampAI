import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { styles } from './styles';

const OnboardingScreenManual = ({ onNext }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    'Turismo',
    'Trabalho',
    'Visitar familiares ou amigos',
    'Evento (show, festival...)',
    'É morador e pretende explorar mais a cidade',
  ];
  
  const questionNumber = 1;
  const totalQuestions = 9;
  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{`${Math.round(progress)}%`}</Text>
      </View>

      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.headerText}>Bem-vindo à São Paulo! 🏙️</Text>
          <Text style={styles.subHeaderText}>
            Vamos conhecer você melhor para criar a experiência perfeita na nossa cidade.
          </Text>
          <Text style={styles.questionText}>
            Qual o motivo principal da sua visita em SP ou o que gostaria de fazer na cidade?
          </Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                selectedOption === option && styles.optionButtonSelected,
              ]}
              onPress={() => setSelectedOption(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={{ width: 90 }} />
          <TouchableOpacity
            style={[styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
            onPress={onNext}
            disabled={!selectedOption}
          >
            <Text style={styles.nextButtonText}>Próxima →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreenManual;