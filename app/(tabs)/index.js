// app/(tabs)/index.js with conditional display based on delivery status
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import {
  Card,
  Text as PaperText,
  Button,
  ActivityIndicator,
  Badge,
  FAB,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getMotoboyMe, getOrder, updateMotoboy } from "../services/api";
import MapView, { Marker, Circle } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";

// Replace with your actual Google Maps API Key
const GOOGLE_MAPS_APIKEY = process.env.MAPS_API;

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
  const [activeDestination, setActiveDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isRacing, setIsRacing] = useState(false);
  const [mockDestinations, setMockDestinations] = useState([]);

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
    const fetchOrder = async () => {
      let motoboyA;
      try {
        const response = await getMotoboyMe();
        const motoboyData = response.data;
        motoboyA = motoboyData;
      } catch (error) {
        console.error(error);
      }

      if (!motoboyA) {
        console.log("Não foi encontrado motoboy");
        return;
      }

      if (!motoboyA.race || motoboyA.race.active === false) {
        console.log("Nenhuma corrida ativa");
        setIsRacing(false);
        setMockDestinations([]);
      } else {
        try {
          const response = await getOrder(motoboyA.race.orderId);
          const order = response.data;
          setIsRacing(true);
          setMockDestinations([
            {
              id: 1,
              title: order.store.name,
              description: "Estabelecimento de retirada",
              coordinate: {
                latitude: order.store.coordinates[1],
                longitude: order.store.coordinates[0],
              },
            },
            {
              id: 2,
              title: order.customer.name,
              description: "Endereço do cliente",
              coordinate: {
                latitude: order.customer.customerAddress.coordinates[1],
                longitude: order.customer.customerAddress.coordinates[0],
              },
            },
          ]);
        } catch (error) {
          console.error("Erro ao buscar informações do pedido:", error);
        }
      }
    };

    setTimeout(() => {
      fetchOrder();
    }, 1000);
  }, []);

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

        // Update motoboy location in backend
        if (motoboyData && currentLocation) {
          try {
            await updateMotoboy({
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

    async function setupStateBastedLocationTracking() {
      try {
        // Different settings based on delivery state
        const IDLE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes when idle
        const ACTIVE_UPDATE_INTERVAL = 30 * 1000; // 30 seconds when on delivery
        const ARRIVING_UPDATE_INTERVAL = 30 * 1000; // 30 seconds when near destination

        let updateInterval = isRacing
          ? ACTIVE_UPDATE_INTERVAL
          : IDLE_UPDATE_INTERVAL;
        let lastUpdate = Date.now();

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // 10 seconds internal updates
            distanceInterval: 10, // 10 meters
          },
          (newLocation) => {
            // Always update UI
            setLocation(newLocation);

            // Check if driver is near destination
            let isNearDestination = false;
            if (isRacing && activeDestination && newLocation) {
              const distToDestination = calculateDistance(
                newLocation.coords.latitude,
                newLocation.coords.longitude,
                activeDestination.coordinate.latitude,
                activeDestination.coordinate.longitude
              );

              isNearDestination = distToDestination < 300; // within 300 meters

              // Update interval based on proximity
              updateInterval = isNearDestination
                ? ARRIVING_UPDATE_INTERVAL
                : ACTIVE_UPDATE_INTERVAL;
            } else {
              updateInterval = isRacing
                ? ACTIVE_UPDATE_INTERVAL
                : IDLE_UPDATE_INTERVAL;
            }

            // Check if we should update server
            if (Date.now() - lastUpdate >= updateInterval) {
              updateMotoboy({
                coordinates: [
                  newLocation.coords.longitude,
                  newLocation.coords.latitude,
                ],
              }).catch((err) =>
                console.error("Erro ao atualizar localização:", err)
              );

              lastUpdate = Date.now();
            }
          }
        );
      } catch (error) {
        console.error("Erro ao iniciar rastreamento de localização:", error);
      }
    }

    // Start tracking if we have permissions
    if (!errorMsg) {
      setupStateBastedLocationTracking();
    }

    // Cleanup function
    return () => {
      if (locationSubscription) {
        locationSubscription.then((sub) => sub.remove());
      }
    };
  }, []);

  // Center the map on current location
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
      );
    }
  };

  // Show route to destination
  const showRouteToDestination = (destination) => {
    setActiveDestination(destination);

    // Fit map to show both points
    if (location && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          destination.coordinate,
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
          animated: true,
        }
      );
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
    return isRacing
      ? "Em entrega"
      : deliveryStatus
      ? "Disponível para entregas"
      : "Offline";
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

            {/* Destination markers - only shown when in active delivery */}
            {isRacing &&
              mockDestinations.map((dest) => (
                <Marker
                  key={dest.id}
                  coordinate={dest.coordinate}
                  title={dest.title}
                  description={dest.description}
                  pinColor={dest.id === 1 ? "orange" : "red"}
                />
              ))}

            {/* Directions between current location and selected destination - only shown when in active delivery */}
            {isRacing && location && activeDestination && (
              <MapViewDirections
                origin={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                destination={activeDestination.coordinate}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor={colors.primary}
                optimizeWaypoints={true}
                onReady={(result) => {
                  setRouteInfo({
                    distance: result.distance,
                    duration: result.duration,
                  });
                }}
              />
            )}
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
              <PaperText style={[styles.welcomeText, { color: colors.text }]}>
                Olá, {motoboy.name || "Entregador"}
              </PaperText>
              <View style={styles.statusContainer}>
                <Badge
                  size={12}
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isRacing
                        ? colors.secondary
                        : getStatusColor(),
                    },
                  ]}
                />
                <PaperText
                  style={[styles.statusText, { color: colors.subtext }]}
                >
                  {getStatusText()}
                </PaperText>
              </View>
            </View>

            {/* Only show availability toggle when NOT in active delivery */}
            {!isRacing && (
              <Button
                mode={deliveryStatus ? "outlined" : "contained"}
                buttonColor={deliveryStatus ? "transparent" : colors.primary}
                textColor={deliveryStatus ? colors.primary : colors.white}
                style={[styles.statusButton, { borderColor: colors.primary }]}
                onPress={toggleAvailability}
              >
                {deliveryStatus ? "Ficar Offline" : "Ficar Online"}
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Destination Controls - only shown when in active delivery */}
      {isRacing && mockDestinations.length > 0 && (
        <View style={styles.destinationControls}>
          <PaperText style={styles.heading}>Selecione um destino:</PaperText>
          {mockDestinations.map((dest, index) => (
            <TouchableOpacity
              key={dest.id}
              style={[
                styles.destinationButton,
                activeDestination?.id === dest.id && styles.selectedDestination,
                {
                  borderLeftWidth: 4,
                  borderLeftColor: index === 0 ? "#ffa500" : "#eb2e3e",
                },
              ]}
              onPress={() => showRouteToDestination(dest)}
            >
              <View style={styles.destinationIconWrapper}>
                {/* Use standard Text component with emoji as a simple icon alternative */}
                <Text style={{ fontSize: 20 }}>
                  {index === 0 ? "🏪" : "🏠"}
                </Text>
              </View>
              <View style={styles.destinationTextContainer}>
                <PaperText
                  style={[
                    styles.destinationLabel,
                    {
                      color:
                        activeDestination?.id === dest.id
                          ? colors.white
                          : "black",
                    },
                  ]}
                >
                  {index === 0 ? "Retirada" : "Entrega"}
                </PaperText>
                <PaperText
                  style={[
                    styles.destinationTitle,
                    {
                      color:
                        activeDestination?.id === dest.id
                          ? colors.white
                          : "black",
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {dest.title}
                </PaperText>
              </View>
            </TouchableOpacity>
          ))}
          {routeInfo && (
            <View style={styles.routeInfoContainer}>
              <View style={styles.routeInfoItem}>
                <PaperText style={styles.routeInfoLabel}>Distância</PaperText>
                <PaperText style={styles.routeInfoValue}>
                  {routeInfo.distance.toFixed(1)} km
                </PaperText>
              </View>
              <View style={styles.routeInfoItem}>
                <PaperText style={styles.routeInfoLabel}>Tempo</PaperText>
                <PaperText style={styles.routeInfoValue}>
                  {Math.ceil(routeInfo.duration)} min
                </PaperText>
              </View>
            </View>
          )}
        </View>
      )}

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
    bottom: 200,
  },
  destinationControls: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  destinationButton: {
    backgroundColor: "#EFEFEF",
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  selectedDestination: {
    backgroundColor: "#EB2E3E",
  },
  buttonText: {
    fontWeight: "600",
    color: "#333333",
  },
  routeInfoContainer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  routeInfoItem: {
    alignItems: "center",
  },
  routeInfoLabel: {
    fontSize: 12,
    color: "#666666",
  },
  routeInfoValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Add these to your existing styles
  destinationButton: {
    backgroundColor: "#EFEFEF",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    overflow: "hidden",
  },
  selectedDestination: {
    backgroundColor: "#EB2E3E",
  },
  destinationIconWrapper: {
    marginRight: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  destinationTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  destinationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  destinationTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  buttonText: {
    fontWeight: "600",
    color: "#333333",
  },
});
