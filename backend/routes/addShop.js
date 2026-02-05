import express from 'express';
import mongoose from 'mongoose';
import Shop from '../models/shop.js';
import { Address } from '../models/UserDetails.js';
import protectRoute from '../src/middleware/authMiddleware.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configure multer for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shops',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

const upload = multer({ storage: storage });

// Middleware for up to 3 images
const uploadFields = upload.fields([
  { name: 'images', maxCount: 3 }
]);

const router = express.Router();

router.post('/shop', protectRoute, uploadFields, async (req, res) => {
    try {
        console.log('Shop creation request received');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        const { name, shopType, location, openingTime, closingTime, status } = req.body;

        // Validate required fields
        if (!name || !shopType || !location || !openingTime || !closingTime) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Validate that location is a valid ObjectId reference
        if (!mongoose.Types.ObjectId.isValid(location)) {
            return res.status(400).json({ message: 'Invalid address reference' });
        }

        // Verify that the address exists and belongs to the user
        const address = await Address.findById(location);

        if (!address) {
            return res.status(400).json({ message: 'Invalid address reference' });
        }

        if (address.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only use your own addresses' });
        }

        // Get uploaded image URLs
        let imageUrls = [];
        if (req.files && req.files.images) {
            console.log('Processing images:', req.files.images.length);
            imageUrls = req.files.images.map(file => {
                console.log('Image file path:', file.path);
                return file.path;
            });
        } else {
            console.log('No images found in req.files');
        }

        console.log('Final image URLs:', imageUrls);

        // Create new shop
        const newShop = new Shop({
            name,
            shopType,
            images: imageUrls,
            location,
            openingTime,
            closingTime,
            status,
            owner: req.user._id
        });

        // Save shop to database
        const savedShop = await newShop.save();
        console.log('Shop saved successfully:', savedShop);
        res.status(201).json(savedShop);
    } catch (error) {
        console.error('Error adding shop:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', protectRoute, async (req, res) => {
    try {
        const shops = await Shop.find({ owner: req.user._id }).populate('owner', 'username email').populate('location'); // Filter by owner and populate owner and location details
        res.status(200).json(shops);
    } catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/getAllUserSide', async (req, res) => {
    try {
        const shops = await Shop.find().sort({ createdAt: -1 }).populate('owner', 'username email').populate('location'); // Sort by creation date descending
        res.status(200).json(shops);
    } catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all shops with pagination - MUST come before /:id route
router.get('/all', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalShops = await Shop.countDocuments();

        // Get paginated shops
        const shops = await Shop.find()
            .sort({ createdAt: -1 })
            .populate('owner', 'username email')
            .populate('location')
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalShops / limit);

        res.status(200).json({
            shops,
            pagination: {
                currentPage: page,
                totalPages,
                totalShops,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching all shops:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const identifier = decodeURIComponent(req.params.id);
        let shop;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            shop = await Shop.findById(identifier).populate('owner', 'username email').populate('location');
        } else {
            shop = await Shop.findOne({ name: identifier }).populate('owner', 'username email').populate('location');
        }
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        res.status(200).json(shop);
    } catch (error) {
        console.error('Error fetching shop:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
