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
        enum: ['shop_delivery', 'own_delivery', 'product_delivery'],
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
    paymentDetails: {
        razorpay_order_id: String,
        razorpay_payment_id: String,
        razorpay_signature: String,
        paymentMethod: {
            type: String,
            enum: ['razorpay', 'upi', 'netbanking', 'phonepe', 'googlepay', 'wallet'],
            default: 'razorpay'
        },
        paymentDate: Date,
        transactionId: String,
        paidAmount: Number
    },
    orderStatus: {
        type: String,
        enum: ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'placed'
    },
    deliveryStatus: {
        type: String,
        enum: ['pending','accepted', 'in-transit', 'delivered', 'cancelled'],
        default: 'pending'
    },
    liveLocation: {
        lat: Number,
        lng: Number,
        updatedAt: Date,
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
        deliveryDetails: {
            deliveryBoyId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            deliveryStatus: {
                type: String,
                enum: ['pending', 'in-transit', 'delivered', 'failed'],
                default: 'pending',
            },
            currentLocation: {
                lat: Number,
                lng: Number,
                timestamp: Date,
            },
            deliveryImage: String,
            deliveryImageWithBarcode: String,
            recipientMobile: String,
            otpCode: String,
            otpVerified: {
                type: Boolean,
                default: false,
            },
            deliveredAt: Date,
            barcodeScanned: {
                type: Boolean,
                default: false,
            },
            barcodeData: String,
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