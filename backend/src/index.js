import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from 'cloudinary';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from "../routes/authRoutes.js";
import productRoutes from "../routes/productRoute.js";
import shopRoutes from "../routes/addShop.js";
import itemRoutes from "../routes/addItems.js";
import subItemRoutes from "../routes/addSubItems.js";
import cartRoutes from "../routes/cartRoutes.js";
import cartHistoryRoutes from "../routes/cartHistoryRoutes.js";
import checkoutRoutes from "../routes/checkoutRoutes.js";
import veichelRoutes from "../routes/addVeichel.js";
import TravelRoutes from "../routes/addTravel.js";
import messageRoutes from "../routes/messageRoutes.js";
import userDetailsRoutes from "../routes/userDetails.js";
import job from "../lib/corn.js";
import { connectDB } from "../lib/db.js";
import Message from "../models/Message.js";
import Product from "../models/Product.js";

dotenv.config();

// Check for required Cloudinary environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Cloudinary environment variables are not set. Please check your .env file.');
  process.exit(1);
}

// Configure Cloudinary after dotenv
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8081",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:8081',
  credentials: true
}));

job.start();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/items", (req, res, next) => {
  console.log(`Items route accessed: ${req.method} ${req.path}`);
  next();
}, itemRoutes);
app.use("/api/subitems", subItemRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/cart-history", cartHistoryRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/veichels", veichelRoutes);
app.use("/api/travels", TravelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/userdetails", userDetailsRoutes);
console.log('Veichel routes mounted at /api/veichels');
console.log('Message routes mounted at /api/messages');
console.log('User details routes mounted at /api/userdetails');

// ✅ Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('🔌 Socket.IO client connected:', socket.id);

  socket.on("chat", (data) => {
    console.log("📨 Received chat:", data);
    io.emit("chat", data); // broadcast to all
  });

  socket.on('joinProductChat', async ({ productId, userId }) => {
    try {
      console.log('🔗 joinProductChat event received:', { productId, userId });
      const product = await Product.findById(productId).populate('createdBy acceptedUsers.userId');
      if (!product) {
        console.log('❌ Product not found');
        return socket.emit('join-error', 'Product not found');
      }

      const allowed = product.createdBy._id.toString() === userId ||
        product.acceptedUsers.some(u => u.userId._id.toString() === userId);

      console.log('✅ User allowed to join:', allowed);
      if (!allowed) return socket.emit('join-error', 'You are not allowed to join this room');

      socket.join(productId);
      socket.emit('joined-product-chat', { productId });
      console.log(`✅ User ${userId} joined product room ${productId}`);
    } catch (err) {
      console.error('❌ Error joining product room:', err);
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

  socket.on('sendMessage', async ({ productId, receiverId, message, senderId, username }) => {
    try {
      console.log('📨 sendMessage event received:', { productId, receiverId, message, senderId, username });
      const roomId = `${productId}_${receiverId}`;

      // Find the accepted user and push message to their messages array
      const updateResult = await Product.findOneAndUpdate(
        { _id: productId, 'acceptedUsers.userId': receiverId },
        {
          $push: {
            'acceptedUsers.$.messages': {
              senderId,
              username,
              message,
              timestamp: new Date()
            }
          }
        }
      );
      console.log('💾 Message saved to database:', updateResult ? 'success' : 'failed');
      if (!updateResult) {
        console.log('❌ No document found to update. Checking product and accepted users...');
        const product = await Product.findById(productId).populate('acceptedUsers.userId');
        console.log('Product found:', !!product);
        if (product) {
          console.log('Accepted users:', product.acceptedUsers.map(u => ({ id: u.userId._id.toString(), username: u.userId.username })));
          console.log('Looking for receiverId:', receiverId);
        }
      }

      // Emit to all users in the room including sender
      io.to(roomId).emit('receiveMessage', {
        message,
        senderId,
        username,
        receiverId,
        productId,
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

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  console.error('Error stack:', error.stack);
  console.error('Request:', req.method, req.url);

  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Return JSON error response
  res.status(500).json({
    message: 'Internal server error',
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// ✅ Start server & DB
connectDB();
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Express server running on http://0.0.0.0:${port}`); // or use localhost
});

// Start Socket.IO server
import('../lib/sockit.js').then(() => {
  console.log('Socket.IO server started on port 3001');
});
