import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const productSchema = new mongoose.Schema({
  Title: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500, // approx 50 words
  },
  price: {
    type: Number,
    required: true,
  },
  weight: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  veichelType: {
    type: String,
    required: true,
  },
  video: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-transit', 'delivered'],
    default: 'pending',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  acceptedUsers: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      vehicleType: {
        type: String,
        required: true,
      },
      tentativeTime: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ['accepted', 'in-transit', 'delivered', 'cancelled'],
        default: 'accepted',
      },
      messages: [
        {
          senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          message: {
            type: String,
            required: true,
          },
          username: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
          read: {
            type: Boolean,
            default: false,
          }
        }
      ]
    }
  ]
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
