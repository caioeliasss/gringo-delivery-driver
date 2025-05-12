// app/(tabs)/index.js - Integrated delivery offers and map functionality
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  Card,
  Text as PaperText,
  Button,
  ActivityIndicator,
  Badge,
  FAB,
  Chip,
  Divider,
  Modal,
  Portal,
  Provider as PaperProvider,
  TextInput,
  ProgressBar,
  Searchbar,
  IconButton,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  getMotoboyMe,
  getOrder,
  updateMotoboy,
  updateOrderStatus,
  getNotifications,
  updateNotification,
  createTravel,
  getMotoboyOrders,
} from "../services/api";
import { getWeather } from "../services/weather";
import MapView, { Marker, Circle } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import socketService from "../services/socketService";
import eventService from "../services/eventService";
import CircularTimer from "../../components/CircularTimer";

// Replace with your actual Google Maps API Key
const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_MAPS_API;
const { height } = Dimensions.get("window");

// Component for the countdown timer
const CountdownTimer = ({ expiresAt, colors, onExpiredChange }) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(1); // Full progress bar initially
  const [expired, setExpired] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const calcTimeLeft = () => {
      const now = new Date();
      const expireDate = new Date(expiresAt);
      const diff = expireDate - now;

      // Calculate total duration on first render (in milliseconds)
      if (totalDuration === 0) {
        // Assuming expiresAt is set 5 minutes from creation
        const fullDuration = 1 * 60 * 1000; // 5 minutes in milliseconds
        setTotalDuration(fullDuration);
      }

      if (diff <= 0) {
        if (!expired) {
          setExpired(true);
          // Call the callback to notify parent component
          if (onExpiredChange) {
            onExpiredChange(true);
          }
        }
        setTimeLeft({ minutes: 0, seconds: 0 });
        setProgress(0);
        return;
      }

      // Calculate minutes and seconds
      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      // Calculate progress (remaining time / total time)
      const remainingProgress = diff / totalDuration;
      setProgress(Math.max(0, Math.min(remainingProgress, 1)));

      setTimeLeft({ minutes, seconds });

      if (expired) {
        setExpired(false);
        // Call the callback to notify parent component
        if (onExpiredChange) {
          onExpiredChange(false);
        }
      }
    };

    calcTimeLeft();
    const timer = setInterval(calcTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, totalDuration, expired, onExpiredChange]);

  if (!expiresAt) return null;

  return (
    <View style={styles.countdownContainer}>
      <View style={styles.countdownHeader}>
        <Text
          style={[
            styles.countdownText,
            { color: expired ? colors.primary : colors.subtext },
          ]}
        >
          {expired ? "Expirado" : "Expira em"}
        </Text>
        <Text
          style={[
            styles.timeText,
            { color: expired ? colors.primary : colors.text },
          ]}
        >
          {expired
            ? "--:--"
            : `${timeLeft.minutes
                .toString()
                .padStart(2, "0")}:${timeLeft.seconds
                .toString()
                .padStart(2, "0")}`}
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={progress < 0.25 ? colors.primary : colors.secondary}
        style={styles.progressBar}
      />
    </View>
  );
};

const colorScheme = "light";

