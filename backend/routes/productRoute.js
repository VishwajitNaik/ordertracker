import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Travel from '../models/travel.js';
import { Address } from '../models/UserDetails.js';
import protectRoute from '../src/middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import crypto from 'crypto';

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);
import mongoose from 'mongoose';

const router = express.Router();

const validateCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const validatePhoneNumber = (phone) => {
  return /^[0-9]{10}$/.test(phone);
};

const validateOTP = (otp) => {
  return /^[0-9]{6}$/.test(otp);
};

router.post('/product', protectRoute, uploadFields, async (req, res) => {
    try {
        console.log('Received product creation request');
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        const { Title, fromLocation, toLocation, description, price, weight, veichelType } = req.body;

        // Validate required fields
        if (!Title || !fromLocation || !toLocation || !description || !price || !weight || !veichelType) {
            console.log('Validation failed: missing required fields');
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Validate that fromLocation and toLocation are valid ObjectId references
        if (!mongoose.Types.ObjectId.isValid(fromLocation) || !mongoose.Types.ObjectId.isValid(toLocation)) {
            return res.status(400).json({ message: 'Invalid address references' });
        }

        // Verify that the addresses exist and belong to the user
        const fromAddress = await Address.findById(fromLocation);
        const toAddress = await Address.findById(toLocation);

        if (!fromAddress || !toAddress) {
            return res.status(400).json({ message: 'Invalid address references' });
        }

        if (fromAddress.createdBy.toString() !== req.user._id.toString() || 
            toAddress.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only use your own addresses' });
        }

        if (!req.files || !req.files.image) {
            console.log('Validation failed: image not provided');
            return res.status(400).json({ message: 'Image is required' });
        }

        console.log('Creating new product');
        // Create new product
        const newProduct = new Product({
            Title,
            fromLocation,
            toLocation,
            description,
            price: parseFloat(price),
            weight,
            image: req.files.image[0].path, // Cloudinary URL
            veichelType,
            video: req.files.video ? req.files.video[0].path : null,
            createdBy: req.user._id
        });

        console.log('Saving product to database');
        // Save product to database
        const savedProduct = await newProduct.save();
        console.log('Product saved successfully:', savedProduct._id);
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', async (req, res) => {
    try {
        const products = await Product.find()
            .populate('createdBy', 'username profileImage')
            .populate('acceptedUsers.userId', 'username profileImage');

        // Fetch addresses for from and to fields
        const productsWithAddresses = await Promise.all(products.map(async (product) => {
            const productObj = product.toObject();

            // Fetch from address
            if (productObj.from) {
                try {
                    const fromAddress = await Address.findById(productObj.from);
                    productObj.fromAddress = fromAddress;
                } catch (error) {
                    console.error('Error fetching from address:', error);
                }
            }

            // Fetch to address
            if (productObj.to) {
                try {
                    const toAddress = await Address.findById(productObj.to);
                    productObj.toAddress = toAddress;
                } catch (error) {
                    console.error('Error fetching to address:', error);
                }
            }

            return productObj;
        }));

        res.status(200).json(productsWithAddresses);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const identifier = decodeURIComponent(req.params.id);
        let product;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            product = await Product.findById(identifier).populate('createdBy', 'username profileImage').populate('acceptedUsers.userId', 'username profileImage');
        } else {
            product = await Product.findOne({ Title: identifier }).populate('createdBy', 'username profileImage').populate('acceptedUsers.userId', 'username profileImage');
        }

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Convert to object and fetch addresses
        const productObj = product.toObject();

        // Fetch from address
        if (productObj.from) {
            try {
                const fromAddress = await Address.findById(productObj.from);
                productObj.fromAddress = fromAddress;
            } catch (error) {
                console.error('Error fetching from address:', error);
            }
        }

        // Fetch to address
        if (productObj.to) {
            try {
                const toAddress = await Address.findById(productObj.to);
                productObj.toAddress = toAddress;
            } catch (error) {
                console.error('Error fetching to address:', error);
            }
        }

        res.status(200).json(productObj);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get("/getAlluserSideProducts", async (req, res) => {
    try {
        const products = await Product.find()
            .populate('createdBy', 'username profileImage')
            .sort({ createdAt: -1 }); // Sort by creation date descending

        // Fetch addresses for from and to fields
        const productsWithAddresses = await Promise.all(products.map(async (product) => {
            const productObj = product.toObject();

            // Fetch from address
            if (productObj.from) {
                try {
                    const fromAddress = await Address.findById(productObj.from);
                    productObj.fromAddress = fromAddress;
                } catch (error) {
                    console.error('Error fetching from address:', error);
                }
            }

            // Fetch to address
            if (productObj.to) {
                try {
                    const toAddress = await Address.findById(productObj.to);
                    productObj.toAddress = toAddress;
                } catch (error) {
                    console.error('Error fetching to address:', error);
                }
            }

            return productObj;
        }));

        res.status(200).json(productsWithAddresses);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get user's dashboard data (products, accepted products, accepted orders)
router.get('/user-dashboard/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user's own products
        const userProducts = await Product.find({ createdBy: userId })
            .populate('createdBy', 'username profileImage')
            .populate('acceptedUsers.userId', 'username profileImage')
            .sort({ createdAt: -1 });

        // Get products accepted by user
        const acceptedProducts = await Product.find({
            'acceptedUsers.userId': userId
        })
            .populate('createdBy', 'username profileImage')
            .populate('acceptedUsers.userId', 'username profileImage')
            .sort({ createdAt: -1 });

        // Get orders created by user
        const userOrders = await Order.find({ userId })
            .populate('userId', 'username')
            .populate('acceptedUsers.userId', 'username profileImage')
            .populate('deliveryAddress')
            .populate('shopId', 'name location')
            .sort({ createdAt: -1 });

        // Get orders accepted by user
        const acceptedOrders = await Order.find({
            'acceptedUsers.userId': userId
        })
            .populate('userId', 'username')
            .populate('acceptedUsers.userId', 'username profileImage')
            .populate('deliveryAddress')
            .populate('shopId', 'name location')
            .sort({ createdAt: -1 });

        // Get user's travels
        const userTravels = await Travel.find({ createdBy: userId })
            .populate('createdBy', 'username')
            .populate('requestedUsers.userId', 'username')
            .populate('requestedUsers.productId', 'Title')
            .sort({ createdAt: -1 });

        // Process addresses for products
        const processProductAddresses = async (products) => {
            return await Promise.all(products.map(async (product) => {
                const productObj = product.toObject();

                if (productObj.from) {
                    try {
                        const fromAddress = await Address.findById(productObj.from);
                        productObj.fromAddress = fromAddress;
                    } catch (error) {
                        console.error('Error fetching from address:', error);
                    }
                }

                if (productObj.to) {
                    try {
                        const toAddress = await Address.findById(productObj.to);
                        productObj.toAddress = toAddress;
                    } catch (error) {
                        console.error('Error fetching to address:', error);
                    }
                }

                return productObj;
            }));
        };

        const userProductsWithAddresses = await processProductAddresses(userProducts);
        const acceptedProductsWithAddresses = await processProductAddresses(acceptedProducts);

        res.status(200).json({
            userProducts: userProductsWithAddresses,
            userOrders,
            acceptedProducts: acceptedProductsWithAddresses,
            acceptedOrders,
            userTravels
        });
    } catch (error) {
        console.error('Error fetching user dashboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/products/:id/accept
router.post('/:id/accept', protectRoute, async (req, res) => {
  const { userId, vehicleType, tentativeTime, price } = req.body; // changed variable names for consistency
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          acceptedUsers: {
            userId,
            vehicleType,
            tentativeTime,
            price,
            status: 'accepted'
          }
        },
        $set: {
          status: 'accepted' // sets product status as 'accepted' if at least one user accepts
        }
      },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id/update-bid - Update bid price for accepted user
router.put('/:id/update-bid', protectRoute, async (req, res) => {
  const { userId, newPrice } = req.body;

  try {
    // Validate input
    if (!userId || !newPrice) {
      return res.status(400).json({ message: 'User ID and new price are required' });
    }

    // Find the product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the requester is either the accepted user themselves or the product creator
    const isAcceptedUser = product.acceptedUsers.some(user => user.userId.toString() === req.user._id.toString());
    const isProductCreator = product.createdBy.toString() === req.user._id.toString();

    if (!isAcceptedUser && !isProductCreator) {
      return res.status(403).json({ message: 'Only the accepted user or product creator can update bid prices' });
    }

    // If updating someone else's bid, must be the product creator
    if (userId !== req.user._id.toString() && !isProductCreator) {
      return res.status(403).json({ message: 'You can only update your own bid price' });
    }

    // Check if the userId is in acceptedUsers
    const acceptedUserExists = product.acceptedUsers.some(user => user.userId.toString() === userId);
    if (!acceptedUserExists) {
      return res.status(404).json({ message: 'Accepted user not found' });
    }

    // Update the specific accepted user's bid
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, 'acceptedUsers.userId': userId },
      {
        $set: {
          'acceptedUsers.$.price': newPrice
        }
      },
      { new: true }
    ).populate('createdBy', 'username profileImage')
     .populate('acceptedUsers.userId', 'username profileImage');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product or accepted user not found' });
    }

    res.status(200).json({
      message: 'Bid updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating bid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/user/:userId - Get products created by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Fetch products created by the user
    const products = await Product.find({ createdBy: userId })
      .populate('createdBy', 'username profileImage')
      .sort({ createdAt: -1 });

    // Fetch addresses for from and to fields
    const productsWithAddresses = await Promise.all(products.map(async (product) => {
      const productObj = product.toObject();

      // Fetch from address
      if (productObj.from) {
        try {
          const fromAddress = await Address.findById(productObj.from);
          productObj.fromAddress = fromAddress;
        } catch (error) {
          console.error('Error fetching from address:', error);
        }
      }

      // Fetch to address
      if (productObj.to) {
        try {
          const toAddress = await Address.findById(productObj.to);
          productObj.toAddress = toAddress;
        } catch (error) {
          console.error('Error fetching to address:', error);
        }
      }

      return productObj;
    }));

    res.status(200).json(productsWithAddresses);
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to populate product addresses
const populateProductAddresses = async (product) => {
  const productObj = product.toObject ? product.toObject() : product;
  
  if (productObj.fromLocation) {
    try {
      productObj.fromAddress = await Address.findById(productObj.fromLocation);
    } catch (error) {
      console.error('Error fetching from address:', error);
    }
  }
  
  if (productObj.toLocation) {
    try {
      productObj.toAddress = await Address.findById(productObj.toLocation);
    } catch (error) {
      console.error('Error fetching to address:', error);
    }
  }
  
  return productObj;
};

// Razorpay payment verification function
const verifyRazorpayPayment = (orderId, paymentId, signature) => {
  try {
    // Skip verification for mock/test payments
    const isMockPayment = paymentId.startsWith('pay_') && signature.startsWith('signature_');
    if (isMockPayment) {
      console.log('Mock payment detected, skipping signature verification');
      return true;
    }

    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
};

// PUT /api/products/:id/confirm-bid - Confirm a bid and set product to in-transit
router.put('/:id/confirm-bid', protectRoute, async (req, res) => {
  const { 
    userId, 
    razorpay_payment_id, 
    razorpay_order_id, 
    razorpay_signature, 
    paymentMethod 
  } = req.body;

  try {
    console.log("🔍 Confirm Bid Request for Product ID:", req.params.id);
    console.log("👤 User ID to confirm:", userId);
    console.log("🔑 Authenticated User ID:", req.user._id);

    // Validate input
    if (!userId) {
      console.log("❌ Validation failed: User ID is required");
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate payment details if payout is being marked as completed
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      console.log("❌ Payment details are required");
      return res.status(400).json({ message: 'Payment details are required' });
    }

    // Find product with accepted users populated
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'username profileImage')
      .populate('acceptedUsers.userId', 'username profileImage');

    if (!product) {
      console.log("❌ Product not found for ID:", req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log("📦 Found product:", product.Title);
    console.log("👑 Product created by:", product.createdBy?._id);

    // Check if user is the product owner
    if (product.createdBy._id.toString() !== req.user._id.toString()) {
      console.log("❌ Unauthorized: User is not the product owner");
      return res.status(403).json({ 
        message: 'Only product owner can confirm bids' 
      });
    }

    // Check if payout is already completed
    if (product.payoutStatus === 'completed') {
      console.log("⚠️ Payout already completed for product:", req.params.id);
      return res.status(400).json({ 
        message: "Payment has already been completed for this product" 
      });
    }

    // Check if product has accepted users
    if (!product.acceptedUsers || product.acceptedUsers.length === 0) {
      console.log("❌ No accepted users found for product:", req.params.id);
      return res.status(400).json({
        message: 'Product must have accepted users to confirm bid'
      });
    }

    // Find the accepted user
    const acceptedUserIndex = product.acceptedUsers.findIndex(
      user => user.userId._id.toString() === userId
    );

    if (acceptedUserIndex === -1) {
      console.log("❌ User not found in accepted users");
      return res.status(404).json({ message: 'Accepted user not found' });
    }

    const acceptedUser = product.acceptedUsers[acceptedUserIndex];
    console.log("💰 Accepted user details:", {
      username: acceptedUser.userId.username,
      price: acceptedUser.price
    });

    // VERIFY RAZORPAY PAYMENT
    const paymentVerified = verifyRazorpayPayment(
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature
    );

    if (!paymentVerified) {
      return res.status(400).json({ 
        message: 'Payment verification failed' 
      });
    }

    // Prepare payment details
    const paymentDetails = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod: paymentMethod || 'razorpay',
      paymentDate: new Date(),
      transactionId: razorpay_payment_id,
      paidAmount: acceptedUser.price
    };

    console.log("💾 Payment details to be stored:", paymentDetails);

    // Create update operations for all accepted users
    const updateOperations = {};
    
    // Set all accepted users to 'cancelled' first
    product.acceptedUsers.forEach((user, index) => {
      updateOperations[`acceptedUsers.${index}.status`] = 'cancelled';
    });
    
    // Then set the selected user to 'in-transit'
    updateOperations[`acceptedUsers.${acceptedUserIndex}.status`] = 'in-transit';
    
    // Update delivery details for the selected user
    updateOperations[`acceptedUsers.${acceptedUserIndex}.deliveryDetails.deliveryStatus`] = 'in-transit';
    updateOperations[`acceptedUsers.${acceptedUserIndex}.deliveryDetails.deliveryBoyId`] = userId;

    // Perform a single atomic update
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          status: 'in-transit',
          payoutStatus: 'completed',
          paymentDetails: paymentDetails,
          ...updateOperations
        }
      },
      { 
        new: true,
        runValidators: true 
      }
    )
    .populate('createdBy', 'username profileImage')
    .populate('acceptedUsers.userId', 'username profileImage');

    if (!updatedProduct) {
      console.log("❌ Failed to update product");
      return res.status(404).json({ message: 'Product not found after update' });
    }

    // Create an order for this product delivery
    const orderId = `PROD_ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const order = new Order({
        orderId,
        userId: req.user._id,
        productId: product._id,
        deliveryUserId: userId,
        items: [{
          productId: product._id,
          name: product.Title,
          price: acceptedUser.price,
          quantity: 1
        }],
        totalAmount: acceptedUser.price,
        deliveryCharges: 0,
        finalAmount: acceptedUser.price,
        deliveryType: 'product_delivery',
        paymentDetails: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          paymentMethod: paymentMethod || 'razorpay'
        },
        paymentStatus: 'completed',
        orderStatus: 'confirmed',
        deliveryStatus: 'in-transit',
        acceptedUsers: [{
          userId: userId,
          vehicleType: acceptedUser.vehicleType,
          tentativeTime: acceptedUser.tentativeTime,
          price: acceptedUser.price,
          status: 'in-transit'
        }]
      });

      await order.save();
      console.log("📦 Order created successfully:", orderId);

      // Populate addresses for the response
      const productResponse = await populateProductAddresses(updatedProduct);

      console.log("🎉 Bid confirmation completed successfully");
      console.log("📊 Final status:", {
        productStatus: updatedProduct.status,
        payoutStatus: updatedProduct.payoutStatus,
        deliveryStatus: updatedProduct.acceptedUsers[acceptedUserIndex]?.deliveryDetails?.deliveryStatus || 'not set'
      });

      res.status(200).json({
        success: true,
        message: 'Bid confirmed and payment completed successfully',
        product: productResponse,
        order: order,
        paymentDetails: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: acceptedUser.price,
          status: 'completed'
        }
      });

    } catch (orderError) {
      console.error("❌ Error creating order:", orderError);
      // If order creation fails, we should still respond with the product update
      const productResponse = await populateProductAddresses(updatedProduct);
      res.status(200).json({
        success: true,
        message: 'Bid confirmed and payment completed, but order creation failed',
        product: productResponse,
        orderError: orderError.message
      });
    }

  } catch (error) {
    console.error('❌ Error confirming bid:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while confirming bid',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update Delivery Status
router.patch('/:id/update-delivery-status', protectRoute, async (req, res) => {
  try {
    const { userId, deliveryStatus, currentLocation } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const bid = product.acceptedUsers.find(bid => bid.userId.toString() === userId);
    if (!bid) return res.status(404).json({ message: 'Bid not found' });

    bid.deliveryDetails.deliveryStatus = deliveryStatus;
    bid.status = deliveryStatus; // Update the accepted user's status

    if (currentLocation) {
      bid.deliveryDetails.currentLocation = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        timestamp: new Date()
      };
    }

    if (deliveryStatus === 'delivered') {
      bid.deliveryDetails.deliveredAt = new Date();
      product.status = 'delivered';
    }

    await product.save();
    res.json({ message: 'Delivery status updated successfully.', product });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Delivery Location
router.patch('/:id/update-location', protectRoute, async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;
    const { id: productId } = req.params;

    // Validate input
    if (!userId || lat === undefined || lng === undefined) {
      return res.status(400).json({ 
        message: 'User ID, latitude and longitude are required' 
      });
    }

    // Validate coordinates
    if (!validateCoordinates(lat, lng)) {
      return res.status(400).json({ 
        message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is authorized (must be the accepted user)
    const bid = product.acceptedUsers.find(bid => 
      bid.userId.toString() === userId && 
      bid.userId.toString() === req.user._id.toString()
    );
    
    if (!bid) {
      return res.status(403).json({ 
        message: 'You are not authorized to update location for this product' 
      });
    }

    // Check if bid is in a state that allows location updates
    if (!['accepted', 'in-transit'].includes(bid.status)) {
      return res.status(400).json({ 
        message: `Cannot update location for bid with status: ${bid.status}` 
      });
    }

    // Initialize deliveryDetails if it doesn't exist
    if (!bid.deliveryDetails) {
      bid.deliveryDetails = {};
    }

    bid.deliveryDetails.currentLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: new Date()
    };

    // Update delivery status if not already in-transit
    if (bid.status === 'accepted') {
      bid.status = 'in-transit';
      bid.deliveryDetails.deliveryStatus = 'in-transit';
      bid.deliveryDetails.deliveryBoyId = userId;
      
      // Also update product status
      if (product.status === 'accepted') {
        product.status = 'in-transit';
      }
    } else if (bid.deliveryDetails.deliveryStatus !== 'in-transit') {
      bid.deliveryDetails.deliveryStatus = 'in-transit';
    }

    await product.save();
    
    res.status(200).json({ 
      success: true,
      message: 'Location updated successfully.', 
      product,
      currentLocation: bid.deliveryDetails.currentLocation
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Add this middleware for handling multipart/form-data
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configure Cloudinary storage
const deliveryImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'delivery-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

const deliveryImageUpload = multer({ storage: deliveryImageStorage });

// Updated Upload Delivery Image route with file upload
router.patch('/:id/upload-delivery-image', protectRoute, deliveryImageUpload.single('image'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId, withBarcode = false } = req.body;
    const { id: productId } = req.params;

    console.log('📤 Upload delivery image request:', {
      productId,
      userId,
      withBarcode,
      file: req.file
    });

    // Validate input
    if (!userId) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    if (!req.file) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Image file is required' 
      });
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Check authorization
    const bid = product.acceptedUsers.find(bid => 
      bid.userId.toString() === userId && 
      bid.userId.toString() === req.user._id.toString()
    );
    
    if (!bid) {
      await session.abortTransaction();
      return res.status(403).json({ 
        success: false,
        message: 'You are not authorized to upload images for this product' 
      });
    }

    // Check if bid is in a state that allows image upload
    if (!['in-transit', 'delivered'].includes(bid.status)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: `Cannot upload images for bid with status: ${bid.status}. Bid must be in-transit or delivered` 
      });
    }

    // Initialize deliveryDetails if it doesn't exist
    if (!bid.deliveryDetails) {
      bid.deliveryDetails = {};
    }

    const imageUrl = req.file.path; // Cloudinary URL

    const isWithBarcode = String(withBarcode).toLowerCase() === 'true';
    if (isWithBarcode) {
      bid.deliveryDetails.deliveryImageWithBarcode = imageUrl;
      
      // Mark barcode as scanned if we're uploading barcode image
      if (!bid.deliveryDetails.barcodeScanned) {
        bid.deliveryDetails.barcodeScanned = true;
        bid.deliveryDetails.barcodeData = `barcode_${Date.now()}`;
        bid.deliveryDetails.barcodeScannedAt = new Date();
      }
    } else {
      bid.deliveryDetails.deliveryImage = imageUrl;
    }

    await product.save({ session });
    await session.commitTransaction();
    
    // Populate product for response
    const populatedProduct = await Product.findById(productId)
      .populate('createdBy', 'username profileImage')
      .populate('acceptedUsers.userId', 'username profileImage');
    
    res.status(200).json({ 
      success: true,
      message: 'Delivery image uploaded successfully.', 
      product: populatedProduct,
      imageType: isWithBarcode ? 'barcode_image' : 'delivery_image',
      imageUrl
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error uploading delivery image:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while uploading image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});

// Set Recipient Mobile and Generate OTP
router.patch('/:id/set-recipient', protectRoute, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId, recipientMobile } = req.body;
    const { id: productId } = req.params;

    // Validate input
    if (!userId || !recipientMobile) {
      return res.status(400).json({ 
        message: 'User ID and recipient mobile number are required' 
      });
    }

    // Validate phone number
    if (!validatePhoneNumber(recipientMobile)) {
      return res.status(400).json({ 
        message: 'Invalid phone number. Please provide a 10-digit mobile number' 
      });
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check authorization
    const bid = product.acceptedUsers.find(bid => 
      bid.userId.toString() === userId && 
      bid.userId.toString() === req.user._id.toString()
    );
    
    if (!bid) {
      await session.abortTransaction();
      return res.status(403).json({ 
        message: 'You are not authorized to set recipient for this product' 
      });
    }

    // Check if bid is in a state that allows setting recipient
    if (bid.status !== 'in-transit') {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: `Cannot set recipient for bid with status: ${bid.status}. Bid must be in-transit` 
      });
    }

    // Initialize deliveryDetails if it doesn't exist
    if (!bid.deliveryDetails) {
      bid.deliveryDetails = {};
    }

    // Generate OTP (6-digit random number)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    bid.deliveryDetails.recipientMobile = recipientMobile;
    bid.deliveryDetails.otpCode = otpCode;
    bid.deliveryDetails.otpVerified = false;

    // Update delivery status
    bid.deliveryDetails.deliveryStatus = 'in-transit';

    await product.save({ session });
    await session.commitTransaction();
    
    // TODO: Send OTP via SMS (implement your SMS service)
    // await sendSMS(recipientMobile, `Your OTP for delivery is: ${otpCode}`);
    
    res.status(200).json({ 
      success: true,
      message: 'Recipient mobile set successfully. OTP generated.', 
      otpCode,
      product,
      maskedMobile: recipientMobile.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error setting recipient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while setting recipient',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});

// Verify OTP
router.patch('/:id/verify-otp', protectRoute, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId, otpCode } = req.body;
    const { id: productId } = req.params;

    // Validate input
    if (!userId || !otpCode) {
      return res.status(400).json({ 
        message: 'User ID and OTP code are required' 
      });
    }

    // Validate OTP format
    if (!validateOTP(otpCode)) {
      return res.status(400).json({ 
        message: 'Invalid OTP format. OTP must be 6 digits' 
      });
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check authorization
    const bid = product.acceptedUsers.find(bid => 
      bid.userId.toString() === userId && 
      bid.userId.toString() === req.user._id.toString()
    );
    
    if (!bid) {
      await session.abortTransaction();
      return res.status(403).json({ 
        message: 'You are not authorized to verify OTP for this product' 
      });
    }

    // Check if deliveryDetails exists
    if (!bid.deliveryDetails || !bid.deliveryDetails.otpCode) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'OTP not generated for this delivery. Please set recipient first.' 
      });
    }

    // Verify OTP
    if (bid.deliveryDetails.otpCode !== otpCode) {
      // Optional: Implement OTP attempt tracking
      if (!bid.deliveryDetails.otpAttempts) {
        bid.deliveryDetails.otpAttempts = 1;
      } else {
        bid.deliveryDetails.otpAttempts += 1;
      }
      
      await product.save({ session });
      await session.abortTransaction();
      
      return res.status(400).json({ 
        message: 'Invalid OTP',
        attempts: bid.deliveryDetails.otpAttempts,
        maxAttempts: 3
      });
    }

    // OTP verified successfully
    bid.deliveryDetails.otpVerified = true;
    bid.deliveryDetails.deliveryStatus = 'delivered';
    bid.status = 'delivered';
    product.status = 'delivered';
    bid.deliveryDetails.deliveredAt = new Date();

    // Reset OTP attempts
    bid.deliveryDetails.otpAttempts = 0;

    await product.save({ session });
    await session.commitTransaction();
    
    // TODO: Send delivery confirmation notification to product owner
    
    res.status(200).json({ 
      success: true,
      message: 'OTP verified successfully. Delivery completed.', 
      product,
      deliveryTime: bid.deliveryDetails.deliveredAt
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});


// Mark Barcode as Scanned
router.patch('/:id/mark-barcode-scanned', protectRoute, async (req, res) => {
  try {
    const { userId, barcodeData } = req.body;
    const { id: productId } = req.params;

    // Validate input
    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID is required' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check authorization
    const bid = product.acceptedUsers.find(bid => 
      bid.userId.toString() === userId && 
      bid.userId.toString() === req.user._id.toString()
    );
    
    if (!bid) {
      return res.status(403).json({ 
        message: 'You are not authorized to mark barcode for this product' 
      });
    }

    // Initialize deliveryDetails if it doesn't exist
    if (!bid.deliveryDetails) {
      bid.deliveryDetails = {};
    }

    bid.deliveryDetails.barcodeScanned = true;
    bid.deliveryDetails.barcodeData = barcodeData || `scanned_${Date.now()}`;
    bid.deliveryDetails.barcodeScannedAt = new Date();

    await product.save();
    
    res.status(200).json({ 
      success: true,
      message: 'Barcode scanned successfully.', 
      product,
      scanTime: bid.deliveryDetails.barcodeScannedAt
    });
  } catch (error) {
    console.error('Error marking barcode as scanned:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while marking barcode',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route to check delivery requirements before marking as delivered
router.get('/:id/check-delivery-requirements', protectRoute, async (req, res) => {
  try {
    const { userId } = req.query;
    const { id: productId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID is required' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    const acceptedUser = product.acceptedUsers.find(user => 
      user.userId.toString() === userId &&
      user.userId.toString() === req.user._id.toString()
    );
    
    if (!acceptedUser) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not authorized to check requirements for this product' 
      });
    }

    const deliveryDetails = acceptedUser.deliveryDetails || {};
    
    // Check all requirements
    const checks = {
      // Required for delivery completion
      hasDeliveryImage: !!deliveryDetails.deliveryImage,
      hasDeliveryImageWithBarcode: !!deliveryDetails.deliveryImageWithBarcode,
      otpVerified: !!deliveryDetails.otpVerified,
      
      // Additional checks
      barcodeScanned: !!deliveryDetails.barcodeScanned,
      recipientMobileSet: !!deliveryDetails.recipientMobile,
      otpGenerated: !!deliveryDetails.otpCode,
      currentLocationSet: !!deliveryDetails.currentLocation,
      
      // Status checks
      bidStatus: acceptedUser.status,
      deliveryStatus: deliveryDetails.deliveryStatus,
      productStatus: product.status
    };

    // Requirements for marking as delivered
    const deliveryRequirementsMet = checks.hasDeliveryImage && 
                                   checks.hasDeliveryImageWithBarcode && 
                                   checks.otpVerified;

    // Requirements for in-transit
    const inTransitRequirementsMet = checks.currentLocationSet;

    // Overall status
    const canMarkDelivered = deliveryRequirementsMet && 
                            acceptedUser.status === 'in-transit' &&
                            product.status === 'in-transit';

    const canUpdateLocation = acceptedUser.status === 'accepted' || 
                             acceptedUser.status === 'in-transit';

    res.status(200).json({
      success: true,
      deliveryRequirements: {
        requiredForDelivery: deliveryRequirementsMet,
        requiredForInTransit: inTransitRequirementsMet,
        canMarkDelivered,
        canUpdateLocation
      },
      checks,
      nextSteps: {
        ...(checks.currentLocationSet ? {} : { updateLocation: 'Update current location' }),
        ...(checks.recipientMobileSet ? {} : { setRecipient: 'Set recipient mobile number' }),
        ...(checks.otpVerified ? {} : { verifyOTP: checks.otpGenerated ? 'Verify OTP' : 'Generate OTP first' }),
        ...(checks.hasDeliveryImage ? {} : { uploadImage: 'Upload delivery image' }),
        ...(checks.hasDeliveryImageWithBarcode ? {} : { uploadBarcodeImage: 'Upload barcode image' }),
        ...(checks.barcodeScanned ? {} : { scanBarcode: 'Scan barcode' })
      },
      currentStatus: {
        bid: acceptedUser.status,
        delivery: deliveryDetails.deliveryStatus || 'pending',
        product: product.status
      }
    });
  } catch (error) {
    console.error('Error checking delivery requirements:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while checking requirements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

// import express from 'express';
// import Product from '../models/Product.js';
// import Order from '../models/Order.js';
// import Travel from '../models/travel.js';
// import { Address } from '../models/UserDetails.js';
// import protectRoute from '../src/middleware/authMiddleware.js';
// import upload from '../middleware/upload.js';

// const uploadFields = upload.fields([
//   { name: 'image', maxCount: 1 },
//   { name: 'video', maxCount: 1 }
// ]);
// import mongoose from 'mongoose';

// const router = express.Router();

// router.post('/product', protectRoute, uploadFields, async (req, res) => {
//     try {
//         console.log('Received product creation request');
//         console.log('Body:', req.body);
//         console.log('Files:', req.files);

//         const { Title, fromLocation, toLocation, description, price, weight, veichelType } = req.body;

//         // Validate required fields
//         if (!Title || !fromLocation || !toLocation || !description || !price || !weight || !veichelType) {
//             console.log('Validation failed: missing required fields');
//             return res.status(400).json({ message: 'Please provide all required fields' });
//         }

//         // Validate that fromLocation and toLocation are valid ObjectId references
//         if (!mongoose.Types.ObjectId.isValid(fromLocation) || !mongoose.Types.ObjectId.isValid(toLocation)) {
//             return res.status(400).json({ message: 'Invalid address references' });
//         }

//         // Verify that the addresses exist and belong to the user
//         const fromAddress = await Address.findById(fromLocation);
//         const toAddress = await Address.findById(toLocation);

//         if (!fromAddress || !toAddress) {
//             return res.status(400).json({ message: 'Invalid address references' });
//         }

//         if (fromAddress.createdBy.toString() !== req.user._id.toString() || 
//             toAddress.createdBy.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'You can only use your own addresses' });
//         }

//         if (!req.files || !req.files.image) {
//             console.log('Validation failed: image not provided');
//             return res.status(400).json({ message: 'Image is required' });
//         }

//         console.log('Creating new product');
//         // Create new product
//         const newProduct = new Product({
//             Title,
//             fromLocation,
//             toLocation,
//             description,
//             price: parseFloat(price),
//             weight,
//             image: req.files.image[0].path, // Cloudinary URL
//             veichelType,
//             video: req.files.video ? req.files.video[0].path : null,
//             createdBy: req.user._id
//         });

//         console.log('Saving product to database');
//         // Save product to database
//         const savedProduct = await newProduct.save();
//         console.log('Product saved successfully:', savedProduct._id);
//         res.status(201).json(savedProduct);
//     } catch (error) {
//         console.error('Error adding product:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// router.get('/', async (req, res) => {
//     try {
//         const products = await Product.find()
//             .populate('createdBy', 'username profileImage')
//             .populate('acceptedUsers.userId', 'username profileImage');

//         // Fetch addresses for from and to fields
//         const productsWithAddresses = await Promise.all(products.map(async (product) => {
//             const productObj = product.toObject();

//             // Fetch from address
//             if (productObj.from) {
//                 try {
//                     const fromAddress = await Address.findById(productObj.from);
//                     productObj.fromAddress = fromAddress;
//                 } catch (error) {
//                     console.error('Error fetching from address:', error);
//                 }
//             }

//             // Fetch to address
//             if (productObj.to) {
//                 try {
//                     const toAddress = await Address.findById(productObj.to);
//                     productObj.toAddress = toAddress;
//                 } catch (error) {
//                     console.error('Error fetching to address:', error);
//                 }
//             }

//             return productObj;
//         }));

//         res.status(200).json(productsWithAddresses);
//     } catch (error) {
//         console.error('Error fetching products:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// router.get('/:id', async (req, res) => {
//     try {
//         const identifier = decodeURIComponent(req.params.id);
//         let product;
//         if (mongoose.Types.ObjectId.isValid(identifier)) {
//             product = await Product.findById(identifier).populate('createdBy', 'username profileImage').populate('acceptedUsers.userId', 'username profileImage');
//         } else {
//             product = await Product.findOne({ Title: identifier }).populate('createdBy', 'username profileImage').populate('acceptedUsers.userId', 'username profileImage');
//         }

//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         // Convert to object and fetch addresses
//         const productObj = product.toObject();

//         // Fetch from address
//         if (productObj.from) {
//             try {
//                 const fromAddress = await Address.findById(productObj.from);
//                 productObj.fromAddress = fromAddress;
//             } catch (error) {
//                 console.error('Error fetching from address:', error);
//             }
//         }

//         // Fetch to address
//         if (productObj.to) {
//             try {
//                 const toAddress = await Address.findById(productObj.to);
//                 productObj.toAddress = toAddress;
//             } catch (error) {
//                 console.error('Error fetching to address:', error);
//             }
//         }

//         res.status(200).json(productObj);
//     } catch (error) {
//         console.error('Error fetching product:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// router.get("/getAlluserSideProducts", async (req, res) => {
//     try {
//         const products = await Product.find()
//             .populate('createdBy', 'username profileImage')
//             .sort({ createdAt: -1 }); // Sort by creation date descending

//         // Fetch addresses for from and to fields
//         const productsWithAddresses = await Promise.all(products.map(async (product) => {
//             const productObj = product.toObject();

//             // Fetch from address
//             if (productObj.from) {
//                 try {
//                     const fromAddress = await Address.findById(productObj.from);
//                     productObj.fromAddress = fromAddress;
//                 } catch (error) {
//                     console.error('Error fetching from address:', error);
//                 }
//             }

//             // Fetch to address
//             if (productObj.to) {
//                 try {
//                     const toAddress = await Address.findById(productObj.to);
//                     productObj.toAddress = toAddress;
//                 } catch (error) {
//                     console.error('Error fetching to address:', error);
//                 }
//             }

//             return productObj;
//         }));

//         res.status(200).json(productsWithAddresses);
//     } catch (error) {
//         console.error("Error fetching products:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// });

// // Get user's dashboard data (products, accepted products, accepted orders)
// router.get('/user-dashboard/:userId', async (req, res) => {
//     try {
//         const { userId } = req.params;

//         // Get user's own products
//         const userProducts = await Product.find({ createdBy: userId })
//             .populate('createdBy', 'username profileImage')
//             .populate('acceptedUsers.userId', 'username profileImage')
//             .sort({ createdAt: -1 });

//         // Get products accepted by user
//         const acceptedProducts = await Product.find({
//             'acceptedUsers.userId': userId
//         })
//             .populate('createdBy', 'username profileImage')
//             .populate('acceptedUsers.userId', 'username profileImage')
//             .sort({ createdAt: -1 });

//         // Get orders created by user
//         const userOrders = await Order.find({ userId })
//             .populate('userId', 'username')
//             .populate('acceptedUsers.userId', 'username profileImage')
//             .populate('deliveryAddress')
//             .populate('shopId', 'name location')
//             .sort({ createdAt: -1 });

//         // Get orders accepted by user
//         const acceptedOrders = await Order.find({
//             'acceptedUsers.userId': userId
//         })
//             .populate('userId', 'username')
//             .populate('acceptedUsers.userId', 'username profileImage')
//             .populate('deliveryAddress')
//             .populate('shopId', 'name location')
//             .sort({ createdAt: -1 });

//         // Get user's travels
//         const userTravels = await Travel.find({ createdBy: userId })
//             .populate('createdBy', 'username')
//             .populate('requestedUsers.userId', 'username')
//             .populate('requestedUsers.productId', 'Title')
//             .sort({ createdAt: -1 });

//         // Process addresses for products
//         const processProductAddresses = async (products) => {
//             return await Promise.all(products.map(async (product) => {
//                 const productObj = product.toObject();

//                 if (productObj.from) {
//                     try {
//                         const fromAddress = await Address.findById(productObj.from);
//                         productObj.fromAddress = fromAddress;
//                     } catch (error) {
//                         console.error('Error fetching from address:', error);
//                     }
//                 }

//                 if (productObj.to) {
//                     try {
//                         const toAddress = await Address.findById(productObj.to);
//                         productObj.toAddress = toAddress;
//                     } catch (error) {
//                         console.error('Error fetching to address:', error);
//                     }
//                 }

//                 return productObj;
//             }));
//         };

//         const userProductsWithAddresses = await processProductAddresses(userProducts);
//         const acceptedProductsWithAddresses = await processProductAddresses(acceptedProducts);

//         res.status(200).json({
//             userProducts: userProductsWithAddresses,
//             userOrders,
//             acceptedProducts: acceptedProductsWithAddresses,
//             acceptedOrders,
//             userTravels
//         });
//     } catch (error) {
//         console.error('Error fetching user dashboard:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // POST /api/products/:id/accept
// router.post('/:id/accept', protectRoute, async (req, res) => {
//   const { userId, vehicleType, tentativeTime, price } = req.body; // changed variable names for consistency
//   try {
//     const product = await Product.findByIdAndUpdate(
//       req.params.id,
//       {
//         $push: {
//           acceptedUsers: {
//             userId,
//             vehicleType,
//             tentativeTime,
//             price,
//             status: 'accepted'
//           }
//         },
//         $set: {
//           status: 'accepted' // sets product status as 'accepted' if at least one user accepts
//         }
//       },
//       { new: true }
//     );
//     if (!product) return res.status(404).json({ message: "Product not found" });
//     res.json(product);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // PUT /api/products/:id/update-bid - Update bid price for accepted user
// router.put('/:id/update-bid', protectRoute, async (req, res) => {
//   const { userId, newPrice } = req.body;

//   try {
//     // Validate input
//     if (!userId || !newPrice) {
//       return res.status(400).json({ message: 'User ID and new price are required' });
//     }

//     // Find the product
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     // Check if the requester is either the accepted user themselves or the product creator
//     const isAcceptedUser = product.acceptedUsers.some(user => user.userId.toString() === req.user._id.toString());
//     const isProductCreator = product.createdBy.toString() === req.user._id.toString();

//     if (!isAcceptedUser && !isProductCreator) {
//       return res.status(403).json({ message: 'Only the accepted user or product creator can update bid prices' });
//     }

//     // If updating someone else's bid, must be the product creator
//     if (userId !== req.user._id.toString() && !isProductCreator) {
//       return res.status(403).json({ message: 'You can only update your own bid price' });
//     }

//     // Check if the userId is in acceptedUsers
//     const acceptedUserExists = product.acceptedUsers.some(user => user.userId.toString() === userId);
//     if (!acceptedUserExists) {
//       return res.status(404).json({ message: 'Accepted user not found' });
//     }

//     // Update the specific accepted user's bid
//     const updatedProduct = await Product.findOneAndUpdate(
//       { _id: req.params.id, 'acceptedUsers.userId': userId },
//       {
//         $set: {
//           'acceptedUsers.$.price': newPrice
//         }
//       },
//       { new: true }
//     ).populate('createdBy', 'username profileImage')
//      .populate('acceptedUsers.userId', 'username profileImage');

//     if (!updatedProduct) {
//       return res.status(404).json({ message: 'Product or accepted user not found' });
//     }

//     res.status(200).json({
//       message: 'Bid updated successfully',
//       product: updatedProduct
//     });
//   } catch (error) {
//     console.error('Error updating bid:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET /api/products/user/:userId - Get products created by a specific user
// router.get('/user/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Validate userId is a valid ObjectId
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: 'Invalid user ID' });
//     }

//     // Fetch products created by the user
//     const products = await Product.find({ createdBy: userId })
//       .populate('createdBy', 'username profileImage')
//       .sort({ createdAt: -1 });

//     // Fetch addresses for from and to fields
//     const productsWithAddresses = await Promise.all(products.map(async (product) => {
//       const productObj = product.toObject();

//       // Fetch from address
//       if (productObj.from) {
//         try {
//           const fromAddress = await Address.findById(productObj.from);
//           productObj.fromAddress = fromAddress;
//         } catch (error) {
//           console.error('Error fetching from address:', error);
//         }
//       }

//       // Fetch to address
//       if (productObj.to) {
//         try {
//           const toAddress = await Address.findById(productObj.to);
//           productObj.toAddress = toAddress;
//         } catch (error) {
//           console.error('Error fetching to address:', error);
//         }
//       }

//       return productObj;
//     }));

//     res.status(200).json(productsWithAddresses);
//   } catch (error) {
//     console.error('Error fetching user products:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });



// // Helper function to populate product addresses
// const populateProductAddresses = async (product) => {
//   const productObj = product.toObject ? product.toObject() : product;
  
//   if (productObj.fromLocation) {
//     try {
//       productObj.fromAddress = await Address.findById(productObj.fromLocation);
//     } catch (error) {
//       console.error('Error fetching from address:', error);
//     }
//   }
  
//   if (productObj.toLocation) {
//     try {
//       productObj.toAddress = await Address.findById(productObj.toLocation);
//     } catch (error) {
//       console.error('Error fetching to address:', error);
//     }
//   }
  
//   return productObj;
// };

// // Razorpay payment verification function
// const verifyRazorpayPayment = async (orderId, paymentId, signature) => {
//   try {
//     const crypto = require('crypto');
//     const body = orderId + "|" + paymentId;
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest('hex');
    
//     return expectedSignature === signature;
//   } catch (error) {
//     console.error('Error verifying Razorpay signature:', error);
//     return false;
//   }
// };

// // PUT /api/products/:id/confirm-bid - Confirm a bid and set product to in-transit
// router.put('/:id/confirm-bid', protectRoute, async (req, res) => {
//   const { 
//     userId, 
//     razorpay_payment_id, 
//     razorpay_order_id, 
//     razorpay_signature, 
//     paymentMethod 
//   } = req.body;

//   try {
//     console.log("🔍 Confirm Bid Request for Product ID:", req.params.id);
//     console.log("👤 User ID to confirm:", userId);
//     console.log("🔑 Authenticated User ID:", req.user._id);

//     // Validate input
//     if (!userId) {
//       console.log("❌ Validation failed: User ID is required");
//       return res.status(400).json({ message: 'User ID is required' });
//     }

//     // Validate payment details if payout is being marked as completed
//     if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
//       console.log("❌ Payment details are required");
//       return res.status(400).json({ message: 'Payment details are required' });
//     }

//     // Find product with accepted users populated
//     const product = await Product.findById(req.params.id)
//       .populate('createdBy', 'username profileImage')
//       .populate('acceptedUsers.userId', 'username profileImage');

//     if (!product) {
//       console.log("❌ Product not found for ID:", req.params.id);
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     console.log("📦 Found product:", product.Title);
//     console.log("👑 Product created by:", product.createdBy?._id);

//     // Check if user is the product owner
//     if (product.createdBy._id.toString() !== req.user._id.toString()) {
//       console.log("❌ Unauthorized: User is not the product owner");
//       return res.status(403).json({ 
//         message: 'Only product owner can confirm bids' 
//       });
//     }

//     // Check if payout is already completed
//     if (product.payoutStatus === 'completed') {
//       console.log("⚠️ Payout already completed for product:", req.params.id);
//       return res.status(400).json({ 
//         message: "Payment has already been completed for this product" 
//       });
//     }

//     // Check if product has accepted users
//     if (!product.acceptedUsers || product.acceptedUsers.length === 0) {
//       console.log("❌ No accepted users found for product:", req.params.id);
//       return res.status(400).json({
//         message: 'Product must have accepted users to confirm bid'
//       });
//     }

//     // Find the accepted user
//     const acceptedUserIndex = product.acceptedUsers.findIndex(
//       user => user.userId._id.toString() === userId
//     );

//     if (acceptedUserIndex === -1) {
//       console.log("❌ User not found in accepted users");
//       return res.status(404).json({ message: 'Accepted user not found' });
//     }

//     const acceptedUser = product.acceptedUsers[acceptedUserIndex];
//     console.log("💰 Accepted user details:", {
//       username: acceptedUser.userId.username,
//       price: acceptedUser.price
//     });

//     // VERIFY RAZORPAY PAYMENT
//     const paymentVerified = await verifyRazorpayPayment(
//       razorpay_order_id, 
//       razorpay_payment_id, 
//       razorpay_signature
//     );

//     if (!paymentVerified) {
//       return res.status(400).json({ 
//         message: 'Payment verification failed' 
//       });
//     }

//     // Prepare payment details
//     const paymentDetails = {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       paymentMethod: paymentMethod || 'razorpay',
//       paymentDate: new Date(),
//       transactionId: razorpay_payment_id,
//       paidAmount: acceptedUser.price
//     };

//     console.log("💾 Payment details to be stored:", paymentDetails);

//     // Create update operations for all accepted users
//     const updateOperations = {};
    
//     // Set all accepted users to 'cancelled' first
//     product.acceptedUsers.forEach((user, index) => {
//       updateOperations[`acceptedUsers.${index}.status`] = 'cancelled';
//     });
    
//     // Then set the selected user to 'in-transit'
//     updateOperations[`acceptedUsers.${acceptedUserIndex}.status`] = 'in-transit';
    
//     // Update delivery details for the selected user
//     updateOperations[`acceptedUsers.${acceptedUserIndex}.deliveryDetails.deliveryStatus`] = 'in-transit';
//     updateOperations[`acceptedUsers.${acceptedUserIndex}.deliveryDetails.deliveryBoyId`] = userId;

//     // Perform a single atomic update
//     const updatedProduct = await Product.findOneAndUpdate(
//       { _id: req.params.id },
//       {
//         $set: {
//           status: 'in-transit',
//           payoutStatus: 'completed',
//           paymentDetails: paymentDetails,
//           ...updateOperations
//         }
//       },
//       { 
//         new: true,
//         runValidators: true 
//       }
//     )
//     .populate('createdBy', 'username profileImage')
//     .populate('acceptedUsers.userId', 'username profileImage');

//     if (!updatedProduct) {
//       console.log("❌ Failed to update product");
//       return res.status(404).json({ message: 'Product not found after update' });
//     }

//     // Create an order for this product delivery
//     const orderId = `PROD_ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
//     try {
//       const order = new Order({
//         orderId,
//         userId: req.user._id,
//         productId: product._id,
//         deliveryUserId: userId,
//         items: [{
//           productId: product._id,
//           name: product.Title,
//           price: acceptedUser.price,
//           quantity: 1
//         }],
//         totalAmount: acceptedUser.price,
//         deliveryCharges: 0,
//         finalAmount: acceptedUser.price,
//         deliveryType: 'product_delivery',
//         paymentDetails: {
//           razorpay_order_id,
//           razorpay_payment_id,
//           razorpay_signature,
//           paymentMethod: paymentMethod || 'razorpay'
//         },
//         paymentStatus: 'completed',
//         orderStatus: 'confirmed',
//         deliveryStatus: 'in-transit',
//         acceptedUsers: [{
//           userId: userId,
//           vehicleType: acceptedUser.vehicleType,
//           tentativeTime: acceptedUser.tentativeTime,
//           price: acceptedUser.price,
//           status: 'in-transit'
//         }]
//       });

//       await order.save();
//       console.log("📦 Order created successfully:", orderId);

//       // Populate addresses for the response
//       const productResponse = await populateProductAddresses(updatedProduct);

//       console.log("🎉 Bid confirmation completed successfully");
//       console.log("📊 Final status:", {
//         productStatus: updatedProduct.status,
//         payoutStatus: updatedProduct.payoutStatus,
//         deliveryStatus: updatedProduct.acceptedUsers[acceptedUserIndex].deliveryDetails.deliveryStatus
//       });

//       res.status(200).json({
//         success: true,
//         message: 'Bid confirmed and payment completed successfully',
//         product: productResponse,
//         order: order,
//         paymentDetails: {
//           paymentId: razorpay_payment_id,
//           orderId: razorpay_order_id,
//           amount: acceptedUser.price,
//           status: 'completed'
//         }
//       });

//     } catch (orderError) {
//       console.error("❌ Error creating order:", orderError);
//       // If order creation fails, we should still respond with the product update
//       // You might want to implement a retry mechanism or notification here
//       res.status(200).json({
//         success: true,
//         message: 'Bid confirmed and payment completed, but order creation failed',
//         product: await populateProductAddresses(updatedProduct),
//         orderError: orderError.message
//       });
//     }

//   } catch (error) {
//     console.error('❌ Error confirming bid:', error);
    
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Validation error',
//         errors: error.errors 
//       });
//     }
    


// // Update Delivery Status
// router.patch('/:id/update-delivery-status', protectRoute, async (req, res) => {
//   try {
//     const { userId, deliveryStatus, currentLocation } = req.body;
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: 'Product not found' });

//     const bid = product.acceptedUsers.find(bid => bid.userId.toString() === userId);
//     if (!bid) return res.status(404).json({ message: 'Bid not found' });

//     bid.deliveryDetails.deliveryStatus = deliveryStatus;
//     bid.status = deliveryStatus; // Update the accepted user's status

//     if (currentLocation) {
//       bid.deliveryDetails.currentLocation = {
//         lat: currentLocation.lat,
//         lng: currentLocation.lng,
//         timestamp: new Date()
//       };
//     }

//     if (deliveryStatus === 'delivered') {
//       bid.deliveryDetails.deliveredAt = new Date();
//       product.status = 'delivered';
//     }

//     await product.save();
//     res.json({ message: 'Delivery status updated successfully.', product });
//   } catch (error) {
//     console.error('Error updating delivery status:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update Delivery Location
// router.patch('/:id/update-location', protectRoute, async (req, res) => {
//   try {
//     const { userId, lat, lng } = req.body;
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: 'Product not found' });

//     const bid = product.acceptedUsers.find(bid => bid.userId.toString() === userId);
//     if (!bid) return res.status(404).json({ message: 'Bid not found' });

//     bid.deliveryDetails.currentLocation = {
//       lat,
//       lng,
//       timestamp: new Date()
//     };

//     await product.save();
//     res.json({ message: 'Location updated successfully.', product });
//   } catch (error) {
//     console.error('Error updating location:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Upload Delivery Image
// router.patch('/:id/upload-delivery-image', protectRoute, async (req, res) => {
//   try {
//     const { userId, image, withBarcode = false } = req.body;
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: 'Product not found' });

//     const bid = product.acceptedUsers.find(bid => bid.userId.toString() === userId);
//     if (!bid) return res.status(404).json({ message: 'Bid not found' });

//     if (withBarcode) {
//       bid.deliveryDetails.deliveryImageWithBarcode = image;
//     } else {
//       bid.deliveryDetails.deliveryImage = image;
//     }

//     await product.save();
//     res.json({ message: 'Delivery image uploaded successfully.', product });
//   } catch (error) {
//     console.error('Error uploading delivery image:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Set Recipient Mobile and Generate OTP
// router.patch('/:id/set-recipient', protectRoute, async (req, res) => {
//   try {
//     const { userId, recipientMobile } = req.body;
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: 'Product not found' });

//     const bid = product.acceptedUsers.find(bid => bid.userId.toString() === userId);
//     if (!bid) return res.status(404).json({ message: 'Bid not found' });

//     // Generate OTP (6-digit random number)
//     const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
//     bid.deliveryDetails.recipientMobile = recipientMobile;
//     bid.deliveryDetails.otpCode = otpCode;
//     bid.deliveryDetails.otpVerified = false;

//     await product.save();
//     res.json({ 
//       message: 'Recipient mobile set successfully.', 
//       otpCode,
//       product 
//     });
//   } catch (error) {
//     console.error('Error setting recipient:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Verify OTP
// router.patch('/:id/verify-otp', protectRoute, async (req, res) => {
//   try {
//     const { userId, otpCode } = req.body;
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: 'Product not found' });

//     const bid = product.acceptedUsers.find(bid => bid.userId.toString() === userId);
//     if (!bid) return res.status(404).json({ message: 'Bid not found' });

//     if (bid.deliveryDetails.otpCode !== otpCode) {
//       return res.status(400).json({ message: 'Invalid OTP' });
//     }

//     bid.deliveryDetails.otpVerified = true;
//     bid.deliveryDetails.deliveryStatus = 'delivered';
//     bid.status = 'delivered'; // Update the accepted user's status
//     product.status = 'delivered';
//     bid.deliveryDetails.deliveredAt = new Date();

//     await product.save();
//     res.json({ message: 'OTP verified successfully. Delivery completed.', product });
//   } catch (error) {
//     console.error('Error verifying OTP:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Mark Barcode as Scanned
// router.patch('/:id/mark-barcode-scanned', protectRoute, async (req, res) => {
//   try {
//     const { userId, barcodeData } = req.body;
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: 'Product not found' });

