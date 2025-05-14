import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import CircularProgress from "react-native-circular-progress-indicator";

const CircularTimer = ({ expiresAt, onComplete }) => {
  const [duration, setDuration] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    // Converter expiresAt para Date se for string
    const expiryDate =
      typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    const now = new Date();

    // Calcular duração em milissegundos
    const durationMs = Math.max(0, expiryDate - now);
    const seconds = Math.floor(durationMs / 1000);

    console.log(durationMs, seconds);
    setDuration(durationMs);
    setRemainingSeconds(seconds);
  }, [expiresAt]);

  // Se não temos uma data válida ou o tempo já passou
  if (!expiresAt || duration <= 0) {
    return (
      <View style={styles.container}>
        <CircularProgress
          value={0}
          radius={15}
          maxValue={100}
          activeStrokeColor="#EB2E3E"
          inActiveStrokeColor="#EEEEEE"
          inActiveStrokeWidth={3}
          activeStrokeWidth={3}
          duration={1000}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CircularProgress
        value={0} // Iniciar de 0
        initialValue={remainingSeconds}
        radius={30}
        maxValue={remainingSeconds} // Valor máximo é o tempo restante em segundos
        duration={duration} // Duração é o tempo restante em milissegundos
        // progressValueColor={"transparent"} // Esconde o número no meio
        // titleColor={"transparent"}
        activeStrokeWidth={3}
        inActiveStrokeWidth={3}
        inActiveStrokeColor={"#EEEEEE"}
        activeStrokeColorConfig={[
          { color: "#28A745", value: 0 }, // Verde no início
          { color: "#FBBF24", value: Math.floor(remainingSeconds / 2) }, // Amarelo no meio
          { color: "#EB2E3E", value: remainingSeconds }, // Vermelho no final
        ]}
        clockwise={false} // Contagem regressiva no sentido anti-horário
        onAnimationComplete={onComplete} // Callback quando terminar
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CircularTimer;
