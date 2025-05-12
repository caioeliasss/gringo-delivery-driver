// app/services/socketService.js
import io from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Connect to server
  connect(motoboyId, token) {
    if (this.socket && this.isConnected) {
      console.log("Socket já conectado");
      return;
    }

    // URL from environment variables
    const socketUrl = process.env.EXPO_PUBLIC_REACT_APP_SOCKET_URL;
    console.log("Conectando ao socket:", socketUrl);
    console.log("Motoboy ID:", motoboyId);

    this.socket = io(socketUrl, {
      path: "/socket",
      auth: { token },
      query: { motoboyId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    this.socket.on("connect", () => {
      console.log("Socket conectado!");
      console.log("Socket ID:", this.socket.id);
      this.isConnected = true;

      // Notify all connection listeners
      this._notifyListeners("connection", { connected: true });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket desconectado:", reason);
      this.isConnected = false;

      // Notify all connection listeners
      this._notifyListeners("connection", { connected: false, reason });
    });

    this.socket.on("connect_error", (error) => {
      console.error("Erro de conexão:", error.message);
      this._notifyListeners("error", { message: error.message });
    });

    // Test event listener
    this.socket.on("test", (data) => {
      console.log("Evento de teste recebido:", data);
      this._notifyListeners("test", data);
    });

    // Location update confirmation listeners
    this.socket.on("locationUpdate:success", (data) => {
      console.log("Localização atualizada com sucesso:", data);
      this._notifyListeners("locationUpdate", { success: true, data });
    });

    this.socket.on("locationUpdate:error", (error) => {
      console.error("Erro ao atualizar localização:", error);
      this._notifyListeners("locationUpdate", { success: false, error });
    });

    // Order update listeners
    this.socket.on("orderUpdate", (data) => {
      console.log("Atualização de pedido recebida:", data);
      this._notifyListeners("orderUpdate", data);
    });
  }

  // Send location to server
  sendLocation(location) {
    if (this.socket && this.isConnected) {
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString(),
      };

      console.log("Enviando localização:", locationData);
      this.socket.emit("updateLocation", locationData);
    } else {
      console.log("Socket não conectado. Status:", this.isConnected);
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event).push(callback);
    return this; // For method chaining
  }

  // Remove event listener
  off(event, callback) {
    if (!this.listeners.has(event)) return this;

    if (callback) {
      // Remove specific callback
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    } else {
      // Remove all callbacks for this event
      this.listeners.delete(event);
    }

    return this; // For method chaining
  }

  // Notify all listeners for an event
  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }

    // Also notify wildcard listeners
    if (this.listeners.has("*")) {
      this.listeners.get("*").forEach((callback) => {
        try {
          callback({ event, data });
        } catch (error) {
          console.error(`Error in wildcard listener:`, error);
        }
      });
    }
  }

  // Listen for order updates
  onOrderUpdate(callback) {
    return this.on("orderUpdate", callback);
  }

  // Remove order update listener
  offOrderUpdate(callback) {
    return this.off("orderUpdate", callback);
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Check connection status
  isConnected() {
    return this.isConnected;
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
