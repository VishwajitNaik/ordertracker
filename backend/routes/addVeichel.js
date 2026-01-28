import express from "express";
import mongoose from "mongoose";
import Vehicle from "../models/Veichel.js";
import protectRoute from "../src/middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Configure multer for multiple optional file uploads
const vehicleUpload = upload.fields([
  { name: 'drivingLicenseFrontImage', maxCount: 1 },
  { name: 'drivingLicenseBackImage', maxCount: 1 },
  { name: 'rcImage', maxCount: 1 },
  { name: 'insuranceImage', maxCount: 1 },
  { name: 'pucImage', maxCount: 1 },
  { name: 'vehicleImages', maxCount: 5 } // Allow up to 5 vehicle images
]);

router.post('/addveichel', protectRoute, (req, res, next) => {
  vehicleUpload(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    next();
  });
}, async (req, res) => {
    console.log('Vehicle add route called with body:', req.body);
    console.log('Files:', req.files);
    try {
        const {
          vehicleType,
          vehicleNumber,
          vehicleBrand,
          vehicleModel,
          vehicleYear,
          vehicleColor,
          capacityKg,
          seatCapacity,
          fuelType,
          drivingLicenseNumber,
          licenseExpiryDate,
          rcNumber,
          rcExpiryDate,
          insuranceNumber,
          insuranceExpiryDate,
          pucNumber,
          pucExpiryDate
        } = req.body;

        // Validate required fields
        if (!vehicleType || !vehicleNumber || !drivingLicenseNumber) {
            return res.status(400).json({ message: 'Please provide all required fields: vehicleType, vehicleNumber, drivingLicenseNumber' });
        }

        // Extract uploaded file URLs
        const drivingLicenseFrontImage = req.files?.drivingLicenseFrontImage?.[0]?.path;
        const drivingLicenseBackImage = req.files?.drivingLicenseBackImage?.[0]?.path;
        const rcImage = req.files?.rcImage?.[0]?.path;
        const insuranceImage = req.files?.insuranceImage?.[0]?.path;
        const pucImage = req.files?.pucImage?.[0]?.path;
        const vehicleImages = req.files?.vehicleImages?.map(file => file.path) || [];

        // Helper to parse date safely
        const parseDate = (dateStr) => {
            if (!dateStr) return undefined;
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? undefined : date;
        };

        // Helper to parse number safely
        const parseNumber = (numStr) => {
            if (!numStr || numStr === '') return undefined;
            const num = parseInt(numStr);
            return isNaN(num) ? undefined : num;
        };

        // Create new vehicle
        const vehicleData = {
           vehicleType,
           vehicleNumber,
           vehicleBrand,
           vehicleModel,
           vehicleYear: parseNumber(vehicleYear),
           vehicleColor,
           capacityKg: parseNumber(capacityKg),
           seatCapacity: parseNumber(seatCapacity),
           fuelType,
           drivingLicenseNumber,
           drivingLicenseFrontImage,
           drivingLicenseBackImage,
           licenseExpiryDate: parseDate(licenseExpiryDate),
           rcNumber,
           rcImage,
           rcExpiryDate: parseDate(rcExpiryDate),
           insuranceNumber,
           insuranceImage,
           insuranceExpiryDate: parseDate(insuranceExpiryDate),
           pucNumber,
           pucImage,
           pucExpiryDate: parseDate(pucExpiryDate),
           vehicleImages,
           createdBy: req.user._id
        };
        console.log('Vehicle data to save:', vehicleData);

        const newVehicle = new Vehicle(vehicleData);

        // Save vehicle to database
        const savedVehicle = await newVehicle.save();
        res.status(201).json(savedVehicle);
    } catch (error) {
        console.error('Error adding vehicle:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', protectRoute, async (req, res) => {
    try {
        console.log('Fetching vehicles for user:', req.user._id);
        const vehicles = await Vehicle.find({ createdBy: req.user._id }).populate('createdBy', 'username');
        console.log('Found vehicles:', vehicles.length);
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const identifier = decodeURIComponent(req.params.id);
        let vehicle;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            vehicle = await Vehicle.findById(identifier).populate('createdBy', 'username');
        } else {
            vehicle = await Vehicle.findOne({ vehicleNumber: identifier }).populate('createdBy', 'username');
        }

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.status(200).json(vehicle);
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
