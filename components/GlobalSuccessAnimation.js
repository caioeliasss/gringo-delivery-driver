// app/components/GlobalSuccessAnimation.js
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

/**
 * Global success animation component designed to work with successAnimationService
 */
const GlobalSuccessAnimation = ({
  visible = false,
  onAnimationComplete,
  message = "Sucesso!",
  subMessage = "Operação concluída",
  icon = "✓",
  backgroundColor = "rgba(0, 0, 0, 0.8)",
  iconBackgroundColor = "#EB2E3E",
  duration = 2000,
}) => {
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset values
      opacity.value = 0;
      scale.value = 0.3;
      textOpacity.value = 0;

      // Start animation
      opacity.value = withTiming(1, { duration: 300 });

      // Animate circle with icon
      scale.value = withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back()) }),
        withTiming(1, { duration: 200 })
      );

      // Animate text
      textOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));

      // Hide animation after specified duration
      opacity.value = withDelay(
        duration,
        withTiming(0, { duration: 500 }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        })
      );
    }
  }, [visible, opacity, scale, textOpacity, duration, onAnimationComplete]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: visible ? "auto" : "none",
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor }, containerStyle]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.circleContainer, circleStyle]}>
          <View
            style={[styles.circle, { backgroundColor: iconBackgroundColor }]}
          >
            <Text style={styles.icon}>{icon}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.subMessage}>{subMessage}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    alignItems: "center",
  },
  circleContainer: {
    marginBottom: 20,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
  },
  textContainer: {
    alignItems: "center",
  },
  message: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subMessage: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
  },
});

export default GlobalSuccessAnimation;