const colors = {
  primary: "#EB2E3E",
  secondary: "#FBBF24",
  white: "#FFFFFF",
  background: colorScheme === "dark" ? "#252525" : "#F5F5F5",
  card: colorScheme === "dark" ? "#333333" : "#FFFFFF",
  text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
  subtext: colorScheme === "dark" ? "#BBBBBB" : "#666666",
  success: colorScheme === "dark" ? "#10B981" : "#28a745",
  border: colorScheme === "dark" ? "#444444" : "#E5E5E5",
  chipBackground: colorScheme === "dark" ? "#444444" : "#EEEEEE",
};

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // const colorScheme = useColorScheme();
  const colorScheme = "light";
  const [appLoading, setAppLoading] = useState(true);
  const [deliveryStatus, setDeliveryStatus] = useState(true);
  const [motoboy, setMotoboy] = useState({});
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const mapRef = useRef(null);
  const [activeDestination, setActiveDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isRacing, setIsRacing] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const [getCode, setGetCode] = useState(false);
  const [code, setCode] = useState(0);
  const [mockDestinations, setMockDestinations] = useState([]);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Explore screen variables
  const [refreshing, setRefreshing] = useState(false);
  const [deliveries, setDeliveries] = useState({});
  const [motoboyId, setMotoboyId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'food', 'pharmacy', 'grocery'
  const [expiredDeliveries, setExpiredDeliveries] = useState({});
  const [showDeliveryOffers, setShowDeliveryOffers] = useState(false);
  const [viewMode, setViewMode] = useState("map"); // 'map' or 'offers'

  // Determine colors based on color scheme
  const colors = {
    primary: "#EB2E3E",
    secondary: "#FBBF24",
    white: "#FFFFFF",
    background: colorScheme === "dark" ? "#252525" : "#F5F5F5",
    card: colorScheme === "dark" ? "#333333" : "#FFFFFF",
    text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    subtext: colorScheme === "dark" ? "#BBBBBB" : "#666666",
    success: colorScheme === "dark" ? "#10B981" : "#27AE60",
    border: colorScheme === "dark" ? "#444444" : "#E5E5E5",
    chipBackground: colorScheme === "dark" ? "#444444" : "#EEEEEE",
  };

  const mapStyle = [
    {
      featureType: "poi",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
  ];

  const locationInterval = useRef(null);

  const handleDeclineDelivery = async () => {
    if (!deliveries) return;

    try {
      await updateNotification({ id: deliveries._id, status: "DECLINED" });
      setDeliveries(null);
    } catch (error) {
      console.log("Error declining delivery:", error);
    }
  };
  // Handle code validation
  const handleCodeValidation = async () => {
    if (!codeInput || codeInput.trim().length === 0) {
      setCodeError("Por favor, insira o código");
      return;
    }

    setCodeVerifying(true);

    try {
      // If validation is successful
      if (code === Number(codeInput)) {
        // Reset states
        setGetCode(false);
        setCodeInput("");
        setCodeError("");

        // Complete the delivery - call your API to update the order status
        await updateOrderStatus({
          id: motoboy.race.orderId,
          status: "entregue",
        });

        // Update motoboy status
        await updateMotoboy({
          isAvailable: true,
          race: { active: false },
        });

        // Refresh the screen or redirect
        setRefreshKey((prev) => prev + 1);

        // Reset view to map and active delivery status
        setViewMode("map");
        setIsRacing(false);
      } else {
        setCodeError("Código inválido. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao validar código:", error);
      setCodeError("Erro ao validar código. Tente novamente.");
    } finally {
      setCodeVerifying(false);
    }
  };

  // Initialize location tracking and SSE connection
  useEffect(() => {
    let isSubscribed = true;

    const setupLocationTracking = async () => {
      try {
        // Check permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permissão de localização negada");
          return;
        }

        // Get motoboy data
        const response = await getMotoboyMe();
        const motoboyData = response.data;

        if (!isSubscribed) return;

        setMotoboy(motoboyData);
        setDeliveryStatus(motoboyData.isAvailable);
        setMotoboyId(motoboyData._id);

        // Connect to socket
        const token = await user.getIdToken();
        socketService.connect(motoboyData._id, token);

        // Connect with SSE
        eventService.connect(user.uid);

        // Register event handlers
        const handleOrderUpdate = async (orderData) => {
          try {
            const response = await getNotifications(motoboyData._id);
            const notifications = response.data;
            setDeliveries(notifications[0]);
          } catch (error) {
            console.log(error.response?.data || error);
          }
        };

        // Register event listener
        eventService.on("notificationUpdate", handleOrderUpdate);

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(location);

        let interval = 5000; // Default 5 second interval
        if (motoboyData.race?.active === false) {
          interval = 30000; // 30 seconds when not in active delivery
        }

        // Start location updates
        locationInterval.current = setInterval(async () => {
          try {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            // Update local state
            setLocation(currentLocation);

            // Send to server via socket
            socketService.sendLocation(currentLocation);
          } catch (error) {
            console.error("Erro ao obter localização:", error);
          }
        }, interval);
      } catch (error) {
        console.error("Erro na configuração:", error);
        setErrorMsg(error.message);
      } finally {
        setAppLoading(false);
      }
    };

    if (user) {
      setupLocationTracking();
    }

    // Cleanup
    return () => {
      isSubscribed = false;
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }
      socketService.disconnect();
      eventService.off("notificationUpdate");
    };
  }, [user]);

  // Load delivery data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setAppLoading(true);

      const fetchData = async () => {
        try {
          // Get motoboy data
          const response = await getMotoboyMe();
          const motoboyData = response.data;
          setMotoboy(motoboyData);
          setMotoboyId(motoboyData._id);

          // Determine if in active delivery
          if (!motoboyData.race || motoboyData.race.active === false) {
            setIsRacing(false);
            setMockDestinations([]);

            // When not in active delivery, fetch available delivery offers
            const notificationsResponse = await getNotifications(
              motoboyData._id
            );
            setDeliveries(notificationsResponse[0]);
          } else {
            // In active delivery, fetch order details
            setIsRacing(true);
            const orderResponse = await getOrder(motoboyData.race.orderId);
            const order = orderResponse.data;
            setCode(order.cliente_cod);

            // Set up destinations for the map
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

            // When in active delivery, default to map view
            setViewMode("map");
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setAppLoading(false);
        }
      };

      fetchData();
    }, [refreshKey])
  );

  // Accept delivery action
  const handleAcceptDelivery = async (delivery) => {
    setDeliveries({});
    setAppLoading(true);

    let isRain = false;
    try {
      // Check weather conditions
      const [latitude, longitude] = delivery.data.order.store.coordinates;
      const response = await getWeather(latitude, longitude);
      isRain = response.current.rain >= 2.4;
    } catch (error) {
      console.log("Weather error:", error);
    }

    delivery.data.order.motoboy.motoboyId = motoboyId;

    const travelData = {
      price: delivery.data.order.motoboy.price,
      rain: isRain,
      distance: delivery.data.order.delivery.distance,
      coordinatesFrom: delivery.data.order.store.coordinates,
      coordinatesTo: delivery.data.order.customer.customerAddress.coordinates,
      order: delivery.data.order,
    };

    try {
      // Update notification status
      await updateNotification({ id: delivery._id, status: "ACCEPTED" });

      // Update order status
      await updateOrderStatus({
        id: delivery.data.order._id,
        status: "em_preparo",
      });

      // Create new travel record
      await createTravel(travelData);

      // Refresh data and switch to map view
      setRefreshKey((prev) => prev + 1);
      setViewMode("map");
      setIsRacing(true);
    } catch (error) {
      console.error("Error accepting delivery:", error);
    } finally {
      setAppLoading(false);
    }
  };

  // Pull to refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (motoboyId) {
        const response = await getNotifications(motoboyId);
        setDeliveries(response.data[0]);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [motoboyId]);

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
      const newStatus = !deliveryStatus;
      setDeliveryStatus(newStatus);

      await updateMotoboy({
        isAvailable: newStatus,
        coordinates: location
          ? [location.coords.longitude, location.coords.latitude]
          : undefined,
      });

      // If going online, show delivery offers
      if (newStatus) {
        setViewMode("offers");
        onRefresh();
      } else {
        setViewMode("map");
      }
    } catch (error) {
      console.error("Erro ao alternar disponibilidade:", error);
    }
  };

  // Helper functions for UI
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

  // Toggle between map and offers view
  const toggleViewMode = () => {
    if (isRacing) {
      // If in active delivery, stay in map view
      setViewMode("map");
    } else {
      // Toggle between views when not in active delivery
      setViewMode(viewMode === "map" ? "offers" : "map");

      // If switching to offers, refresh data
      if (viewMode === "map") {
        onRefresh();
      }
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

  return (
    // Modificação para o componente principal HomeScreen
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        {/* Conteúdo principal com mapa */}
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
              customMapStyle={mapStyle}
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

              {/* Directions between current location and selected destination */}
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

                    // Set isNear flag if we're close to destination (within 100 meters)
                    setIsNear(result.distance < 0.1);
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
          {!isRacing && (
            <View style={styles.availabilityContainer}>
              <Card
                style={{
                  width: "50%",
                  backgroundColor: deliveryStatus
                    ? colors.success
                    : colors.primary,
                }}
              >
                <Card.Content>
                  <View>
                    <TouchableOpacity onPress={toggleAvailability}>
                      <PaperText
                        style={{
                          color: colors.white,
                          textAlign: "center",
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        {deliveryStatus ? "Disponível" : "Indisponível"}
                      </PaperText>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            </View>
          )}
          {/* Cards informativos no topo do mapa */}
          {/* <View style={styles.infoCardsContainer}>
            <Card style={styles.infoCard}>
              <Card.Content style={styles.infoCardContent}>
                <View>
                  <PaperText style={styles.infoCardLabel}>
                    Ganhos hoje
                  </PaperText>
                  <PaperText style={styles.infoCardValue}>R$ 0,00</PaperText>
                </View>
                <View>
                  <IconButton icon="chevron-right" size={24} color="#999" />
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.infoCard}>
              <Card.Content style={styles.infoCardContent}>
                <View>
                  <PaperText style={styles.infoCardLabel}>
                    Pedidos hoje
                  </PaperText>
                  <PaperText style={styles.infoCardValue}>0</PaperText>
                </View>
                <View>
                  <IconButton icon="chevron-right" size={24} color="#999" />
                </View>
              </Card.Content>
            </Card>
          </View> */}

          {/* Botão para centralizar mapa */}
          <View style={styles.fab}>
            <FAB
              style={styles.fab}
              icon="crosshairs-gps"
              background={colors.primary}
              color={colors.white}
              onPress={centralizarMapa}
            />
          </View>

          {/* Área de notificação de corrida na parte inferior */}
          {!isRacing && deliveryStatus && !deliveries && (
            <View style={styles.lookingNotificationContainer}>
              <PaperText style={styles.lookingNotificationText}>
                Estamos procurando novas entregas para você
              </PaperText>
            </View>
          )}
          {deliveries && deliveryStatus && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                width: "100%",
                // maxWidth: 360,
                backgroundColor: "white",
                // borderRadius: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
                overflow: "hidden",
                marginHorizontal: "auto",
                zIndex: 999,
                // marginVertical: 10,
              }}
            >
              {/* Header with title */}
              <View
                style={{
                  padding: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F5F5F5",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#F63A50",
                    marginBottom: 12,
                  }}
                >
                  Nova entrega disponível
                </Text>

                {/* Store information */}
                <View
                  style={{
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#222222",
                      marginBottom: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    {deliveries.data.order.store.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#666666",
                      fontWeight: "400",
                    }}
                  >
                    {deliveries.data.order.store.address.address}
                  </Text>
                </View>

                {/* Price and distance */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#4CAF50",
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#333333",
                      }}
                    >
                      R$ {deliveries.data.order.motoboy.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#666666",
                    }}
                  >
                    {deliveries.data.order.delivery.distance.toFixed(1)} km
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View
                style={{
                  flexDirection: "row",
                  height: 60,
                }}
              >
                {/* Decline button */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "white",
                  }}
                  onPress={handleDeclineDelivery}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      color: "#999",
                      fontWeight: "300",
                    }}
                  >
                    ×
                  </Text>
                </TouchableOpacity>

                {/* Timer */}
                <CircularTimer expiresAt={deliveries.expiresAt} />

                {/* Accept button */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "white",
                  }}
                  onPress={handleAcceptDelivery}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      color: "#4CAF50",
                      fontWeight: "600",
                    }}
                  >
                    ✓
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* Controles de destino - mostrados durante uma entrega ativa */}
          {isRacing && mockDestinations.length > 0 && (
            <View style={styles.activeDeliveryContainer}>
              <Card style={styles.activeDeliveryCard}>
                <Card.Content>
                  <View style={styles.deliveryHeaderContainer}>
                    <PaperText style={styles.deliveryHeaderText}>
                      Entrega em andamento
                    </PaperText>
                    {routeInfo && (
                      <View style={styles.routeInfoContainer}>
                        <PaperText style={styles.routeInfoText}>
                          {routeInfo.distance.toFixed(1)} km •{" "}
                          {Math.ceil(routeInfo.duration)} min
                        </PaperText>
                      </View>
                    )}
                  </View>

                  <Divider style={styles.deliveryDivider} />

                  <View style={styles.destinationsContainer}>
                    {mockDestinations.map((dest, index) => (
                      <TouchableOpacity
                        key={dest.id}
                        style={[
                          styles.destinationButton,
                          activeDestination?.id === dest.id &&
                            styles.selectedDestination,
                        ]}
                        onPress={() => showRouteToDestination(dest)}
                      >
                        <View style={styles.destinationIconWrapper}>
                          <Text style={{ fontSize: 20 }}>
                            {index === 0 ? "🏪" : "🏠"}
                          </Text>
                        </View>
                        <View style={styles.destinationTextContainer}>
                          <PaperText style={styles.destinationLabel}>
                            {index === 0 ? "Retirada" : "Entrega"}
                          </PaperText>
                          <PaperText
                            style={styles.destinationTitle}
                            numberOfLines={1}
                          >
                            {dest.title}
                          </PaperText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {isNear && (
                    <Button
                      mode="contained"
                      buttonColor={colors.success}
                      style={styles.finalizeButton}
                      onPress={() => setGetCode(true)}
                    >
                      Finalizar entrega
                    </Button>
                  )}
                </Card.Content>
              </Card>
            </View>
          )}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  // General layout
  container: {
    flex: 1,
  },
  appBar: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  appBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  availabilityContainer: {
    alignItems: "center",
    position: "absolute",
    bottom: 0, // distância da parte inferior
    left: 0,
    right: 0,
    top: 20,
    paddingHorizontal: 16,
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  statusIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statusDot: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  toggleButton: {
    borderColor: colors.white,
    borderRadius: 20,
  },
  toggleButtonLabel: {
    fontSize: 12,
  },

  // Mapa
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noLocationContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  storeInfo: {
    marginBottom: 12,
  },
  storeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 14,
    color: "#666",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  distance: {
    fontSize: 15,
    color: "#666",
  },
  buttonsContainer: {
    flexDirection: "row",
    height: 60,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  declineButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  declineIcon: {
    fontSize: 28,
    color: "#999",
  },
  timerContainer: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  timer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  timerProgress: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderLeftColor: "#EB2E3E",
    borderTopColor: "#EB2E3E",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    transform: [{ rotate: "135deg" }],
  },
  acceptButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  acceptIcon: {
    fontSize: 24,
    color: "#4CAF50",
  },

  // Cards informativos
  infoCardsContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 5,
  },
  infoCard: {
    width: "48%",
    borderRadius: 8,
    elevation: 3,
  },
  infoCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  infoCardLabel: {
    fontSize: 12,
    color: colors.subtext,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },

  // Controles
  fab: {
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 100,
    right: 16,
  },

  // Notificação "Procurando entregas"
  lookingNotificationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 8, // Sombra para Android
    shadowColor: "#000", // Sombra para iOS
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 5,
  },

  lookingNotificationCard: {
    borderRadius: 12,
    elevation: 4,
    backgroundColor: colors.white,
  },
  lookingNotificationText: {
    color: colors.primary,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },

  // Entrega ativa
  activeDeliveryContainer: {
    position: "relative",
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 5,
  },
  activeDeliveryCard: {
    borderRadius: 12,
    elevation: 4,
  },
  deliveryHeaderContainer: {
    marginBottom: 12,
  },
  deliveryHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  routeInfoContainer: {
    marginTop: 4,
  },
  routeInfoText: {
    fontSize: 14,
    color: colors.subtext,
  },
  deliveryDivider: {
    marginVertical: 12,
  },
  destinationsContainer: {
    marginVertical: 8,
  },
  destinationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  selectedDestination: {
    backgroundColor: "#f0f0f0",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  destinationIconWrapper: {
    marginHorizontal: 12,
  },
  destinationTextContainer: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 12,
    color: colors.subtext,
  },
  destinationTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  finalizeButton: {
    marginTop: 8,
    borderRadius: 8,
  },

  // Modal de ofertas
  offersModalContainer: {
    backgroundColor: colors.card,
    margin: 0,
    paddingTop: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flex: 1,
    marginTop: 60,
  },
  offersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  offersHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
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
  viewToggleButton: {
    borderRadius: 20,
  },
  actionButtonContainer: {
    flexDirection: "row",
  },

  // Map styles
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
    color: "#333333",
  },
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
    color: "#111111",
  },
  routeInfoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },

  // Delivery offers styles
  offersContainer: {
    flex: 1,
    marginTop: 70, // To account for the status card at the top
    paddingBottom: 16,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtersScroll: {
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80, // Extra padding at bottom
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    height: height * 0.5, // Use half screen height for better centering
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  deliveryCard: {
    marginBottom: 16,
    borderRadius: 8,
  },

  // Countdown timer styles
  countdownContainer: {
    marginBottom: 10,
    borderRadius: 4,
    overflow: "hidden",
  },
  countdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },

  // Delivery card styles
  restaurantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  priceChip: {
    borderRadius: 4,
  },
  priceText: {
    color: "#000000",
    fontWeight: "bold",
  },
  addressSection: {
    marginBottom: 12,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
  },
  divider: {
    marginVertical: 12,
  },
  deliveryDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailItem: {
    alignItems: "center",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  detailLabel: {
    fontSize: 12,
  },
  acceptButton: {
    borderRadius: 20,
  },

  // Modal styles
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
});
