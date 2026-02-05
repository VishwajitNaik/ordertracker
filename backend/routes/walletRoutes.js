// routes/wallet.js
import express from 'express';
import mongoose from 'mongoose';
import { Wallet, Transaction } from '../models/Wallet.js';
import protectRoute from '../src/middleware/authMiddleware.js';

const router = express.Router();

// Get wallet balance
router.get('/balance', protectRoute, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
      });
    }

    res.status(200).json({
      success: true,
      wallet: {
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        lockedBalance: wallet.lockedBalance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        bankDetails: wallet.bankDetails,
        upiId: wallet.upiId,
        isActive: wallet.isActive,
      },
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance',
      error: error.message,
    });
  }
});

// Add money to wallet
router.post('/add-money', protectRoute, async (req, res) => {
  try {
    const { amount, paymentMethod = 'razorpay', referenceId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
      });
    }

    // In real implementation, verify payment with Razorpay first
    // const paymentVerified = await verifyRazorpayPayment(referenceId, amount);
    // if (!paymentVerified) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Payment verification failed',
    //   });
    // }

    const transactionData = {
      description: `Wallet recharge of ₹${amount}`,
      paymentMethod,
      referenceId,
      metadata: {
        addedVia: 'manual',
        timestamp: new Date(),
      },
    };

    const { wallet: updatedWallet, transaction } = await wallet.addMoney(amount, transactionData);

    res.status(200).json({
      success: true,
      message: `₹${amount} added to wallet successfully`,
      wallet: {
        balance: updatedWallet.balance,
        availableBalance: updatedWallet.availableBalance,
      },
      transaction: {
        id: transaction.transactionId,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Error adding money to wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add money to wallet',
      error: error.message,
    });
  }
});

// Get transaction history
// Update the transactions route in wallet.js
router.get('/transactions', protectRoute, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type,
      status,
      paymentMethod,
      startDate,
      endDate 
    } = req.query;
    
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    
    // Apply filters
    if (type && ['credit', 'debit'].includes(type)) {
      query.type = type;
    }
    
    if (status && ['completed', 'pending', 'failed', 'cancelled'].includes(status)) {
      query.status = status;
    }
    
    if (paymentMethod && [
      'razorpay', 
      'upi', 
      'bank_transfer', 
      'delivery_earning', 
      'wallet'
    ].includes(paymentMethod)) {
      query.paymentMethod = paymentMethod;
    }
    
    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      transactions: transactions.map(txn => ({
        id: txn.transactionId,
        amount: txn.amount,
        type: txn.type,
        description: txn.description,
        status: txn.status,
        paymentMethod: txn.paymentMethod,
        referenceId: txn.referenceId,
        createdAt: txn.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
});

// Save bank details
router.post('/bank-details', protectRoute, async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'All bank details are required',
      });
    }

    // Validate IFSC code format (11 characters)
    if (ifscCode.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IFSC code format',
      });
    }

    // Validate account number (10-18 digits)
    if (!/^\d{10,18}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account number',
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
      });
    }

    wallet.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      isVerified: false, // In real app, verify with bank API
    };

    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Bank details saved successfully',
      bankDetails: wallet.bankDetails,
    });
  } catch (error) {
    console.error('Error saving bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save bank details',
      error: error.message,
    });
  }
});

// Save UPI ID
router.post('/upi-id', protectRoute, async (req, res) => {
  try {
    const { upiId } = req.body;

    if (!upiId) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID is required',
      });
    }

    // Validate UPI ID format
    if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UPI ID format',
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
      });
    }

    wallet.upiId = upiId;
    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'UPI ID saved successfully',
      upiId: wallet.upiId,
    });
  } catch (error) {
    console.error('Error saving UPI ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save UPI ID',
      error: error.message,
    });
  }
});

// Request withdrawal
router.post('/withdraw', protectRoute, async (req, res) => {
  try {
    const { amount, withdrawalMethod = 'bank' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    // Minimum withdrawal amount
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹100',
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Check if user has bank details for bank withdrawal
    if (withdrawalMethod === 'bank' && (!wallet.bankDetails || !wallet.bankDetails.accountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please add bank details before withdrawing',
      });
    }

    // Check if user has UPI ID for UPI withdrawal
    if (withdrawalMethod === 'upi' && !wallet.upiId) {
      return res.status(400).json({
        success: false,
        message: 'Please add UPI ID before withdrawing',
      });
    }

    // Check available balance
    if (wallet.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal',
        availableBalance: wallet.availableBalance,
      });
    }

    const withdrawalData = {
      description: `Withdrawal of ₹${amount} to ${withdrawalMethod === 'bank' ? 'bank account' : 'UPI'}`,
      referenceId: `WTH_${Date.now()}`,
      metadata: {
        withdrawalMethod,
        requestedAt: new Date(),
      },
    };

    const { wallet: updatedWallet, transaction } = await wallet.processWithdrawal(amount, withdrawalData);

    // In real implementation, initiate bank transfer/UPI transfer here
    // await initiatePayout(amount, withdrawalMethod === 'bank' ? wallet.bankDetails : wallet.upiId);

    res.status(200).json({
      success: true,
      message: `Withdrawal request of ₹${amount} processed successfully`,
      wallet: {
        balance: updatedWallet.balance,
        availableBalance: updatedWallet.availableBalance,
        totalWithdrawn: updatedWallet.totalWithdrawn,
      },
      transaction: {
        id: transaction.transactionId,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message,
    });
  }
});

// Get wallet statistics
router.get('/stats', protectRoute, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    
    console.log("wallet", wallet);
    

    if (!wallet) {
      return res.status(200).json({
        success: true,
        stats: {
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          totalTransactions: 0,
          thisMonthEarnings: 0,
        },
      });
    }

    // Calculate this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthEarnings = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'credit',
          status: 'completed',
          createdAt: { $gte: startOfMonth },
          paymentMethod: 'delivery_earning',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalTransactions = await Transaction.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      stats: {
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        lockedBalance: wallet.lockedBalance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        totalTransactions,
        thisMonthEarnings: thisMonthEarnings[0]?.total || 0,
        hasBankDetails: !!wallet.bankDetails?.accountNumber,
        hasUpiId: !!wallet.upiId,
      },
    });
  } catch (error) {
    console.error('Error fetching wallet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet statistics',
      error: error.message,
    });
  }
});

export default router;

