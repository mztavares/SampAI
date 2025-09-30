import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { styles } from './styles';

const AgeScreen = ({ onNext, onBack }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    '15 a 19 anos',
    '20 a 30 anos',
    '30 a 50 anos',
    '50 anos ou mais',
  ];
  
  const questionNumber = 6;
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
            Qual a sua idade?
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

export default AgeScreen;
