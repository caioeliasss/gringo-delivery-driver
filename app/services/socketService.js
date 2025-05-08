// app/services/socketService.js
import io from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Conectar ao servidor
  connect(motoboyId, token) {
    if (this.socket) {
      console.log("Socket já conectado");
      return;
    }

    // NÃO incluir /socket na URL, apenas na configuração path
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

    // Eventos de conexão
    this.socket.on("connect", () => {
      console.log("Socket conectado!");
      console.log("Socket ID:", this.socket.id);
      this.isConnected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket desconectado:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Erro de conexão:", error.message);
    });

    // Listener para evento de teste
    this.socket.on("test", (data) => {
      console.log("Evento de teste recebido:", data);
    });

    // Listeners para confirmação de localização
    this.socket.on("locationUpdate:success", (data) => {
      console.log("Localização atualizada com sucesso:", data);
    });

    this.socket.on("locationUpdate:error", (error) => {
      console.error("Erro ao atualizar localização:", error);
    });
  }

  // Enviar localização
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

  // Escutar por atualizações de pedidos
  onOrderUpdate(callback) {
    if (this.socket) {
      this.socket.on("orderUpdate", callback);
    }
  }

  // Remover listener
  offOrderUpdate() {
    if (this.socket) {
      this.socket.off("orderUpdate");
    }
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

const socketService = new SocketService();
export default socketService;
