// app/notifications.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Divider,
  IconButton,
} from "react-native-paper";
import { useAuth } from "./context/AuthContext";
import { getNotificationsAll, getMotoboyMe } from "./services/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale"; // Se quiser usar português

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Cores do app
  const colors = {
    primary: "#EB2E3E",
    secondary: "#FBBF24",
    white: "#FFFFFF",
    background: "#F5F5F5",
    card: "#FFFFFF",
    text: "#000000",
    subtext: "#666666",
  };

  // Função para buscar notificações
  const fetchNotifications = async () => {
    try {
      // Substitua por sua lógica real de busca de notificações
      // const response = await getNotifications();
      // setNotifications(response.data);
      setLoading(true);
      // Usa seu serviço API existente
      const reponseMotoboy = await getMotoboyMe();
      const motoboyData = reponseMotoboy.data;
      const response = await getNotificationsAll(motoboyData._id);

      const notificationAll = response.data.map((notification, index) => ({
        id: index,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        read: notification.status === "READ",
        type: notification.type,
      }));

      notificationAll.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Ordena do mais recente para o mais antigo
      });
      notificationAll.forEach((notification) => {
        notification.time = formatDistanceToNow(
          new Date(notification.createdAt),
          {
            addSuffix: true,
            locale: pt,
          }
        );
      });
      setNotifications(notificationAll);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Buscar notificações na montagem do componente
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Função para a ação de pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Marcar notificação como lida
  const markAsRead = (id) => {
    // Implementar lógica para marcar como lida
    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    );

    setNotifications(updatedNotifications);
  };

  // Renderizar item da lista de notificações
  const renderNotificationItem = ({ item }) => (
    <Card
      style={[
        styles.notificationCard,
        { backgroundColor: item.read ? colors.card : "#FFF8F8" },
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <Card.Content>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              styles.notificationTitle,
              { color: colors.text, fontWeight: item.read ? "600" : "700" },
            ]}
          >
            {item.title}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.subtext }]}>
            {item.time}
          </Text>
        </View>

        <Text style={[styles.notificationMessage, { color: colors.text }]}>
          {item.message}
        </Text>

        {!item.read && (
          <View
            style={[
              styles.unreadIndicator,
              { backgroundColor: colors.primary },
            ]}
          />
        )}
      </Card.Content>
    </Card>
  );

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
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={colors.text}
          onPress={() => router.back()}
        />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notificações
        </Text>
        <IconButton
          icon="check-all"
          size={24}
          iconColor={colors.primary}
          onPress={() => {
            // Marcar todas como lidas
            const allRead = notifications.map((notification) => ({
              ...notification,
              read: true,
            }));
            setNotifications(allRead);
          }}
        />
      </View>

      {/* Lista de notificações */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notificationsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Não há notificações no momento
            </Text>
          </View>
        }
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  notificationsList: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    flex: 1,
  },
  notificationTime: {
    fontSize: 11,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 12,
    lineHeight: 20,
  },
  unreadIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
