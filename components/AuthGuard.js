// app/components/AuthGuard.js
import React, { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator, View } from "react-native";

export function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (!user && inAuthGroup) {
      // Redireciona para login se não estiver autenticado e tentar acessar rotas protegidas
      router.replace("/login");
    } else if (user && !inAuthGroup && segments[0] !== undefined) {
      // Se estiver logado e acessando telas públicas, redireciona para a tela principal
      // Exceto se estiver na tela inicial com segments[0] undefined (rota /)
      if (segments[0] === "login" || segments[0] === "register") {
        router.replace("/(tabs)");
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return <>{children}</>;
}
