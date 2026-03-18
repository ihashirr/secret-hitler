import { io } from 'socket.io-client';

// 'http://localhost:3001' for local development
// We will use import.meta.env to handle prod urls if needed
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket = io(URL, {
  autoConnect: false // We will connect manually when user enters name
});
