import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat';

import * as SplashStyles from './styles';

const SPLASH_DURATION = 2500; 

export default function SplashScreen({ onFinishLoading = () => {} }) {

  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Montserrat_500Medium,
  });

  React.useEffect(() => {

    if (fontsLoaded) {
      const timer = setTimeout(() => {
        onFinishLoading();
      }, SPLASH_DURATION);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, onFinishLoading]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={SplashStyles.styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2D2D2D" translucent />
      
      <View style={SplashStyles.styles.logoContainer}>
        <SvgXml xml={SplashStyles.logoSvg} width="80" height="80" />
        <Text style={SplashStyles.styles.logoText}>
          Samp<Text style={SplashStyles.styles.logoHighlight}>AI</Text>
        </Text>
      </View>

    </View>
  );
}