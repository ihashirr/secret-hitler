import { io } from "socket.io-client";

// In Next.js with custom server, the socket is served on the same host and port as the frontend
export const socket = io({
  autoConnect: false
});
