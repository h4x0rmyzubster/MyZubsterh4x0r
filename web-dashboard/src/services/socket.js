// src/services/socket.js
import { io } from 'socket.io-client';

let socket = null;
let isConnecting = false;

// FORZATO per sviluppo
const SOCKET_URL = 'http://localhost:5000';

export const connectSocket = (userId, onConnect = null, onDisconnect = null) => {
  if (socket && socket.connected) {
    console.log('🔌 WebSocket già connesso');
    return socket;
  }

  if (isConnecting) {
    console.log('⏳ Connessione WebSocket in corso...');
    return socket;
  }

  isConnecting = true;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log(`🔌 WebSocket connesso (ID: ${socket.id})`);
    isConnecting = false;
    
    if (userId) {
      socket.emit('authenticate', userId);
      console.log(`🔐 Autenticato utente ${userId} sul WebSocket`);
    }

    if (onConnect) onConnect();
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Errore connessione WebSocket:', error);
    isConnecting = false;
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 WebSocket disconnesso: ${reason}`);
    if (onDisconnect) onDisconnect(reason);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 WebSocket riconnesso (tentativo ${attemptNumber})`);
    if (userId) {
      socket.emit('authenticate', userId);
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnecting = false;
    console.log('🔌 WebSocket disconnesso manualmente');
  }
};

export const getSocket = () => {
  return socket;
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};

export const emitSocketEvent = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
    return true;
  }
  console.warn(`⚠️ WebSocket non connesso, evento "${event}" non inviato`);
  return false;
};

export const onSocketEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  } else {
    console.warn(`⚠️ WebSocket non disponibile, impossibile ascoltare "${event}"`);
  }
};

export const offSocketEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

const socketService = {
  connectSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  emitSocketEvent,
  onSocketEvent,
  offSocketEvent,
};

export default socketService;