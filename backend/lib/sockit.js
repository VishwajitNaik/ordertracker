import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Product from '../models/Product.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8081",
    methods: ["GET", "POST"]
  }
});

// Store online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Socket.IO client connected:', socket.id);

  socket.on("chat", (data) => {
    console.log("📨 Received chat:", data);
    io.emit("chat", data); // broadcast to all
  });

  // Join user to their own room for direct messaging
  socket.on("join-user", (userId) => {
    socket.join(userId);
    console.log(`🔗 User ${userId} joined their personal room (socket: ${socket.id})`);
    console.log(`📊 Online users count: ${io.sockets.sockets.size}`);
  });

  // Handle product-based chat messages (save to product's acceptedUsers.messages array)
  socket.on("sendMessage", async ({ productId, senderId, receiverId, message, username }) => {
    console.log(`📤 SEND PRODUCT MESSAGE: Product ${productId}, From ${senderId} (${username}) to ${receiverId}: "${message}"`);

    try {
      // Save message to the product's acceptedUsers.messages array
      const product = await Product.findById(productId);
      if (!product) throw new Error('Product not found');

      const creatorId = product.createdBy.toString();
      const isSenderCreator = senderId === creatorId;

      // Create message object with correct field names for frontend compatibility
      const messageData = {
        _id: new mongoose.Types.ObjectId(), // Generate ObjectId for consistency
        productId, // Include productId for filtering
        senderId, // Use senderId to match frontend expectation
        receiverId,
        message,
        username,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        read: false
      };

      // Store message in the acceptedUsers messages array where it belongs
      // For conversation continuity, we need to ensure both users can see all messages
      // So we store each message in the accepted user's messages array (since accepted users have the messages field)

      const updateQuery = {
        $push: {
          'acceptedUsers.$[user].messages': messageData
        }
      };

      // If sender is creator, store in receiver's (accepted user) messages array
      // If sender is accepted user, store in sender's (accepted user) messages array
      const targetUserId = isSenderCreator ? receiverId : senderId;
      const arrayFilters = [{ 'user.userId': targetUserId }];

      const updateResult = await Product.findByIdAndUpdate(productId, updateQuery, { arrayFilters });

      if (!updateResult) {
        throw new Error('Product update failed - product not found or no matching user');
      }

      console.log(`💾 Message saved to product ${productId} acceptedUsers.messages array`);

      // Determine the chat room for real-time delivery
      const roomId = isSenderCreator
        ? `${productId}_${senderId}_${receiverId}`
        : `${productId}_${receiverId}_${senderId}`;

      console.log(`📡 About to emit to room ${roomId}, messageData:`, JSON.stringify(messageData, null, 2));

      // Emit to the specific private chat room only
      const emitResult = io.to(roomId).emit("receiveMessage", messageData);
      console.log(`📡 Message emitted to private chat room ${roomId}, emit result: ${emitResult}`);

      // Check room occupancy for debugging
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      console.log(`🏠 Room ${roomId} has ${roomSockets ? roomSockets.size : 0} sockets`);

    } catch (error) {
      console.error('❌ Error sending product message:', error);
      socket.emit('message-error', 'Failed to send message');
    }
  });

  // Handle order-based chat messages (save to order's acceptedUsers.messages array)
  socket.on("sendOrderMessage", async ({ orderId, senderId, receiverId, message, username }) => {
    console.log(`📤 SEND ORDER MESSAGE: Order ${orderId}, From ${senderId} (${username}) to ${receiverId}: "${message}"`);

    try {
      // Save message to the order's acceptedUsers.messages array
      const order = await mongoose.model('Order').findById(orderId);
      if (!order) throw new Error('Order not found');

      const creatorId = order.userId.toString();
      const isSenderCreator = senderId === creatorId;

      // Create message object with correct field names for frontend compatibility
      const messageData = {
        _id: new mongoose.Types.ObjectId(), // Generate ObjectId for consistency
        orderId, // Include orderId for filtering
        senderId, // Use senderId to match frontend expectation
        receiverId,
        message,
        username,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        read: false
      };

      // Store message in the acceptedUsers messages array where it belongs
      // For conversation continuity, we need to ensure both users can see all messages
      // So we store each message in the accepted user's messages array (since accepted users have the messages field)

      const updateQuery = {
        $push: {
          'acceptedUsers.$[user].messages': messageData
        }
      };

      // If sender is creator, store in receiver's (accepted user) messages array
      // If sender is accepted user, store in sender's (accepted user) messages array
      const targetUserId = isSenderCreator ? receiverId : senderId;
      const arrayFilters = [{ 'user.userId': targetUserId }];

      const updateResult = await mongoose.model('Order').findByIdAndUpdate(orderId, updateQuery, { arrayFilters });

      if (!updateResult) {
        throw new Error('Order update failed - order not found or no matching user');
      }

      console.log(`💾 Message saved to order ${orderId} acceptedUsers.messages array`);

      // Determine the chat room for real-time delivery
      const roomId = isSenderCreator
        ? `${orderId}_${senderId}_${receiverId}`
        : `${orderId}_${receiverId}_${senderId}`;

      console.log(`📡 About to emit to room ${roomId}, messageData:`, JSON.stringify(messageData, null, 2));

      // Emit to the specific private chat room only
      const emitResult = io.to(roomId).emit("receiveOrderMessage", messageData);
      console.log(`📡 Message emitted to private chat room ${roomId}, emit result: ${emitResult}`);

      // Check room occupancy for debugging
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      console.log(`🏠 Room ${roomId} has ${roomSockets ? roomSockets.size : 0} sockets`);

    } catch (error) {
      console.error('❌ Error sending order message:', error);
      socket.emit('message-error', 'Failed to send message');
    }
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

  // Join product chat rooms (separate room for each creator-accepted_user pair)
  socket.on('joinProductChat', async ({ productId, userId }) => {
    try {
      const product = await Product.findById(productId).populate('createdBy acceptedUsers.userId');
      if (!product) return socket.emit('join-error', 'Product not found');

      // Check if user is creator or accepted user
      const isCreator = product.createdBy._id.toString() === userId;
      const isAcceptedUser = product.acceptedUsers.some(u => u.userId._id.toString() === userId);

      if (!isCreator && !isAcceptedUser) {
        return socket.emit('join-error', 'You are not allowed to join this product chat');
      }

      // Join separate rooms for each chat pair
      if (isCreator) {
        // Creator joins a room with each accepted user
        product.acceptedUsers.forEach(acceptedUser => {
          const roomId = `${productId}_${userId}_${acceptedUser.userId._id}`;
          socket.join(roomId);
          console.log(`Creator ${userId} joined chat room ${roomId} with ${acceptedUser.userId._id}`);
        });
      } else {
        // Accepted user joins room with creator
        const roomId = `${productId}_${product.createdBy._id}_${userId}`;
        socket.join(roomId);
        console.log(`Accepted user ${userId} joined chat room ${roomId} with creator`);
      }

      socket.emit('joined-product-chat', { productId });
      console.log(`User ${userId} joined all relevant product chat rooms for product ${productId}`);
    } catch (err) {
      console.error('Error joining product chat:', err);
      socket.emit('join-error', 'Server error');
    }
  });

  // Join order chat rooms (separate room for each creator-accepted_user pair)
  socket.on('joinOrderChat', async ({ orderId, userId }) => {
    try {
      const order = await mongoose.model('Order').findById(orderId).populate('userId acceptedUsers.userId');
      if (!order) return socket.emit('join-error', 'Order not found');

      // Check if user is creator or accepted user
      const isCreator = order.userId._id.toString() === userId;
      const isAcceptedUser = order.acceptedUsers.some(u => u.userId._id.toString() === userId);

      if (!isCreator && !isAcceptedUser) {
        return socket.emit('join-error', 'You are not allowed to join this order chat');
      }

      // Join separate rooms for each chat pair
      if (isCreator) {
        // Creator joins a room with each accepted user
        order.acceptedUsers.forEach(acceptedUser => {
          const roomId = `${orderId}_${userId}_${acceptedUser.userId._id}`;
          socket.join(roomId);
          console.log(`Creator ${userId} joined chat room ${roomId} with ${acceptedUser.userId._id}`);
        });
      } else {
        // Accepted user joins room with creator
        const roomId = `${orderId}_${order.userId._id}_${userId}`;
        socket.join(roomId);
        console.log(`Accepted user ${userId} joined chat room ${roomId} with creator`);
      }

      socket.emit('joined-order-chat', { orderId });
      console.log(`User ${userId} joined all relevant order chat rooms for order ${orderId}`);
    } catch (err) {
      console.error('Error joining order chat:', err);
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
    console.log(`📊 Online users count after disconnect: ${io.sockets.sockets.size}`);
  });

  // Listen for message received confirmations (optional)
  socket.on("message-received-ack", ({ messageId, userId }) => {
    console.log(`📨 Message ${messageId} received acknowledgment from user ${userId}`);
  });
});

server.listen(3001, () => {
  console.log('🚀 Socket.IO server listening on *:3001');
});

export default { io, server, app };
