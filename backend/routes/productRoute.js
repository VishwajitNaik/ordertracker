import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Travel from '../models/travel.js';
import { Address } from '../models/UserDetails.js';
import protectRoute from '../src/middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);
import mongoose from 'mongoose';

const router = express.Router();

router.post('/product', protectRoute, uploadFields, async (req, res) => {
    try {
        console.log('Received product creation request');
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        const { Title, from, to, description, price, weight, veichelType } = req.body;

        // Validate required fields
        if (!Title || !from || !to || !description || !price || !weight || !veichelType) {
            console.log('Validation failed: missing required fields');
            return res.status(400).json({ message: 'Please provide all required fields' });
        }



        if (!req.files || !req.files.image) {
            console.log('Validation failed: image not provided');
            return res.status(400).json({ message: 'Image is required' });
        }

        console.log('Creating new product');
        // Create new product
        const newProduct = new Product({
            Title,
            from,
            to,
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
router.post('/products/:id/accept', protectRoute, async (req, res) => {
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
router.put('/products/:id/update-bid', protectRoute, async (req, res) => {
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

// PUT /api/products/:id/confirm-bid - Confirm a bid and set product to in-transit
router.put('/products/:id/confirm-bid', protectRoute, async (req, res) => {
  const { userId } = req.body;

  try {
    // Validate input
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // First check if user is the product owner and product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the product owner
    if (product.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only product owner can confirm bids' });
    }

    // Check if product is in accepted state
    console.log('Product status:', product.status, 'Type:', typeof product.status);
    if (product.status !== 'accepted') {
      return res.status(400).json({
        message: 'Product must be in accepted state to confirm bid',
        currentStatus: product.status
      });
    }

    // Check if the userId is in acceptedUsers
    const acceptedUserExists = product.acceptedUsers.some(
      user => user.userId.toString() === userId
    );

    if (!acceptedUserExists) {
      return res.status(404).json({ message: 'Accepted user not found' });
    }

    // Use findOneAndUpdate to avoid validation issues with messages
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, 'acceptedUsers.userId': userId },
      {
        $set: {
          status: 'in-transit',
          'acceptedUsers.$.status': 'in-transit'
        }
      },
      { new: true }
    ).populate('createdBy', 'username profileImage')
     .populate('acceptedUsers.userId', 'username profileImage');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product or accepted user not found' });
    }

    // Now update other accepted users to cancelled status using separate operations
    await Product.updateMany(
      {
        _id: req.params.id,
        'acceptedUsers.userId': { $ne: userId }
      },
      {
        $set: { 'acceptedUsers.$[].status': 'cancelled' }
      }
    );

    res.status(200).json({
      message: 'Bid confirmed successfully. Product is now in-transit.',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error confirming bid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
