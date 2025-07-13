import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Start the animations
    Animated.parallel(
      [
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 10,
          friction: 2,
          useNativeDriver: true,
        }),
      ],
      {stopTogether: false}
    ).start();

    const timer = setTimeout(() => {
      router.replace('/auth');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {opacity: fadeAnimation, transform: [{scale: scaleAnimation}]},
        ]}
      >
        <Ionicons
          name='medical'
          size={100}
          color='white'
        />
        <Text style={styles.appName}>MedRemind</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
  },
  appName: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    letterSpacing: 1,
  },
});
