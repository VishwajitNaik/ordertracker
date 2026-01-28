import mongoose from "mongoose";
import Travel from "../models/travel.js";
import Vehicle from "../models/Veichel.js";
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
        const travels = await Travel.find({ createdBy: req.user._id }).populate('createdBy', 'username').populate('requestedUsers.userId', 'username').populate('requestedUsers.productId', 'Title');
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
      .populate('requestedUsers.productId', 'Title')
      .sort({ createdAt: -1 }); // Sort by creation date descending
    res.status(200).json(travels);
  } catch (error) {
    console.error("Error fetching travel entries:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('vehicleId', 'vehicleImages vehicleType vehicleNumber')
      .populate('requestedUsers.userId', 'username')
      .populate('requestedUsers.productId', 'Title');
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
    const { productId, price } = req.body;
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).json({ message: 'Travel not found' });

    // Check if user already requested
    const existingRequest = travel.requestedUsers.find(
      req => req.userId.toString() === req.user._id.toString() && req.productId.toString() === productId
    );
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    travel.requestedUsers.push({
      userId: req.user._id,
      productId,
      price: parseFloat(price),
      status: 'pending'
    });

    await travel.save();
    res.json({ message: 'Request sent successfully', travel });
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept Request
router.patch('/:id/accept-request', protectRoute, async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).json({ message: 'Travel not found' });
    if (travel.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const request = travel.requestedUsers.find(
      req => req.userId.toString() === userId && req.productId.toString() === productId
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'accepted';
    await travel.save();
    res.json({ message: 'Request accepted', travel });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.id);
    let travel;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      travel = await Travel.findById(identifier);
    } else {
      travel = await Travel.findOne({ veichelType: identifier });
    }

    if (!travel) {
      return res.status(404).json({ message: "Travel entry not found" });
    }
    res.status(200).json(travel);
  } catch (error) {
    console.error("Error fetching travel entry:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;