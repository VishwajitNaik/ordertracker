import express from 'express';
import { UserDetails, Address, DailyRoute } from '../models/UserDetails.js';
import protectRoute from '../src/middleware/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/userdetails', protectRoute, async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ message: 'Phone is required' });
        }

        // Check if user details already exist
        const existingDetails = await UserDetails.findOne({ createdBy: req.user._id });
        if (existingDetails) {
            return res.status(400).json({ message: 'User details already exist' });
        }

        const newUserDetails = new UserDetails({
            phone,
            createdBy: req.user._id
        });

        const savedUserDetails = await newUserDetails.save();
        res.status(201).json(savedUserDetails);
    } catch (error) {
        console.error('Error adding user details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Address routes
router.get('/addresses/:userId', protectRoute, async (req, res) => {
    try {
        const { userId } = req.params;

        // Allow users to view their own addresses or admins to view any
        if (req.user._id.toString() !== userId && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const addresses = await Address.find({ createdBy: userId }).sort({ isDefault: -1, createdAt: -1 });
        res.status(200).json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single address by ID (Public endpoint - no authentication required)
router.get('/addresses/public/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find the address by ID
        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Return address details without authentication check
        res.status(200).json(address);
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single address by ID (Authenticated endpoint - for user's own addresses)
router.get('/addresses/single/:id', protectRoute, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the address by ID
        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Allow users to view their own addresses or admins to view any
        if (req.user._id.toString() !== address.createdBy.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.status(200).json(address);
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/addresses', protectRoute, async (req, res) => {
    try {
        console.log('Address creation request received:', req.body);
        const { label, address, city, state, zipCode, isDefault, lat, lng } = req.body;

        console.log('Parsed body:', { label, address, city, state, zipCode, isDefault, lat, lng });

        if (!address || !city || !state || !zipCode) {
            console.log('Validation failed: missing required fields');
            return res.status(400).json({ message: 'Address, city, state, and zip code are required' });
        }

        if (lat === undefined || lng === undefined) {
            console.log('Validation failed: missing coordinates');
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        // If setting as default, unset other defaults for this user
        if (isDefault) {
            await Address.updateMany(
                { createdBy: req.user._id },
                { isDefault: false }
            );
        }

        const newAddress = new Address({
            label: label || 'Home',
            address,
            city,
            state,
            zipCode,
            lat,
            lng,
            isDefault: isDefault || false,
            createdBy: req.user._id
        });

        const savedAddress = await newAddress.save();
        const populatedAddress = await Address.findById(savedAddress._id);
        res.status(201).json(populatedAddress);
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/addresses/:id', protectRoute, async (req, res) => {
    try {
        const { id } = req.params;
        const { label, address, city, state, zipCode, isDefault, lat, lng } = req.body;

        const addressDoc = await Address.findById(id);
        if (!addressDoc) {
            return res.status(404).json({ message: 'Address not found' });
        }

        if (addressDoc.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // If setting as default, unset other defaults for this user
        if (isDefault) {
            await Address.updateMany(
                { createdBy: req.user._id, _id: { $ne: id } },
                { isDefault: false }
            );
        }

        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            {
                label: label || addressDoc.label,
                address: address || addressDoc.address,
                city: city || addressDoc.city,
                state: state || addressDoc.state,
                zipCode: zipCode || addressDoc.zipCode,
                lat: lat !== undefined ? lat : addressDoc.lat,
                lng: lng !== undefined ? lng : addressDoc.lng,
                isDefault: isDefault !== undefined ? isDefault : addressDoc.isDefault
            },
            { new: true }
        );

        res.status(200).json(updatedAddress);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/addresses/:id', protectRoute, async (req, res) => {
    try {
        const { id } = req.params;

        const addressDoc = await Address.findById(id);
        if (!addressDoc) {
            return res.status(404).json({ message: 'Address not found' });
        }

        if (addressDoc.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Address.findByIdAndDelete(id);
        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const identifier = req.params.id;
        let userDetails;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            userDetails = await UserDetails.findOne({ createdBy: identifier }).populate('createdBy', 'username profileImage');
        } else {
            return res.status(400).json({ message: 'Invalid identifier' });
        }

        // Return null if user details not found (not an error, just no details exist yet)
        res.status(200).json(userDetails);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Daily Route routes
router.get('/daily-routes/:userId', protectRoute, async (req, res) => {
    try {
        const { userId } = req.params;

        // Allow users to view their own routes or admins to view any
        if (req.user._id.toString() !== userId && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const routes = await DailyRoute.find({ createdBy: userId, isActive: true })
            .populate('from', 'label address city state zipCode')
            .populate('to', 'label address city state zipCode')
            .sort({ createdAt: -1 });
        res.status(200).json(routes);
    } catch (error) {
        console.error('Error fetching daily routes:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/daily-routes', protectRoute, async (req, res) => {
    try {
        const { from, to, days, goTime, arrivalTime } = req.body;

        if (!from || !to || !days || !goTime || !arrivalTime) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!Array.isArray(days) || days.length === 0) {
            return res.status(400).json({ message: 'At least one day must be selected' });
        }

        // Verify that the addresses belong to the user
        const fromAddress = await Address.findOne({ _id: from, createdBy: req.user._id });
        const toAddress = await Address.findOne({ _id: to, createdBy: req.user._id });

        if (!fromAddress || !toAddress) {
            return res.status(400).json({ message: 'Invalid addresses selected' });
        }

        const newRoute = new DailyRoute({
            from,
            to,
            days,
            goTime,
            arrivalTime,
            createdBy: req.user._id
        });

        const savedRoute = await newRoute.save();
        const populatedRoute = await DailyRoute.findById(savedRoute._id)
            .populate('from', 'label address city state zipCode')
            .populate('to', 'label address city state zipCode');

        res.status(201).json(populatedRoute);
    } catch (error) {
        console.error('Error creating daily route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/daily-routes/:id', protectRoute, async (req, res) => {
    try {
        const { id } = req.params;
        const { from, to, days, goTime, arrivalTime, isActive } = req.body;

        const route = await DailyRoute.findById(id);
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        if (route.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Verify addresses if they're being updated
        if (from) {
            const fromAddress = await Address.findOne({ _id: from, createdBy: req.user._id });
            if (!fromAddress) {
                return res.status(400).json({ message: 'Invalid from address' });
            }
        }

        if (to) {
            const toAddress = await Address.findOne({ _id: to, createdBy: req.user._id });
            if (!toAddress) {
                return res.status(400).json({ message: 'Invalid to address' });
            }
        }

        const updatedRoute = await DailyRoute.findByIdAndUpdate(
            id,
            {
                from: from || route.from,
                to: to || route.to,
                days: days || route.days,
                goTime: goTime || route.goTime,
                arrivalTime: arrivalTime || route.arrivalTime,
                isActive: isActive !== undefined ? isActive : route.isActive
            },
            { new: true }
        ).populate('from', 'label address city state zipCode')
         .populate('to', 'label address city state zipCode');

        res.status(200).json(updatedRoute);
    } catch (error) {
        console.error('Error updating daily route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/daily-routes/:id', protectRoute, async (req, res) => {
    try {
        const { id } = req.params;

        const route = await DailyRoute.findById(id);
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        if (route.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await DailyRoute.findByIdAndDelete(id);
        res.status(200).json({ message: 'Route deleted successfully' });
    } catch (error) {
        console.error('Error deleting daily route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;