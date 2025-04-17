// app/(tabs)/index.js
import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Badge,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Redirect } from "expo-router";
import { getMotoboyMe, getMotoboys, updateMotoboy } from "../services/api";

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [appLoading, setAppLoading] = useState(true);
  const [deliveryStatus, setDeliveryStatus] = useState(true); // 'offline', 'online', 'delivering'

  // Check if user is authenticated
  if (!loading && !user) {
    return <Redirect href="/login" />;
  }

  // Simulating data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Determine colors based on color scheme
  const colors = {
    primary: "#EB2E3E",
    secondary: "#FBBF24",
    white: "#FFFFFF",
    background: colorScheme === "dark" ? "#252525" : "#F5F5F5",
    card: colorScheme === "dark" ? "#333333" : "#FFFFFF",
    text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    subtext: colorScheme === "dark" ? "#BBBBBB" : "#666666",
    success: colorScheme === "dark" ? "#10B981" : "#34D399",
    border: colorScheme === "dark" ? "#444444" : "#E5E5E5",
  };

  // Toggle driver availability
  const toggleAvailability = async () => {
    try {
      const response = await getMotoboyMe(); // Execute the function and await its result
      const motoboyData = response.data; // Now response is the actual axios response
      setDeliveryStatus(!motoboyData.isAvailable);

      await updateMotoboy({ isAvailable: !motoboyData.isAvailable });
    } catch (error) {
      console.log("Error fetching motoboy data:", error);
    }
  };

  const getStatusColor = () => {
    switch (deliveryStatus) {
      case true:
        return colors.success;
      case false:
        return colors.secondary;
      default:
        return colors.subtext;
    }
  };

  const getStatusText = () => {
    switch (deliveryStatus) {
      case true:
        return "Disponível para entregas";
      case false:
        return "Em entrega";
      default:
        return false;
    }
  };

  if (loading || appLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Rest of your component stays the same...
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Content style={styles.statusCard}>
            <View>
              <Text style={[styles.welcomeText, { color: colors.text }]}>
                Olá, {user?.displayName?.split(" ")[0] || "Entregador"}
              </Text>
              <View style={styles.statusContainer}>
                <Badge
                  size={12}
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor() },
                  ]}
                />
                <Text style={[styles.statusText, { color: colors.subtext }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>

            <Button
              mode={deliveryStatus === false ? "contained" : "outlined"}
              buttonColor={
                deliveryStatus === false ? colors.primary : "transparent"
              }
              textColor={
                deliveryStatus === false ? colors.white : colors.primary
              }
              style={[styles.statusButton, { borderColor: colors.primary }]}
              onPress={toggleAvailability}
            >
              {deliveryStatus === false ? "Ficar Online" : "Ficar Offline"}
            </Button>
          </Card.Content>
        </Card>

        {/* Keep the rest of your JSX here */}
        {/* ... */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
  },
  statusButton: {
    borderRadius: 20,
  },
  // Include the rest of your styles here
  // ...
});
