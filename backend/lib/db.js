import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Product from '../models/Product.js';
import Travel from '../models/travel.js';
import Vehicle from '../models/Veichel.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Shop from '../models/shop.js';
import Item from '../models/Items.js';
import SubItem from '../models/subItems.js';


dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:8081",
    credentials: true,
  },
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Socket.IO client connected:', socket.id);

  socket.on("chat", (data) => {
    console.log("📨 Received chat:", data);
    io.emit("chat", data); // broadcast to all
  });

  socket.on('join-product-room', async ({ productId, userId }) => {
    try {
      const product = await Product.findById(productId).populate('createdBy acceptedUsers.userId');
      if (!product) return socket.emit('join-error', 'Product not found');

      const allowed = product.createdBy._id.toString() === userId ||
        product.acceptedUsers.some(u => u.userId._id.toString() === userId);

      if (!allowed) return socket.emit('join-error', 'You are not allowed to join this room');

      socket.join(productId);
      socket.emit('joined-product-room', productId);
      console.log(`User ${userId} joined product room ${productId}`);
    } catch (err) {
      console.error('Error joining product room:', err);
      socket.emit('join-error', 'Server error');
    }
  });

  socket.on('join-user-chat', async ({ productId, userId, targetUserId }) => {
    try {
      const product = await Product.findById(productId).populate('createdBy acceptedUsers.userId');
      if (!product) return socket.emit('join-error', 'Product not found');

      // Check if user is creator or the target accepted user
      const isCreator = product.createdBy._id.toString() === userId;
      const isAcceptedUser = product.acceptedUsers.some(u => u.userId._id.toString() === userId);
      const isTargetUser = targetUserId === userId || product.acceptedUsers.some(u => u.userId._id.toString() === targetUserId);

      if (!isCreator && !isAcceptedUser) return socket.emit('join-error', 'You are not allowed to join this chat');

      const roomId = `${productId}_${targetUserId}`;
      socket.join(roomId);
      socket.emit('joined-user-chat', { roomId, targetUserId });
      console.log(`User ${userId} joined chat room ${roomId}`);
    } catch (err) {
      console.error('Error joining user chat:', err);
      socket.emit('join-error', 'Server error');
    }
  });

  socket.on('send-user-message', async ({ productId, targetUserId, message, userId, username }) => {
    try {
      const roomId = `${productId}_${targetUserId}`;

      // Find the accepted user and push message to their messages array
      await Product.findOneAndUpdate(
        { _id: productId, 'acceptedUsers.userId': targetUserId },
        {
          $push: {
            'acceptedUsers.$.messages': {
              userId,
              username,
              message,
              timestamp: new Date()
            }
          }
        }
      );

      // Emit to all users in the room including sender
      io.to(roomId).emit('user-message', {
        message,
        userId,
        username,
        targetUserId,
        timestamp: new Date().toISOString()
      });
      console.log(`Message saved and sent in user chat room ${roomId}: ${message}`);
    } catch (error) {
      console.error('Error saving user message:', error);
      socket.emit('message-error', 'Failed to send message');
    }
  });

  socket.on("disconnect", () => {
    console.log('❎ Socket.IO client disconnected:', socket.id);
  });
});

const startServer = async () => {
  await connectDB();

  // Start Socket.IO server on port 3001
  httpServer.listen(3001, () => {
    console.log(`🚀 Socket.IO server running on http://0.0.0.0:3001`);
    console.log('⚙️  Socket.IO server started successfully');
  }).on('error', (err) => {
    console.error('❌ Socket.IO server error:', err);
    process.exit(1);
  });
};

// startServer(); // Commented out to prevent auto-start

export { io, connectDB };
