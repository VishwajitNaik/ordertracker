// app/wallet.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '@/constants/color';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status: string;
  paymentMethod: string;
  referenceId?: string;
  createdAt: string;
}

interface WalletStats {
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalTransactions: number;
  thisMonthEarnings: number;
  hasBankDetails: boolean;
  hasUpiId: boolean;
}

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  const [upiId, setUpiId] = useState('');
  const [showUpiModal, setShowUpiModal] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch wallet stats
      const statsRes = await fetch('http://localhost:3000/api/wallet/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch recent transactions
      const txnRes = await fetch('http://localhost:3000/api/wallet/transactions?limit=10', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const txnData = await txnRes.json();
      
      if (txnData.success) {
        setTransactions(txnData.transactions);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/wallet/add-money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod: 'razorpay',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', data.message);
        setShowAddMoneyModal(false);
        setAmount('');
        fetchWalletData();
        
        // In real implementation, open Razorpay checkout here
        // openRazorpayCheckout(amount);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error adding money:', error);
      Alert.alert('Error', 'Failed to add money');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!stats?.hasBankDetails && !stats?.hasUpiId) {
      Alert.alert(
        'Bank Details Required',
        'Please add bank details or UPI ID before withdrawing',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Details', onPress: () => setShowBankDetailsModal(true) }
        ]
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawalAmount),
          withdrawalMethod: stats?.hasBankDetails ? 'bank' : 'upi',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', data.message);
        setShowWithdrawModal(false);
        setWithdrawalAmount('');
        fetchWalletData();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error withdrawing money:', error);
      Alert.alert('Error', 'Failed to process withdrawal');
    }
  };

  const handleSaveBankDetails = async () => {
    const { accountHolderName, accountNumber, ifscCode, bankName } = bankDetails;
    
    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/wallet/bank-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankDetails),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', data.message);
        setShowBankDetailsModal(false);
        setBankDetails({
          accountHolderName: '',
          accountNumber: '',
          ifscCode: '',
          bankName: '',
        });
        fetchWalletData();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error saving bank details:', error);
      Alert.alert('Error', 'Failed to save bank details');
    }
  };

  const handleSaveUpiId = async () => {
    if (!upiId) {
      Alert.alert('Error', 'Please enter UPI ID');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/wallet/upi-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ upiId }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', data.message);
        setShowUpiModal(false);
        setUpiId('');
        fetchWalletData();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error saving UPI ID:', error);
      Alert.alert('Error', 'Failed to save UPI ID');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/wallet/transactions')}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchWalletData();
            }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{stats?.balance?.toFixed(2) || '0.00'}</Text>
          
          <View style={styles.balanceDetails}>
            <View style={styles.balanceDetailItem}>
              <Text style={styles.balanceDetailLabel}>This Month</Text>
              <Text style={styles.balanceDetailValue}>₹{stats?.thisMonthEarnings?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.balanceDetailItem}>
              <Text style={styles.balanceDetailLabel}>Total Earned</Text>
              <Text style={styles.balanceDetailValue}>₹{stats?.totalEarned?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.balanceDetailItem}>
              <Text style={styles.balanceDetailLabel}>Total Withdrawn</Text>
              <Text style={styles.balanceDetailValue}>₹{stats?.totalWithdrawn?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.addMoneyButton]}
              onPress={() => setShowAddMoneyModal(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={() => setShowWithdrawModal(true)}
              activeOpacity={0.8}
              disabled={!stats?.balance || stats.balance <= 0}
            >
              <MaterialIcons name="account-balance-wallet" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowBankDetailsModal(true)}
              activeOpacity={0.8}
            >
              <FontAwesome name="bank" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>
                {stats?.hasBankDetails ? 'Update Bank' : 'Add Bank'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowUpiModal(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="payment" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>
                {stats?.hasUpiId ? 'Update UPI' : 'Add UPI'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/wallet/transactions')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.noTransactions}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.noTransactionsText}>No transactions yet</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Ionicons
                      name={item.type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={24}
                      color={item.type === 'credit' ? '#10b981' : '#ef4444'}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.amountText,
                      item.type === 'credit' ? styles.creditAmount : styles.debitAmount
                    ]}>
                      {item.type === 'credit' ? '+' : '-'}₹{item.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.transactionStatus}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Money Modal */}
      <Modal
        visible={showAddMoneyModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Money to Wallet</Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <Text style={styles.modalSubtitle}>Quick Select</Text>
            <View style={styles.quickAmounts}>
              {[100, 500, 1000, 2000, 5000].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={styles.quickAmountButton}
                  onPress={() => setAmount(quickAmount.toString())}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickAmountText}>₹{quickAmount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddMoneyModal(false);
                  setAmount('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddMoney}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdraw Money</Text>
            <Text style={styles.modalSubtitle}>
              Available Balance: ₹{stats?.availableBalance?.toFixed(2) || '0.00'}
            </Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={withdrawalAmount}
                onChangeText={setWithdrawalAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <Text style={styles.infoText}>Minimum withdrawal: ₹100</Text>
            
            {stats?.hasBankDetails && (
              <View style={styles.withdrawMethod}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.withdrawMethodText}>Withdraw to Bank Account</Text>
              </View>
            )}
            
            {stats?.hasUpiId && (
              <View style={styles.withdrawMethod}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.withdrawMethodText}>Withdraw to UPI</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowWithdrawModal(false);
                  setWithdrawalAmount('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleWithdraw}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bank Details Modal */}
      <Modal
        visible={showBankDetailsModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bank Account Details</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Account Holder Name"
              value={bankDetails.accountHolderName}
              onChangeText={(text) => setBankDetails({...bankDetails, accountHolderName: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Account Number"
              value={bankDetails.accountNumber}
              onChangeText={(text) => setBankDetails({...bankDetails, accountNumber: text})}
              keyboardType="numeric"
              maxLength={18}
            />
            
            <TextInput
              style={styles.input}
              placeholder="IFSC Code"
              value={bankDetails.ifscCode}
              onChangeText={(text) => setBankDetails({...bankDetails, ifscCode: text.toUpperCase()})}
              maxLength={11}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Bank Name"
              value={bankDetails.bankName}
              onChangeText={(text) => setBankDetails({...bankDetails, bankName: text})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBankDetailsModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveBankDetails}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Save Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* UPI ID Modal */}
      <Modal
        visible={showUpiModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>UPI ID Details</Text>
            <Text style={styles.modalSubtitle}>Format: username@bankname</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter UPI ID"
              value={upiId}
              onChangeText={setUpiId}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUpiModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveUpiId}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Save UPI ID</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    margin: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceDetailItem: {
    alignItems: 'center',
  },
  balanceDetailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  balanceDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  addMoneyButton: {
    backgroundColor: '#10b981',
  },
  withdrawButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  transactionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  noTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTransactionsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  creditAmount: {
    color: '#10b981',
  },
  debitAmount: {
    color: '#ef4444',
  },
  transactionStatus: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    paddingVertical: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  withdrawMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  withdrawMethodText: {
    fontSize: 14,
    color: '#0f5132',
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});