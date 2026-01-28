import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    // Vehicle Basic Info
    vehicleType: { type: String, required: true },
    vehicleNumber: { type: String, required: true, unique: true },
    vehicleBrand: String,
    vehicleModel: String,
    vehicleYear: Number,
    vehicleColor: String,

    // Capacity
    capacityKg: Number,
    seatCapacity: Number,
    fuelType: String,

    // Driver License
    drivingLicenseNumber: { type: String, required: true },
    drivingLicenseFrontImage: String,
    drivingLicenseBackImage: String,
    licenseExpiryDate: Date,

    // Vehicle Documents
    rcNumber: String,
    rcImage: String,
    rcExpiryDate: Date,

    insuranceNumber: String,
    insuranceImage: String,
    insuranceExpiryDate: Date,

    pucNumber: String,
    pucImage: String,
    pucExpiryDate: Date,

    // Vehicle Images
    vehicleImages: [String],

    // Verification
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    rejectionReason: String,

    // Ownership
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    verifiedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastVerifiedAt: Date,
  },
  { timestamps: true }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
