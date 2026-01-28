import mongoose from "mongoose";

const travelSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
    },
    veichelType:{
        type: String,
        required: true,
    },
    from:{
        type: String,
        required: true,
    },
    to:{
        type: String,
        required: true,
    },
    date:{
        type: Date,
        required: true,
    },
    gotime:{
        type: String,
        required: true,
    },
    arrivaltime:{
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'started', 'completed'],
        default: 'scheduled',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    requestedUsers: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            status: {
                type: String,
                enum: ['pending', 'accepted', 'rejected'],
                default: 'pending',
            },
        }
    ],
}, { timestamps: true });

const Travel = mongoose.model('Travel', travelSchema);

export default Travel;
