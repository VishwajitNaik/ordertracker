// import mongoose from "mongoose";

// const productSchema = new mongoose.Schema({
//   Title: {
//     type: String,
//     required: true,
//   },
//   fromLocation: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Address',
//     required: true,
//   },
//   toLocation: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Address',
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//     maxlength: 500, // approx 50 words
//   },
//   price: {
//     type: Number,
//     required: true,
//   },
//   weight: {
//     type: String,
//     required: true,
//   },
//   image: {
//     type: String,
//     required: true,
//   },
//   veichelType: {
//     type: String,
//     required: true,
//   },
//   video: {
//     type: String,
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'accepted', 'in-transit', 'delivered'],
//     default: 'pending',
//   },
//   payoutStatus: {
//     type: String,
//     enum: ['pending', 'completed', 'failed'],
//     default: 'pending',
//   },
//   paymentDetails: {
//     razorpay_order_id: String,
//     razorpay_payment_id: String,
//     razorpay_signature: String,
//     paymentMethod: {
//       type: String,
//       enum: ['razorpay', 'upi', 'netbanking', 'phonepe', 'googlepay', 'wallet'],
//       default: 'razorpay'
//     },
//     paymentDate: Date,
//     transactionId: String,
//     paidAmount: Number
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: false,
//   },
//   acceptedUsers: [
//     {
//       userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//       },
//       vehicleType: {
//         type: String,
//         required: true,
//       },
//       tentativeTime: {
//         type: String,
//         required: true,
//       },
//       price: {
//         type: Number,
//         required: true,
//       },
//       status: {
//         type: String,
//         enum: ['accepted', 'in-transit', 'delivered', 'cancelled'],
//         default: 'accepted',
//       },
//       deliveryDetails: {
//         deliveryBoyId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: 'User',
//         },
//         deliveryStatus: {
//           type: String,
//           enum: ['pending', 'in-transit', 'delivered', 'failed'],
//           default: 'pending',
//         },
//         currentLocation: {
//           lat: Number,
//           lng: Number,
//           timestamp: Date,
//         },
//         deliveryImage: String,
//         deliveryImageWithBarcode: String,
//         recipientMobile: String,
//         otpCode: String,
//         otpVerified: {
//           type: Boolean,
//           default: false,
//         },
//         deliveredAt: Date,
//         barcodeScanned: {
//           type: Boolean,
//           default: false,
//         },
//         barcodeData: String,
//       },
//       messages: [
//         {
//           senderId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User',
//             required: true,
//           },
//           receiverId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User',
//             required: true,
//           },
//           message: {
//             type: String,
//             required: true,
//           },
//           username: {
//             type: String,
//             required: true,
//           },
//           timestamp: {
//             type: Date,
//             default: Date.now,
//           },
//           createdAt: {
//             type: Date,
//             default: Date.now,
//           },
//           read: {
//             type: Boolean,
//             default: false,
//           }
//         }
//       ]
//     }
//   ]
// }, { timestamps: true });

// const Product = mongoose.model("Product", productSchema);

// // Add indexes for better performance
// productSchema.index({ createdBy: 1, createdAt: -1 });
// productSchema.index({ 'acceptedUsers.userId': 1 });
// productSchema.index({ status: 1 });
// productSchema.index({ payoutStatus: 1 });

// export default Product;


