import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    subItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubItem',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    itemDetails: {
        name: String,
        category: String,
        brand: String,
        images: [String]
    }
});

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    deliveryCharges: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    deliveryType: {
        type: String,
        enum: ['shop_delivery', 'own_delivery'],
        required: true
    },
    deliveryAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    customAddress: {
        address: String,
        city: String,
        state: String,
        zipCode: String
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop'
    },
    paymentId: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'placed'
    },
    deliveryStatus: {
        type: String,
        enum: ['accepted', 'in-transit', 'delivered', 'cancelled'],
        default: null
    },
    acceptedUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        vehicleType: {
            type: String,
            required: true
        },
        tentativeTime: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['accepted', 'in-transit', 'delivered', 'cancelled'],
            default: 'accepted'
        },
        messages: [{
            senderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            receiverId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            message: {
                type: String,
                required: true
            },
            username: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            read: {
                type: Boolean,
                default: false
            }
        }]
    }],
    razorpayOrderId: String,
    offers: [{
        code: String,
        discount: Number,
        description: String
    }],
    notes: String
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;