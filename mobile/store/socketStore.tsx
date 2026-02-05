import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connect: (userId: string) => void;
  disconnect: () => void;
  sendMessage: (senderId: string, receiverId: string, message: string, username: string) => void;
  onTravelRequestAccepted: (callback: (data: { productId: string, travelId: string }) => void) => void;
  removeTravelRequestAcceptedListener: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (userId: string) => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to Socket.IO');
      set({ isConnected: true });

      // Join user's personal room
      socket.emit('join-user', userId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO');
      set({ isConnected: false });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  sendMessage: (senderId: string, receiverId: string, message: string, username: string) => {
    const { socket } = get();
    if (socket) {
      console.log('📤 Frontend: Sending message:', { senderId, receiverId, message, username });
      socket.emit('sendMessage', {
        senderId,
        receiverId,
        message,
        username
      });
    } else {
      console.error('❌ Frontend: Socket not connected');
    }
  },

  onTravelRequestAccepted: (callback: (data: { productId: string, travelId: string }) => void) => {
    const { socket } = get();
    if (socket) {
      socket.on('travelRequestAccepted', callback);
    }
  },

  removeTravelRequestAcceptedListener: () => {
    const { socket } = get();
    if (socket) {
      socket.off('travelRequestAccepted');
    }
  }
}));