import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  Title: {
    type: String,
    required: true,
    trim: true
  },
  fromLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true,
  },
  toLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  veichelType: {
    type: String,
    required: true,
    trim: true
  },
  Type: {  // Added this field that's referenced in your frontend
    type: String,
    default: 'General',
    trim: true
  },
  video: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-transit', 'delivered'],
    default: 'pending',
  },
  payoutStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  paymentDetails: {
    razorpay_order_id: {
      type: String,
      trim: true
    },
    razorpay_payment_id: {
      type: String,
      trim: true
    },
    razorpay_signature: {
      type: String,
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'upi', 'netbanking', 'phonepe', 'googlepay', 'wallet'],
      default: 'razorpay'
    },
    paymentDate: {
      type: Date,
      default: null
    },
    transactionId: {
      type: String,
      trim: true
    },
    paidAmount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Changed from false to true since it's required
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
        trim: true
      },
      tentativeTime: {
        type: String,
        required: true,
        trim: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      status: {
        type: String,
        enum: ['accepted', 'in-transit', 'delivered', 'cancelled'],
        default: 'accepted',
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
          lat: {
            type: Number,
            min: -90,
            max: 90
          },
          lng: {
            type: Number,
            min: -180,
            max: 180
          },
          timestamp: {
            type: Date,
            default: Date.now
          },
        },
        deliveryImage: {
          type: String,
          trim: true
        },
        deliveryImageWithBarcode: {
          type: String,
          trim: true
        },
        recipientMobile: {
          type: String,
          trim: true,
          validate: {
            validator: function(v) {
              return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
          }
        },
        otpCode: {
          type: String,
          trim: true
        },
        otpVerified: {
          type: Boolean,
          default: false,
        },
        deliveredAt: {
          type: Date,
          default: null
        },
        barcodeScanned: {
          type: Boolean,
          default: false,
        },
        barcodeData: {
          type: String,
          trim: true
        },
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
            trim: true,
            maxlength: 1000
          },
          username: {
            type: String,
            required: true,
            trim: true
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
}, { 
  timestamps: true,
  // Add validation for paymentDetails when payoutStatus is 'completed'
  validate: {
    validator: function() {
      // If payoutStatus is 'completed', paymentDetails should have required fields
      if (this.payoutStatus === 'completed') {
        return this.paymentDetails && 
               this.paymentDetails.razorpay_order_id &&
               this.paymentDetails.razorpay_payment_id &&
               this.paymentDetails.razorpay_signature;
      }
      return true;
    },
    message: 'Payment details are required when payout status is completed'
  }
});

// Add indexes BEFORE creating the model
productSchema.index({ createdBy: 1, createdAt: -1 });
productSchema.index({ 'acceptedUsers.userId': 1 });
productSchema.index({ status: 1 });
productSchema.index({ payoutStatus: 1 });
productSchema.index({ 'acceptedUsers.status': 1 });
productSchema.index({ fromLocation: 1 });
productSchema.index({ toLocation: 1 });

// Create virtual for getting active accepted users
productSchema.virtual('activeAcceptedUsers').get(function() {
  if (!this.acceptedUsers) return [];
  return this.acceptedUsers.filter(user => 
    user.status === 'accepted' || user.status === 'in-transit'
  );
});

// Create virtual for getting cancelled accepted users
productSchema.virtual('cancelledAcceptedUsers').get(function() {
  if (!this.acceptedUsers) return [];
  return this.acceptedUsers.filter(user => user.status === 'cancelled');
});

// Method to check if user can confirm bid
productSchema.methods.canConfirmBid = function(userId) {
  if (this.payoutStatus === 'completed') {
    return false;
  }
  
  const acceptedUser = this.acceptedUsers.find(user => 
    user.userId.toString() === userId.toString()
  );
  
  return acceptedUser && acceptedUser.status === 'accepted';
};

// Method to update bid status
productSchema.methods.updateBidStatus = async function(acceptedUserId, status) {
  const acceptedUser = this.acceptedUsers.find(user => 
    user.userId.toString() === acceptedUserId.toString()
  );
  
  if (!acceptedUser) {
    throw new Error('Accepted user not found');
  }
  
  if (!['accepted', 'in-transit', 'delivered', 'cancelled'].includes(status)) {
    throw new Error('Invalid status');
  }
  
  acceptedUser.status = status;
  
  // If setting to in-transit, also update delivery status
  if (status === 'in-transit') {
    acceptedUser.deliveryDetails.deliveryStatus = 'in-transit';
    acceptedUser.deliveryDetails.deliveryBoyId = acceptedUserId;
  }
  
  // If setting to delivered, update delivery status and timestamp
  if (status === 'delivered') {
    acceptedUser.deliveryDetails.deliveryStatus = 'delivered';
    acceptedUser.deliveryDetails.deliveredAt = new Date();
    this.status = 'delivered';
  }
  
  return this.save();
};

const Product = mongoose.model("Product", productSchema);

export default Product;