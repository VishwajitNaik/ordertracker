import express from 'express';
import mongoose from 'mongoose';
import SubItem from '../models/subItems.js';
import protectRoute from '../src/middleware/authMiddleware.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configure multer for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'subitems',
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

router.post('/addsubitem', protectRoute, uploadFields, async (req, res) => {
    try {
        console.log('Sub-item creation request received');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        const { name, description, quantity, Price, category, brand, model, parentItemId } = req.body;

        // Validate required fields
        if (!name || !description || !quantity || !Price || !category || !brand || !model || !parentItemId) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if parent item exists and user owns it
        const Item = mongoose.model('Item');
        const parentItem = await Item.findById(parentItemId);
        if (!parentItem) {
            return res.status(404).json({ message: 'Parent item not found' });
        }

        // Check if user owns the parent item
        if (parentItem.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to add sub-items to this item' });
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

        const newSubItem = new SubItem({
            name,
            description,
            quantity: Number(quantity),
            Price: Number(Price),
            category,
            images: imageUrls,
            brand,
            model,
            parentItemId,
            createdBy: req.user._id
        });

        const savedSubItem = await newSubItem.save();
        console.log('Sub-item saved successfully:', savedSubItem);
        res.status(201).json(savedSubItem);
    } catch (error) {
        console.error('Error adding sub-item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', async (req, res) => {
    try {
        const subItems = await SubItem.find().populate('createdBy', 'username email');
        if (subItems.length === 0) {
            return res.status(404).json({ message: 'No sub-items found' });
        }
        res.status(200).json(subItems);
    } catch (error) {
        console.error('Error fetching sub-items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/byParent/:parentId', async (req, res) => {
    try {
        const { parentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ message: 'Invalid parent item ID' });
        }
        const subItems = await SubItem.find({
            parentItemId: parentId,
            isAvailable: true,
            quantity: { $gt: 0 }
        }).populate('createdBy', 'username email');
        res.status(200).json(subItems);
    } catch (error) {
        console.error('Error fetching sub-items by parent:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get("/getAllUserSide", async (req, res) => {
    try {
        const subItems = await SubItem.find().sort({ createdAt: -1 }).populate('createdBy', 'username email'); // Sort by creation date descending
        if (subItems.length === 0) {
            return res.status(404).json({ message: 'No sub-items found' });
        }
        res.status(200).json(subItems);
    } catch (error) {
        console.error('Error fetching sub-items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const identifier = decodeURIComponent(req.params.id);
        let subItem;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            subItem = await SubItem.findById(identifier).populate('createdBy', 'username email');
        } else {
            subItem = await SubItem.findOne({ name: identifier }).populate('createdBy', 'username email');
        }
        if (!subItem) {
            return res.status(404).json({ message: 'Sub-item not found' });
        }
        res.status(200).json(subItem);
    } catch (error) {
        console.error('Error fetching sub-item:', error);
        res.status(500).json({ message: 'Server error' });
    }
})

// Update sub-item
router.put('/:id', protectRoute, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid sub-item ID' });
        }

        const subItem = await SubItem.findById(id);
        if (!subItem) {
            return res.status(404).json({ message: 'Sub-item not found' });
        }

        // Check if user owns this sub-item
        if (subItem.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this sub-item' });
        }

        const updatedSubItem = await SubItem.findByIdAndUpdate(id, updates, { new: true });
        res.status(200).json(updatedSubItem);
    } catch (error) {
        console.error('Error updating sub-item:', error);
        res.status(500).json({ message: 'Server error' });
    }
})

export default router;
