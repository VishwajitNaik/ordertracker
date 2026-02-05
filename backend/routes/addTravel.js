import mongoose from "mongoose";
import Travel from "../models/travel.js";
import Vehicle from "../models/Veichel.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import express from "express";
import protectRoute from "../src/middleware/authMiddleware.js";

const router = express.Router();

router.post("/addtravel", protectRoute, async (req, res) => {
  try {
    const { vehicleId, veichelType, from, to, date, gotime, arrivaltime } = req.body;

    // Validate required fields
    if (!veichelType || !from || !to || !date || !gotime || !arrivaltime) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Verify vehicle exists and belongs to user if vehicleId is provided
    if (vehicleId) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, createdBy: req.user._id });
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found or not owned by user" });
      }
    }

    // Create new travel entry
    const newTravel = new Travel({
      vehicleId,
      veichelType,
      from,
      to,
      date,
      gotime,
      arrivaltime,
      createdBy: req.user._id,
    });

    // Save travel entry to database
    const savedTravel = await newTravel.save();
    res.status(201).json(savedTravel);
  } catch (error) {
    console.error("Error adding travel entry:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", protectRoute, async (req, res) => {
    try {
        const travels = await Travel.find({ createdBy: req.user._id })
          .populate('createdBy', 'username')
          .populate('requestedUsers.userId', 'username')
          .populate('requestedUsers.fromUserId', 'username')
          .populate('requestedUsers.toUserId', 'username')
          .populate('requestedUsers.productId', 'Title')
          .populate('requestedUsers.orderId', 'orderId totalAmount finalAmount');
        res.status(200).json(travels);
    } catch (error) {
        console.error("Error fetching travel entries:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/getAllUserSide", async (req, res) => {
  try {
    const travels = await Travel.find()
      .populate('createdBy', 'username')
      .populate('vehicleId', 'vehicleImages vehicleType vehicleNumber')
      .populate('requestedUsers.userId', 'username')
      .populate('requestedUsers.fromUserId', 'username')
      .populate('requestedUsers.toUserId', 'username')
      .populate('requestedUsers.productId', 'Title')
      .populate('requestedUsers.orderId', 'orderId totalAmount finalAmount')
      .sort({ createdAt: -1 }); // Sort by creation date descending
    res.status(200).json(travels);
  } catch (error) {
    console.error("Error fetching travel entries:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Travel by ID
router.get("/:id", async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('vehicleId', 'vehicleImages vehicleType vehicleNumber')
      .populate('requestedUsers.userId', 'username')
      .populate('requestedUsers.fromUserId', 'username')
      .populate('requestedUsers.toUserId', 'username')
      .populate('requestedUsers.productId', 'Title')
      .populate('requestedUsers.orderId', 'orderId totalAmount finalAmount');
    if (!travel) {
      return res.status(404).json({ message: "Travel not found" });
    }
    res.status(200).json(travel);
  } catch (error) {
    console.error("Error fetching travel:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start Travel
router.patch('/:id/start', protectRoute, async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).json({ message: 'Travel not found' });
    if (travel.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (travel.status !== 'scheduled') {
      return res.status(400).json({ message: 'Travel already started or completed' });
    }
    travel.status = 'started';
    await travel.save();
    res.json({ message: 'Travel started', travel });
  } catch (error) {
    console.error('Error starting travel:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End Travel
router.patch('/:id/end', protectRoute, async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).json({ message: 'Travel not found' });
    if (travel.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (travel.status !== 'started') {
      return res.status(400).json({ message: 'Travel not started yet' });
    }
    travel.status = 'completed';
    await travel.save();
    res.json({ message: 'Travel completed', travel });
  } catch (error) {
    console.error('Error ending travel:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send Request to Travel
router.post('/:id/request', protectRoute, async (req, res) => {
  try {
    const { productId, orderId, price, message } = req.body;
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).json({ message: 'Travel not found' });

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Determine request type and validate
    let requestType;
    let itemId;
    
    if (productId) {
      requestType = 'product';
      itemId = productId;
      
      // Check if user already requested this product for this travel
      const existingRequest = travel.requestedUsers && travel.requestedUsers.find(
        request => request && request.userId && request.userId.toString() === req.user._id.toString() && 
                 request.productId && request.productId.toString() === productId
      );
      if (existingRequest) {
        return res.status(400).json({ message: 'Request already sent for this product' });
      }
    } else if (orderId) {
      requestType = 'order';
      itemId = orderId;
      
      // Check if user already requested this order for this travel
      const existingRequest = travel.requestedUsers && travel.requestedUsers.find(
        request => request && request.userId && request.userId.toString() === req.user._id.toString() && 
                 request.orderId && request.orderId.toString() === orderId
      );
      if (existingRequest) {
        return res.status(400).json({ message: 'Request already sent for this order' });
      }
    } else {
      return res.status(400).json({ message: 'Either productId or orderId is required' });
    }

    // Build request object based on type
    const requestObj = {
      userId: req.user._id,
      fromUserId: req.user._id, // User who sent the request
      toUserId: travel.createdBy, // Travel owner who received the request
      price: parseFloat(price),
      message: message || '',
      status: 'pending',
      requestType
    };

    if (requestType === 'product') {
      requestObj.productId = productId;
    } else {
      requestObj.orderId = orderId;
    }

    travel.requestedUsers.push(requestObj);
    await travel.save();

    // Update the product/order status to 'pending' (requested)
    if (requestType === 'product') {
      await Product.findByIdAndUpdate(productId, { status: 'pending' });
    } else {
      await Order.findByIdAndUpdate(orderId, { deliveryStatus: 'accepted' });
    }

    res.json({
      message: `Your delivery request has been sent successfully for ${requestType}!`,
      travel
    });
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept Request
router.patch('/:id/accept-request', protectRoute, async (req, res) => {
  try {
    const { userId, productId, orderId, tentativeTime, vehicleType, price } = req.body;
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).json({ message: 'Travel not found' });
    if (travel.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Find the request by productId or orderId
    const request = travel.requestedUsers.find(
      req => (productId && req.productId && req.productId.toString() === productId) ||
             (orderId && req.orderId && req.orderId.toString() === orderId)
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // Update travel request status
    request.status = 'accepted';
    await travel.save();

    // Provide fallback values for required fields
    const finalVehicleType = vehicleType || travel.vehicleId?.vehicleType || travel.veichelType || 'Not specified';
    const finalTentativeTime = tentativeTime || travel.arrivaltime || 'Not specified';

    // Update product or order based on request type
    if (request.requestType === 'product' && productId) {
      const product = await Product.findById(productId);
      if (product) {
        // Check if travel owner is already in acceptedUsers
        const alreadyAccepted = product.acceptedUsers?.some(
          (u) => u.userId.toString() === userId
        );
        
        if (!alreadyAccepted) {
          product.acceptedUsers = product.acceptedUsers || [];
          product.acceptedUsers.push({
            userId: userId, // This is the travel owner accepting the request
            vehicleType: finalVehicleType,
            tentativeTime: finalTentativeTime,
            price: price || request.price,
            status: 'accepted'
          });
          product.status = 'accepted';
          await product.save();
        }
      }
      res.json({ message: 'Request accepted', travel, product });
    } else if (request.requestType === 'order' && orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        // Check if travel owner is already in acceptedUsers
        const alreadyAccepted = order.acceptedUsers?.some(
          (u) => u.userId.toString() === userId
        );
        
        if (!alreadyAccepted) {
          order.acceptedUsers = order.acceptedUsers || [];
          order.acceptedUsers.push({
            userId: userId, // This is the travel owner accepting the request
            vehicleType: finalVehicleType,
            tentativeTime: finalTentativeTime,
            price: price || request.price,
            status: 'accepted'
          });
          order.deliveryStatus = 'accepted';
          await order.save();
        }
      }
      res.json({ message: 'Request accepted', travel, order });
    } else {
      res.status(400).json({ message: 'Invalid request type' });
    }
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;