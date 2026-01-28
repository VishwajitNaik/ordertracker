import express from 'express';
import mongoose from 'mongoose';
import Item from '../models/Items.js';
import protectRoute from '../src/middleware/authMiddleware.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configure multer for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'items',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

const upload = multer({ storage: storage });

// Middleware for up to 3 images
const uploadFields = upload.fields([
  { name: 'images', maxCount: 3 }
]);

const router = express.Router();

router.post('/additem', protectRoute, uploadFields, async (req, res) => {
    console.log('Route handler reached - protectRoute and uploadFields passed');
    try {
        console.log('Item creation request received');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        const { name, description, quantity, MinPrice, MaxPrice, category, brand, model, shop_id } = req.body;

        console.log('Extracted shop_id:', shop_id);
        console.log('Shop_id type:', typeof shop_id);
        console.log('Shop_id is valid ObjectId:', mongoose.Types.ObjectId.isValid(shop_id));

        // Validate required fields
        if (!name || !description || !quantity || !MinPrice || !MaxPrice || !category || !shop_id) {
            console.log('Missing required fields:', { name, description, quantity, MinPrice, MaxPrice, category, shop_id });
            return res.status(400).json({ message: 'Please provide all required fields including shop_id' });
        }

        // Validate shop_id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(shop_id)) {
            return res.status(400).json({ message: 'Invalid shop_id format' });
        }

        // Check if shop exists and user owns it
        const Shop = mongoose.model('Shop');
        const shopExists = await Shop.findById(shop_id);
        if (!shopExists) {
            return res.status(400).json({ message: 'Shop not found' });
        }

        // Check if user owns the shop
        if (shopExists.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to add items to this shop' });
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
            return res.status(400).json({ message: 'Please upload at least one image' });
        }

        console.log('Final image URLs:', imageUrls);

        // Create new item
        const newItem = new Item({
            name,
            description,
            quantity: Number(quantity),
            MinPrice: Number(MinPrice),
            MaxPrice: Number(MaxPrice),
            category,
            images: imageUrls,
            brand,
            model,
            createdBy: req.user._id,
            shop_id: shop_id
        });

        // Save item to database
        console.log('Attempting to save item to database...');
        const savedItem = await newItem.save();
        console.log('Item saved successfully:', savedItem);
        res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error adding item:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // Return specific error message based on error type
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error', details: error.message });
        } else if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid data format', details: error.message });
        } else {
            return res.status(500).json({ message: 'Server error', details: error.message });
        }
    }
});

router.get('/', async (req, res) => {
    try {
        const items = await Item.find().populate('createdBy', 'username email'); // Populate creator details
        if (items.length === 0) {
            return res.status(404).json({ message: 'No items found' });
        }
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get("/getAllUserSide", async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 }).populate('createdBy', 'username email').populate('shop_id', 'name location'); // Sort by creation date descending
        if (items.length === 0) {
            return res.status(404).json({ message: 'No items found' });
        }
        console.log("all items fetching", items);

        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get items for a specific shop - only items created by the shop owner
router.get("/shop/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;

        // First get the shop to find the owner
        const Shop = mongoose.model('Shop');
        const shop = await Shop.findById(shopId);

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // Find items where shop_id matches AND createdBy matches the shop owner
        console.log(`Shop ${shopId} owner:`, shop.owner);
        console.log(`Shop owner type:`, typeof shop.owner);

        const items = await Item.find({
            shop_id: shopId,
            createdBy: shop.owner
        }).sort({ createdAt: -1 }).populate('createdBy', 'username email').populate('shop_id', 'name location');

        console.log(`Items for shop ${shopId} (owner: ${shop.owner}):`, items.length);
        console.log('Found items:', items.map(item => ({ id: item._id, createdBy: item.createdBy, shop_id: item.shop_id })));

        // Also check total items for this shop_id regardless of owner
        const allShopItems = await Item.find({ shop_id: shopId });
        console.log(`Total items for shop ${shopId}:`, allShopItems.length);
        console.log('All shop items:', allShopItems.map(item => ({ id: item._id, createdBy: item.createdBy, shop_id: item.shop_id })));

        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching shop items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const identifier = decodeURIComponent(req.params.id);
        let item;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            item = await Item.findById(identifier).populate('createdBy', 'username email');
        } else {
            item = await Item.findOne({ name: identifier }).populate('createdBy', 'username email');
        }
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
