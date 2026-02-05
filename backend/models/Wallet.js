// models/Wallet.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'bank_transfer', 'card', 'wallet', 'delivery_earning'],
    default: 'wallet',
  },
  referenceId: {
    type: String,
    trim: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  lockedBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalEarned: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0,
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  upiId: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastTransactionAt: Date,
}, { timestamps: true });

// Indexes
walletSchema.index({ userId: 1 });
walletSchema.index({ 'bankDetails.isVerified': 1 });
walletSchema.index({ balance: 1 });

// Drop old transaction index if it exists (for backward compatibility)
walletSchema.post('init', async function() {
  try {
    const collection = this.collection;
    const indexes = await collection.listIndexes().toArray();
    const oldIndex = indexes.find(idx => idx.name === 'transactions.transactionId_1');
    if (oldIndex) {
      console.log('Dropping old transactions.transactionId_1 index');
      await collection.dropIndex('transactions.transactionId_1');
    }
  } catch (error) {
    console.error('Error checking/dropping old index:', error);
  }
});

// Virtual for available balance
walletSchema.virtual('availableBalance').get(function() {
  return this.balance - this.lockedBalance;
});

// Method to add money
walletSchema.methods.addMoney = async function(amount, transactionData = {}) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  this.balance += amount;
  this.totalEarned += amount;
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  // Create transaction record
  const Transaction = mongoose.model('Transaction');
  const transaction = await Transaction.create({
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: this.userId,
    type: 'credit',
    amount,
    description: transactionData.description || 'Wallet top-up',
    status: 'completed',
    paymentMethod: transactionData.paymentMethod || 'razorpay',
    referenceId: transactionData.referenceId,
    metadata: transactionData.metadata || {},
  });

  return { wallet: this, transaction };
};

// Method to deduct money
walletSchema.methods.deductMoney = async function(amount, transactionData = {}) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (this.availableBalance < amount) {
    throw new Error('Insufficient balance');
  }

  this.balance -= amount;
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  // Create transaction record
  const Transaction = mongoose.model('Transaction');
  const transaction = await Transaction.create({
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: this.userId,
    type: 'debit',
    amount,
    description: transactionData.description || 'Wallet deduction',
    status: 'completed',
    paymentMethod: transactionData.paymentMethod || 'wallet',
    referenceId: transactionData.referenceId,
    metadata: transactionData.metadata || {},
  });

  return { wallet: this, transaction };
};

// Method to lock money (for pending transactions)
walletSchema.methods.lockMoney = async function(amount, reason = '') {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (this.availableBalance < amount) {
    throw new Error('Insufficient available balance');
  }

  this.lockedBalance += amount;
  await this.save();
  
  return this;
};

// Method to release locked money
walletSchema.methods.releaseLockedMoney = async function(amount, reason = '') {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (this.lockedBalance < amount) {
    throw new Error('Locked balance is less than requested amount');
  }

  this.lockedBalance -= amount;
  await this.save();
  
  return this;
};

// Method to process withdrawal
walletSchema.methods.processWithdrawal = async function(amount, withdrawalData = {}) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (this.availableBalance < amount) {
    throw new Error('Insufficient balance for withdrawal');
  }

  // For withdrawals, we'll first lock the money
  await this.lockMoney(amount, 'Withdrawal request');
  
  // In real scenario, you'd integrate with payment gateway here
  // For now, we'll simulate withdrawal
  this.balance -= amount;
  this.lockedBalance -= amount; // Release the locked amount
  this.totalWithdrawn += amount;
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  // Create transaction record
  const Transaction = mongoose.model('Transaction');
  const transaction = await Transaction.create({
    transactionId: `WTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: this.userId,
    type: 'debit',
    amount,
    description: withdrawalData.description || 'Withdrawal to bank account',
    status: 'completed',
    paymentMethod: 'bank_transfer',
    referenceId: withdrawalData.referenceId,
    metadata: withdrawalData.metadata || {},
  });

  return { wallet: this, transaction };
};

// Method to add delivery earnings
walletSchema.methods.addDeliveryEarning = async function(amount, productId, deliveryDetails = {}) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  this.balance += amount;
  this.totalEarned += amount;
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  // Create transaction record
  const Transaction = mongoose.model('Transaction');
  const transaction = await Transaction.create({
    transactionId: `DEL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: this.userId,
    type: 'credit',
    amount,
    description: `Delivery earning for product: ${productId}`,
    status: 'completed',
    paymentMethod: 'delivery_earning',
    referenceId: productId,
    metadata: {
      productId,
      deliveryDate: new Date(),
      ...deliveryDetails,
    },
  });

  return { wallet: this, transaction };
};

const Wallet = mongoose.model('Wallet', walletSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

export { Wallet, Transaction };

// import mongoose from 'mongoose';

// const walletTransactionSchema = new mongoose.Schema({
//   transactionId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   type: {
//     type: String,
//     enum: ['credit', 'debit'],
//     required: true
//   },
//   amount: {
//     type: Number,
//     required: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   paymentMethod: {
//     type: String,
//     enum: ['razorpay', 'upi', 'netbanking', 'phonepe', 'googlepay', 'bank transfer']
//   },
//   referenceId: {
//     type: String
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'completed', 'failed', 'refunded'],
//     default: 'pending'
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// const walletSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     unique: true
//   },
//   balance: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   transactions: [walletTransactionSchema],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Update updatedAt timestamp on every save
// walletSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// // Static method to find or create a wallet for a user
// walletSchema.statics.findOrCreate = async function(userId) {
//   let wallet = await this.findOne({ userId });
//   if (!wallet) {
//     wallet = await this.create({ userId, balance: 0 });
//   }
//   return wallet;
// };

// // Method to add money to wallet
// walletSchema.methods.addMoney = async function(amount, description, paymentMethod = 'razorpay', referenceId = null) {
//   const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
//   this.balance += amount;
//   this.transactions.push({
//     transactionId,
//     type: 'credit',
//     amount,
//     description,
//     paymentMethod,
//     referenceId,
//     status: 'completed'
//   });
  
//   return await this.save();
// };

// // Method to deduct money from wallet
// walletSchema.methods.deductMoney = async function(amount, description, referenceId = null) {
//   if (this.balance < amount) {
//     throw new Error('Insufficient balance');
//   }
  
//   const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
//   this.balance -= amount;
//   this.transactions.push({
//     transactionId,
//     type: 'debit',
//     amount,
//     description,
//     referenceId,
//     status: 'completed'
//   });
  
//   return await this.save();
// };

// // Method to get wallet balance
// walletSchema.methods.getBalance = function() {
//   return this.balance;
// };

// // Method to get transaction history
// walletSchema.methods.getTransactionHistory = function(limit = 50, offset = 0) {
//   return this.transactions.slice(offset, offset + limit).reverse();
// };

// const Wallet = mongoose.model('Wallet', walletSchema);

// export default Wallet;
