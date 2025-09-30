import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { styles } from './styles';

const StayScreen = ({ onNext, onBack }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    '1 dia',
    '2 a 3 dias',
    '4 a 7 dias',
    '1 a 2 semanas',
    'Mais de 2 semanas',
  ];
  
  const questionNumber = 8;
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
        <View>
          <Text style={styles.questionText}>
            Quantos dias você pretende ficar em São Paulo?
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
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
            onPress={() => onNext(selectedOption)}
            disabled={!selectedOption}
          >
            <Text style={styles.nextButtonText}>Próxima →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default StayScreen;
