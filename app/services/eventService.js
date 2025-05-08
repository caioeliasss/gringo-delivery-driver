// src/services/eventService.js
import EventSource from "react-native-sse";
class EventService {
  constructor() {
    this.eventSource = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.storeId = null;
  }

  // Conectar ao servidor de eventos
  connect(storeId) {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.storeId = storeId;
    const baseUrl = process.env.EXPO_PUBLIC_REACT_APP_API_URL;
    const eventsUrl =
      baseUrl.replace("/api", "") + `/api/events?storeId=${storeId}`;

    console.log("Conectando SSE em:", eventsUrl);

    try {
      this.eventSource = new EventSource(eventsUrl);

      // Manipulador de conexão
      this.eventSource.addEventListener("open", () => {
        console.log("SSE conectado");
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      // Manipulador de mensagens - USAR addEventListener em vez de onmessage
      this.eventSource.addEventListener("message", (event) => {
        // console.log("Evento recebido:", event);

        try {
          // Parse da string JSON nos dados do evento
          const eventData = JSON.parse(event.data);
          // console.log("Dados parseados:", eventData);

          // Verificar tipo e notificar listeners
          if (eventData.type && this.listeners.has(eventData.type)) {
            // console.log(`Executando callbacks para ${eventData.type}`);
            this.listeners.get(eventData.type).forEach((callback) => {
              callback(eventData.data);
            });
          }
        } catch (error) {
          console.error("Erro ao processar evento:", error);
        }
      });

      // Manipulador de erros
      this.eventSource.addEventListener("error", (error) => {
        console.error("Erro no SSE:", error);
        this.isConnected = false;
        this.eventSource.close();
        this.eventSource = null;
        this.scheduleReconnect();
      });
    } catch (error) {
      console.error("Erro ao conectar ao SSE:", error);
      this.scheduleReconnect();
    }
  }

  // Agendar reconexão
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Número máximo de tentativas de reconexão atingido");
      return;
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    console.log(
      `Tentando reconectar em ${delay}ms (tentativa ${
        this.reconnectAttempts + 1
      }/${this.maxReconnectAttempts})`
    );

    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.storeId);
    }, delay);
  }

  // Registrar um ouvinte para um tipo específico de evento
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType).push(callback);
  }

  // Remover um ouvinte
  off(eventType, callback) {
    if (!this.listeners.has(eventType)) return;

    const callbacks = this.listeners.get(eventType);
    const index = callbacks.indexOf(callback);

    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    if (callbacks.length === 0) {
      this.listeners.delete(eventType);
    }
  }

  // Desconectar do servidor de eventos
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      this.storeId = null;
      clearTimeout(this.reconnectTimeout);
    }
  }
}

// Criar e exportar uma única instância do serviço
const eventService = new EventService();
export default eventService;
