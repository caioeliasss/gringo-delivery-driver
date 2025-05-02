// app/(tabs)/explore.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import {
  Card,
  Text,
  Button,
  Chip,
  ActivityIndicator,
  Searchbar,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createTravel,
  getMotoboyMe,
  getNotifications,
  updateNotification,
  updateOrderStatus,
} from "../services/api";
import { getWeather } from "../services/weather";
import { useAuth } from "../context/AuthContext";
import eventService from "../services/eventService";
import { useRouter } from "expo-router";

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
        // Assuming expiresAt is set 5 minutes from creation, we get the full duration
        // You might want to adjust this logic based on your actual backend implementation
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

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [motoboyId, setMotoboyId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'food', 'pharmacy', 'grocery'
  const [expiredDeliveries, setExpiredDeliveries] = useState({});
  const { user, logout } = useAuth();
  const [isTravel, setIsTravel] = useState();
  const router = useRouter();

  // Define app colors
  const colors = {
    primary: "#EB2E3E",
    secondary: "#FBBF24",
    white: "#FFFFFF",
    background: colorScheme === "dark" ? "#252525" : "#F5F5F5",
    card: colorScheme === "dark" ? "#333333" : "#FFFFFF",
    text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    subtext: colorScheme === "dark" ? "#BBBBBB" : "#666666",
    border: colorScheme === "dark" ? "#444444" : "#E5E5E5",
    chipBackground: colorScheme === "dark" ? "#444444" : "#EEEEEE",
  };

  useEffect(() => {
    if (user) {
      // Conectar com o SSE
      eventService.connect(user.uid);
      console.log("Conectado com o user:", user.uid);

      // Registrar manipulador de eventos com logs
      const handleOrderUpdate = async (orderData) => {
        let motoboy_id;
        try {
          let response = await getMotoboyMe();
          const motoboy = response.data;

          motoboy_id = motoboy._id;
          setMotoboyId(motoboy_id);
        } catch (error) {
          console.log(error.response?.data || error);
        }
        try {
          response = await getNotifications(motoboy_id);
          const notification = response.data;
          setDeliveries(notification);
          setLoading(false);
        } catch (error) {
          console.log(error.response?.data || error);
        }
      };

      // Registrar evento e verificar se foi registrado corretamente
      eventService.on("notificationUpdate", handleOrderUpdate);
      eventService.on("*", (data) => {
        console.log("Evento genérico recebido:", data);
      });

      return () => {
        console.log("Desmontando componente, removendo listener");
        eventService.off("notificationUpdate", handleOrderUpdate);
      };
    }
  }, [user]);

  useEffect(() => {
    const fetchPedidos = async () => {
      let motoboy_id;
      try {
        let response = await getMotoboyMe();
        const motoboy = response.data;

        motoboy_id = motoboy._id;
        setMotoboyId(motoboy_id);
        setIsTravel(motoboy.race.active);
      } catch (error) {
        console.log(error.response?.data || error);
      }
      try {
        response = await getNotifications(motoboy_id);
        const notification = response.data;
        setDeliveries(notification);
        setLoading(false);
      } catch (error) {
        console.log(error.response?.data || error);
      }
    };
    setTimeout(() => {
      fetchPedidos();
    }, 1000);
  }, []);

  // Refresh data
  const onRefresh = () => {
    const fetchPedidos = async () => {
      try {
        const response = await getNotifications(motoboyId);
        const notification = response.data;
        setDeliveries(notification);
        setLoading(false);
      } catch (error) {
        console.log(error.response?.data || error);
      }
    };
    fetchPedidos();
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Filter deliveries based on search and filter
  const filteredDeliveries = deliveries
    .filter((delivery) => {
      const matchesSearch = searchQuery
        ? delivery.restaurant
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          delivery.pickupAddress
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          delivery.deliveryAddress
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;

      const matchesFilter = filter === "all" || delivery.type === filter;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by createdAt, newest first
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

  // Accept delivery action
  const handleAcceptDelivery = async (delivery) => {
    setDeliveries([]);

    let isRain;
    try {
      const [latitude, longitude] = delivery.data.order.store.coordinates;

      const response = await getWeather(latitude, longitude);

      if (response.current.rain < 2.4) {
        isRain = false;
      } else {
        isRain = true;
      }
    } catch (error) {
      console.log(error);
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
      await updateNotification({ id: delivery._id, status: "ACCEPTED" });
    } catch (error) {
      console.log("Erro updateNotification: ", error);
    }
    try {
      await updateOrderStatus({
        id: delivery.data.order._id,
        status: "em_preparo",
      });
    } catch (error) {
      console.log("Erro updateOrderStatus: ", error);
    }
    try {
      await createTravel(travelData);
      router.replace("/(tabs)?refresh=true");
    } catch (error) {
      console.log("Erro createTravel: ", error);
    }
  };

  if (loading) {
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <View style={styles.header}>
        <Searchbar
          placeholder="Buscar entregas..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: colors.card }]}
          inputStyle={{ color: colors.text }}
          iconColor={colors.primary}
          placeholderTextColor={colors.subtext}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <Chip
            selected={filter === "all"}
            onPress={() => setFilter("all")}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === "all" ? colors.primary : colors.chipBackground,
              },
            ]}
            textStyle={{
              color: filter === "all" ? colors.white : colors.text,
            }}
          >
            Todas
          </Chip>

          <Chip
            selected={filter === "food"}
            onPress={() => setFilter("food")}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === "food" ? colors.primary : colors.chipBackground,
              },
            ]}
            textStyle={{
              color: filter === "food" ? colors.white : colors.text,
            }}
          >
            Restaurantes
          </Chip>

          <Chip
            selected={filter === "pharmacy"}
            onPress={() => setFilter("pharmacy")}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === "pharmacy"
                    ? colors.primary
                    : colors.chipBackground,
              },
            ]}
            textStyle={{
              color: filter === "pharmacy" ? colors.white : colors.text,
            }}
          >
            Farmácias
          </Chip>

          <Chip
            selected={filter === "grocery"}
            onPress={() => setFilter("grocery")}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === "grocery" ? colors.primary : colors.chipBackground,
              },
            ]}
            textStyle={{
              color: filter === "grocery" ? colors.white : colors.text,
            }}
          >
            Mercados
          </Chip>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filteredDeliveries.length === 0 ? (
          <View>
            {isTravel ? (
              <Card
                style={[
                  styles.activeDeliveryCard,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => router.replace("/(tabs)?refresh=true")}
              >
                <Card.Content style={styles.activeDeliveryContent}>
                  <View style={styles.deliveryIconContainer}>
                    <Text style={styles.deliveryIcon}>🚚</Text>
                    <View style={styles.pulseCircle} />
                  </View>
                  <View style={styles.deliveryTextContainer}>
                    <Text style={styles.activeDeliveryTitle}>
                      Entrega em andamento
                    </Text>
                    <Text style={styles.activeDeliverySubtitle}>
                      Toque para visualizar sua rota atual
                    </Text>
                  </View>
                  <View style={styles.deliveryArrowContainer}>
                    <Text style={styles.deliveryArrow}>→</Text>
                  </View>
                </Card.Content>
              </Card>
            ) : null}

            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                Nenhuma entrega disponível no momento.
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
                Puxe para baixo para atualizar
              </Text>
            </View>
          </View>
        ) : (
          filteredDeliveries.map((delivery) => {
            const isExpired = expiredDeliveries[delivery._id] || false;

            return (
              <Card
                key={delivery._id}
                style={[
                  styles.deliveryCard,
                  {
                    backgroundColor: colors.card,
                    opacity: isExpired ? 0.7 : 1,
                  },
                ]}
              >
                <Card.Content>
                  {/* Countdown Timer Component */}
                  <CountdownTimer
                    expiresAt={delivery.expiresAt}
                    colors={colors}
                    onExpiredChange={(expired) => {
                      setExpiredDeliveries((prev) => ({
                        ...prev,
                        [delivery._id]: expired,
                      }));
                    }}
                  />

                  <View style={styles.restaurantRow}>
                    <Text
                      style={[styles.restaurantName, { color: colors.text }]}
                    >
                      {delivery.title}
                    </Text>
                    <Chip
                      style={[
                        styles.priceChip,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Text style={styles.priceText}>
                        R$ {delivery.data.order.motoboy.price.toFixed(2)}
                      </Text>
                    </Chip>
                  </View>

                  <View style={styles.addressSection}>
                    <View style={styles.addressContainer}>
                      <Text
                        style={[styles.addressLabel, { color: colors.subtext }]}
                      >
                        Retirada:
                      </Text>
                      <Text
                        style={[styles.addressText, { color: colors.text }]}
                      >
                        {`${delivery.data.order.store.address.address}, ${delivery.data.order.store.address.addressNumber}, ${delivery.data.order.store.address.bairro}`}
                      </Text>
                    </View>

                    <View style={styles.addressContainer}>
                      <Text
                        style={[styles.addressLabel, { color: colors.subtext }]}
                      >
                        Entrega:
                      </Text>
                      <Text
                        style={[styles.addressText, { color: colors.text }]}
                      >
                        {`${delivery.data.address.address}, ${delivery.data.address.addressNumber}, ${delivery.data.address.bairro}`}
                      </Text>
                    </View>
                  </View>

                  <Divider
                    style={[styles.divider, { backgroundColor: colors.border }]}
                  />

                  <View style={styles.deliveryDetails}>
                    <View style={styles.detailItem}>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {delivery.data.order.delivery.distance.toFixed(1)} km
                      </Text>
                      <Text
                        style={[styles.detailLabel, { color: colors.subtext }]}
                      >
                        Distância
                      </Text>
                    </View>

                    {isExpired ? (
                      <Button
                        mode="contained"
                        buttonColor={colors.chipBackground}
                        style={styles.acceptButton}
                        disabled={true}
                      >
                        Expirado
                      </Button>
                    ) : (
                      <Button
                        mode="contained"
                        buttonColor={colors.primary}
                        style={styles.acceptButton}
                        onPress={() => handleAcceptDelivery(delivery)}
                      >
                        Aceitar
                      </Button>
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
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
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
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
  // Countdown styles
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
  // Add these styles to your StyleSheet.create function
  activeDeliveryCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  activeDeliveryContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  deliveryIconContainer: {
    position: "relative",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  deliveryIcon: {
    fontSize: 28,
    zIndex: 2,
  },
  pulseCircle: {
    position: "absolute",
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.3)",
    opacity: 0.7,
    zIndex: 1,
    // You'd ideally use Animated to create a pulsing effect
    // This is just a placeholder styling
  },
  deliveryTextContainer: {
    flex: 1,
  },
  activeDeliveryTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  activeDeliverySubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
  },
  deliveryArrowContainer: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  deliveryArrow: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
