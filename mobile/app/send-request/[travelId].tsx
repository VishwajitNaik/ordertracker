import React, { useState, useEffect } from "react";
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
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { ToastManager } from "@/components/Toast";

interface Travel {
  _id: string;
  veichelType: string;
  from: string;
  to: string;
  date: string;
  gotime: string;
  arrivaltime: string;
  createdBy?: {
    _id: string;
    username: string;
  };
}

interface Product {
  _id: string;
  Title: string;
  price: number;
  description: string;
  image: string;
  status: string;
}

interface Order {
  _id: string;
  orderId: string;
  totalAmount: number;
  finalAmount: number;
  orderStatus: string;
  deliveryStatus: string;
  items: Array<{
    itemDetails: {
      name: string;
      images: string[];
    };
  }>;
}

export default function SendRequest() {
  const { travelId } = useLocalSearchParams();
  const { user, token } = useAuthStore();
  const [travel, setTravel] = useState<Travel | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  
  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch travel details
        const travelRes = await fetch(`http://localhost:3000/api/travels/${travelId}`);
        const travelData = await travelRes.json();
        setTravel(travelData);

        // Fetch user's products
        if (user) {
          const productsRes = await fetch(`http://localhost:3000/api/products/user/${user._id}`);
          const productsData = await productsRes.json();
          
          // Filter out products that have already been requested for this travel
          const requestedProductIds = travelData.requestedUsers
            ?.filter((req: any) => req.userId._id === user._id && req.productId)
            .map((req: any) => req.productId._id || req.productId) || [];
          
          const availableProducts = productsData.filter((product: Product) => 
            !requestedProductIds.includes(product._id)
          );
          setProducts(availableProducts);

          // Fetch user's orders
          const ordersRes = await fetch(`http://localhost:3000/api/checkout/orders/user/${user._id}`);
          const ordersData = await ordersRes.json();
          
          // Filter out orders that have already been requested for this travel
          const requestedOrderIds = travelData.requestedUsers
            ?.filter((req: any) => req.userId._id === user._id && req.orderId)
            .map((req: any) => req.orderId._id || req.orderId) || [];
          
          const availableOrders = ordersData.filter((order: Order) => 
            !requestedOrderIds.includes(order._id)
          );
          setOrders(availableOrders);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        Alert.alert("Error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    if (travelId) fetchData();
  }, [travelId]);

  const handleSubmitRequest = async () => {
    if (activeTab === 'products' && !selectedProductId) {
      ToastManager.show("Please select a product", "error");
      return;
    }

    if (activeTab === 'orders' && !selectedOrderId) {
      ToastManager.show("Please select an order", "error");
      return;
    }

    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      ToastManager.show("Please enter a valid offer price", "error");
      return;
    }

    setRequestLoading(true);

    try {
      const requestBody: any = {
        price: parseFloat(offerPrice),
        message: message.trim()
      };

      if (activeTab === 'products') {
        requestBody.productId = selectedProductId;
      } else {
        requestBody.orderId = selectedOrderId;
      }

      const response = await fetch(`http://localhost:3000/api/travels/${travelId}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send request');
      }

      ToastManager.show(data.message || "Request sent successfully!", "success");
      
      // Clear the form
      setSelectedProductId('');
      setSelectedOrderId('');
      setOfferPrice('');
      setMessage('');
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err: any) {
      console.error("Failed to send request:", err);
      ToastManager.show(err.message || "Failed to send request. Please try again.", "error");
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading request form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!travel) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={100} color="#E0E0E0" />
          <Text style={styles.errorTitle}>Travel Not Found</Text>
          <Text style={styles.errorMessage}>
            The travel details you're looking for are not available.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Send Request</Text>
          <Text style={styles.headerSubtitle}>{travel.veichelType}</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Travel Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="map-outline" size={24} color={COLORS.primary} />
              <Text style={styles.summaryTitle}>Travel Summary</Text>
            </View>
            
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>From</Text>
                <Text style={styles.summaryValue}>{travel.from}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>To</Text>
                <Text style={styles.summaryValue}>{travel.to}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{formatDate(travel.date)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Departure</Text>
                <Text style={styles.summaryValue}>{formatTime(travel.gotime)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Arrival</Text>
                <Text style={styles.summaryValue}>{formatTime(travel.arrivaltime)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Host</Text>
                <Text style={styles.summaryValue}>{travel.createdBy?.username || 'Unknown'}</Text>
              </View>
            </View>
          </View>

          {/* Request Form */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
              <Text style={styles.formTitle}>Delivery Request</Text>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'products' && styles.tabActive]}
                onPress={() => {
                  setActiveTab('products');
                  setSelectedOrderId('');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
                  Products
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
                onPress={() => {
                  setActiveTab('orders');
                  setSelectedProductId('');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
                  Orders
                </Text>
              </TouchableOpacity>
            </View>

            {/* Product Selection */}
            {activeTab === 'products' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Product</Text>
                {products.filter(product => product.status !== 'delivered').length === 0 ? (
                  <View style={styles.noProductsContainer}>
                    <Ionicons name="cube-outline" size={40} color="#E0E0E0" />
                    <Text style={styles.noProductsText}>No available products</Text>
                    <Text style={styles.noProductsSubtext}>
                      {products.length === 0 
                        ? "Please add products to your profile to send delivery requests."
                        : "All your products have already been requested for this travel."}
                    </Text>
                  </View>
                ) : (
                  <ScrollView 
                    style={styles.productList}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {products.filter(product => product.status !== 'delivered').map((product) => (
                      <TouchableOpacity
                        key={product._id}
                        style={[
                          styles.productCard,
                          selectedProductId === product._id && styles.productCardSelected
                        ]}
                        onPress={() => setSelectedProductId(product._id)}
                        activeOpacity={0.8}
                      >
                        {product.image ? (
                          <View style={styles.productImageContainer}>
                            <Image 
                              source={{ uri: product.image }} 
                              style={styles.productImage} 
                            />
                          </View>
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <Ionicons name="cube-outline" size={24} color="#999" />
                          </View>
                        )}
                        <View style={styles.productInfo}>
                          <Text style={styles.productTitle} numberOfLines={2}>
                            {product.Title}
                          </Text>
                          <Text style={styles.productPrice}>
                            ₹{product.price}
                          </Text>
                          <View style={[styles.productStatus, product.status === 'pending' ? styles.statusPending : 
                            product.status === 'accepted' ? styles.statusAccepted : 
                            product.status === 'in-transit' ? styles.statusInTransit : styles.statusDelivered]}>
                            <Text style={[styles.productStatusText, product.status === 'pending' ? styles.statusTextPending : 
                              product.status === 'accepted' ? styles.statusTextAccepted : 
                              product.status === 'in-transit' ? styles.statusTextInTransit : styles.statusTextDelivered]}>
                              {product.status}
                            </Text>
                          </View>
                        </View>
                        {selectedProductId === product._id && (
                          <View style={styles.selectedIndicator}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Order Selection */}
            {activeTab === 'orders' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Order</Text>
                {orders.filter(order => order.deliveryStatus !== 'delivered').length === 0 ? (
                  <View style={styles.noProductsContainer}>
                    <Ionicons name="receipt-outline" size={40} color="#E0E0E0" />
                    <Text style={styles.noProductsText}>No available orders</Text>
                    <Text style={styles.noProductsSubtext}>
                      {orders.length === 0 
                        ? "Please place orders to send delivery requests."
                        : "All your orders have already been requested for this travel."}
                    </Text>
                  </View>
                ) : (
                  <ScrollView 
                    style={styles.productList}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {orders.filter(order => order.deliveryStatus !== 'delivered').map((order) => (
                      <TouchableOpacity
                        key={order._id}
                        style={[
                          styles.productCard,
                          selectedOrderId === order._id && styles.productCardSelected
                        ]}
                        onPress={() => setSelectedOrderId(order._id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.productImagePlaceholder}>
                          <Ionicons name="receipt-outline" size={24} color="#999" />
                        </View>
                        <View style={styles.productInfo}>
                          <Text style={styles.productTitle} numberOfLines={2}>
                            {order.orderId}
                          </Text>
                          <Text style={styles.productPrice}>
                            ₹{order.finalAmount}
                          </Text>
                          <View style={[styles.productStatus, 
                            order.deliveryStatus === 'accepted' ? styles.statusAccepted : 
                            order.deliveryStatus === 'in-transit' ? styles.statusInTransit : 
                            order.deliveryStatus === 'delivered' ? styles.statusDelivered : styles.statusPending]}>
                            <Text style={[styles.productStatusText, 
                              order.deliveryStatus === 'accepted' ? styles.statusTextAccepted : 
                              order.deliveryStatus === 'in-transit' ? styles.statusTextInTransit : 
                              order.deliveryStatus === 'delivered' ? styles.statusTextDelivered : styles.statusTextPending]}>
                              {order.deliveryStatus || 'pending'}
                            </Text>
                          </View>
                        </View>
                        {selectedOrderId === order._id && (
                          <View style={styles.selectedIndicator}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Offer Price */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Offer Price (₹)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={offerPrice}
                  onChangeText={setOfferPrice}
                  placeholder="Enter your offer price"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Message */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Message (Optional)</Text>
              <View style={styles.textareaContainer}>
                <TextInput
                  style={styles.textarea}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Add a message for the travel host"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                ((activeTab === 'products' && !selectedProductId) || 
                 (activeTab === 'orders' && !selectedOrderId) || 
                 !offerPrice || requestLoading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitRequest}
              disabled={(activeTab === 'products' && !selectedProductId) || 
                       (activeTab === 'orders' && !selectedOrderId) || 
                       !offerPrice || requestLoading}
              activeOpacity={0.8}
            >
              {requestLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Send Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    marginTop: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  summaryDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  noProductsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  noProductsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  noProductsSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  productList: {
    maxHeight: 140,
  },
  productCard: {
    width: 140,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  productCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F5E8',
  },
  productImageContainer: {
    height: 60,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  productStatus: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
  },
  statusAccepted: {
    backgroundColor: '#D1E7DD',
    borderColor: '#B7EBC4',
  },
  statusInTransit: {
    backgroundColor: '#cff4fc',
    borderColor: '#b6effb',
  },
  statusDelivered: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  productStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statusTextPending: {
    color: '#856404',
  },
  statusTextAccepted: {
    color: '#0f5132',
  },
  statusTextInTransit: {
    color: '#055160',
  },
  statusTextDelivered: {
    color: '#721c24',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  inputContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  textareaContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textarea: {
    padding: 16,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowColor: 'transparent',
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  backButton1: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});