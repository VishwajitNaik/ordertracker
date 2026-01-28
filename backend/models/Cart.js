import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    subItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubItem',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0,
    },
    itemCount: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

// Update totalAmount and itemCount before saving
cartSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.itemCount = this.items.reduce((total, item) => total + item.quantity, 0);
    next();
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