//     const bid = product.acceptedUsers.find(bid => bid.userId.toString() === userId);
//     if (!bid) return res.status(404).json({ message: 'Bid not found' });

//     bid.deliveryDetails.barcodeScanned = true;
//     bid.deliveryDetails.barcodeData = barcodeData;

//     await product.save();
//     res.json({ message: 'Barcode scanned successfully.', product });
//   } catch (error) {
//     console.error('Error marking barcode as scanned:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Route to check delivery requirements before marking as delivered
// router.get('/:id/check-delivery-requirements', protectRoute, async (req, res) => {
//   try {
//     const { userId } = req.query;
//     const product = await Product.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     const acceptedUser = product.acceptedUsers.find(user => user.userId.toString() === userId);
//     if (!acceptedUser) {
//       return res.status(404).json({ message: 'User not found in accepted users' });
//     }

//     const deliveryDetails = acceptedUser.deliveryDetails;
    
//     // Check if all required steps are completed
//     const hasDeliveryImage = deliveryDetails.deliveryImage && deliveryDetails.deliveryImage.length > 0;
//     const hasDeliveryImageWithBarcode = deliveryDetails.deliveryImageWithBarcode && deliveryDetails.deliveryImageWithBarcode.length > 0;
//     const otpVerified = deliveryDetails.otpVerified;

//     // Note: barcode scan is optional for now, so we don't check it for requirements
//     const requirementsMet = hasDeliveryImage && hasDeliveryImageWithBarcode && otpVerified;

//     res.json({
//       requirementsMet,
//       hasDeliveryImage,
//       hasDeliveryImageWithBarcode,
//       otpVerified,
//       barcodeScanned: deliveryDetails.barcodeScanned // Optional, not required for now
//     });
//   } catch (error) {
//     console.error('Error checking delivery requirements:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// export default router;

