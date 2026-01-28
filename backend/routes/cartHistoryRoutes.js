import express from 'express';
import mongoose from 'mongoose';
import CartHistory from '../models/CartHistory.js';
import protectRoute from '../src/middleware/authMiddleware.js';

const router = express.Router();

// Get user's cart history
router.get('/', protectRoute, async (req, res) => {
    try {
        const { page = 1, limit = 20, action, startDate, endDate } = req.query;

        const query = { userId: req.user._id };

        // Add filters
        if (action) query.action = action;
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const history = await CartHistory.find(query)
            .populate({
                path: 'subItemId',
                model: 'SubItem',
                populate: {
                    path: 'parentItemId',
                    model: 'Item',
                    select: 'name'
                }
            })
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await CartHistory.countDocuments(query);

        // Group by date for better UI display
        const groupedHistory = history.reduce((acc, item) => {
            const date = item.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD format
            if (!acc[date]) acc[date] = [];
            acc[date].push(item);
            return acc;
        }, {});

        res.json({
            history: groupedHistory,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            },
            summary: {
                totalActions: total,
                actionsByType: await CartHistory.aggregate([
                    { $match: { userId: req.user._id } },
                    { $group: { _id: '$action', count: { $sum: 1 } } }
                ])
            }
        });

    } catch (error) {
        console.error('Error fetching cart history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get cart history statistics
router.get('/stats', protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get statistics for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await CartHistory.aggregate([
            {
                $match: {
                    userId: userId,
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        action: '$action',
                        date: {
                            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                        }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            },
            {
                $group: {
                    _id: '$_id.action',
                    dailyStats: {
                        $push: {
                            date: '$_id.date',
                            count: '$count',
                            amount: '$totalAmount'
                        }
                    },
                    totalCount: { $sum: '$count' },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Get most added items
        const topItems = await CartHistory.aggregate([
            {
                $match: {
                    userId: userId,
                    action: 'add'
                }
            },
            {
                $group: {
                    _id: '$subItemId',
                    count: { $sum: '$quantity' },
                    lastAdded: { $max: '$timestamp' }
                }
            },
            {
                $lookup: {
                    from: 'subitems',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subItem'
                }
            },
            {
                $unwind: '$subItem'
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    lastAdded: 1,
                    name: '$subItem.name',
                    price: '$subItem.Price',
                    category: '$subItem.category',
                    images: { $slice: ['$subItem.images', 1] }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            stats,
            topItems,
            period: {
                startDate: thirtyDaysAgo,
                endDate: new Date()
            }
        });

    } catch (error) {
        console.error('Error fetching cart history stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete cart history (admin function - optional)
router.delete('/:historyId', protectRoute, async (req, res) => {
    try {
        const { historyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(historyId)) {
            return res.status(400).json({ message: 'Invalid history ID' });
        }

        const history = await CartHistory.findOneAndDelete({
            _id: historyId,
            userId: req.user._id
        });

        if (!history) {
            return res.status(404).json({ message: 'History entry not found' });
        }

        res.json({ message: 'History entry deleted successfully' });

    } catch (error) {
        console.error('Error deleting cart history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Clear all cart history for user
router.delete('/', protectRoute, async (req, res) => {
    try {
        const result = await CartHistory.deleteMany({ userId: req.user._id });

        res.json({
            message: 'Cart history cleared successfully',
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error clearing cart history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
