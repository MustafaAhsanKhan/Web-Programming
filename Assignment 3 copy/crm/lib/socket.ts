import { io, Socket } from "socket.io-client";

let socket: Socket | undefined;

/**
 * Returns a singleton Socket.io client.
 * Returns null during SSR — socket.io-client must only run in the browser.
 */
export const getSocket = (): Socket | null => {
  if (typeof window === "undefined") return null; // SSR guard

  if (!socket) {
    socket = io({
      path: "/api/socket",
      // Start with polling so the Pages Router /api/socket route
      // initialises the server, then upgrade to WebSocket.
      transports: ["polling", "websocket"],
    });

    socket.on("connect", () => {
      console.log("[socket] connected:", socket?.id);
    });
    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
    });
    socket.on("connect_error", (err) => {
      console.error("[socket] connection error:", err.message);
    });
  }

  return socket;
};
