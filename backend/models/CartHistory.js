import mongoose from "mongoose";

const cartHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        enum: ['add', 'remove', 'update', 'checkout', 'clear'],
        required: true,
    },
    subItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubItem',
        required: true,
    },
    subItemDetails: {
        name: String,
        price: Number,
        category: String,
        brand: String,
        images: [String],
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    previousQuantity: {
        type: Number,
        default: 0,
    },
    totalAmount: {
        type: Number,
        default: 0,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    sessionId: {
        type: String,
        required: true,
    },
    ipAddress: String,
    userAgent: String,
}, { timestamps: true });

// Index for better query performance
cartHistorySchema.index({ userId: 1, timestamp: -1 });
cartHistorySchema.index({ sessionId: 1 });

const CartHistory = mongoose.model("CartHistory", cartHistorySchema);
export default CartHistory;
