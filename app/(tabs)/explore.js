// app/(tabs)/explore.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import {
  Card,
  Text,
  Button,
  Chip,
  ActivityIndicator,
  Searchbar,
  Divider,
} from "react-native-paper";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createTravel,
  getMotoboyMe,
  getMotoboyOrders,
  getNotifications,
  updateNotification,
} from "../services/api";
import { buscarCnpj } from "../services/cnpj";
import { getWeather } from "../services/weather";

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [motoboyId, setMotoboyId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'food', 'pharmacy', 'grocery'

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
    // Simulate API call
    const fetchPedidos = async () => {
      let motoboy_id;
      try {
        let response = await getMotoboyMe();
        const motoboy = response.data;

        motoboy_id = motoboy._id;
        setMotoboyId(motoboy_id);
      } catch (error) {
        console.log(error.response.data);
      }

      console.log(motoboy_id);
      try {
        response = await getNotifications(motoboy_id);
        const notification = response.data;
        setDeliveries(notification);
        setLoading(false);
      } catch (error) {
        console.log(error.response.data);
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
        response = await getNotifications(motoboyId);
        const notification = response.data;

        setDeliveries(notification);
        setLoading(false);
      } catch (error) {
        console.log(error.response.data);
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
  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch = searchQuery
      ? delivery.restaurant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.pickupAddress
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        delivery.deliveryAddress
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true;

    const matchesFilter = filter === "all" || delivery.type === filter;

    return matchesSearch && matchesFilter;
  });

  // Accept delivery action
  const handleAcceptDelivery = async (delivery) => {
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

    const travelData = {
      price: delivery.data.order.motoboy.price,
      rain: isRain,
      distance: delivery.data.order.delivery.distance, //TODO Calcular distancia de todos os pedidos
      coordinatesFrom: delivery.data.order.store.coordinates,
      coordinatesTo: delivery.data.order.customer.customerAddress.coordinates, //FIXME
      order: delivery.data.order,
    };
    try {
      console.log(travelData);
      await updateNotification({ id: delivery._id, status: "ACCEPTED" });
      await createTravel(travelData);
      setDeliveries([]);
    } catch (error) {
      console.log(error);
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
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Nenhuma entrega disponível no momento.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
              Puxe para baixo para atualizar
            </Text>
          </View>
        ) : (
          filteredDeliveries.map((delivery) => (
            <Card
              key={delivery._id}
              style={[styles.deliveryCard, { backgroundColor: colors.card }]}
            >
              <Card.Content>
                <View style={styles.restaurantRow}>
                  <Text style={[styles.restaurantName, { color: colors.text }]}>
                    {delivery.title}
                  </Text>
                  <Chip
                    style={[
                      styles.priceChip,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Text style={styles.priceText}>
                      R$ {delivery.data.order.motoboy.price}
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
                    <Text style={[styles.addressText, { color: colors.text }]}>
                      {`${delivery.data.order.store.address.address}, ${delivery.data.order.store.address.addressNumber}, ${delivery.data.order.store.address.bairro}`}
                    </Text>
                  </View>

                  <View style={styles.addressContainer}>
                    <Text
                      style={[styles.addressLabel, { color: colors.subtext }]}
                    >
                      Entrega:
                    </Text>
                    <Text style={[styles.addressText, { color: colors.text }]}>
                      {`${delivery.data.address.address}, ${delivery.data.address.addressNumber}, ${delivery.data.address.bairro}`}
                    </Text>
                  </View>
                </View>

                <Divider
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <View style={styles.deliveryDetails}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {delivery.data.order.delivery.distance.toFixed(1)} km
                    </Text>
                    <Text
                      style={[styles.detailLabel, { color: colors.subtext }]}
                    >
                      Distância
                    </Text>
                  </View>

                  {/* <View style={styles.detailItem}>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {delivery.time}
                    </Text>
                    <Text
                      style={[styles.detailLabel, { color: colors.subtext }]}
                    >
                      Tempo estimado
                    </Text>
                  </View> */}

                  <Button
                    mode="contained"
                    buttonColor={colors.primary}
                    style={styles.acceptButton}
                    onPress={() => handleAcceptDelivery(delivery)}
                  >
                    Aceitar
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
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
  restaurantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
});
