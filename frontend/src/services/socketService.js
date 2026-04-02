import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

const socketService = {
  connect(token, orgId) {
    if (socket?.connected) return;

    socket = io(SOCKET_URL, {
      auth: { token, orgId },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connection error", err.message);
    });
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on(event, handler) {
    if (socket) socket.on(event, handler);
  },

  off(event, handler) {
    if (socket) socket.off(event, handler);
  },

  emit(event, data) {
    if (socket) socket.emit(event, data);
  },
};

export default socketService;
