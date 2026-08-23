// Singleton WebSocket client manager for real-time document collaboration
// Handles connection, reconnection, room management, and message routing

type MessageHandler = (data: any) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private currentDocumentId: string | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private intentionallyClosed = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Derive WebSocket URL from current page location
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      this.url = `${protocol}//${window.location.host}`;
    } else {
      this.url = "";
    }
  }

  connect(): void {
    if (typeof window === "undefined") return;
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.intentionallyClosed = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[WS] Connected");
        this.reconnectAttempts = 0;

        // Re-join room if we were in one
        if (this.currentDocumentId) {
          this.send({ type: "join", documentId: this.currentDocumentId });
        }

        // Start keepalive ping
        this.startPing();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const handlers = this.handlers.get(data.type);
          if (handlers) {
            handlers.forEach((handler) => handler(data));
          }
        } catch (err) {
          // Ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        console.log("[WS] Disconnected");
        this.stopPing();
        if (!this.intentionallyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // onclose will fire after onerror, which handles reconnection
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WS] Max reconnect attempts reached");
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, ... capped at 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: "ping" });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.stopPing();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  joinDocument(documentId: string): void {
    // Leave previous document room
    if (this.currentDocumentId && this.currentDocumentId !== documentId) {
      this.send({ type: "leave" });
    }

    this.currentDocumentId = documentId;
    this.send({ type: "join", documentId });
  }

  leaveDocument(): void {
    if (this.currentDocumentId) {
      this.send({ type: "leave" });
      this.currentDocumentId = null;
    }
  }

  sendDocUpdate(content: any, senderId?: string, updatedAt?: string): void {
    this.send({
      type: "doc:update",
      content,
      senderId,
      updatedAt,
    });
  }

  sendTitleUpdate(title: string, senderId?: string): void {
    this.send({
      type: "doc:title",
      title,
      senderId,
    });
  }

  sendSavedNotification(updatedAt: string): void {
    this.send({
      type: "doc:saved",
      updatedAt,
    });
  }

  sendPermissionsUpdate(): void {
    this.send({
      type: "doc:permissions",
    });
  }

  on(type: string, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off(type: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsClientInstance: WSClient | null = null;

export function getWSClient(): WSClient {
  if (!wsClientInstance) {
    wsClientInstance = new WSClient();
  }
  return wsClientInstance;
}

export type { WSClient };
