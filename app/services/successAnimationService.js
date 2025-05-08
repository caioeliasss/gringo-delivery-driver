// app/services/successAnimation.js
import React, { useState, useRef, createContext, useContext } from "react";
import { StyleSheet, View, Text, Dimensions, Modal } from "react-native";
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

// Context para controle global
const SuccessAnimationContext = createContext();

// Provider Component
export const SuccessAnimationProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({});
  const resolveRef = useRef(null);

  const showAnimation = (options = {}) => {
    return new Promise((resolve) => {
      setConfig(options);
      setVisible(true);
      resolveRef.current = resolve;
    });
  };

  const hideAnimation = () => {
    setVisible(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  };

  return (
    <SuccessAnimationContext.Provider value={{ showAnimation }}>
      {children}
      <SuccessAnimationComponent
        visible={visible}
        config={config}
        onComplete={hideAnimation}
      />
    </SuccessAnimationContext.Provider>
  );
};

// Animation Component
const SuccessAnimationComponent = ({ visible, config, onComplete }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const textOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      // Reset animations
      opacity.value = 0;
      scale.value = 0.3;
      textOpacity.value = 0;

      // Start animation sequence
      opacity.value = withTiming(1, { duration: 300 });

      scale.value = withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back()) }),
        withTiming(1, { duration: 200 })
      );

      textOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));

      // Auto hide after duration
      const duration = config.duration || 2000;
      opacity.value = withDelay(
        duration,
        withTiming(0, { duration: 500 }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        })
      );
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  if (!visible) return null;

  const {
    message = "Sucesso!",
    subMessage = "Operação concluída",
    icon = "✓",
    backgroundColor = "rgba(0, 0, 0, 0.8)",
    iconBackgroundColor = "#EB2E3E",
  } = config;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View
        style={[styles.overlay, { backgroundColor }, containerStyle]}
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
            {subMessage ? (
              <Text style={styles.subMessage}>{subMessage}</Text>
            ) : null}
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

// Hook to use the animation
export const useSuccessAnimation = () => {
  const context = useContext(SuccessAnimationContext);
  if (!context) {
    throw new Error(
      "useSuccessAnimation must be used within SuccessAnimationProvider"
    );
  }
  return context.showAnimation;
};

// Global function
let globalShowAnimation = null;

export const successAnimation = (options = {}) => {
  if (!globalShowAnimation) {
    console.error(
      "SuccessAnimationProvider not mounted! Make sure to wrap your app with SuccessAnimationProvider"
    );
    return Promise.resolve();
  }
  return globalShowAnimation(options);
};

// Connect the global function to the context
export const SuccessAnimationConnector = () => {
  const showAnimation = useSuccessAnimation();
  React.useEffect(() => {
    globalShowAnimation = showAnimation;
    return () => {
      globalShowAnimation = null;
    };
  }, [showAnimation]);
  return null;
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
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
