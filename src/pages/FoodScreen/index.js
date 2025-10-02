import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { styles } from './styles';

const FoodScreen = ({ onNext, onBack }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    'Brasileira',
    'Italiana',
    'Japonesa',
    'Fast Food',
    'Culinária Internacional',
    'Vegetariana/Vegana',
  ];
  
  const questionNumber = 4;
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
          <Text style={styles.questionText}>
            Qual tipo de restaurante/comida você mais gosta?
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

export default FoodScreen;