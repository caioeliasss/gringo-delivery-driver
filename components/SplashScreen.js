// components/SplashScreen.js
import React, { useEffect } from "react";
import { View, Image, StyleSheet, Animated } from "react-native";
import { Text } from "react-native-paper";

export default function SplashScreen() {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require("../assets/images/gringo-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Entregador</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EB2E3E", // Main red background
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 220,
    height: 100,
  },
  tagline: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
