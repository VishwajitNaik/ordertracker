import express from 'express';
import Message from '../models/Message.js';
import Product from '../models/Product.js';

const router = express.Router();

// Save product chat message
router.post('/product-chat', async (req, res) => {
  try {
    const { productId, senderId, receiverId, message, roomId, timestamp } = req.body;

    const newMessage = new Message({
      productId,
      senderId,
      receiverId,
      message,
      roomId,
      createdAt: timestamp || new Date()
    });

    const savedMessage = await newMessage.save();
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'username profileImage')
      .populate('receiverId', 'username profileImage');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Get messages for a specific room
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId })
      .populate('senderId', 'username profileImage')
      .populate('receiverId', 'username profileImage')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark messages as read
router.put('/mark-read', async (req, res) => {
  try {
    const { messageIds, readerId } = req.body;

    await Message.updateMany(
      { _id: { $in: messageIds }, receiverId: readerId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count for a user in a product
router.get('/unread/:productId/:userId', async (req, res) => {
  try {
    const { productId, userId } = req.params;

    const unreadCount = await Message.countDocuments({
      productId,
      receiverId: userId,
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Get direct messages between two users
router.get('/direct/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    // Find messages where either user is sender/receiver
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ],
      productId: null // Only direct messages
    })
      .populate('senderId', 'username profileImage')
      .populate('receiverId', 'username profileImage')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ error: 'Failed to fetch direct messages' });
  }
});

// Mark direct messages as read between two users
router.put('/direct/mark-read/:senderId/:receiverId', async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    await Message.updateMany(
      { senderId, receiverId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking direct messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get online users (this would need to be integrated with Socket.IO)
router.get('/online-users', async (req, res) => {
  // This is a placeholder - you'd need to get online users from Socket.IO
  // For now, just return a placeholder response
  res.json({
    message: "Online users endpoint - needs Socket.IO integration",
    onlineCount: 0,
    users: []
  });
});

export default router;
