import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { io } from 'socket.io-client';
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "@/constants/color";
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from "@react-native-picker/picker";
import CheckoutModal from "@/components/CheckoutModal";
import { RefreshControl } from "react-native";

const { width } = Dimensions.get('window');

interface UserInfo {
  _id: string;
  username: string;
  profileImage: string;
}

interface AcceptedUser {
  _id?: string;
  userId: UserInfo;
  vehicleType: string;
  tentativeTime: string;
  price: number;
  status: string;
  messages?: any[];
}

interface Address {
  _id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Product {
  _id: string;
  Title: string;
  fromLocation: string;
  toLocation: string;
  description: string;
  price?: number;
  weight: string;
  image: string;
  veichelType: string;
  video?: string;
  status: string;
  payoutStatus: string;
  paymentDetails?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    paymentMethod?: string;
    paymentDate?: Date;
    transactionId?: string;
    paidAmount?: number;
  };
  Type: string;
  createdBy?: UserInfo;
  acceptedUsers?: AcceptedUser[];
}

export default function SingleProduct() {
  const { product: productId, travelId, requestId, mode } = useLocalSearchParams();
  const { user, fetchVehicles, vehicles, acceptProduct, acceptTravelRequest, confirmBid } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showUpdatePrice, setShowUpdatePrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'bids'>('details');
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [tentativeTime, setTentativeTime] = useState("");
  const [acceptVehicleType, setAcceptVehicleType] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [fromAddress, setFromAddress] = useState<Address | null>(null);
  const [toAddress, setToAddress] = useState<Address | null>(null);
  const updateBid = useAuthStore((state) => state.updateBid);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [selectedBidUser, setSelectedBidUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleTyping = (typing: boolean) => {
    if (!socket || !selectedUser || !product) return;

    let roomId: string;

    if (user._id === product.createdBy?._id) {
      roomId = `${productId}-${selectedUser.userId._id}`;
    } else {
      roomId = `${productId}-${user._id}`;
    }

    socket.emit('typing', {
      roomId,
      userId: user._id,
      isTyping: typing
    });

    setIsTyping(typing);
  };

  const sendMessage = async () => {
    if (!socket || !messageInput.trim() || !product) return;

    let targetUserId: string;

    if (user._id === product.createdBy?._id) {
      if (!selectedUser) {
        Alert.alert('Error', 'Please select a user to chat with');
        return;
      }
      targetUserId = selectedUser.userId._id;
    } else {
      targetUserId = product.createdBy?._id!;
    }

    const messageData = {
      productId: productId as string,
      senderId: user._id,
      receiverId: targetUserId,
      message: messageInput.trim(),
      username: user.username
    };

    try {
      console.log('📤 Frontend: Sending message via Socket.IO:', messageData);
      socket.emit('sendMessage', messageData);

      const optimisticMessage = {
        ...messageData,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        senderId: user._id,
        read: false
      };

      setUserMessages(prev => [...prev, optimisticMessage]);
      setMessageInput('');
      handleTyping(false);

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const openChat = (acceptedUser: any) => {
    const isCreator = user._id === product?.createdBy?._id;
    const chatPartner = isCreator ? acceptedUser : { userId: product?.createdBy };

    setSelectedUser(chatPartner);

    if (isCreator) {
      const userMessages = acceptedUser.messages || [];
      setUserMessages(userMessages);
    } else {
      const userMessages = acceptedUser.messages || [];
      setUserMessages(userMessages);
    }

    setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
    setSelectedUser(null);
    setUserMessages([]);
    setShowUpdatePrice(false);
    setNewPrice('');
  };

  const updatePrice = async () => {
    if (!newPrice.trim() || !selectedUser) {
      Alert.alert("Error", "Please enter a new price");
      return;
    }

    try {
      await updateBid(productId as string, selectedUser.userId._id, parseFloat(newPrice));
      setShowUpdatePrice(false);
      setNewPrice('');
      fetchProductData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update price");
    }
  };

  const handleSubmitAccept = async () => {
    if (!productId) return;

    if (mode === 'accept' && travelId && requestId) {
      try {
        await acceptTravelRequest(
          travelId as string,
          user._id,
          productId as string,
          tentativeTime,
          acceptVehicleType,
          parseFloat(productPrice) || 0
        );
      } catch (error: any) {
        console.error('Error accepting travel request:', error);
        Alert.alert('Error', 'Failed to accept travel request');
        return;
      }
    }

    await acceptProduct(productId as string, {
      tentativeDeliveryTime: tentativeTime,
      acceptedVehicleType: acceptVehicleType,
      price: parseFloat(productPrice) || 0,
    });

    setAcceptModalVisible(false);
    setTentativeTime("");
    setProductPrice("");
    setAcceptVehicleType("");
    setSelectedVehicleId("");
    fetchProductData();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#FFA500';
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'in transit': return '#2196F3';
      case 'delivered': return '#8BC34A';
      default: return '#666';
    }
  };

  const fetchProductData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`http://localhost:3000/api/products/${productId}`);
      const data = await res.json();
      setProduct(data);
      
      if (data && data.fromLocation && data.toLocation) {
        fetchAddressDetails(data.fromLocation, data.toLocation);
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const fetchAddressDetails = async (fromAddressId: string, toAddressId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const [fromRes, toRes] = await Promise.all([
        fetch(`http://localhost:3000/api/userdetails/addresses/public/${fromAddressId}`),
        fetch(`http://localhost:3000/api/userdetails/addresses/public/${toAddressId}`)
      ]);

      const fromData = await fromRes.json();
      const toData = await toRes.json();

      if (fromRes.ok && fromData) setFromAddress(fromData);
      if (toRes.ok && toData) setToAddress(toData);
      
      if (!fromRes.ok || !fromData) {
        setFromAddress({
          _id: fromAddressId,
          label: 'Unknown Location',
          address: 'Address not available',
          city: '',
          state: '',
          zipCode: ''
        });
      }
      
      if (!toRes.ok || !toData) {
        setToAddress({
          _id: toAddressId,
          label: 'Unknown Location',
          address: 'Address not available',
          city: '',
          state: '',
          zipCode: ''
        });
      }
    } catch (error) {
      console.error("Failed to fetch address details:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);
 
  useEffect(() => {
    if (mode === 'accept' && travelId && requestId && product) {
      setAcceptModalVisible(true);
      
      const fetchTravelDetails = async () => {
        try {
          const travelRes = await fetch(`http://localhost:3000/api/travels/${travelId}`);
          const travelData = await travelRes.json();
          
          if (travelData && travelData.vehicleId) {
            const vehicleType = travelData.vehicleId.vehicleType || travelData.veichelType || '';
            setAcceptVehicleType(vehicleType);
            setTentativeTime(travelData.arrivaltime || '');
            setSelectedVehicleId(travelData.vehicleId._id || travelId);
          } else {
            setAcceptVehicleType(product.veichelType || '');
            setTentativeTime('');
            setSelectedVehicleId(travelId as string);
          }
          
          if (travelData.requestedUsers) {
            const request = travelData.requestedUsers.find(
              (req: any) => req.productId._id === productId
            );
            if (request) {
              setProductPrice(request.price?.toString() || '');
            }
          }
        } catch (error) {
          console.error('Error fetching travel details:', error);
          setAcceptVehicleType(product.veichelType || '');
          setTentativeTime('');
          setProductPrice('');
          setSelectedVehicleId(travelId as string);
        }
      };
      
      fetchTravelDetails();
    }
  }, [mode, travelId, requestId, product, productId]);
 
  useEffect(() => {
    if (!productId || !user || !product) return;

    const newSocket = io('http://localhost:3001');

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Frontend: Connected to Socket.IO server:', newSocket.id);

      newSocket.emit('joinProductChat', {
        productId: productId as string,
        userId: user._id
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Frontend: Disconnected from Socket.IO server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Frontend: Socket.IO connection error:', error);
    });

    newSocket.on('joined-product-chat', ({ productId }) => {
      console.log(`Joined product chat room: ${productId}`);
    });

    newSocket.on('join-error', (error) => {
      console.error('Failed to join product chat:', error);
      Alert.alert('Error', error);
    });

    newSocket.on('receiveMessage', (message) => {
      const { senderId, receiverId, productId: msgProductId } = message;

      if (msgProductId !== productId) return;

      const isMessageForCurrentUser = receiverId === user._id;
      const isMessageFromCurrentUser = senderId === user._id;

      if (!isMessageForCurrentUser && !isMessageFromCurrentUser) return;

      const isUserInvolved = senderId === user._id || receiverId === user._id;

      if (isUserInvolved) {
        if (user._id !== product?.createdBy?._id && senderId === product?.createdBy?._id && !selectedUser) {
          setSelectedUser({ userId: product?.createdBy });
        }

        setUserMessages(prev => {
          const existingIndex = prev.findIndex(m =>
            m.senderId === message.senderId &&
            m.receiverId === message.receiverId &&
            m.message === message.message &&
            m.timestamp === message.timestamp
          );

          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = message;
            return updated;
          }

          return [...prev, message];
        });
      }
    });

    newSocket.on('user-typing', ({ roomId, userId, isTyping }) => {
      if (selectedUser && roomId === `${productId}-${selectedUser.userId._id}`) {
        setOtherUserTyping(isTyping);
      }
    });

    newSocket.on('travelRequestAccepted', async (data) => {
      if (data.productId === productId) {
        fetchProductData();
      }
    });

    newSocket.on('bidConfirmed', async (data) => {
      console.log('🎧 BID CONFIRMED EVENT TRIGGERED:', data);
      if (data.productId === productId) {
        Alert.alert('Success', 'Bid confirmed successfully!');
        fetchProductData();
      }
    });

    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, [productId, user, product]);

// Replace the handleBidConfirm function in SingleProduct.tsx:
const handleBidConfirm = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  paymentMethod: string;
  paidAmount: number;
}) => {
  try {
    console.log('💰 Frontend: Calling confirmBid with payment data:', paymentData);
    
    // Call the confirmBid function with the CORRECT signature (3 parameters)
    const result = await confirmBid(
      productId as string, 
      selectedBidUser?.userId?._id,
      {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        paymentMethod: paymentData.paymentMethod,
        paidAmount: paymentData.paidAmount
      }
    );
    
    console.log('✅ Bid confirmation result:', result);
    Alert.alert('Success', 'Bid confirmed successfully!');
    
    // Refresh product data
    fetchProductData();
    setCheckoutModalVisible(false);
    
  } catch (error: any) {
    console.error('❌ Error confirming bid after payment:', error);
    Alert.alert('Error', error.message || 'Failed to confirm bid');
  }
};

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Loading product details...</Text>
    </View>
  );
  
  if (!product)
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchProductData}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Product Image & Basic Info */}
        <View style={styles.productHeader}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: product.image }} 
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, { color: getStatusColor(product.status) }]}>
                {product.status.toUpperCase()}
              </Text>
            </View>
            {product.payoutStatus === 'completed' && (
              <View style={styles.paymentStatusBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.paymentStatusText}>Paid</Text>
              </View>
            )}
          </View>
          
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{product.Title}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Estimated Value</Text>
              <Text style={styles.priceValue}>
                ₹{product.price || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <MaterialIcons 
              name="description" 
              size={20} 
              color={activeTab === 'details' ? COLORS.primary : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Details
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bids' && styles.activeTab]}
            onPress={() => setActiveTab('bids')}
          >
            <FontAwesome5 
              name="handshake" 
              size={18} 
              color={activeTab === 'bids' ? COLORS.primary : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'bids' && styles.activeTabText]}>
              Bids ({product.acceptedUsers?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'details' ? (
          <View style={styles.detailsContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Details</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailLabel}>From</Text>
                  <Text style={styles.detailValue}>
                    {fromAddress ? `${fromAddress.label} - ${fromAddress.address}, ${fromAddress.city}, ${fromAddress.state}` : 'Loading...'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="map-marker-check" size={20} color={COLORS.primary} />
                  <Text style={styles.detailLabel}>To</Text>
                  <Text style={styles.detailValue}>
                    {toAddress ? `${toAddress.label} - ${toAddress.address}, ${toAddress.city}, ${toAddress.state}` : 'Loading...'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product Specifications</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specCard}>
                  <MaterialCommunityIcons name="package-variant" size={24} color={COLORS.primary} />
                  <Text style={styles.specLabel}>Type</Text>
                  <Text style={styles.specValue}>{product.Type || 'General'}</Text>
                </View>
                <View style={styles.specCard}>
                  <FontAwesome5 name="weight-hanging" size={20} color={COLORS.primary} />
                  <Text style={styles.specLabel}>Weight</Text>
                  <Text style={styles.specValue}>{product.weight} kg</Text>
                </View>
                <View style={styles.specCard}>
                  <MaterialCommunityIcons name="truck" size={24} color={COLORS.primary} />
                  <Text style={styles.specLabel}>Vehicle</Text>
                  <Text style={styles.specValue}>{product.veichelType}</Text>
                </View>
              </View>
            </View>

            {/* Payment Status Section */}
            {product.payoutStatus === 'completed' && product.paymentDetails && (
              <View style={[styles.section, { backgroundColor: '#e8f5e8', borderColor: '#10b981' }]}>
                <View style={styles.deliveryTrackingHeader}>
                  <Ionicons name="card-outline" size={24} color="#10b981" />
                  <Text style={[styles.sectionTitle, { color: '#10b981', marginLeft: 12 }]}>
                    Payment Details
                  </Text>
                </View>
                <View style={styles.deliveryTrackingContent}>
                  <Text style={styles.deliveryStatus}>
                    Status: <Text style={{ fontWeight: '700', color: '#10b981' }}>Completed</Text>
                  </Text>
                  {product.paymentDetails.paymentMethod && (
                    <Text style={styles.deliveryDescription}>
                      Method: {product.paymentDetails.paymentMethod}
                    </Text>
                  )}
                  {product.paymentDetails.paidAmount && (
                    <Text style={styles.deliveryDescription}>
                      Amount: ₹{product.paymentDetails.paidAmount}
                    </Text>
                  )}
                  {product.paymentDetails.paymentDate && (
                    <Text style={styles.deliveryDescription}>
                      Date: {new Date(product.paymentDetails.paymentDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Delivery Tracking Section */}
            {(product.status === 'accepted' || product.status === 'in-transit') && (
              <View style={[styles.section, { backgroundColor: '#e8f5e8', borderColor: '#4CAF50' }]}>
                <View style={styles.deliveryTrackingHeader}>
                  <Ionicons name="locate-outline" size={24} color="#2E7D32" />
                  <Text style={[styles.sectionTitle, { color: '#2E7D32', marginLeft: 12 }]}>
                    Delivery Tracking
                  </Text>
                </View>
                <View style={styles.deliveryTrackingContent}>
                  <Text style={styles.deliveryStatus}>
                    Status: <Text style={{ fontWeight: '700', color: '#2E7D32' }}>{product.status}</Text>
                  </Text>
                  <Text style={styles.deliveryDescription}>
                    Track your delivery in real-time and get updates on the delivery progress.
                  </Text>
                  <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => router.push(`/delivery-tracking/${product._id}`)}
                  >
                    <Ionicons name="navigate-outline" size={20} color="#fff" />
                    <Text style={styles.trackButtonText}>Track Delivery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {product.createdBy && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shipper Information</Text>
                <View style={styles.creatorCard}>
                  <Image 
                    source={{ uri: product.createdBy.profileImage }} 
                    style={styles.creatorAvatar} 
                  />
                  <View style={styles.creatorInfo}>
                    <Text style={styles.creatorName}>{product.createdBy.username}</Text>
                    <Text style={styles.creatorRole}>Shipper</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>4.8 (120 deliveries)</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.messageIconButton}
                    onPress={() => {
                      if (product.acceptedUsers && product.acceptedUsers.length > 0) {
                        const acceptedUser = product.acceptedUsers[0];
                        openChat(acceptedUser);
                      } else {
                        Alert.alert('Info', 'No accepted bids to chat with');
                      }
                    }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.bidsContainer}>
            <Text style={styles.bidsTitle}>Active Bids</Text>
            
            {Array.isArray(product.acceptedUsers) && product.acceptedUsers.length > 0 ? (
              product.acceptedUsers
                .filter(accepted => user?._id === product.createdBy?._id || accepted.userId._id === user?._id)
                .map((accepted, idx) => (
                  <View key={accepted._id || idx} style={styles.bidCard}>
                    <View style={styles.bidHeader}>
                      <Image 
                        source={{ uri: accepted.userId.profileImage }} 
                        style={styles.bidderAvatar} 
                      />
                      <View style={styles.bidderInfo}>
                        <Text style={styles.bidderName}>{accepted.userId.username}</Text>
                        <View style={styles.bidderStatus}>
                          <View style={[
                            styles.statusDot, 
                            { backgroundColor: getStatusColor(accepted.status) }
                          ]} />
                          <Text style={styles.bidderStatusText}>{accepted.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.bidPrice}>₹{accepted.price}</Text>
                    </View>
                    
                    <View style={styles.bidDetails}>
                      <View style={styles.bidDetailItem}>
                        <MaterialCommunityIcons name="truck" size={16} color="#666" />
                        <Text style={styles.bidDetailText}>{accepted.vehicleType}</Text>
                      </View>
                      <View style={styles.bidDetailItem}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                        <Text style={styles.bidDetailText}>{accepted.tentativeTime}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.bidActions}>
                      {product.status !== 'delivered' && accepted.status !== 'cancelled' && (
                        <TouchableOpacity
                          style={styles.chatButton}
                          onPress={() => openChat(accepted)}
                        >
                          <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                          <Text style={styles.chatButtonText}>Chat</Text>
                        </TouchableOpacity>
                      )}

                      {user?._id === product.createdBy?._id && accepted.status === 'accepted' && product.payoutStatus !== 'completed' && (
                        <TouchableOpacity
                          style={styles.confirmBidButton}
                          onPress={() => {
                            setSelectedBidUser(accepted);
                            setCheckoutModalVisible(true);
                          }}
                        >
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          <Text style={styles.confirmBidButtonText}>Confirm & Pay</Text>
                        </TouchableOpacity>
                      )}
                      {user?._id === product.createdBy?._id && accepted.status === 'accepted' && product.payoutStatus === 'completed' && (
                        <View style={styles.payoutCompletedBadge}>
                          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                          <Text style={styles.payoutCompletedText}>Payment Completed</Text>
                        </View>
                      )}

                      {user?._id === product?.createdBy?._id && accepted.status === 'accepted' && (
                        <TouchableOpacity
                          style={styles.updateBidButton}
                          onPress={() => {
                            setSelectedUser(accepted);
                            setShowUpdatePrice(true);
                          }}
                        >
                          <MaterialIcons name="edit" size={18} color={COLORS.primary} />
                          <Text style={styles.updateBidButtonText}>Update Price</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
            ) : (
              <View style={styles.noBidsContainer}>
                <MaterialCommunityIcons name="truck-remove" size={64} color="#DDD" />
                <Text style={styles.noBidsText}>No bids yet</Text>
                <Text style={styles.noBidsSubtext}>Be the first to bid on this delivery</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {user && product.createdBy && user._id !== product.createdBy._id && !product.acceptedUsers?.some(accepted => accepted.userId._id === user._id) ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => setAcceptModalVisible(true)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Accept Product</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.callButton]}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Call Shipper</Text>
              </TouchableOpacity>
            </>
          )}
          
          {/* Track Delivery Button */}
          {product && (product.status === 'in-transit' || product.status === 'accepted') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#28a745' }]}
              onPress={() => router.push(`/delivery-tracking/${product._id}`)}
            >
              <Ionicons name="locate-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Track Delivery</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Chat Modal */}
      {showChat && selectedUser && product.status !== 'delivered' && (
        <View style={styles.chatModal}>
          <View style={styles.chatHeader}>
            <View style={styles.chatUserInfo}>
              <Image 
                source={{ uri: user?._id === product?.createdBy?._id ? 
                  selectedUser.userId.profileImage : 
                  product?.createdBy?.profileImage 
                }} 
                style={styles.chatAvatar}
              />
              <View>
                <Text style={styles.chatUserName}>
                  {user?._id === product?.createdBy?._id ? 
                    selectedUser.userId.username : 
                    product?.createdBy?.username
                  }
                </Text>
                <View style={styles.chatStatus}>
                  <View style={[
                    styles.onlineIndicator, 
                    { backgroundColor: onlineUsers.includes(
                      user?._id === product?.createdBy?._id ? 
                      selectedUser.userId._id : 
                      product?.createdBy?._id
                    ) ? '#4CAF50' : '#999' }
                  ]} />
                  <Text style={styles.chatStatusText}>
                    {otherUserTyping ? 'Typing...' : 
                     onlineUsers.includes(
                       user?._id === product?.createdBy?._id ? 
                       selectedUser.userId._id : 
                       product?.createdBy?._id
                     ) ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.chatHeaderActions}>
              <TouchableOpacity onPress={closeChat}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
          
          <FlatList
            data={[...userMessages].reverse()}
            keyExtractor={(item) => item._id || item.timestamp}
            renderItem={({ item }) => {
              const isOwnMessage = item.senderId === user._id || item.userId === user._id;
              
              return (
                <View style={[
                  styles.messageContainer,
                  isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
                ]}>
                  {!isOwnMessage && (
                    <Image 
                      source={{ uri: item.senderAvatar || 'https://via.placeholder.com/40' }} 
                      style={styles.messageAvatar}
                    />
                  )}
                  <View style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                    ]}>
                      {item.message}
                    </Text>
                    <View style={styles.messageMeta}>
                      <Text style={styles.messageTime}>
                        {new Date(item.createdAt || item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      {isOwnMessage && (
                        <Ionicons
                          name={item.read ? "checkmark-done" : "checkmark"}
                          size={14}
                          color={item.read ? "#007AFF" : "#999"}
                          style={styles.messageStatus}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            inverted={true}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
          />
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={messageInput}
              onChangeText={(text) => {
                setMessageInput(text);
                handleTyping(text.length > 0);
              }}
              onBlur={() => handleTyping(false)}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !messageInput.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!messageInput.trim()}
            >
              <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Update Price Modal */}
      {showUpdatePrice && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {user?._id === product?.createdBy?._id ? 'Update Bid Price' : 'Update Your Bid'}
            </Text>
            <Text style={styles.modalSubtitle}>Enter your new price for this delivery</Text>
            
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.priceModalInput}
                value={newPrice}
                onChangeText={setNewPrice}
                placeholder="0.00"
                keyboardType="numeric"
                autoFocus
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUpdatePrice(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={updatePrice}
              >
                <Text style={styles.confirmButtonText}>
                  {user?._id === product?.createdBy?._id ? 'Update Price' : 'Update Bid'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Accept Product Modal */}
      {acceptModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Delivery Details</Text>
              <TouchableOpacity onPress={() => setAcceptModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Tentative Delivery Time (e.g., 18:00 or 2 hours)"
              value={tentativeTime}
              onChangeText={setTentativeTime}
              style={styles.input}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Your Vehicle:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedVehicleId}
                  onValueChange={(itemValue) => {
                    setSelectedVehicleId(itemValue);
                    if (itemValue) {
                      const selectedVehicle = vehicles.find(v => v._id === itemValue);
                      setAcceptVehicleType(selectedVehicle ? `${selectedVehicle.vehicleType} - ${selectedVehicle.vehicleNumber}` : "");
                    } else {
                      setAcceptVehicleType("");
                    }
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a vehicle..." value="" />
                  {vehicles
                    .filter(vehicle => vehicle.verificationStatus === 'approved')
                    .map((vehicle) => (
                      <Picker.Item
                        key={vehicle._id}
                        label={`${vehicle.vehicleType} - ${vehicle.vehicleNumber} (${vehicle.vehicleModel || 'No model'})`}
                        value={vehicle._id}
                      />
                    ))
                  }
                </Picker>
              </View>
            </View>

            {acceptVehicleType ? (
              <View style={styles.selectedVehicleInfo}>
                <Text style={styles.selectedVehicleText}>Selected: {acceptVehicleType}</Text>
              </View>
            ) : null}

            <TextInput
              placeholder="Price (in Rs.)"
              value={productPrice}
              onChangeText={setProductPrice}
              style={styles.input}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setAcceptModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleSubmitAccept}>
                <Text style={styles.modalButtonText}>Confirm Acceptance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Checkout Modal for Bid Confirmation */}
      <CheckoutModal
        visible={checkoutModalVisible}
        onClose={() => setCheckoutModalVisible(false)}
        isBidConfirmation={true}
        bidAmount={selectedBidUser?.price}
        productId={productId as string}
        acceptedUserId={selectedBidUser?.userId?._id}
        onBidConfirm={handleBidConfirm}
      />
    </SafeAreaView>
  );
}

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   ScrollView,
//   TouchableOpacity,
//   TextInput,
//   FlatList,
//   Alert,
//   Dimensions,
//   SafeAreaView,
//   StatusBar,
// } from "react-native";
// import { useLocalSearchParams, router } from "expo-router";
// import { useAuthStore } from "@/store/authStore";
// import { io } from 'socket.io-client';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import COLORS from "@/constants/color";
// import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
// import { Picker } from "@react-native-picker/picker";
// import CheckoutModal from "@/components/CheckoutModal";

// const { width } = Dimensions.get('window');

// interface UserInfo {
//   _id: string;
//   username: string;
//   profileImage: string;
// }

// interface AcceptedUser {
//   _id?: string;
//   userId: UserInfo;
//   vehicleType: string;
//   tentativeTime: string;
//   price: number;
//   status: string;
//   messages?: any[];
// }

// interface Address {
//   _id: string;
//   label: string;
//   address: string;
//   city: string;
//   state: string;
//   zipCode: string;
// }

// interface Product {
//   _id: string;
//   Title: string;
//   fromLocation: string; // Address ID
//   toLocation: string; // Address ID
//   description: string;
//   price?: number;
//   weight: string;
//   image: string;
//   veichelType: string;
//   video?: string;
//   status: string;
//   payoutStatus: string;
//   paymentDetails?: {
//     razorpay_order_id?: string;
//     razorpay_payment_id?: string;
//     razorpay_signature?: string;
//     paymentMethod?: string;
//     paymentDate?: Date;
//     transactionId?: string;
//     paidAmount?: number;
//   };
//   Type: string; // Add this field
//   createdBy?: UserInfo;
//   acceptedUsers?: AcceptedUser[];
// }

// interface Address {
//   _id: string;
//   label: string;
//   address: string;
//   city: string;
//   state: string;
//   zipCode: string;
// }

// export default function SingleProduct() {
//   const { product: productId, travelId, requestId, mode } = useLocalSearchParams();
//   const { user, fetchVehicles, vehicles, acceptProduct, acceptTravelRequest } = useAuthStore();
//   const [product, setProduct] = useState<Product | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [socket, setSocket] = useState<any>(null);
//   const [userMessages, setUserMessages] = useState<any[]>([]);
//   const [messageInput, setMessageInput] = useState('');
//   const [showChat, setShowChat] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<any>(null);
//   const [isTyping, setIsTyping] = useState(false);
//   const [otherUserTyping, setOtherUserTyping] = useState(false);
//   const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
//   const [showUpdatePrice, setShowUpdatePrice] = useState(false);
//   const [newPrice, setNewPrice] = useState('');
//   const [activeTab, setActiveTab] = useState<'details' | 'bids'>('details');
//   const [acceptModalVisible, setAcceptModalVisible] = useState(false);
//   const [tentativeTime, setTentativeTime] = useState("");
//   const [acceptVehicleType, setAcceptVehicleType] = useState("");
//   const [selectedVehicleId, setSelectedVehicleId] = useState("");
//   const [productPrice, setProductPrice] = useState("");
//   const [fromAddress, setFromAddress] = useState<Address | null>(null);
//   const [toAddress, setToAddress] = useState<Address | null>(null);
//   const updateBid = useAuthStore((state) => state.updateBid);
//   const confirmBid = useAuthStore((state) => state.confirmBid);
//   const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
//   const [selectedBidUser, setSelectedBidUser] = useState<any>(null);

//   const handleTyping = (typing: boolean) => {
//     if (!socket || !selectedUser || !product) return;

//     let roomId: string;

//     if (user._id === product.createdBy?._id) {
//       roomId = `${productId}-${selectedUser.userId._id}`;
//     } else {
//       roomId = `${productId}-${user._id}`;
//     }

//     socket.emit('typing', {
//       roomId,
//       userId: user._id,
//       isTyping: typing
//     });

//     setIsTyping(typing);
//   };

//   const sendMessage = async () => {
//     if (!socket || !messageInput.trim() || !product) return;

//     let targetUserId: string;

//     if (user._id === product.createdBy?._id) {
//       if (!selectedUser) {
//         Alert.alert('Error', 'Please select a user to chat with');
//         return;
//       }
//       targetUserId = selectedUser.userId._id;
//     } else {
//       targetUserId = product.createdBy?._id!;
//     }

//     const messageData = {
//       productId: productId as string,
//       senderId: user._id,
//       receiverId: targetUserId,
//       message: messageInput.trim(),
//       username: user.username
//     };

//     try {
//       console.log('📤 Frontend: Sending message via Socket.IO:', messageData);
//       // Send via Socket.IO for real-time delivery
//       socket.emit('sendMessage', messageData);

//       // Optimistic update - add message to UI immediately
//       const optimisticMessage = {
//         ...messageData,
//         _id: Date.now().toString(), // Temporary ID
//         createdAt: new Date().toISOString(),
//         senderId: user._id,
//         read: false
//       };

//       setUserMessages(prev => [...prev, optimisticMessage]);
//       setMessageInput('');
//       handleTyping(false);

//     } catch (error) {
//       console.error('Failed to send message:', error);
//       Alert.alert('Error', 'Failed to send message');
//     }
//   };

//   const openChat = (acceptedUser: any) => {
//     // For creator: chat with accepted user
//     // For accepted user: chat with creator
//     const isCreator = user._id === product?.createdBy?._id;
//     const chatPartner = isCreator ? acceptedUser : { userId: product?.createdBy };

//     setSelectedUser(chatPartner);

//     // Load messages from the product's acceptedUsers array
//     if (isCreator) {
//       // Creator opening chat with accepted user - load messages from that user's array
//       const userMessages = acceptedUser.messages || [];
//       setUserMessages(userMessages);
//     } else {
//       // Accepted user opening chat with creator - load messages from their own array
//       const userMessages = acceptedUser.messages || [];
//       setUserMessages(userMessages);
//     }

//     setShowChat(true);

//     // Socket room joining is handled in joinProductChat
//   };

//   const closeChat = () => {
//     setShowChat(false);
//     setSelectedUser(null);
//     setUserMessages([]);
//     setShowUpdatePrice(false);
//     setNewPrice('');
//   };

//   const updatePrice = async () => {
//     if (!newPrice.trim() || !selectedUser) {
//       Alert.alert("Error", "Please enter a new price");
//       return;
//     }

//     try {
//       await updateBid(productId as string, selectedUser.userId._id, parseFloat(newPrice));
//       setShowUpdatePrice(false);
//       setNewPrice('');
//       const productRes = await fetch(`http://localhost:3000/api/products/${productId}`);
//       const updatedProduct = await productRes.json();
//       setProduct(updatedProduct);
//     } catch (error: any) {
//       Alert.alert("Error", error.message || "Failed to update price");
//     }
//   };

//   const handleSubmitAccept = async () => {
//     if (!productId) return;

//     // If accepting from travel, also accept the travel request
//     if (mode === 'accept' && travelId && requestId) {
//       try {
//         // Accept the travel request with product details
//         // Use current user's ID (travel owner) instead of requester's ID
//         await acceptTravelRequest(
//           travelId as string,
//           user._id,
//           productId as string,
//           tentativeTime,
//           acceptVehicleType,
//           parseFloat(productPrice) || 0
//         );
//       } catch (error: any) {
//         console.error('Error accepting travel request:', error);
//         Alert.alert('Error', 'Failed to accept travel request');
//         return;
//       }
//     }

//     await acceptProduct(productId as string, {
//       tentativeDeliveryTime: tentativeTime,
//       acceptedVehicleType: acceptVehicleType,
//       price: parseFloat(productPrice) || 0,
//     });

//     setAcceptModalVisible(false);
//     setTentativeTime("");
//     setProductPrice("");
//     setAcceptVehicleType("");
//     setSelectedVehicleId("");
//     // Refresh product
//     const productRes = await fetch(`http://localhost:3000/api/products/${productId}`);
//     const updatedProduct = await productRes.json();
//     setProduct(updatedProduct);
//   };

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'pending': return '#FFA500';
//       case 'accepted': return '#4CAF50';
//       case 'rejected': return '#F44336';
//       case 'in transit': return '#2196F3';
//       case 'delivered': return '#8BC34A';
//       default: return '#666';
//     }
//   };

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/products/${productId}`);
//         const data = await res.json();
//         setProduct(data);
        
//         // Fetch address details if product has address IDs
//         if (data && data.fromLocation && data.toLocation) {
//           fetchAddressDetails(data.fromLocation, data.toLocation);
//         }
//       } catch (err) {
//         console.error("Failed to fetch product:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (productId) fetchProduct();
//   }, [productId]);

//   const fetchAddressDetails = async (fromAddressId: string, toAddressId: string) => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) return;

//       const [fromRes, toRes] = await Promise.all([
//         fetch(`http://localhost:3000/api/userdetails/addresses/public/${fromAddressId}`),
//         fetch(`http://localhost:3000/api/userdetails/addresses/public/${toAddressId}`)
//       ]);

//       const fromData = await fromRes.json();
//       const toData = await toRes.json();

//       if (fromRes.ok && fromData) setFromAddress(fromData);
//       if (toRes.ok && toData) setToAddress(toData);
      
//       // If addresses not found, set fallback values
//       if (!fromRes.ok || !fromData) {
//         console.warn('From address not found, setting fallback');
//         setFromAddress({
//           _id: fromAddressId,
//           label: 'Unknown Location',
//           address: 'Address not available',
//           city: '',
//           state: '',
//           zipCode: ''
//         });
//       }
      
//       if (!toRes.ok || !toData) {
//         console.warn('To address not found, setting fallback');
//         setToAddress({
//           _id: toAddressId,
//           label: 'Unknown Location',
//           address: 'Address not available',
//           city: '',
//           state: '',
//           zipCode: ''
//         });
//       }
//     } catch (error) {
//       console.error("Failed to fetch address details:", error);
//     }
//   };

//   useEffect(() => {
//     fetchVehicles();
//   }, []);
 
//   // Handle accept mode from travel page
//   useEffect(() => {
//     if (mode === 'accept' && travelId && requestId && product) {
//       // Open accept modal
//       setAcceptModalVisible(true);
      
//       // Fetch travel details to get vehicle information
//       const fetchTravelDetails = async () => {
//         try {
//           const travelRes = await fetch(`http://localhost:3000/api/travels/${travelId}`);
//           const travelData = await travelRes.json();
          
//           if (travelData && travelData.vehicleId) {
//             // Pre-fill vehicle type from travel's vehicle
//             const vehicleType = travelData.vehicleId.vehicleType || travelData.veichelType || '';
//             setAcceptVehicleType(vehicleType);
            
//             // Pre-fill tentative time based on travel's arrival time
//             setTentativeTime(travelData.arrivaltime || '');
            
//             // Store travel details for submission
//             setSelectedVehicleId(travelData.vehicleId._id || travelId);
//           } else {
//             // Fallback to product's vehicle type if no vehicle in travel
//             setAcceptVehicleType(product.veichelType || '');
//             setTentativeTime('');
//             setSelectedVehicleId(travelId as string);
//           }
          
//           // Find the request to get the price
//           if (travelData.requestedUsers) {
//             const request = travelData.requestedUsers.find(
//               (req: any) => req.productId._id === productId
//             );
//             if (request) {
//               setProductPrice(request.price?.toString() || '');
//             }
//           }
//         } catch (error) {
//           console.error('Error fetching travel details:', error);
//           // Fallback to product's vehicle type
//           setAcceptVehicleType(product.veichelType || '');
//           setTentativeTime('');
//           setProductPrice('');
//           setSelectedVehicleId(travelId as string);
//         }
//       };
      
//       fetchTravelDetails();
//     }
//   }, [mode, travelId, requestId, product, productId]);
 
//   useEffect(() => {
//     if (!productId || !user || !product) return;

//     const newSocket = io('http://localhost:3001');

//     setSocket(newSocket);

//     newSocket.on('connect', () => {
//       console.log('🔌 Frontend: Connected to Socket.IO server:', newSocket.id);

//       // Join the product chat room (all accepted users + creator)
//       console.log('🏠 Frontend: Joining product chat rooms...');
//       newSocket.emit('joinProductChat', {
//         productId: productId as string,
//         userId: user._id
//       });
//     });

//     newSocket.on('disconnect', () => {
//       console.log('❌ Frontend: Disconnected from Socket.IO server');
//     });

//     newSocket.on('connect_error', (error) => {
//       console.error('❌ Frontend: Socket.IO connection error:', error);
//     });

//     newSocket.on('joined-product-chat', ({ productId }) => {
//       console.log(`Joined product chat room: ${productId}`);
//     });

//     newSocket.on('join-error', (error) => {
//       console.error('Failed to join product chat:', error);
//       Alert.alert('Error', error);
//     });

//     // Listen for real-time messages in this product
//     newSocket.on('receiveMessage', (message) => {
//       console.log('🎧 RECEIVE MESSAGE EVENT TRIGGERED!');
//       console.log('📦 Raw message data:', message);

//       const { senderId, receiverId, productId: msgProductId } = message;

//       // Only handle messages for this product
//       if (msgProductId !== productId) {
//         console.log('❌ Wrong product ID, ignoring');
//         return;
//       }

//       console.log('📨 Received real-time message:', message);
//       console.log('👤 Current user:', user._id);
//       console.log('🎯 Selected user:', selectedUser?.userId._id);
//       console.log('🏠 Socket rooms:', (newSocket as any).rooms);

//       // Check if this message is relevant to current user
//       const isMessageForCurrentUser = receiverId === user._id;
//       const isMessageFromCurrentUser = senderId === user._id;

//       console.log('🔍 Message relevance:', { isMessageForCurrentUser, isMessageFromCurrentUser });

//       // Only process if message involves current user
//       if (!isMessageForCurrentUser && !isMessageFromCurrentUser) {
//         console.log('❌ Message not relevant to current user');
//         return;
//       }

//       console.log('🎯 Checking message display logic...');
//       console.log('👤 Current user ID:', user._id);
//       console.log('👤 Product creator ID:', product?.createdBy?._id);
//       console.log('📨 Message sender:', senderId);
//       console.log('📨 Message receiver:', receiverId);

//       // Simplified logic: show message if user is involved (either sender or receiver)
//       const isUserInvolved = senderId === user._id || receiverId === user._id;

//       console.log('🔍 Is user involved in message?', isUserInvolved);

//       if (isUserInvolved) {
//         console.log('✅ User is involved, adding message to chat');

//         // For accepted users, if message is from creator, ensure we have a chat partner
//         if (user._id !== product?.createdBy?._id && senderId === product?.createdBy?._id && !selectedUser) {
//           console.log('📨 Auto-setting selectedUser to creator for accepted user');
//           setSelectedUser({ userId: product?.createdBy });
//         }

//         setUserMessages(prev => {
//           // Check for existing optimistic message to replace (same message content and sender)
//           const existingIndex = prev.findIndex(m =>
//             m.senderId === message.senderId &&
//             m.receiverId === message.receiverId &&
//             m.message === message.message &&
//             m.timestamp === message.timestamp
//           );

//           if (existingIndex !== -1) {
//             console.log('🔄 Replacing optimistic message with real-time message');
//             const updated = [...prev];
//             updated[existingIndex] = message; // Replace optimistic with real message
//             return updated;
//           }

//           console.log('📝 Adding new real-time message to UI');
//           return [...prev, message];
//         });
//       } else {
//         console.log('❌ User is not involved in this message');
//       }
//     });

//     newSocket.on('user-typing', ({ roomId, userId, isTyping }) => {
//       if (selectedUser && roomId === `${productId}-${selectedUser.userId._id}`) {
//         setOtherUserTyping(isTyping);
//       }
//     });

//     // Listen for travel request acceptance updates
//     newSocket.on('travelRequestAccepted', async (data) => {
//       console.log('🎧 TRAVEL REQUEST ACCEPTED EVENT TRIGGERED!');
//       console.log('📦 Data:', data);

//       // Check if this event is for the current product
//       if (data.productId === productId) {
//         console.log('✅ Travel request accepted for current product, refreshing data...');

//         // Refresh product data to show the new accepted user
//         try {
//           const productRes = await fetch(`http://localhost:3000/api/products/${productId}`);
//           const updatedProduct = await productRes.json();
//           setProduct(updatedProduct);
//           console.log('✅ Product data refreshed successfully');
//         } catch (error) {
//           console.error('❌ Failed to refresh product data:', error);
//         }
//       }
//     });

//     return () => {
//       if (newSocket.connected) {
//         newSocket.disconnect();
//       }
//     };
//   }, [productId, user, product]);

//   if (loading) return (
//     <View style={styles.loadingContainer}>
//       <ActivityIndicator size="large" color={COLORS.primary} />
//       <Text style={styles.loadingText}>Loading product details...</Text>
//     </View>
//   );
  
//   if (!product)
//     return (
//       <View style={styles.errorContainer}>
//         <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
//         <Text style={styles.errorText}>Product not found</Text>
//       </View>
//     );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
//       <ScrollView 
//         contentContainerStyle={styles.container}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Product Image & Basic Info */}
//         <View style={styles.productHeader}>
//           <View style={styles.imageContainer}>
//             <Image 
//               source={{ uri: product.image }} 
//               style={styles.productImage}
//               resizeMode="cover"
//             />
//             <View style={styles.statusBadge}>
//               <Text style={[styles.statusText, { color: getStatusColor(product.status) }]}>
//                 {product.status.toUpperCase()}
//               </Text>
//             </View>
//           </View>
          
//           <View style={styles.productInfo}>
//             <Text style={styles.productTitle}>{product.Title}</Text>
            
//             <View style={styles.priceContainer}>
//               <Text style={styles.priceLabel}>Estimated Value</Text>
//               <Text style={styles.priceValue}>
//                 ₹{product.price || 'N/A'}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Tab Navigation */}
//         <View style={styles.tabContainer}>
//           <TouchableOpacity 
//             style={[styles.tab, activeTab === 'details' && styles.activeTab]}
//             onPress={() => setActiveTab('details')}
//           >
//             <MaterialIcons 
//               name="description" 
//               size={20} 
//               color={activeTab === 'details' ? COLORS.primary : '#666'} 
//             />
//             <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
//               Details
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={[styles.tab, activeTab === 'bids' && styles.activeTab]}
//             onPress={() => setActiveTab('bids')}
//           >
//             <FontAwesome5 
//               name="handshake" 
//               size={18} 
//               color={activeTab === 'bids' ? COLORS.primary : '#666'} 
//             />
//             <Text style={[styles.tabText, activeTab === 'bids' && styles.activeTabText]}>
//               Bids ({product.acceptedUsers?.length || 0})
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {activeTab === 'details' ? (
//           <View style={styles.detailsContainer}>
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Delivery Details</Text>
//               <View style={styles.detailRow}>
//                 <View style={styles.detailItem}>
//                   <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.primary} />
//                   <Text style={styles.detailLabel}>From</Text>
//                   <Text style={styles.detailValue}>
//                     {fromAddress ? `${fromAddress.label} - ${fromAddress.address}, ${fromAddress.city}, ${fromAddress.state}` : 'Loading...'}
//                   </Text>
//                 </View>
//                 <View style={styles.detailItem}>
//                   <MaterialCommunityIcons name="map-marker-check" size={20} color={COLORS.primary} />
//                   <Text style={styles.detailLabel}>To</Text>
//                   <Text style={styles.detailValue}>
//                     {toAddress ? `${toAddress.label} - ${toAddress.address}, ${toAddress.city}, ${toAddress.state}` : 'Loading...'}
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Product Specifications</Text>
//               <View style={styles.specsGrid}>
//                 <View style={styles.specCard}>
//                   <MaterialCommunityIcons name="package-variant" size={24} color={COLORS.primary} />
//                   <Text style={styles.specLabel}>Type</Text>
//                   <Text style={styles.specValue}>{product.Type}</Text>
//                 </View>
//                 <View style={styles.specCard}>
//                   <FontAwesome5 name="weight-hanging" size={20} color={COLORS.primary} />
//                   <Text style={styles.specLabel}>Weight</Text>
//                   <Text style={styles.specValue}>{product.weight} kg</Text>
//                 </View>
//                 <View style={styles.specCard}>
//                   <MaterialCommunityIcons name="truck" size={24} color={COLORS.primary} />
//                   <Text style={styles.specLabel}>Vehicle</Text>
//                   <Text style={styles.specValue}>{product.veichelType}</Text>
//                 </View>
//               </View>
//             </View>

//             {/* Delivery Tracking Section */}
//             {(product.status === 'accepted' || product.status === 'in-transit') && (
//               <View style={[styles.section, { backgroundColor: '#e8f5e8', borderColor: '#4CAF50' }]}>
//                 <View style={styles.deliveryTrackingHeader}>
//                   <Ionicons name="locate-outline" size={24} color="#2E7D32" />
//                   <Text style={[styles.sectionTitle, { color: '#2E7D32', marginLeft: 12 }]}>
//                     Delivery Tracking
//                   </Text>
//                 </View>
//                 <View style={styles.deliveryTrackingContent}>
//                   <Text style={styles.deliveryStatus}>
//                     Status: <Text style={{ fontWeight: '700', color: '#2E7D32' }}>{product.status}</Text>
//                   </Text>
//                   <Text style={styles.deliveryDescription}>
//                     Track your delivery in real-time and get updates on the delivery progress.
//                   </Text>
//                   <TouchableOpacity
//                     style={styles.trackButton}
//                     onPress={() => router.push(`/delivery-tracking/${product._id}`)}
//                   >
//                     <Ionicons name="navigate-outline" size={20} color="#fff" />
//                     <Text style={styles.trackButtonText}>Track Delivery</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}

//             {product.createdBy && (
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Shipper Information</Text>
//                 <View style={styles.creatorCard}>
//                   <Image 
//                     source={{ uri: product.createdBy.profileImage }} 
//                     style={styles.creatorAvatar} 
//                   />
//                   <View style={styles.creatorInfo}>
//                     <Text style={styles.creatorName}>{product.createdBy.username}</Text>
//                     <Text style={styles.creatorRole}>Shipper</Text>
//                     <View style={styles.ratingContainer}>
//                       <Ionicons name="star" size={16} color="#FFD700" />
//                       <Text style={styles.ratingText}>4.8 (120 deliveries)</Text>
//                     </View>
//                   </View>
//                   <TouchableOpacity style={styles.messageIconButton}>
//                     <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}
//           </View>
//         ) : (
//           <View style={styles.bidsContainer}>
//             <Text style={styles.bidsTitle}>Active Bids</Text>
            
//             {Array.isArray(product.acceptedUsers) && product.acceptedUsers.length > 0 ? (
//               product.acceptedUsers
//                 .filter(accepted => user?._id === product.createdBy?._id || accepted.userId._id === user?._id)
//                 .map((accepted, idx) => (
//                   <View key={accepted._id || idx} style={styles.bidCard}>
//                     <View style={styles.bidHeader}>
//                       <Image 
//                         source={{ uri: accepted.userId.profileImage }} 
//                         style={styles.bidderAvatar} 
//                       />
//                       <View style={styles.bidderInfo}>
//                         <Text style={styles.bidderName}>{accepted.userId.username}</Text>
//                         <View style={styles.bidderStatus}>
//                           <View style={[
//                             styles.statusDot, 
//                             { backgroundColor: getStatusColor(accepted.status) }
//                           ]} />
//                           <Text style={styles.bidderStatusText}>{accepted.status}</Text>
//                         </View>
//                       </View>
//                       <Text style={styles.bidPrice}>₹{accepted.price}</Text>
//                     </View>
                    
//                     <View style={styles.bidDetails}>
//                       <View style={styles.bidDetailItem}>
//                         <MaterialCommunityIcons name="truck" size={16} color="#666" />
//                         <Text style={styles.bidDetailText}>{accepted.vehicleType}</Text>
//                       </View>
//                       <View style={styles.bidDetailItem}>
//                         <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
//                         <Text style={styles.bidDetailText}>{accepted.tentativeTime}</Text>
//                       </View>
//                     </View>
                    
//                     <View style={styles.bidActions}>
//                       {product.status !== 'delivered' && (
//                         <TouchableOpacity
//                           style={styles.chatButton}
//                           onPress={() => openChat(accepted)}
//                         >
//                           <Ionicons name="chatbubble-outline" size={18} color="#fff" />
//                           <Text style={styles.chatButtonText}>Chat</Text>
//                         </TouchableOpacity>
//                       )}

//                       {user?._id === product.createdBy?._id && accepted.status === 'accepted' && product.status === 'accepted' && product.payoutStatus !== 'completed' && (
//                         <TouchableOpacity
//                           style={styles.confirmBidButton}
//                           onPress={() => {
//                             setSelectedBidUser(accepted);
//                             setCheckoutModalVisible(true);
//                           }}
//                         >
//                           <Ionicons name="checkmark-circle" size={18} color="#fff" />
//                           <Text style={styles.confirmBidButtonText}>Confirm</Text>
//                         </TouchableOpacity>
//                       )}
//                       {user?._id === product.createdBy?._id && accepted.status === 'accepted' && product.status === 'accepted' && product.payoutStatus === 'completed' && (
//                         <View style={styles.payoutCompletedBadge}>
//                           <Ionicons name="checkmark-circle" size={18} color="#10b981" />
//                           <Text style={styles.payoutCompletedText}>Payout Completed</Text>
//                         </View>
//                       )}

//                       {user?._id === product?.createdBy?._id && (
//                         <TouchableOpacity
//                           style={styles.updateBidButton}
//                           onPress={() => {
//                             setSelectedUser(accepted);
//                             setShowUpdatePrice(true);
//                           }}
//                         >
//                           <MaterialIcons name="edit" size={18} color={COLORS.primary} />
//                           <Text style={styles.updateBidButtonText}>Update Price</Text>
//                         </TouchableOpacity>
//                       )}
//                     </View>
//                   </View>
//                 ))
//             ) : (
//               <View style={styles.noBidsContainer}>
//                 <MaterialCommunityIcons name="truck-remove" size={64} color="#DDD" />
//                 <Text style={styles.noBidsText}>No bids yet</Text>
//                 <Text style={styles.noBidsSubtext}>Be the first to bid on this delivery</Text>
//               </View>
//             )}
//           </View>
//         )}

//         {/* Action Buttons */}
//         <View style={styles.actionButtons}>
//           {user && product.createdBy && user._id !== product.createdBy._id && !product.acceptedUsers?.some(accepted => accepted.userId._id === user._id) ? (
//             <TouchableOpacity
//               style={[styles.actionButton, styles.acceptButton]}
//               onPress={() => setAcceptModalVisible(true)}
//             >
//               <Ionicons name="checkmark-circle" size={20} color="#fff" />
//               <Text style={styles.actionButtonText}>Accept Product</Text>
//             </TouchableOpacity>
//           ) : (
//             <>
//               <TouchableOpacity style={[styles.actionButton, styles.callButton]}>
//                 <Ionicons name="call" size={20} color="#fff" />
//                 <Text style={styles.actionButtonText}>Call Shipper</Text>
//               </TouchableOpacity>
//             </>
//           )}
          
//           {/* Track Delivery Button */}
//           {product && (product.status === 'in-transit' || product.status === 'accepted') && (
//             <TouchableOpacity
//               style={[styles.actionButton, { backgroundColor: '#28a745' }]}
//               onPress={() => router.push(`/delivery-tracking/${product._id}`)}
//             >
//               <Ionicons name="locate-outline" size={20} color="#fff" />
//               <Text style={styles.actionButtonText}>Track Delivery</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </ScrollView>

//       {/* Chat Modal */}
//       {showChat && selectedUser && product.status !== 'delivered' && (
//         <View style={styles.chatModal}>
//           <View style={styles.chatHeader}>
//             <View style={styles.chatUserInfo}>
//               <Image 
//                 source={{ uri: user?._id === product?.createdBy?._id ? 
//                   selectedUser.userId.profileImage : 
//                   product?.createdBy?.profileImage 
//                 }} 
//                 style={styles.chatAvatar}
//               />
//               <View>
//                 <Text style={styles.chatUserName}>
//                   {user?._id === product?.createdBy?._id ? 
//                     selectedUser.userId.username : 
//                     product?.createdBy?.username
//                   }
//                 </Text>
//                 <View style={styles.chatStatus}>
//                   <View style={[
//                     styles.onlineIndicator, 
//                     { backgroundColor: onlineUsers.includes(
//                       user?._id === product?.createdBy?._id ? 
//                       selectedUser.userId._id : 
//                       product?.createdBy?._id
//                     ) ? '#4CAF50' : '#999' }
//                   ]} />
//                   <Text style={styles.chatStatusText}>
//                     {otherUserTyping ? 'Typing...' : 
//                      onlineUsers.includes(
//                        user?._id === product?.createdBy?._id ? 
//                        selectedUser.userId._id : 
//                        product?.createdBy?._id
//                      ) ? 'Online' : 'Offline'}
//                   </Text>
//                 </View>
//               </View>
//             </View>
            
//             <View style={styles.chatHeaderActions}>
//               <TouchableOpacity onPress={closeChat}>
//                 <Ionicons name="close-circle" size={28} color="#666" />
//               </TouchableOpacity>
//             </View>
//           </View>
          
//           <FlatList
//             data={[...userMessages].reverse()}
//             keyExtractor={(item) => item._id || item.timestamp}
//             renderItem={({ item }) => {
//               const isOwnMessage = item.senderId === user._id || item.userId === user._id;
              
//               return (
//                 <View style={[
//                   styles.messageContainer,
//                   isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
//                 ]}>
//                   {!isOwnMessage && (
//                     <Image 
//                       source={{ uri: item.senderAvatar || 'https://via.placeholder.com/40' }} 
//                       style={styles.messageAvatar}
//                     />
//                   )}
//                   <View style={[
//                     styles.messageBubble,
//                     isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
//                   ]}>
//                     <Text style={[
//                       styles.messageText,
//                       isOwnMessage ? styles.ownMessageText : styles.otherMessageText
//                     ]}>
//                       {item.message}
//                     </Text>
//                     <View style={styles.messageMeta}>
//                       <Text style={styles.messageTime}>
//                         {new Date(item.createdAt || item.timestamp).toLocaleTimeString([], {
//                           hour: '2-digit',
//                           minute: '2-digit'
//                         })}
//                       </Text>
//                       {isOwnMessage && (
//                         <Ionicons
//                           name={item.read ? "checkmark-done" : "checkmark"}
//                           size={14}
//                           color={item.read ? "#007AFF" : "#999"}
//                           style={styles.messageStatus}
//                         />
//                       )}
//                     </View>
//                   </View>
//                 </View>
//               );
//             }}
//             inverted={true}
//             style={styles.messagesList}
//             contentContainerStyle={styles.messagesContent}
//           />
          
//           <View style={styles.chatInputContainer}>
//             <TextInput
//               style={styles.chatInput}
//               value={messageInput}
//               onChangeText={(text) => {
//                 setMessageInput(text);
//                 handleTyping(text.length > 0);
//               }}
//               onBlur={() => handleTyping(false)}
//               placeholder="Type your message..."
//               placeholderTextColor="#999"
//               multiline
//             />
//             <TouchableOpacity
//               style={[styles.sendButton, !messageInput.trim() && styles.sendButtonDisabled]}
//               onPress={sendMessage}
//               disabled={!messageInput.trim()}
//             >
//               <Ionicons name="send" size={22} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {/* Update Price Modal */}
//       {showUpdatePrice && (
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <Text style={styles.modalTitle}>
//               {user?._id === product?.createdBy?._id ? 'Update Bid Price' : 'Update Your Bid'}
//             </Text>
//             <Text style={styles.modalSubtitle}>Enter your new price for this delivery</Text>
            
//             <View style={styles.priceInputContainer}>
//               <Text style={styles.currencySymbol}>₹</Text>
//               <TextInput
//                 style={styles.priceModalInput}
//                 value={newPrice}
//                 onChangeText={setNewPrice}
//                 placeholder="0.00"
//                 keyboardType="numeric"
//                 autoFocus
//               />
//             </View>
            
//             <View style={styles.modalButtons}>
//               <TouchableOpacity 
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => setShowUpdatePrice(false)}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.confirmButton]}
//                 onPress={updatePrice}
//               >
//                 <Text style={styles.confirmButtonText}>
//                   {user?._id === product?.createdBy?._id ? 'Update Price' : 'Update Bid'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       )}

//       {/* Accept Product Modal */}
//       {acceptModalVisible && (
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalHeading}>Delivery Details</Text>
//               <TouchableOpacity onPress={() => setAcceptModalVisible(false)}>
//                 <Ionicons name="close" size={24} color="#333" />
//               </TouchableOpacity>
//             </View>

//             <TextInput
//               placeholder="Tentative Delivery Time (e.g., 18:00 or 2 hours)"
//               value={tentativeTime}
//               onChangeText={setTentativeTime}
//               style={styles.input}
//             />

//             <View style={styles.pickerContainer}>
//               <Text style={styles.pickerLabel}>Select Your Vehicle:</Text>
//               <View style={styles.pickerWrapper}>
//                 <Picker
//                   selectedValue={selectedVehicleId}
//                   onValueChange={(itemValue) => {
//                     setSelectedVehicleId(itemValue);
//                     if (itemValue) {
//                       const selectedVehicle = vehicles.find(v => v._id === itemValue);
//                       setAcceptVehicleType(selectedVehicle ? `${selectedVehicle.vehicleType} - ${selectedVehicle.vehicleNumber}` : "");
//                     } else {
//                       setAcceptVehicleType("");
//                     }
//                   }}
//                   style={styles.picker}
//                 >
//                   <Picker.Item label="Select a vehicle..." value="" />
//                   {vehicles
//                     .filter(vehicle => vehicle.verificationStatus === 'approved')
//                     .map((vehicle) => (
//                       <Picker.Item
//                         key={vehicle._id}
//                         label={`${vehicle.vehicleType} - ${vehicle.vehicleNumber} (${vehicle.vehicleModel || 'No model'})`}
//                         value={vehicle._id}
//                       />
//                     ))
//                   }
//                 </Picker>
//               </View>
//             </View>

//             {acceptVehicleType ? (
//               <View style={styles.selectedVehicleInfo}>
//                 <Text style={styles.selectedVehicleText}>Selected: {acceptVehicleType}</Text>
//               </View>
//             ) : null}

//             <TextInput
//               placeholder="Price (in Rs.)"
//               value={productPrice}
//               onChangeText={setProductPrice}
//               style={styles.input}
//               keyboardType="numeric"
//             />

//             <View style={styles.modalActions}>
//               <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setAcceptModalVisible(false)}>
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.modalButton} onPress={handleSubmitAccept}>
//                 <Text style={styles.modalButtonText}>Confirm Acceptance</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       )}

//       {/* Checkout Modal for Bid Confirmation */}
//       <CheckoutModal
//         visible={checkoutModalVisible}
//         onClose={() => setCheckoutModalVisible(false)}
//         isBidConfirmation={true}
//         bidAmount={selectedBidUser?.price}
//         productId={productId as string}
//         acceptedUserId={selectedBidUser?.userId?._id}
//         onBidConfirm={async (paymentData) => {
//           try {
//             console.log('Bid confirmation payment successful:', paymentData);
//             await confirmBid(productId as string, selectedBidUser?.userId?._id);
//           } catch (error) {
//             console.error('Error confirming bid after payment:', error);
//             Alert.alert('Error', 'Failed to confirm bid');
//           }
//         }}
//       />
//     </SafeAreaView>
//   );
// }

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    fontWeight: '600',
  },
  container: {
    paddingBottom: 100,
    backgroundColor: '#f8f9fa',
  },
  productHeader: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productInfo: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#f0f7ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  detailsContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Add this to your styles object:
paymentStatusBadge: {
  position: 'absolute',
  top: 16,
  left: 16,
  backgroundColor: '#10b981',
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
paymentStatusText: {
  fontSize: 12,
  fontWeight: '700',
  color: '#fff',
  marginLeft: 4,
},
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  specsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  specLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  creatorRole: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  messageIconButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bidsContainer: {
    padding: 20,
  },
  bidsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bidderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  bidderInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bidderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  bidderStatusText: {
    fontSize: 12,
    color: '#666',
  },
  bidPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bidDetails: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingLeft: 60,
  },
  bidDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  bidDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  bidActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingLeft: 60,
    gap: 8,
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  updateBidButton: {
    backgroundColor: '#f0f7ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  updateBidButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  noBidsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noBidsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  noBidsSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  payButton: {
    backgroundColor: COLORS.primary,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  chatModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  chatUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chatStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  chatStatusText: {
    fontSize: 12,
    color: '#666',
  },
  chatHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updatePriceButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  updatePriceButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
    marginRight: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#666',
  },
  messageStatus: {
    marginLeft: 2,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  priceInputContainer: {
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
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 8,
  },
  priceModalInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    paddingVertical: 12,
    maxWidth: width * 0.6, // Limit width for mobile
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmBidButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  confirmBidButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333"
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#333",
  },
  selectedVehicleInfo: {
    backgroundColor: "#e8f5e8",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  selectedVehicleText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  },
  deliveryTrackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deliveryTrackingContent: {
    paddingVertical: 12,
  },
  deliveryStatus: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  deliveryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  trackButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  payoutCompletedBadge: {
    backgroundColor: '#e8f5e8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  payoutCompletedText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});
