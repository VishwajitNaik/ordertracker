// screens/WalletScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '@/constants/color';

export default function WalletScreen() {
  const { wallet, walletStats, fetchWalletBalance, fetchWalletStats, fetchWalletTransactions } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWalletBalance(),
        fetchWalletStats(),
        fetchWalletTransactions({ limit: 5 })
      ]);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>₹{wallet?.availableBalance?.toFixed(2) || '0.00'}</Text>
        
        <View style={styles.balanceDetails}>
          <Text style={styles.balanceDetail}>Total: ₹{wallet?.balance?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.balanceDetail}>Locked: ₹{wallet?.lockedBalance?.toFixed(2) || '0.00'}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>Add Money</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-up-circle" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="time" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>₹{walletStats?.thisMonthEarnings?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={styles.statValue}>₹{walletStats?.totalEarned?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Withdrawn</Text>
            <Text style={styles.statValue}>₹{walletStats?.totalWithdrawn?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>{walletStats?.totalTransactions || 0}</Text>
          </View>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.paymentMethodsCard}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        {wallet?.bankDetails?.accountNumber ? (
          <View style={styles.paymentMethod}>
            <Ionicons name="card" size={20} color="#666" />
            <Text style={styles.paymentText}>
              Bank: {wallet.bankDetails.bankName} ••••{wallet.bankDetails.accountNumber.slice(-4)}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPaymentButton}>
            <Text style={styles.addPaymentText}>+ Add Bank Account</Text>
          </TouchableOpacity>
        )}
        
        {wallet?.upiId ? (
          <View style={styles.paymentMethod}>
            <Ionicons name="phone-portrait" size={20} color="#666" />
            <Text style={styles.paymentText}>UPI: {wallet.upiId}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPaymentButton}>
            <Text style={styles.addPaymentText}>+ Add UPI ID</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceDetail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentMethodsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  addPaymentButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addPaymentText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});