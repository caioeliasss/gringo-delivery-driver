// app/(tabs)/profile.js
import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Card, Text, Button, Avatar, Divider } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Determine text and background colors based on color scheme
  const colors = {
    primary: "#EB2E3E",
    secondary: "#FBBF24",
    white: "#FFFFFF",
    background: colorScheme === "dark" ? "#252525" : "#F5F5F5",
    card: colorScheme === "dark" ? "#333333" : "#FFFFFF",
    text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    subtext: colorScheme === "dark" ? "#BBBBBB" : "#666666",
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileHeader}>
          <Avatar.Text
            size={80}
            label={
              user?.displayName
                ? user.displayName.substring(0, 2).toUpperCase()
                : "??"
            }
            backgroundColor={colors.primary}
            color={colors.white}
          />
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.displayName || "Usuário"}
          </Text>
          <Text style={[styles.userEmail, { color: colors.subtext }]}>
            {user?.email || "email@exemplo.com"}
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Title
            title="Informações do Entregador"
            titleStyle={{ color: colors.text }}
          />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                Status:
              </Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>
                Ativo
              </Text>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                Entregas realizadas:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>42</Text>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                Avaliação:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                4.8 ⭐
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Title title="Ganhos" titleStyle={{ color: colors.text }} />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                Hoje:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                R$ 120,00
              </Text>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                Esta semana:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                R$ 650,00
              </Text>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>
                Total:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                R$ 4.230,00
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleLogout}
            buttonColor={colors.primary}
            textColor={colors.white}
            style={styles.logoutButton}
          >
            Sair
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 12,
  },
  userEmail: {
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 8,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  logoutButton: {
    borderRadius: 8,
  },
});
