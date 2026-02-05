import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import SubItem from '../models/subItems.js';
import Shop from '../models/shop.js';
import { Address } from '../models/UserDetails.js';
import protectRoute from '../src/middleware/authMiddleware.js';

const router = express.Router();

// Function to get Razorpay instance (initialized on demand)
const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        console.error('Razorpay environment variables not found. Please check your .env file.');
        throw new Error('Razorpay environment variables not configured');
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

// Create Razorpay order
router.post('/create-order', protectRoute, async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        const razorpay = getRazorpayInstance();
        // Convert to integer amount in paisa
        let finalAmount;
        
        if (Number.isInteger(amount) && amount < 10000) {
            // If amount is an integer and less than 10000, treat as rupees
            finalAmount = amount * 100;
        } else if (Number(amount) >= 100) {
            // If amount is >= 100, treat as paisa
            finalAmount = Math.floor(Number(amount));
        } else {
            // For other cases, ensure it's treated as rupees
            finalAmount = Math.floor(Number(amount) * 100);
        }
        
        const options = {
            amount: finalAmount, // Razorpay expects amount in paisa as integer
            currency,
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1, // Auto capture
        };

        const order = await razorpay.orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
});

// Verify payment and complete order
router.post('/verify-payment', protectRoute, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderData
        } = req.body;

        // Verify payment signature (skip for mock/test payments)
        const isMockPayment = razorpay_payment_id.startsWith('pay_') &&
                             razorpay_signature.startsWith('signature_');

        if (!isMockPayment) {
            const sign = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSign = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(sign.toString())
                .digest('hex');

            if (razorpay_signature !== expectedSign) {
                return res.status(400).json({ message: 'Payment verification failed' });
            }
        } else {
            console.log('Mock payment detected, skipping signature verification');
        }

        // Get user's cart
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate('items.subItemId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Validate stock and calculate amounts
        let totalAmount = 0;
        const orderItems = [];

        for (const cartItem of cart.items) {
            const subItem = cartItem.subItemId;
            if (!subItem || !subItem.isAvailable || subItem.quantity < cartItem.quantity) {
                return res.status(400).json({
                    message: `Item ${subItem?.name || 'Unknown'} is not available or insufficient stock`
                });
            }

            totalAmount += cartItem.price * cartItem.quantity;
            orderItems.push({
                subItemId: cartItem.subItemId._id,
                quantity: cartItem.quantity,
                price: cartItem.price,
                itemDetails: {
                    name: subItem.name,
                    category: subItem.category,
                    brand: subItem.brand,
                    images: subItem.images
                }
            });
        }

        // Calculate delivery charges
        let deliveryCharges = 0;
        if (orderData.deliveryType === 'shop_delivery') {
            deliveryCharges = 50; // Dummy delivery charge
        }

        const finalAmount = totalAmount + deliveryCharges;

        // Create order
        const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const order = new Order({
            orderId,
            userId: req.user._id,
            items: orderItems,
            totalAmount,
            deliveryCharges,
            finalAmount,
            deliveryType: orderData.deliveryType,
            shopId: orderData.shopId,
            paymentId: razorpay_payment_id,
            paymentStatus: 'completed',
            razorpayOrderId: razorpay_order_id,
            paymentDetails: {
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature,
                paymentMethod: orderData.paymentMethod || 'razorpay',
                paymentDate: new Date(),
                transactionId: razorpay_payment_id,
                paidAmount: finalAmount
            },
            offers: orderData.offers || [],
            notes: orderData.notes
        });

        // Handle delivery address
        if (orderData.deliveryAddressId) {
            order.deliveryAddress = orderData.deliveryAddressId;
        } else if (orderData.customAddress) {
            order.customAddress = orderData.customAddress;
        }

        await order.save();

        // Update inventory
        for (const item of cart.items) {
            await SubItem.findByIdAndUpdate(
                item.subItemId._id,
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Clear cart
        await Cart.findByIdAndDelete(cart._id);

        res.json({
            message: 'Order placed successfully!',
            orderId: order.orderId,
            paymentId: razorpay_payment_id,
            amount: finalAmount
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
});

// Get user's orders
router.get('/orders', protectRoute, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate('items.subItemId')
            .populate('deliveryAddress')
            .populate('shopId', 'name location')
            .sort({ createdAt: -1 });
        console.log("orders:", orders);
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// Get user's orders by userId (for frontend compatibility)
router.get('/orders/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId })
            .populate('items.subItemId')
            .populate('deliveryAddress')
            .populate('shopId', 'name location')
            .sort({ createdAt: -1 });
        console.log("orders for user:", userId, orders);
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// Get order by ID
router.get('/orders/:orderId', async (req, res) => {
    try {
        console.log('🔍 Fetching order with ID:', req.params.orderId);

        // First try to find without auth for placed orders
        let order = await Order.findOne({
            _id: req.params.orderId,
            orderStatus: 'placed'
        })
        .populate('items.subItemId')
        .populate('deliveryAddress')
        .populate('shopId', 'name location')
        .populate('acceptedUsers.userId', 'username profileImage');

        console.log('📦 Order found (placed status):', !!order);
        console.log('📦 Order acceptedUsers:', order?.acceptedUsers);

        // If not found, check with auth for all order statuses
        if (!order) {
            console.log('🔍 Order not found with placed status, checking with auth...');

            // Check if user is authenticated
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ message: 'Not authorized, no token' });
            }

            const jwt = await import('jsonwebtoken');
            const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
            const User = (await import('../models/User.js')).default;
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            console.log('👤 Authenticated user:', user._id);
            console.log('👤 User username:', user.username);

            // Find order where user is either the creator OR in acceptedUsers
            order = await Order.findOne({
                _id: req.params.orderId,
                $or: [
                    { userId: user._id },
                    { 'acceptedUsers.userId': user._id }
                ]
            })
            .populate('items.subItemId')
            .populate('deliveryAddress')
            .populate('shopId', 'name location')
            .populate('acceptedUsers.userId', 'username profileImage')
            .populate('userId', 'username'); // Also populate the order creator

            console.log('📦 Order found (with auth):', !!order);
            console.log('📦 Order acceptedUsers:', order?.acceptedUsers);
            console.log('📦 Order acceptedUsers length:', order?.acceptedUsers?.length || 0);
        }

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('✅ Order successfully retrieved');
        console.log('✅ Order data:', {
            _id: order._id,
            orderId: order.orderId,
            orderStatus: order.orderStatus,
            userId: order.userId,
            acceptedUsers: order.acceptedUsers?.map(au => ({
                userId: au.userId,
                username: au.userId?.username,
                status: au.status,
                price: au.price
            }))
        });

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Failed to fetch order' });
    }
});

// Get available orders for travelers
router.get('/available-orders', protectRoute, async (req, res) => {
    try {
        const orders = await Order.find({
            orderStatus: 'placed',
            $or: [
                { travelerId: { $exists: false } },
                { travelerId: null }
            ]
        })
        .populate('items.subItemId')
        .populate('deliveryAddress')
        .populate('shopId', 'name location')
        .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('Error fetching available orders:', error);
        res.status(500).json({ message: 'Failed to fetch available orders' });
    }
});

// Accept order for delivery
router.post('/orders/:orderId/accept', protectRoute, async (req, res) => {
    try {
        const { userId, vehicleType, tentativeTime, price } = req.body;

        // Get the order to check if user is the order creator
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Prevent order creator from accepting their own order
        if (order.userId.toString() === userId) {
            return res.status(400).json({ message: 'Order creator cannot accept their own order' });
        }

        // Check if user has already accepted this order
        const existingAcceptance = order.acceptedUsers?.find(
            accepted => accepted.userId.toString() === userId
        );

        if (existingAcceptance) {
            return res.status(400).json({ message: 'You have already accepted this order' });
        }

        // Create new acceptance
        const newAcceptance = {
            userId,
            vehicleType,
            tentativeTime,
            price,
            status: 'accepted'
        };

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.orderId,
            {
                $push: {
                    acceptedUsers: newAcceptance
                },
                $set: {
                    deliveryStatus: 'accepted'
                }
            },
            { new: true }
        )
        .populate('items.subItemId')
        .populate('deliveryAddress')
        .populate('shopId', 'name location')
        .populate('acceptedUsers.userId', 'username');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order accepted successfully', order: updatedOrder });
    } catch (error) {
        console.error('Error accepting order:', error);
        res.status(500).json({ message: 'Failed to accept order' });
    }
});

// PUT /api/checkout/orders/:id/update-bid - Update bid price for accepted user
router.put('/orders/:id/update-bid', protectRoute, async (req, res) => {
    const { userId, newPrice } = req.body;

    try {
        // Validate input
        if (!userId || !newPrice) {
            return res.status(400).json({ message: 'User ID and new price are required' });
        }

        // Find the order
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the requester is either the accepted user themselves or the order owner
        const isAcceptedUser = order.acceptedUsers.some(user => user.userId.toString() === req.user._id.toString());
        const isOrderOwner = order.userId.toString() === req.user._id.toString();

        if (!isAcceptedUser && !isOrderOwner) {
            return res.status(403).json({ message: 'Only the accepted user or order owner can update bid prices' });
        }

        // If updating someone else's bid, must be the order owner
        if (userId !== req.user._id.toString() && !isOrderOwner) {
            return res.status(403).json({ message: 'You can only update your own bid price' });
        }

        // Check if the userId is in acceptedUsers
        const acceptedUserExists = order.acceptedUsers.some(user => user.userId.toString() === userId);
        if (!acceptedUserExists) {
            return res.status(404).json({ message: 'Accepted user not found' });
        }

        // Update the specific accepted user's bid
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: req.params.id, 'acceptedUsers.userId': userId },
            {
                $set: {
                    'acceptedUsers.$.price': newPrice
                }
            },
            { new: true }
        ).populate('items.subItemId')
         .populate('deliveryAddress')
         .populate('shopId', 'name location')
         .populate('acceptedUsers.userId', 'username')
         .populate('userId', 'username');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order or accepted user not found' });
        }

        res.status(200).json({
            message: 'Bid updated successfully',
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error updating bid:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/checkout/orders/:id/confirm-bid - Confirm a bid and set order to confirmed
router.put('/orders/:id/confirm-bid', protectRoute, async (req, res) => {
    const { userId, paymentMethod, useWallet, walletAmount } = req.body;

    try {
        // Validate input
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // First check if user is the order owner and order exists
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is the order owner
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only order owner can confirm bids' });
        }

        // Check if order has accepted users
        if (!order.acceptedUsers || order.acceptedUsers.length === 0) {
            return res.status(400).json({ message: 'Order must have accepted users to confirm bid' });
        }

        // Check if the userId is in acceptedUsers
        const acceptedUserExists = order.acceptedUsers.some(
            user => user.userId.toString() === userId
        );

        if (!acceptedUserExists) {
            return res.status(404).json({ message: 'Accepted user not found' });
        }

        // Handle wallet payment if applicable
        if (paymentMethod === 'wallet' && useWallet && walletAmount > 0) {
            const Wallet = (await import('../models/Wallet.js')).default;
            
            // Get user's wallet
            let wallet = await Wallet.findOne({ userId: req.user._id });
            
            if (!wallet) {
                return res.status(400).json({ message: 'Wallet not found' });
            }
            
            // Check if user has sufficient balance
            if (wallet.availableBalance < walletAmount) {
                return res.status(400).json({ message: 'Insufficient wallet balance' });
            }
            
            // Process wallet payment
            const transactionData = {
                description: `Order payment for ${order.orderId}`,
                paymentMethod: 'wallet',
                referenceId: `ORD_${order._id}`,
                metadata: {
                    orderId: order._id,
                    transactionType: 'payment'
                }
            };
            
            await wallet.deductMoney(walletAmount, transactionData);
        }

        // Use findOneAndUpdate to set the confirmed user to in-transit and others to cancelled
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: req.params.id, 'acceptedUsers.userId': userId },
            {
                $set: {
                    orderStatus: 'confirmed',
                    deliveryStatus: 'in-transit',
                    'acceptedUsers.$.status': 'in-transit',
                    paymentMethod: paymentMethod || 'razorpay',
                    paymentStatus: paymentMethod === 'wallet' ? 'completed' : 'pending'
                }
            },
            { new: true }
        ).populate('items.subItemId')
         .populate('deliveryAddress')
         .populate('shopId', 'name location')
         .populate('acceptedUsers.userId', 'username')
         .populate('userId', 'username');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order or accepted user not found' });
        }

        // Now update other accepted users to cancelled status
        await Order.updateMany(
            {
                _id: req.params.id,
                'acceptedUsers.userId': { $ne: userId }
            },
            {
                $set: { 'acceptedUsers.$[].status': 'cancelled' }
            }
        );

        res.status(200).json({
            message: 'Bid confirmed successfully. Order is now confirmed.',
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error confirming bid:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/checkout/orders/:id/update-delivery-status - Update delivery status from traveler side
router.put('/orders/:id/update-delivery-status', protectRoute, async (req, res) => {
    const { userId, status } = req.body;

    try {
        // Validate input
        if (!userId || !status) {
            return res.status(400).json({ message: 'User ID and status are required' });
        }

        // Validate status
        const validStatuses = ['accepted', 'in-transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be one of: accepted, in-transit, delivered, cancelled' });
        }

        // Find the order
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the user is in acceptedUsers
        const acceptedUserIndex = order.acceptedUsers.findIndex(
            user => user.userId.toString() === userId
        );

        if (acceptedUserIndex === -1) {
            return res.status(403).json({ message: 'User is not authorized to update this order delivery status' });
        }

        // Check if the user is the one making the request or if it's the order owner
        const isAcceptedUser = userId === req.user._id.toString();
        const isOrderOwner = order.userId.toString() === req.user._id.toString();

        if (!isAcceptedUser && !isOrderOwner) {
            return res.status(403).json({ message: 'Only the accepted delivery user or order owner can update delivery status' });
        }

        // Update the delivery status and the specific user's status
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: req.params.id, 'acceptedUsers.userId': userId },
            {
                $set: {
                    deliveryStatus: status,
                    'acceptedUsers.$.status': status
                }
            },
            { new: true }
        ).populate('items.subItemId')
         .populate('deliveryAddress')
         .populate('shopId', 'name location')
         .populate('acceptedUsers.userId', 'username')
         .populate('userId', 'username');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order or accepted user not found' });
        }

        // If status is 'delivered' or 'cancelled', also update orderStatus accordingly
        if (status === 'delivered') {
            await Order.findByIdAndUpdate(req.params.id, {
                $set: { orderStatus: 'delivered' }
            });
        } else if (status === 'cancelled') {
            await Order.findByIdAndUpdate(req.params.id, {
                $set: { orderStatus: 'cancelled' }
            });
        }

        res.status(200).json({
            message: `Delivery status updated to ${status} successfully.`,
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get delivery options for checkout
router.get('/delivery-options/:shopId', protectRoute, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        const options = [
            {
                type: 'shop_delivery',
                label: 'Delivery by Shop',
                charges: 50, // Dummy charge
                description: 'Shop will deliver to your address'
            },
            {
                type: 'own_delivery',
                label: 'Arrange Your Own Delivery',
                charges: 0,
                description: 'Use our travel service to arrange delivery'
            }
        ];

        res.json({
            shop: {
                id: shop._id,
                name: shop.name,
                location: shop.location
            },
            deliveryOptions: options
        });
    } catch (error) {
        console.error('Error fetching delivery options:', error);
        res.status(500).json({ message: 'Failed to fetch delivery options' });
    }
});

// Update Delivery Status for Order
router.patch('/orders/:orderId/update-delivery-status', protectRoute, async (req, res) => {
    try {
        const { userId, deliveryStatus, currentLocation } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const bid = order.acceptedUsers.find(bid => bid.userId.toString() === userId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        bid.deliveryDetails.deliveryStatus = deliveryStatus;
        bid.status = deliveryStatus; // Update accepted user's status

        if (currentLocation) {
            bid.deliveryDetails.currentLocation = {
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                timestamp: new Date()
            };
        }

        if (deliveryStatus === 'delivered') {
            bid.deliveryDetails.deliveredAt = new Date();
            order.deliveryStatus = 'delivered';
            order.orderStatus = 'delivered';
        }

        await order.save();
        res.json({ message: 'Delivery status updated successfully.', order });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Delivery Location for Order
router.patch('/orders/:orderId/update-location', protectRoute, async (req, res) => {
    try {
        const { userId, lat, lng } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const bid = order.acceptedUsers.find(bid => bid.userId.toString() === userId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        bid.deliveryDetails.currentLocation = {
            lat,
            lng,
            timestamp: new Date()
        };

        await order.save();
        res.json({ message: 'Location updated successfully.', order });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload Delivery Image for Order
router.patch('/orders/:orderId/upload-delivery-image', protectRoute, async (req, res) => {
    try {
        const { userId, image, withBarcode = false } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const bid = order.acceptedUsers.find(bid => bid.userId.toString() === userId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        if (withBarcode) {
            bid.deliveryDetails.deliveryImageWithBarcode = image;
        } else {
            bid.deliveryDetails.deliveryImage = image;
        }

        await order.save();
        res.json({ message: 'Delivery image uploaded successfully.', order });
    } catch (error) {
        console.error('Error uploading delivery image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Set Recipient Mobile and Generate OTP for Order
router.patch('/orders/:orderId/set-recipient', protectRoute, async (req, res) => {
    try {
        const { userId, recipientMobile } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const bid = order.acceptedUsers.find(bid => bid.userId.toString() === userId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        // Generate OTP (6-digit random number)
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        bid.deliveryDetails.recipientMobile = recipientMobile;
        bid.deliveryDetails.otpCode = otpCode;
        bid.deliveryDetails.otpVerified = false;

        await order.save();
        res.json({
            message: 'Recipient mobile set successfully.',
            otpCode,
            order
        });
    } catch (error) {
        console.error('Error setting recipient:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify OTP for Order
router.patch('/orders/:orderId/verify-otp', protectRoute, async (req, res) => {
    try {
        const { userId, otpCode } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const bid = order.acceptedUsers.find(bid => bid.userId.toString() === userId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        if (bid.deliveryDetails.otpCode !== otpCode) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        bid.deliveryDetails.otpVerified = true;
        bid.deliveryDetails.deliveryStatus = 'delivered';
        bid.status = 'delivered'; // Update accepted user's status
        order.deliveryStatus = 'delivered';
        order.orderStatus = 'delivered';
        bid.deliveryDetails.deliveredAt = new Date();

        await order.save();
        res.json({ message: 'OTP verified successfully. Delivery completed.', order });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark Barcode as Scanned for Order
router.patch('/orders/:orderId/mark-barcode-scanned', protectRoute, async (req, res) => {
    try {
        const { userId, barcodeData } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const bid = order.acceptedUsers.find(bid => bid.userId.toString() === userId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        bid.deliveryDetails.barcodeScanned = true;
        bid.deliveryDetails.barcodeData = barcodeData;

        await order.save();
        res.json({ message: 'Barcode scanned successfully.', order });
    } catch (error) {
        console.error('Error marking barcode as scanned:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to check delivery requirements before marking as delivered for Order
router.get('/orders/:orderId/check-delivery-requirements', protectRoute, async (req, res) => {
    try {
        const { userId } = req.query;
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const acceptedUser = order.acceptedUsers.find(user => user.userId.toString() === userId);
        if (!acceptedUser) {
            return res.status(404).json({ message: 'User not found in accepted users' });
        }

        const deliveryDetails = acceptedUser.deliveryDetails;

        // Check if all required steps are completed
        const hasDeliveryImage = deliveryDetails.deliveryImage && deliveryDetails.deliveryImage.length > 0;
        const hasDeliveryImageWithBarcode = deliveryDetails.deliveryImageWithBarcode && deliveryDetails.deliveryImageWithBarcode.length > 0;
        const otpVerified = deliveryDetails.otpVerified;

        // Note: barcode scan is optional for now, so we don't check it for requirements
        const requirementsMet = hasDeliveryImage && hasDeliveryImageWithBarcode && otpVerified;

        res.json({
            requirementsMet,
            hasDeliveryImage,
            hasDeliveryImageWithBarcode,
            otpVerified,
            barcodeScanned: deliveryDetails.barcodeScanned // Optional, not required for now
        });
    } catch (error) {
        console.error('Error checking delivery requirements:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;