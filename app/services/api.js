import axios from "axios";
import { auth } from "../firebase/config";
import { Platform } from "react-native";

const getBaseUrl = () => {
  // For web, we can use relative URLs or localhost
  if (Platform.OS === "web") {
    return process.env.REACT_APP_API_URL || "http://localhost:8080/api";
  }

  // For mobile devices, we need to use the computer's network IP address
  // Replace 192.168.1.x with your actual local IP address
  return "http://192.168.15.24:8080/api"; //FIXME adicionar env com api
};

const API_URL = getBaseUrl();

console.log(API_URL);
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      // console.log(token);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Serviços de Motoboy
export const getMotoboys = async () => {
  return api.get("/motoboys");
};

export const getNotifications = async (motoboyId) => {
  return api.get("/notifications", { params: { motoboyId } });
};

export const updateNotification = async (notificationData) => {
  return api.put("/notifications", notificationData);
};

export const updateOrderStatus = async (notificationData) => {
  console.log("UpdateOrderStatus ", api, API_URL);
  return api.put(`/orders/status`, notificationData);
};

export const createTravel = async (travelData) => {
  return api.post("/travels", travelData);
};

export const getMotoboyMe = async () => {
  return api.get("/motoboys/me");
};

export const getMotoboyOrders = async () => {
  return api.get("/motoboys/orders");
};

export const createMotoboy = async (motoboyData) => {
  return api.post("/motoboys", motoboyData);
};

export const updateMotoboy = async (motoboyData) => {
  return api.put("/motoboys", motoboyData);
};

export const findNearestMotoboy = async (coords) => {
  return api.post("/motoboys/find-nearest", coords);
};

export const updateMotoboyLocation = async (locationData) => {
  return api.put("/motoboys/update-location", locationData);
};

export const getOrder = async (orderId) => {
  return api.get(`/orders/${orderId}`);
};

// Função utilitária para converter endereço em coordenadas usando a API do Google Maps
export const geocodeAddress = async (address) => {
  try {
    // Nota: Em produção, você usaria seu próprio serviço proxy para proteger sua API key
    // Aqui estamos usando uma abordagem simplificada para fins de demonstração
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const encodedAddress = encodeURIComponent(address);
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    );

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }

    throw new Error("Não foi possível geocodificar o endereço");
  } catch (error) {
    console.error("Erro ao geocodificar endereço:", error);
    throw error;
  }
};

export default api;
