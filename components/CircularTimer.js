import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";

const CircularTimer = ({ expiresAt }) => {
  // Estado para o texto do timer
  const [timeText, setTimeText] = useState("");

  // Valor de progresso (0 a 1)
  const progress = useSharedValue(0);

  // Flag para controlar se a animação já foi iniciada
  const isAnimating = useRef(false);

  // Calcular tempo restante em segundos
  const calculateTimeRemaining = () => {
    if (!expiresAt) return 0;

    const now = new Date();
    const expiry = new Date(expiresAt);
    return Math.max(0, Math.floor((expiry - now) / 1000));
  };

  useEffect(() => {
    if (!expiresAt || isAnimating.current) return;

    isAnimating.current = true;
    const initialSeconds = calculateTimeRemaining();
    setTimeText(`${initialSeconds}`);

    const duration = initialSeconds * 1000;

    // Animar o progresso de 0 a 1
    progress.value = withTiming(1, {
      duration,
      easing: Easing.linear,
    });

    // Atualizar o contador a cada segundo
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeText(`${remaining}`);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Estilo para o preenchimento do círculo
  const fillStyle = useAnimatedStyle(() => {
    // Calcular o ângulo para criar o efeito de preenchimento circular
    const degree = progress.value * 360;

    // Determinar qual metade está sendo preenchida
    let rotate1, rotate2;

    if (degree <= 180) {
      // Primeira metade
      rotate1 = `${degree}deg`;
      rotate2 = "0deg";
    } else {
      // Segunda metade
      rotate1 = "180deg";
      rotate2 = `${degree - 180}deg`;
    }

    return {
      // Aplicar rotação à primeira metade
      transform: [{ rotate: rotate1 }],
    };
  });

  const fillStyle2 = useAnimatedStyle(() => {
    const degree = progress.value * 360;

    // Somente visível após 180 graus
    const opacity = degree <= 180 ? 0 : 1;
    const rotate = degree <= 180 ? "0deg" : `${degree - 180}deg`;

    return {
      opacity,
      transform: [{ rotate }],
    };
  });

  // Estilo para a cor do timer
  const colorStyle = useAnimatedStyle(() => {
    // Interpolar cores: Verde -> Amarelo -> Vermelho à medida que o tempo avança
    const color = interpolateColor(
      progress.value,
      [0, 0.5, 1],
      ["rgb(40, 167, 69)", "rgb(251, 191, 36)", "rgb(235, 46, 62)"]
    );

    return {
      borderColor: color,
    };
  });

  // Estilo para a cor do texto
  const textColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 0.5, 1],
      ["rgb(40, 167, 69)", "rgb(251, 191, 36)", "rgb(235, 46, 62)"]
    );

    return {
      color,
    };
  });

  return (
    <View style={styles.container}>
      {/* Círculo base (fundo cinza) */}
      <View style={styles.baseCircle} />

      {/* Sistema de preenchimento circular animado */}
      <View style={styles.timerContainer}>
        {/* Primeiro semi-círculo (direito) */}
        <View style={styles.rightHalfMask}>
          <Animated.View style={[styles.rightHalf, fillStyle, colorStyle]} />
        </View>

        {/* Segundo semi-círculo (esquerdo) */}
        <View style={styles.leftHalfMask}>
          <Animated.View style={[styles.leftHalf, fillStyle2, colorStyle]} />
        </View>
      </View>

      {/* Círculo central com o tempo */}
      <View style={styles.innerCircle}>
        <Animated.Text style={[styles.timeText, textColorStyle]}>
          {timeText}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  baseCircle: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#EEEEEE",
  },
  timerContainer: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  rightHalfMask: {
    position: "absolute",
    width: 18,
    height: 36,
    right: 0,
    overflow: "hidden",
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  rightHalf: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#28A745", // Cor inicial (verde)
    right: 0,
    // O ponto de origem da rotação é o centro esquerdo
    transformOrigin: "left center",
  },
  leftHalfMask: {
    position: "absolute",
    width: 18,
    height: 36,
    left: 0,
    overflow: "hidden",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  leftHalf: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#28A745", // Cor inicial (verde)
    left: 0,
    // O ponto de origem da rotação é o centro direito
    transformOrigin: "right center",
  },
  innerCircle: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#28A745", // Cor inicial (verde)
  },
});

export default CircularTimer;
