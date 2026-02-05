import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
// Mock Razorpay for testing - replace with actual implementation when native module works
const RazorpayCheckout = {
  open: async (options: any): Promise<{
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }> => {
    // Simulate payment success for testing
    console.log('Mock Razorpay: Opening payment with options:', options);
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResponse = {
          razorpay_order_id: options.order_id || `order_${Date.now()}`,
          razorpay_payment_id: `pay_${Date.now()}`,
          razorpay_signature: `signature_${Date.now()}`
        };
        console.log('Mock Razorpay: Payment successful', mockResponse);
        resolve(mockResponse);
      }, 2000); // Simulate 2 second payment processing
    });
  }
};

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  cartItems?: any[];
  singleItem?: any;
  totalAmount?: number;
  shopId?: string;
  // Bid confirmation specific properties
  isBidConfirmation?: boolean;
  bidAmount?: number;
  productId?: string;
  acceptedUserId?: string;
  onBidConfirm?: (paymentData: any) => Promise<void>;
}

interface Address {
  _id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface DeliveryOption {
  type: 'shop_delivery' | 'own_delivery';
  label: string;
  charges: number;
  description: string;
}

export default function CheckoutModal({ 
  visible, 
  onClose, 
  cartItems, 
  singleItem, 
  totalAmount, 
  shopId,
  isBidConfirmation = false,
  bidAmount = 0,
  productId,
  acceptedUserId,
  onBidConfirm
}: CheckoutModalProps) {
  const { user, token, wallet } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [shopInfo, setShopInfo] = useState<any>(null);

  // Determine checkout items and total based on type
  const checkoutItems = isBidConfirmation ? [] : (singleItem ? [{ subItemId: singleItem, quantity: 1, price: singleItem.Price }] : (cartItems || []));
  const checkoutTotal = isBidConfirmation ? bidAmount : (singleItem ? singleItem.Price : (totalAmount || 0));
  const checkoutShopId = isBidConfirmation ? null : (singleItem ? singleItem.parentItemId?.shop_id : shopId);

  // Form state
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'shop_delivery' | 'own_delivery'>('shop_delivery');
  const [customAddress, setCustomAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('razorpay');

  useEffect(() => {
    if (visible && user && token) {
      fetchAddresses();
      if (checkoutShopId) {
        fetchDeliveryOptions();
      }
    }
  }, [visible, user, token, checkoutShopId]);

  useEffect(() => {
    // Auto-select default address when addresses are loaded
    if (addresses.length > 0 && !selectedAddressId && !useCustomAddress) {
      const defaultAddr = addresses.find((addr: any) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      } else if (addresses.length > 0) {
        setSelectedAddressId(addresses[0]._id);
      }
    }
  }, [addresses]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/userdetails/addresses/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setAddresses(data);
        // Auto-select default address
        const defaultAddr = data.find((addr: Address) => (addr as any).isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchDeliveryOptions = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/checkout/delivery-options/${checkoutShopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDeliveryOptions(data.deliveryOptions);
        setShopInfo(data.shop);
      }
    } catch (error) {
      console.error('Error fetching delivery options:', error);
    }
  };

  const calculateFinalAmount = () => {
    const deliveryCharges = selectedDeliveryType === 'shop_delivery' ? 50 : 0; // Dummy charge
    return checkoutTotal + deliveryCharges;
  };

  const handlePayment = async () => {
    if (!isBidConfirmation) {
      // Regular checkout validation
      if (!selectedAddressId && !useCustomAddress) {
        Alert.alert('Error', 'Please select a delivery address');
        return;
      }

      if (useCustomAddress && (!customAddress.address || !customAddress.city || !customAddress.state || !customAddress.zipCode)) {
        Alert.alert('Error', 'Please fill in all custom address fields');
        return;
      }
    }

    setLoading(true);
    try {
      // Handle wallet payment separately
      if (selectedPaymentMethod === 'wallet') {
        // Check if user has sufficient balance
        if (!wallet || wallet.availableBalance < checkoutTotal) {
          Alert.alert('Error', 'Insufficient wallet balance');
          setLoading(false);
          return;
        }

        if (isBidConfirmation) {
          // Bid confirmation with wallet
          if (onBidConfirm && productId && acceptedUserId) {
            await onBidConfirm({
              paymentMethod: 'wallet',
              useWallet: true,
              walletAmount: Math.min(bidAmount, wallet.availableBalance)
            });
          } else if (productId && acceptedUserId) {
            // Use the auth store's confirmBid function with wallet payment data
            const confirmBid = useAuthStore.getState().confirmBid;
            await confirmBid(productId, acceptedUserId, {
              paymentMethod: 'wallet',
              useWallet: true,
              walletAmount: Math.min(bidAmount, wallet.availableBalance)
            });
          }
          Alert.alert(
            'Success',
            'Payment successful! Bid confirmed.',
            [
              {
                text: 'OK',
                onPress: () => {
                  onClose();
                }
              }
            ]
          );
        } else {
          // Regular checkout with wallet
          Alert.alert('Success', 'Wallet payment successful! Order placed.');
          onClose();
        }
        setLoading(false);
        return;
      }

      // Create Razorpay order for other payment methods
      // Ensure we're passing amount in rupees (not paisa) to backend as integer
      const orderAmount = isBidConfirmation ? Math.floor(bidAmount) : Math.floor(calculateFinalAmount());
      const orderResponse = await fetch('http://localhost:3000/api/checkout/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: orderAmount }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(orderData.message);
      }

      // Razorpay checkout options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Order Tracker',
        description: 'Purchase from Order Tracker',
        prefill: {
          email: user.email,
          contact: user.phone,
          name: user.username,
        },
        theme: { color: '#007AFF' },
        // Enable multiple payment methods
        method: ['card', 'netbanking', 'upi', 'wallet'],
      };

      // Show mock payment notice
      Alert.alert(
        'Mock Payment',
        'Using test payment system. In production, this will open Razorpay with multiple payment options.',
        [{ text: 'Continue' }]
      );

      // Open mock Razorpay checkout
      const paymentResponse = await RazorpayCheckout.open(options);

      if (isBidConfirmation) {
        // Bid confirmation flow
        if (onBidConfirm && productId && acceptedUserId) {
          await onBidConfirm({
            ...paymentResponse,
            paymentMethod: selectedPaymentMethod
          });
        } else if (productId && acceptedUserId) {
          // Use the auth store's confirmBid function with payment data
          const confirmBid = useAuthStore.getState().confirmBid;
          await confirmBid(productId, acceptedUserId, {
            ...paymentResponse,
            paymentMethod: selectedPaymentMethod
          });
        }
        Alert.alert(
          'Success',
          'Payment successful! Bid confirmed.',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
              }
            }
          ]
        );
      } else {
        // Regular checkout flow
        // Verify payment
        const verifyResponse = await fetch('http://localhost:3000/api/checkout/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            orderData: {
              deliveryType: selectedDeliveryType,
              deliveryAddressId: useCustomAddress ? null : selectedAddressId,
              customAddress: useCustomAddress ? customAddress : null,
              shopId: checkoutShopId,
              offers: [], // Dummy offers
              notes,
              paymentMethod: selectedPaymentMethod,
            },
          }),
        });

        const verifyData = await verifyResponse.json();
        if (verifyResponse.ok) {
          Alert.alert('Success', `Order placed successfully! Order ID: ${verifyData.orderId}`);
          onClose();
          // Refresh cart or navigate to orders
        } else {
          Alert.alert('Error', verifyData.message);
        }
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      if (error.code !== 'PAYMENT_CANCELLED') {
        Alert.alert('Error', error.message || 'Payment failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{isBidConfirmation ? 'Confirm Bid Payment' : 'Checkout'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Bid Confirmation Specific Content */}
            {isBidConfirmation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bid Confirmation</Text>
                <View style={styles.bidInfoContainer}>
                  <Text style={styles.bidInfoText}>You are about to confirm the bid and make payment.</Text>
                  <View style={styles.bidAmountContainer}>
                    <Text style={styles.bidAmountLabel}>Bid Amount:</Text>
                    <Text style={styles.bidAmountValue}>₹{bidAmount}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Regular Checkout Content */}
            {!isBidConfirmation && (
              <View>
                {/* Shop Information */}
                {shopInfo && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shop Information</Text>
                    <View style={styles.shopInfoContainer}>
                      <Text style={styles.shopInfoTitle}>Product from:</Text>
                      <Text style={styles.shopInfoText}>{shopInfo.name}</Text>
                      <Text style={styles.shopInfoAddress}>{shopInfo.location}</Text>
                    </View>
                  </View>
                )}

                {/* Delivery Address Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Select Delivery Address</Text>

              {/* Saved Addresses */}
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address._id}
                  style={[
                    styles.addressOption,
                    selectedAddressId === address._id && !useCustomAddress && styles.selectedAddress,
                  ]}
                  onPress={() => {
                    setSelectedAddressId(address._id);
                    setUseCustomAddress(false);
                  }}
                >
                  <View style={styles.addressContent}>
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    <Text style={styles.addressText}>
                      {address.address}, {address.city}, {address.state} - {address.zipCode}
                    </Text>
                  </View>
                  {selectedAddressId === address._id && !useCustomAddress && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}


              {/* Custom Address Option */}
              <TouchableOpacity
                style={[
                  styles.addressOption,
                  useCustomAddress && styles.selectedAddress,
                ]}
                onPress={() => setUseCustomAddress(true)}
              >
                <View style={styles.addressContent}>
                  <Text style={styles.addressLabel}>Use Different Address</Text>
                  <Text style={styles.addressText}>Enter a new delivery address</Text>
                </View>
                {useCustomAddress && (
                  <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>

              {/* Custom Address Form */}
              {useCustomAddress && (
                <View style={styles.customAddressForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Address"
                    value={customAddress.address}
                    onChangeText={(text) => setCustomAddress(prev => ({ ...prev, address: text }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={customAddress.city}
                    onChangeText={(text) => setCustomAddress(prev => ({ ...prev, city: text }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    value={customAddress.state}
                    onChangeText={(text) => setCustomAddress(prev => ({ ...prev, state: text }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="ZIP Code"
                    value={customAddress.zipCode}
                    onChangeText={(text) => setCustomAddress(prev => ({ ...prev, zipCode: text }))}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>

            {/* Delivery Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Options</Text>
              {deliveryOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.deliveryOption,
                    selectedDeliveryType === option.type && styles.selectedDelivery,
                  ]}
                  onPress={() => setSelectedDeliveryType(option.type)}
                >
                  <View style={styles.deliveryContent}>
                    <Text style={styles.deliveryLabel}>{option.label}</Text>
                    <Text style={styles.deliveryDescription}>{option.description}</Text>
                    <Text style={styles.deliveryCharges}>
                      {option.charges === 0 ? 'Free' : `₹${option.charges}`}
                    </Text>
                  </View>
                  {selectedDeliveryType === option.type && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Total:</Text>
                <Text style={styles.summaryValue}>₹{totalAmount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Charges:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDeliveryType === 'shop_delivery' ? '₹50' : '₹0'}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>₹{calculateFinalAmount()}</Text>
              </View>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethodContainer}>
                 {[
                  { key: 'phonepe', label: 'PhonePe', icon: 'phone-portrait-outline' },
                  { key: 'googlepay', label: 'Google Pay', icon: 'logo-google' },
                  { key: 'netbanking', label: 'Net Banking', icon: 'desktop-outline' },
                  { key: 'upi', label: 'UPI', icon: 'qr-code-outline' },
                  { key: 'razorpay', label: 'Credit/Debit Card', icon: 'card-outline' },
                  { 
                    key: 'wallet', 
                    label: 'Wallet', 
                    icon: 'wallet-outline',
                    subtitle: wallet ? `Balance: ₹${wallet.availableBalance.toFixed(2)}` : 'Balance: ₹0.00',
                    disabled: !wallet || wallet.availableBalance < checkoutTotal
                  },
                ].map((method) => (
                  <TouchableOpacity
                    key={method.key}
                    style={[
                      styles.paymentMethodOption,
                      selectedPaymentMethod === method.key && styles.selectedPaymentMethod,
                      method.disabled && styles.disabledPaymentMethod
                    ]}
                    onPress={() => !method.disabled && setSelectedPaymentMethod(method.key)}
                    disabled={method.disabled}
                  >
                    <Ionicons 
                      name={method.icon as any} 
                      size={20} 
                      color={method.disabled ? "#ccc" : "#007AFF"} 
                    />
                    <View style={styles.paymentMethodInfo}>
                      <Text style={[
                        styles.paymentMethodLabel,
                        method.disabled && styles.disabledText
                      ]}>
                        {method.label}
                      </Text>
                      {method.subtitle && (
                        <Text style={[
                          styles.paymentMethodSubtitle,
                          method.disabled && styles.disabledText
                        ]}>
                          {method.subtitle}
                        </Text>
                      )}
                    </View>
                    {selectedPaymentMethod === method.key && (
                      <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any special delivery instructions..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
              </View>
          )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payButton, loading && styles.disabledButton]}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={18} color="#fff" />
                  <Text style={styles.payButtonText}>
                    {isBidConfirmation ? `Pay ₹${bidAmount}` : `Pay ₹${calculateFinalAmount()}`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bidInfoContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  bidInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  bidAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  bidAmountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bidAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedAddress: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  customAddressForm: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedDelivery: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  deliveryContent: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  deliveryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deliveryCharges: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  payButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  shopInfoContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  shopInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  shopInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  shopInfoAddress: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  disabledPaymentMethod: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#ccc',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    flex: 1,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedPaymentMethod: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 8,
  },
});