import express from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import SubItem from '../models/subItems.js';
import CartHistory from '../models/CartHistory.js';
import protectRoute from '../src/middleware/authMiddleware.js';

const router = express.Router();

// Get user's cart
router.get('/', protectRoute, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate({
                path: 'items.subItemId',
                model: 'SubItem',
                populate: {
                    path: 'parentItemId',
                    model: 'Item',
                    select: 'name shop_id',
                    populate: {
                        path: 'shop_id',
                        model: 'Shop',
                        select: 'name location'
                    }
                }
            });

        if (!cart) {
            return res.json({
                items: [],
                totalAmount: 0,
                itemCount: 0
            });
        }

        res.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add item to cart
router.post('/add', protectRoute, async (req, res) => {
    try {
        const { subItemId, quantity = 1 } = req.body;

        if (!subItemId || !mongoose.Types.ObjectId.isValid(subItemId)) {
            return res.status(400).json({ message: 'Valid subItemId is required' });
        }

        // Check if sub-item exists and is available
        const subItem = await SubItem.findById(subItemId);
        if (!subItem) {
            return res.status(404).json({ message: 'Sub-item not found' });
        }

        if (!subItem.isAvailable) {
            return res.status(400).json({ message: 'Sub-item is not available' });
        }

        if (subItem.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient quantity available' });
        }

        // Find or create cart
        let cart = await Cart.findOne({ userId: req.user._id });

        if (!cart) {
            cart = new Cart({
                userId: req.user._id,
                items: []
            });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.subItemId.toString() === subItemId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                subItemId,
                quantity,
                price: subItem.Price
            });
        }

        await cart.save();

        // Log cart history
        await CartHistory.create({
            userId: req.user._id,
            action: existingItemIndex > -1 ? 'update' : 'add',
            subItemId,
            subItemDetails: {
                name: subItem.name,
                price: subItem.Price,
                category: subItem.category,
                brand: subItem.brand,
                images: subItem.images
            },
            quantity,
            previousQuantity: existingItemIndex > -1 ? cart.items[existingItemIndex].quantity - quantity : 0,
            totalAmount: cart.totalAmount,
            sessionId: req.sessionID || 'web-session',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Populate and return updated cart
        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.subItemId',
                model: 'SubItem',
                populate: {
                    path: 'parentItemId',
                    model: 'Item',
                    select: 'name shop_id',
                    populate: {
                        path: 'shop_id',
                        model: 'Shop',
                        select: 'name location'
                    }
                }
            });

        res.json({
            message: 'Item added to cart successfully',
            cart: updatedCart
        });

    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update item quantity in cart
router.put('/update', protectRoute, async (req, res) => {
    try {
        const { subItemId, quantity } = req.body;

        if (!subItemId || !mongoose.Types.ObjectId.isValid(subItemId)) {
            return res.status(400).json({ message: 'Valid subItemId is required' });
        }

        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(
            item => item.subItemId.toString() === subItemId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Check available quantity
        const subItem = await SubItem.findById(subItemId);
        if (subItem && subItem.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient quantity available' });
        }

        const previousQuantity = cart.items[itemIndex].quantity;
        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        // Log cart history
        await CartHistory.create({
            userId: req.user._id,
            action: 'update',
            subItemId,
            subItemDetails: {
                name: cart.items[itemIndex].subItemId.name,
                price: cart.items[itemIndex].price,
                category: cart.items[itemIndex].subItemId.category,
                brand: cart.items[itemIndex].subItemId.brand,
                images: cart.items[itemIndex].subItemId.images
            },
            quantity,
            previousQuantity,
            totalAmount: cart.totalAmount,
            sessionId: req.sessionID || 'web-session',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.subItemId',
                model: 'SubItem',
                populate: {
                    path: 'parentItemId',
                    model: 'Item',
                    select: 'name shop_id',
                    populate: {
                        path: 'shop_id',
                        model: 'Shop',
                        select: 'name location'
                    }
                }
            });

        res.json({
            message: 'Cart updated successfully',
            cart: updatedCart
        });

    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove item from cart
router.delete('/remove/:subItemId', protectRoute, async (req, res) => {
    try {
        const { subItemId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(subItemId)) {
            return res.status(400).json({ message: 'Valid subItemId is required' });
        }

        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the item being removed for history logging
        const removedItem = cart.items.find(
            item => item.subItemId.toString() === subItemId
        );

        cart.items = cart.items.filter(
            item => item.subItemId.toString() !== subItemId
        );

        await cart.save();

        // Log cart history
        if (removedItem) {
            await CartHistory.create({
                userId: req.user._id,
                action: 'remove',
                subItemId,
                subItemDetails: {
                    name: removedItem.subItemId.name,
                    price: removedItem.price,
                    category: removedItem.subItemId.category,
                    brand: removedItem.subItemId.brand,
                    images: removedItem.subItemId.images
                },
                quantity: 0,
                previousQuantity: removedItem.quantity,
                totalAmount: cart.totalAmount,
                sessionId: req.sessionID || 'web-session',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.subItemId',
                model: 'SubItem',
                populate: {
                    path: 'parentItemId',
                    model: 'Item',
                    select: 'name shop_id',
                    populate: {
                        path: 'shop_id',
                        model: 'Shop',
                        select: 'name location'
                    }
                }
            });

        res.json({
            message: 'Item removed from cart successfully',
            cart: updatedCart
        });

    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Clear entire cart
router.delete('/clear', protectRoute, async (req, res) => {
    try {
        const cart = await Cart.findOneAndDelete({ userId: req.user._id });

        // If no cart exists, it's already "cleared", so return success
        res.json({
            message: 'Cart cleared successfully'
        });

    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Checkout/Purchase items
router.post('/checkout', protectRoute, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate('items.subItemId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Validate all items are still available
        for (const cartItem of cart.items) {
            const subItem = cartItem.subItemId;
            if (!subItem.isAvailable) {
                return res.status(400).json({
                    message: `Item "${subItem.name}" is no longer available`
                });
            }
            if (subItem.quantity < cartItem.quantity) {
                return res.status(400).json({
                    message: `Insufficient quantity for "${subItem.name}"`
                });
            }
        }

        // Process the order (this is a simplified version)
        // In a real app, you'd create an Order record, process payment, etc.

        // Update quantities
        for (const cartItem of cart.items) {
            await SubItem.findByIdAndUpdate(
                cartItem.subItemId._id,
                { $inc: { quantity: -cartItem.quantity } }
            );
        }

        // Clear the cart
        await Cart.findByIdAndDelete(cart._id);

        res.json({
            message: 'Purchase completed successfully!',
            totalAmount: cart.totalAmount,
            itemsPurchased: cart.items.length
        });

    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ message: 'Server error during checkout' });
    }
});

export default router;
