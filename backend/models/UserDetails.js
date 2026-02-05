import mongoose from "mongoose";

const productDetailsSchema = new mongoose.Schema({
    phone:{
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
}, { timestamps: true });

const UserDetails = mongoose.model('UserDetails', productDetailsSchema);

// Address schema for multiple addresses per user
const addressSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        enum: ['Home', 'Work', 'Other'],
        default: 'Home'
    },
    address: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    zipCode: {
        type: String,
        required: true,
    },
    lat: {
        type: Number,
        required: true,
    },
    lng: {
        type: Number,
        required: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const Address = mongoose.model('Address', addressSchema);

// Daily Route Scheduling Schema
const dailyRouteSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true,
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true,
    },
    days: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true,
    }],
    goTime: {
        type: String,
        required: true,
    },
    arrivalTime: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const DailyRoute = mongoose.model('DailyRoute', dailyRouteSchema);

export { UserDetails, Address, DailyRoute };
