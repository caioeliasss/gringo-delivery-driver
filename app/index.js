// app/index.js
import { Redirect } from "expo-router";
import { useAuth } from "./context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();

  // Mostrar um indicador de carregamento enquanto verifica o status de autenticação
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  // Redirecionar com base no status de autenticação
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
