// app/(tabs)/index.js
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, ScrollView, Dimensions } from "react-native";
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Badge,
  FAB,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Redirect } from "expo-router";
import { getMotoboyMe, updateMotoboy } from "../services/api";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [appLoading, setAppLoading] = useState(true);
  const [deliveryStatus, setDeliveryStatus] = useState(true);
  const [motoboy, setMotoboy] = useState({});
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const mapRef = useRef(null);

  // Demo data - substitua isso com os dados do seu banco
  // Exemplo de pontos de interesse para mostrar no mapa
  const [pontosDeInteresse, setPontosDeInteresse] = useState([
    {
      id: 1,
      nome: "Restaurante Exemplo",
      coordinates: {
        latitude: -22.905,
        longitude: -47.06,
      },
    },
    {
      id: 2,
      nome: "Cliente Exemplo",
      coordinates: {
        latitude: -22.91,
        longitude: -47.057,
      },
    },
  ]);

  // Check if user is authenticated
  if (!loading && !user) {
    return <Redirect href="/login" />;
  }

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

  useEffect(() => {
    async function loadData() {
      try {
        // Get motoboy profile data
        const response = await getMotoboyMe();
        const motoboyData = response.data;
        setDeliveryStatus(motoboyData.isAvailable);
        setMotoboy(motoboyData);

        // Request location permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permissão de acesso à localização negada");
          setAppLoading(false);
          return;
        }

        // Get current location
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);

        // Atualizar pontos de interesse com base na localização atual (simulação)
        // Aqui você poderia buscar pontos próximos do seu banco de dados
        if (currentLocation) {
          // Ajustar os pontos de interesse para ficarem próximos à localização atual
          const pontosAtualizados = pontosDeInteresse.map((ponto, index) => ({
            ...ponto,
            coordinates: {
              latitude: currentLocation.coords.latitude + index * 0.0015,
              longitude: currentLocation.coords.longitude + index * 0.0015,
            },
          }));
          setPontosDeInteresse(pontosAtualizados);
        }

        // Update motoboy location in backend
        if (motoboyData && currentLocation) {
          try {
            await updateMotoboy({
              //FIXME motoboy coords backend
              coordinates: [
                currentLocation.coords.longitude,
                currentLocation.coords.latitude,
              ],
            });
          } catch (locationError) {
            console.error("Falha ao atualizar localização:", locationError);
          }
        }

        setAppLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setAppLoading(false);
      }
    }

    loadData();

    // Location tracking subscription
    let locationSubscription;

    async function setupLocationTracking() {
      try {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5, // metros
            timeInterval: 3000, // 3 segundos
          },
          (newLocation) => {
            setLocation(newLocation);

            // Only update location in backend when online
            if (deliveryStatus) {
              updateMotoboy({
                coordinates: [
                  newLocation.coords.longitude,
                  newLocation.coords.latitude,
                ],
              }).catch((err) =>
                console.error("Erro ao atualizar localização:", err)
              );
            }
          }
        );
      } catch (error) {
        console.error("Erro ao iniciar rastreamento de localização:", error);
      }
    }

    // Start tracking if we have permissions
    if (!errorMsg) {
      setupLocationTracking();
    }

    // Cleanup function
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [deliveryStatus]);

  // Centralizar o mapa na posição atual
  const centralizarMapa = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      ); // 1000ms de animação
    }
  };

  // Toggle driver availability
  const toggleAvailability = async () => {
    try {
      const response = await getMotoboyMe();
      const motoboyData = response.data;
      const newStatus = !motoboyData.isAvailable;

      setDeliveryStatus(newStatus);

      await updateMotoboy({
        isAvailable: newStatus,
        coordinates: location
          ? [location.coords.longitude, location.coords.latitude]
          : undefined,
      });
    } catch (error) {
      console.error("Erro ao alternar disponibilidade:", error);
    }
  };

  const getStatusColor = () => {
    return deliveryStatus ? colors.success : colors.secondary;
  };

  const getStatusText = () => {
    return deliveryStatus ? "Disponível para entregas" : "Offline";
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            showsUserLocation={true}
            showsCompass={true}
            showsScale={true}
            rotateEnabled={true}
          >
            {/* Location Accuracy Circle */}
            <Circle
              center={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              radius={location.coords.accuracy || 50}
              fillColor="rgba(66, 133, 244, 0.2)"
              strokeColor="rgba(66, 133, 244, 0.5)"
              strokeWidth={1}
            />
            {/* <MapViewDirections
              origin={origin}
              destination={destination}
              apikey={GOOGLE_MAPS_APIKEY}
            /> */}
          </MapView>
        ) : (
          <View
            style={[
              styles.noLocationContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={{ color: colors.text }}>
              {errorMsg || "Obtendo sua localização..."}
            </Text>
          </View>
        )}
      </View>

      {/* Status Card */}
      <View style={styles.cardContainer}>
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Content style={styles.statusCard}>
            <View>
              <Text style={[styles.welcomeText, { color: colors.text }]}>
                Olá, {motoboy.name || "Entregador"}
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
              mode={deliveryStatus ? "outlined" : "contained"}
              buttonColor={deliveryStatus ? "transparent" : colors.primary}
              textColor={deliveryStatus ? colors.primary : colors.white}
              style={[styles.statusButton, { borderColor: colors.primary }]}
              onPress={toggleAvailability}
            >
              {deliveryStatus ? "Ficar Offline" : "Ficar Online"}
            </Button>
          </Card.Content>
        </Card>
      </View>

      {/* Botão para centralizar mapa */}
      <FAB
        style={[styles.fab, { backgroundColor: colors.primary }]}
        icon="crosshairs-gps"
        color={colors.white}
        onPress={centralizarMapa}
      />
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
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noLocationContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 24,
  },
});
