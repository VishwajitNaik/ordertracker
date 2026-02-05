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
// import { useLocalSearchParams } from "expo-router";
// import { useAuthStore } from "@/store/authStore";
// import { io } from 'socket.io-client';
// import COLORS from "@/constants/color";
// import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
// import { Picker } from "@react-native-picker/picker";
// import * as Location from 'expo-location';

// const { width } = Dimensions.get('window');

// interface OrderItem {
//   subItemId: {
//     _id: string;
//     name: string;
//     images: string[];
//     category: string;
//     brand: string;
//   };
//   quantity: number;
//   price: number;
//   itemDetails: {
//     name: string;
//     category: string;
//     brand: string;
//     images: string[];
//   };
// }

// interface AcceptedUser {
//   _id?: string;
//   userId: string | {
//     _id: string;
//     username: string;
//     profileImage?: string;
//   };
//   vehicleType: string;
//   tentativeTime: string;
//   price: number;
//   status: string;
//   messages?: any[];
//   deliveryDetails?: {
//     deliveryBoyId?: string;
//     deliveryStatus: string;
//     currentLocation?: {
//       lat: number;
//       lng: number;
//       timestamp: Date;
//     };
//     deliveryImage?: string;
//     deliveryImageWithBarcode?: string;
//     recipientMobile?: string;
//     otpCode?: string;
//     otpVerified: boolean;
//     deliveredAt?: Date;
//     barcodeScanned: boolean;
//     barcodeData?: string;
//   };
// }

// interface Order {
//   _id: string;
//   orderId: string;
//   userId: string | {  // This can be string or object
//     _id: string;
//     username: string;
//     profileImage?: string;
//   };
//   items: OrderItem[];
//   totalAmount: number;
//   deliveryCharges: number;
//   finalAmount: number;
//   deliveryType: string;
//   shopId: {
//     _id: string;
//     name: string;
//     location: string;
//   };
//   deliveryAddress?: {
//     address: string;
//     city: string;
//     state: string;
//     zipCode: string;
//   };
//   customAddress?: {
//     address: string;
//     city: string;
//     state: string;
//     zipCode: string;
//   };
//   paymentId: string;
//   paymentStatus: string;
//   orderStatus: string;
//   deliveryStatus?: string;
//   razorpayOrderId?: string;
//   offers?: {
//     code: string;
//     discount: number;
//     description: string;
//   }[];
//   acceptedUsers?: AcceptedUser[];
//   notes: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export default function SingleOrder() {
//   const { order: orderId } = useLocalSearchParams();
//   const { user, token, fetchVehicles, vehicles, acceptOrder, updateOrderBid, confirmOrderBid, updateDeliveryStatus: updateDeliveryStatusStore } = useAuthStore();
//   const [order, setOrder] = useState<Order | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [acceptModalVisible, setAcceptModalVisible] = useState(false);
//   const [tentativeTime, setTentativeTime] = useState("");
//   const [acceptVehicleType, setAcceptVehicleType] = useState("");
//   const [selectedVehicleId, setSelectedVehicleId] = useState("");
//   const [orderPrice, setOrderPrice] = useState("");
//   const [activeTab, setActiveTab] = useState<'details' | 'bids'>('details');
//   const [showUpdatePrice, setShowUpdatePrice] = useState(false);
//   const [newPrice, setNewPrice] = useState('');
//   const [selectedUser, setSelectedUser] = useState<any>(null);
//   const [socket, setSocket] = useState<any>(null);
//   const [userMessages, setUserMessages] = useState<any[]>([]);
//   const [messageInput, setMessageInput] = useState('');
//   const [showChat, setShowChat] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [otherUserTyping, setOtherUserTyping] = useState(false);
//   const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
//   const [locationSubscription, setLocationSubscription] = useState<any>(null);
//   const [isTrackingLocation, setIsTrackingLocation] = useState(false);
//   const [liveLocation, setLiveLocation] = useState<any>(null);

//   // Delivery tracking states
//   const [recipientMobile, setRecipientMobile] = useState("");
//   const [otpCode, setOtpCode] = useState("");
//   const [barcodeData, setBarcodeData] = useState("");
//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [showBarcodeModal, setShowBarcodeModal] = useState(false);
//   const [imageLoading, setImageLoading] = useState(false);
//   const [otpLoading, setOtpLoading] = useState(false);

//   // Auto-manage live tracking based on order status
//   useEffect(() => {
//     if (!order || !user) return;

//     const isAcceptedUser = order.acceptedUsers?.some(au => getAcceptedUserId(au) === user._id) || false;

//     if (!isAcceptedUser) return;

//     const shouldTrack = order.deliveryStatus === 'in-transit' || order.deliveryStatus === 'accepted' || order.orderStatus === 'confirmed';

//     if (shouldTrack && !isTrackingLocation) {
//       // Auto-start tracking when order becomes in-transit
//       startLiveTracking();
//     } else if (!shouldTrack && isTrackingLocation) {
//       // Auto-stop tracking when order is delivered/cancelled
//       stopLiveTracking();
//     }
//   }, [order?.deliveryStatus, order?.acceptedUsers, user?._id, isTrackingLocation]);

//   // Helper function to get user ID from userId field (handles both string and object)
//   const getUserId = (userIdField: any): string => {
//     if (!userIdField) return '';
    
//     if (typeof userIdField === 'string') {
//       return userIdField;
//     }
    
//     if (typeof userIdField === 'object' && userIdField._id) {
//       return userIdField._id;
//     }
    
//     // Try to extract ID from MongoDB ObjectId
//     if (userIdField && typeof userIdField === 'object') {
//       // Check if it has $oid format (MongoDB extended JSON)
//       if (userIdField.$oid) {
//         return userIdField.$oid;
//       }
      
//       // Try to get toString() if it's an ObjectId
//       if (typeof userIdField.toString === 'function') {
//         return userIdField.toString();
//       }
//     }
    
//     return '';
//   };

//   // Helper function to get username from userId field
//   const getUsername = (userIdField: any): string => {
//     if (typeof userIdField === 'object' && userIdField.username) {
//       return userIdField.username;
//     }
//     return 'User';
//   };

//   // Helper function to get accepted user ID
//   const getAcceptedUserId = (acceptedUser: AcceptedUser): string => {
//     return getUserId(acceptedUser.userId);
//   };

//   // Helper function to get accepted username
//   const getAcceptedUsername = (acceptedUser: AcceptedUser): string => {
//     if (typeof acceptedUser.userId === 'object' && acceptedUser.userId.username) {
//       return acceptedUser.userId.username;
//     }
//     return 'Traveler';
//   };

//   // Helper function to get accepted profile image
//   const getAcceptedProfileImage = (acceptedUser: AcceptedUser): string => {
//     if (typeof acceptedUser.userId === 'object' && acceptedUser.userId.profileImage) {
//       return acceptedUser.userId.profileImage;
//     }
//     return 'https://via.placeholder.com/40';
//   };

//   const handleSubmitAccept = async () => {
//     if (!orderId) return;

//     await acceptOrder(orderId as string, {
//       tentativeDeliveryTime: tentativeTime,
//       acceptedVehicleType: acceptVehicleType,
//       price: parseFloat(orderPrice) || 0,
//     });

//     setAcceptModalVisible(false);
//     setTentativeTime("");
//     setOrderPrice("");
//     setAcceptVehicleType("");
//     setSelectedVehicleId("");
//     // Refresh order
//     const orderRes = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}`);
//     const updatedOrder = await orderRes.json();
//     setOrder(updatedOrder);
//   };

//   const updateDeliveryStatus = async (userId: string, status: string) => {
//     await updateDeliveryStatusStore(orderId as string, userId, status);
//     // Refresh order data
//     const orderRes = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}`);
//     const updatedOrder = await orderRes.json();
//     setOrder(updatedOrder);
//   };

//   const startLiveTracking = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission Denied', 'Location permission is required for live tracking');
//         return;
//       }

//       setIsTrackingLocation(true);

//       const subscription = await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.High,
//           timeInterval: 5000,      // every 5 sec
//           distanceInterval: 10,    // every 10 meters
//         },
//         (location) => {
//           const { latitude, longitude } = location.coords;

//           // Send location update via socket
//           if (socket) {
//             socket.emit('order:location-update', {
//               orderId: orderId,
//               lat: latitude,
//               lng: longitude,
//             });
//           }
//         }
//       );

//       // Store subscription - some versions return different object types
//       setLocationSubscription(subscription);
//       Alert.alert('Success', 'Live tracking started');
//     } catch (error) {
//       console.error('Error starting location tracking:', error);
//       Alert.alert('Error', 'Failed to start location tracking');
//       setIsTrackingLocation(false);
//     }
//   };

//   const stopLiveTracking = () => {
//     try {
//       if (locationSubscription) {
//         // Different versions of expo-location have different methods
//         // Try multiple approaches
//         if (typeof locationSubscription.remove === 'function') {
//           locationSubscription.remove();
//         } else if (typeof locationSubscription.unsubscribe === 'function') {
//           locationSubscription.unsubscribe();
//         } else if (typeof locationSubscription.cancel === 'function') {
//           locationSubscription.cancel();
//         }
//         // Clear the subscription reference
//         setLocationSubscription(null);
//       }
//       setIsTrackingLocation(false);
//       Alert.alert('Success', 'Live tracking stopped');
//     } catch (error) {
//       console.error('Error stopping location tracking:', error);
//       // Force cleanup even if remove fails
//       setLocationSubscription(null);
//       setIsTrackingLocation(false);
//       Alert.alert('Success', 'Live tracking stopped');
//     }
//   };

//   // Delivery tracking functions
//   const uploadDeliveryImage = async (image: string, withBarcode: boolean = false) => {
//     try {
//       const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/upload-delivery-image`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           userId: user?._id,
//           image,
//           withBarcode
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       setOrder(data.order);
//       Alert.alert('Success', 'Delivery image uploaded successfully');
//     } catch (error) {
//       console.error('Error uploading delivery image:', error);
//       Alert.alert('Error', 'Failed to upload delivery image');
//     }
//   };

//   const setRecipient = async () => {
//     if (!recipientMobile) {
//       Alert.alert('Error', 'Please enter recipient mobile number');
//       return;
//     }

//     try {
//       const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/set-recipient`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           userId: user?._id,
//           recipientMobile
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       setOrder(data.order);
//       setOtpCode(data.otpCode);
//       setShowOtpModal(true);
//     } catch (error) {
//       console.error('Error setting recipient:', error);
//       Alert.alert('Error', 'Failed to set recipient');
//     }
//   };

//   const verifyOtp = async () => {
//     if (!otpCode) {
//       Alert.alert('Error', 'Please enter OTP');
//       return;
//     }

//     try {
//       const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/verify-otp`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           userId: user?._id,
//           otpCode: otpCode
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       setOrder(data.order);
//       Alert.alert('Success', 'OTP verified successfully. Delivery completed!');
//       setShowOtpModal(false);
//     } catch (error) {
//       console.error('Error verifying OTP:', error);
//       Alert.alert('Error', 'Failed to verify OTP');
//     }
//   };

//   const markBarcodeScanned = async () => {
//     try {
//       const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/mark-barcode-scanned`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           userId: user?._id,
//           barcodeData: barcodeData
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       setOrder(data.order);
//       Alert.alert('Success', 'Barcode marked as scanned');
//       setShowBarcodeModal(false);
//     } catch (error) {
//       console.error('Error marking barcode as scanned:', error);
//       Alert.alert('Error', 'Failed to mark barcode as scanned');
//     }
//   };

//   const checkDeliveryRequirements = async () => {
//     try {
//       const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/check-delivery-requirements?userId=${user?._id}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();

//       if (!data.requirementsMet) {
//         let missingItems = [];

//         if (!data.hasDeliveryImage) missingItems.push("delivery image");
//         if (!data.hasDeliveryImageWithBarcode) missingItems.push("delivery image with barcode");
//         if (!data.otpVerified) missingItems.push("OTP verification");

//         Alert.alert(
//           'Incomplete Requirements',
//           `Please complete the following before marking as delivered:\n\n• ${missingItems.join('\n• ')}`,
//           [
//             { text: 'OK', style: 'default' }
//           ]
//         );
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('Error checking delivery requirements:', error);
//       Alert.alert('Error', 'Failed to check delivery requirements');
//       return false;
//     }
//   };

//   const handleTyping = (typing: boolean) => {
//     if (!socket || !selectedUser || !order) return;

//     let roomId: string;

//     const orderCreatorId = getUserId(order.userId);
//     if (user._id === orderCreatorId) {
//       roomId = `${orderId}-${getAcceptedUserId(selectedUser)}`;
//     } else {
//       roomId = `${orderId}-${user._id}`;
//     }

//     socket.emit('typing-order', {
//       roomId,
//       userId: user._id,
//       isTyping: typing
//     });

//     setIsTyping(typing);
//   };

//   const sendMessage = async () => {
//     if (!socket || !messageInput.trim() || !order) return;

//     let targetUserId: string;

//     const orderCreatorId = getUserId(order.userId);
//     if (user._id === orderCreatorId) {
//       if (!selectedUser) {
//         Alert.alert('Error', 'Please select a user to chat with');
//         return;
//       }
//       targetUserId = getAcceptedUserId(selectedUser);
//     } else {
//       targetUserId = orderCreatorId;
//     }

//     const messageData = {
//       orderId: orderId as string,
//       senderId: user._id,
//       receiverId: targetUserId,
//       message: messageInput.trim(),
//       username: user.username
//     };

//     try {
//       console.log('📤 Frontend: Sending order message via Socket.IO:', messageData);
//       // Send via Socket.IO for real-time delivery
//       socket.emit('sendOrderMessage', messageData);

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
//       console.error('Failed to send order message:', error);
//       Alert.alert('Error', 'Failed to send message');
//     }
//   };

//   const getStatusColor = (status: string) => {
//     if (!status) return '#666';
//     switch (status.toLowerCase()) {
//       case 'placed': return '#FFA500';
//       case 'confirmed': return '#4CAF50';
//       case 'preparing': return '#2196F3';
//       case 'ready': return '#8BC34A';
//       case 'out_for_delivery': return '#FF9800';
//       case 'delivered': return '#4CAF50';
//       case 'cancelled': return '#F44336';
//       default: return '#666';
//     }
//   };

//   const getDeliveryStatusColor = (status: string) => {
//     if (!status) return '#666';
//     switch (status.toLowerCase()) {
//       case 'accepted': return '#4CAF50';
//       case 'in-transit': return '#2196F3';
//       case 'delivered': return '#8BC34A';
//       case 'cancelled': return '#F44336';
//       default: return '#666';
//     }
//   };

//   useEffect(() => {
//     const fetchOrder = async () => {
//       try {
//         console.log('🔍 Fetching order with ID:', orderId);
//         console.log('🔑 Token available:', !!token, token ? token.substring(0, 20) + '...' : 'null');

//         const headers: any = {};
//         if (token) {
//           headers.Authorization = `Bearer ${token}`;
//           console.log('📤 Sending Authorization header');
//         } else {
//           console.log('⚠️ No token available, sending request without auth');
//         }

//         const res = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}`, {
//           headers
//         });

//         console.log('📡 Response status:', res.status);
//         console.log('📡 Response ok:', res.ok);
//         console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));

//         const responseText = await res.text();
//         console.log('📡 Raw response text:', responseText);

//         let data;
//         try {
//           data = JSON.parse(responseText);
//           console.log('📦 Parsed JSON data:', data);
//         } catch (parseError) {
//           console.error('❌ Failed to parse response as JSON:', parseError);
//           data = { error: 'Invalid response format', raw: responseText };
//         }

//         console.log('📦 Order userId field:', data.userId);
//         console.log('📦 Type of userId:', typeof data.userId);
//         console.log('📦 Current user ID:', user?._id);

//         setOrder(data);
//       } catch (err) {
//         console.error("Failed to fetch order:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (orderId) fetchOrder();
//   }, [orderId]);

//   useEffect(() => {
//     fetchVehicles();
//   }, []);

//   // Debug: Log order and user info
//   useEffect(() => {
//     if (order && user) {
//       console.log('=== USER CHECK ===');
//       console.log('Current User ID:', user._id);
//       console.log('Order userId field:', order.userId);
//       console.log('Extracted Order Creator ID:', getUserId(order.userId));
//       console.log('Is Order Creator?', user._id === getUserId(order.userId));
//       console.log('Accepted Users:', order.acceptedUsers?.map(au => ({
//         userId: au.userId,
//         type: typeof au.userId,
//         extractedId: getAcceptedUserId(au)
//       })));
//       console.log('=== END CHECK ===');
//     }
//   }, [order, user, activeTab]);

//   // Socket.IO Connection
//   useEffect(() => {
//     if (!orderId || !user || !order) return;

//     const newSocket = io('http://localhost:3001');

//     setSocket(newSocket);

//     newSocket.on('connect', () => {
//       console.log('🔌 Frontend: Connected to Socket.IO server:', newSocket.id);

//       // Join the order chat room (all accepted users + order creator)
//       console.log('🏠 Frontend: Joining order chat rooms...');
//       newSocket.emit('joinOrderChat', {
//         orderId: orderId as string,
//         userId: user._id
//       });
//     });

//     newSocket.on('disconnect', () => {
//       console.log('❌ Frontend: Disconnected from Socket.IO server');
//     });

//     newSocket.on('connect_error', (error) => {
//       console.error('❌ Frontend: Socket.IO connection error:', error);
//     });

//     newSocket.on('joined-order-chat', ({ orderId }) => {
//       console.log(`Joined order chat room: ${orderId}`);
//     });

//     newSocket.on('join-error', (error) => {
//       console.error('Failed to join order chat:', error);
//       Alert.alert('Error', error);
//     });

//     // Listen for real-time messages in this order
//     newSocket.on('receiveOrderMessage', (message) => {
//       console.log('🎧 RECEIVE ORDER MESSAGE EVENT TRIGGERED!');
//       console.log('📦 Raw message data:', message);

//       const { senderId, receiverId, orderId: msgOrderId } = message;

//       // Only handle messages for this order
//       if (msgOrderId !== orderId) {
//         console.log('❌ Wrong order ID, ignoring');
//         return;
//       }

//       // Simplified logic: show message if user is involved (either sender or receiver)
//       const isUserInvolved = senderId === user._id || receiverId === user._id;

//       if (isUserInvolved) {
//         console.log('✅ User is involved, adding message to chat');

//         // For accepted users, if message is from order creator, ensure we have a chat partner
//         const orderCreatorId = getUserId(order.userId);
//         if (user._id !== orderCreatorId && senderId === orderCreatorId && !selectedUser) {
//           console.log('📨 Auto-setting selectedUser to order creator for accepted user');
//           setSelectedUser({ userId: order.userId });
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

//     newSocket.on('user-typing-order', ({ roomId, userId, isTyping }) => {
//       if (selectedUser && roomId === `${orderId}-${getAcceptedUserId(selectedUser)}`) {
//         setOtherUserTyping(isTyping);
//       }
//     });

//     // Join order tracking room for live GPS
//     newSocket.emit('join:order-tracking', { orderId: orderId });

//     // Listen for live location updates
//     newSocket.on('order:location-receive', (locationData) => {
//       console.log('📍 Received live location:', locationData);
//       setLiveLocation(locationData);
//     });

//     return () => {
//       if (newSocket.connected) {
//         newSocket.disconnect();
//       }
//     };
//   }, [orderId, user, order]);

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//           <Text style={styles.loadingText}>Loading Order Details...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!order) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
//         <View style={styles.errorContainer}>
//           <Ionicons name="document-outline" size={80} color="#E0E0E0" />
//           <Text style={styles.errorText}>Order not found</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={() => {}}>
//             <Text style={styles.retryText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const deliveryAddress = order.deliveryAddress || order.customAddress;
//   const orderCreatorId = getUserId(order.userId);
//   const isOrderCreator = user?._id === orderCreatorId;
//   const isAcceptedUser = order.acceptedUsers?.some(au => getAcceptedUserId(au) === user?._id) || false;
  
//   console.log('RENDER DEBUG:', {
//     orderCreatorId,
//     currentUserId: user?._id,
//     isOrderCreator,
//     acceptedUsersCount: order.acceptedUsers?.length || 0
//   });

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => {}}>
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Order Details</Text>
//         <View style={styles.headerRight} />
//       </View>

//       {/* Tab Navigation */}
//       <View style={styles.tabContainer}>
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === 'details' && styles.activeTab]}
//           onPress={() => setActiveTab('details')}
//         >
//           <MaterialIcons 
//             name="description" 
//             size={20} 
//             color={activeTab === 'details' ? COLORS.primary : '#666'} 
//           />
//           <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
//             Details
//           </Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === 'bids' && styles.activeTab]}
//           onPress={() => setActiveTab('bids')}
//         >
//           <FontAwesome5 
//             name="handshake" 
//             size={18} 
//             color={activeTab === 'bids' ? COLORS.primary : '#666'} 
//           />
//           <Text style={[styles.tabText, activeTab === 'bids' && styles.activeTabText]}>
//             Bids ({order.acceptedUsers?.length || 0})
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {activeTab === 'details' ? (
//         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//           {/* Order Info Card */}
//           <View style={styles.card}>
//             <View style={styles.cardHeader}>
//               <View style={styles.orderIdContainer}>
//                 <Text style={styles.orderId}>Order #{order.orderId}</Text>
//                 <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus || 'placed') }]}>
//                   <Text style={styles.statusText}>{order.orderStatus || 'placed'}</Text>
//                 </View>
//               </View>
//               {order.deliveryStatus && (
//                 <View style={styles.deliveryStatusContainer}>
//                   <Text style={styles.deliveryStatusLabel}>Delivery Status:</Text>
//                   <View style={[styles.statusBadge, { backgroundColor: getDeliveryStatusColor(order.deliveryStatus) }]}>
//                     <Text style={styles.statusText}>{order.deliveryStatus}</Text>
//                   </View>
//                 </View>
//               )}

//               {/* Live Tracking Section */}
//               {(order.deliveryStatus === 'in-transit' || order.deliveryStatus === 'accepted' || (order.orderStatus === 'confirmed' && isAcceptedUser)) && (
//                 <View style={styles.liveTrackingContainer}>
//                   <View style={styles.liveTrackingHeader}>
//                     <Ionicons name="location" size={20} color={COLORS.primary} />
//                     <Text style={styles.liveTrackingTitle}>Live Tracking</Text>
//                     {isTrackingLocation && (
//                       <View style={styles.trackingIndicator}>
//                         <View style={styles.trackingDot} />
//                         <Text style={styles.trackingText}>Live</Text>
//                       </View>
//                     )}
//                   </View>

//                   {liveLocation && (
//                     <View style={styles.locationInfo}>
//                       <Text style={styles.locationText}>
//                         📍 Lat: {liveLocation.lat.toFixed(6)}, Lng: {liveLocation.lng.toFixed(6)}
//                       </Text>
//                       <Text style={styles.locationTime}>
//                         Updated: {new Date(liveLocation.updatedAt).toLocaleTimeString()}
//                       </Text>
//                     </View>
//                   )}

//                   {liveLocation && (
//                     <View style={styles.locationDisplay}>
//                       <Text style={styles.locationTitle}>📍 Current Location</Text>
//                       <Text style={styles.locationCoords}>
//                         {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
//                       </Text>
//                       <Text style={styles.locationTimestamp}>
//                         Last updated: {new Date(liveLocation.updatedAt).toLocaleTimeString()}
//                       </Text>
//                     </View>
//                   )}

//                   {/* Tracking Controls for Delivery Person */}
//                   {isAcceptedUser && (order.deliveryStatus === 'in-transit' || order.deliveryStatus === 'accepted' || order.orderStatus === 'confirmed') && (
//                     <View style={styles.trackingControls}>
//                       {!isTrackingLocation ? (
//                         <TouchableOpacity
//                           style={styles.startTrackingButton}
//                           onPress={startLiveTracking}
//                         >
//                           <Ionicons name="location" size={18} color="#fff" />
//                           <Text style={styles.trackingButtonText}>Start Live Tracking</Text>
//                         </TouchableOpacity>
//                       ) : (
//                         <TouchableOpacity
//                           style={styles.stopTrackingButton}
//                           onPress={stopLiveTracking}
//                         >
//                           <Ionicons name="stop-circle" size={18} color="#fff" />
//                           <Text style={styles.trackingButtonText}>Stop Tracking</Text>
//                         </TouchableOpacity>
//                       )}
//                     </View>
//                   )}
//                 </View>
//               )}
//               <Text style={styles.dateText}>
//                 {new Date(order.createdAt).toLocaleDateString('en-IN', {
//                   day: 'numeric',
//                   month: 'short',
//                   year: 'numeric',
//                   hour: '2-digit',
//                   minute: '2-digit'
//                 })}
//               </Text>
//             </View>

//             {/* Shop Info */}
//             <View style={styles.section}>
//               <View style={styles.sectionHeader}>
//                 <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
//                 <Text style={styles.sectionTitle}>Shop Details</Text>
//               </View>
//               <Text style={styles.shopName}>{order.shopId?.name || 'Shop Name'}</Text>
//               <Text style={styles.shopLocation}>{order.shopId?.location || 'Shop Location'}</Text>
//             </View>

//             {/* Delivery Address */}
//             {deliveryAddress && (
//               <View style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                   <Ionicons name="location-outline" size={20} color={COLORS.primary} />
//                   <Text style={styles.sectionTitle}>Delivery Address</Text>
//                 </View>
//                 <Text style={styles.addressText}>
//                   {deliveryAddress.address}
//                   {deliveryAddress.city && `, ${deliveryAddress.city}`}
//                   {deliveryAddress.state && `, ${deliveryAddress.state}`}
//                   {deliveryAddress.zipCode && ` - ${deliveryAddress.zipCode}`}
//                 </Text>
//               </View>
//             )}

//             {/* Order Summary */}
//             <View style={styles.section}>
//               <View style={styles.sectionHeader}>
//                 <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
//                 <Text style={styles.sectionTitle}>Order Summary</Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Subtotal:</Text>
//                 <Text style={styles.summaryValue}>₹{order.totalAmount}</Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Delivery Charges:</Text>
//                 <Text style={styles.summaryValue}>₹{order.deliveryCharges}</Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Total Amount:</Text>
//                 <Text style={styles.summaryValue}>₹{order.finalAmount}</Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Delivery Type:</Text>
//                 <Text style={styles.summaryValue}>{order.deliveryType === 'own_delivery' ? 'Own Delivery' : 'Shop Delivery'}</Text>
//               </View>
//             </View>

//             {/* Payment Details */}
//             <View style={styles.section}>
//               <View style={styles.sectionHeader}>
//                 <Ionicons name="card-outline" size={20} color={COLORS.primary} />
//                 <Text style={styles.sectionTitle}>Payment Details</Text>
//               </View>
//               <View style={styles.detailRow}>
//                 <Text style={styles.detailLabel}>Payment ID:</Text>
//                 <Text style={styles.detailValue}>{order.paymentId}</Text>
//               </View>
//               <View style={styles.detailRow}>
//                 <Text style={styles.detailLabel}>Payment Status:</Text>
//                 <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.paymentStatus) }]}>
//                   <Text style={styles.statusText}>{order.paymentStatus}</Text>
//                 </View>
//               </View>
//               {order.razorpayOrderId && (
//                 <View style={styles.detailRow}>
//                   <Text style={styles.detailLabel}>Razorpay Order ID:</Text>
//                   <Text style={styles.detailValue}>{order.razorpayOrderId}</Text>
//                 </View>
//               )}
//             </View>

//             {/* Order Items */}
//             <View style={styles.section}>
//               <View style={styles.sectionHeader}>
//                 <Ionicons name="bag-outline" size={20} color={COLORS.primary} />
//                 <Text style={styles.sectionTitle}>Order Items ({order.items?.length || 0})</Text>
//               </View>
//               {(order.items || []).map((item, index) => (
//                 <View key={index} style={styles.itemCard}>
//                   {item.itemDetails?.images?.[0] && (
//                     <Image source={{ uri: item.itemDetails.images[0] }} style={styles.itemImage} />
//                   )}
//                   <View style={styles.itemDetails}>
//                     <Text style={styles.itemName}>{item.itemDetails?.name || 'Item'}</Text>
//                     <Text style={styles.itemCategory}>
//                       {item.itemDetails?.category} • {item.itemDetails?.brand}
//                     </Text>
//                     <View style={styles.itemFooter}>
//                       <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
//                       <Text style={styles.itemPrice}>₹{item.price}</Text>
//                     </View>
//                   </View>
//                 </View>
//               ))}
//             </View>

//             {/* Offers */}
//             {order.offers && order.offers.length > 0 && (
//               <View style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                   <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
//                   <Text style={styles.sectionTitle}>Applied Offers</Text>
//                 </View>
//                 {order.offers.map((offer, index) => (
//                   <View key={index} style={styles.offerCard}>
//                     <Text style={styles.offerCode}>{offer.code}</Text>
//                     <Text style={styles.offerDescription}>{offer.description}</Text>
//                     <Text style={styles.offerDiscount}>-₹{offer.discount}</Text>
//                   </View>
//                 ))}
//               </View>
//             )}

//             {/* Notes */}
//             {order.notes && (
//               <View style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                   <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
//                   <Text style={styles.sectionTitle}>Notes</Text>
//                 </View>
//                 <Text style={styles.notesText}>{order.notes}</Text>
//               </View>
//             )}

//             {/* Messages Summary */}
//             {order.acceptedUsers && order.acceptedUsers.length > 0 && (
//               <View style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                   <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
//                   <Text style={styles.sectionTitle}>Communication</Text>
//                 </View>
//                 {order.acceptedUsers.map((accepted, idx) => {
//                   const messageCount = accepted.messages?.length || 0;
//                   return (
//                     <View key={idx} style={styles.messageSummary}>
//                       <Text style={styles.messageSummaryText}>
//                         {getAcceptedUsername(accepted)}: {messageCount} message{messageCount !== 1 ? 's' : ''}
//                       </Text>
//                     </View>
//                   );
//                 })}
//               </View>
//             )}

//           </View>

//           {/* Accept Button for Travelers (NOT order creator) */}
//           {user && !isOrderCreator && order.orderStatus === 'placed' && (
//             <TouchableOpacity
//               style={styles.acceptButton}
//               onPress={() => setAcceptModalVisible(true)}
//             >
//               <Text style={styles.acceptButtonText}>Accept Order for Delivery</Text>
//             </TouchableOpacity>
//           )}
//         </ScrollView>
//       ) : (
//         <View style={styles.bidsContainer}>
//           <Text style={styles.bidsTitle}>Active Bids ({order.acceptedUsers?.length || 0})</Text>
          
//           {Array.isArray(order.acceptedUsers) && order.acceptedUsers.length > 0 ? (
//             order.acceptedUsers.map((accepted, idx) => {
//               const acceptedUserId = getAcceptedUserId(accepted);
//               const acceptedUsername = getAcceptedUsername(accepted);
//               const acceptedProfileImage = getAcceptedProfileImage(accepted);
              
//               console.log(`Bid ${idx} check:`, {
//                 acceptedUserId,
//                 currentUserId: user?._id,
//                 orderCreatorId,
//                 isOrderCreator,
//                 isAcceptedUser: acceptedUserId === user?._id
//               });
              
//               // RULE: Order creator sees ALL bids, Accepted user sees only their own bid
//               const isAcceptedUser = acceptedUserId === user?._id;
//               const shouldShow = isOrderCreator || isAcceptedUser;
              
//               console.log(`Should show bid ${idx}?`, shouldShow);
              
//               if (!shouldShow) {
//                 return null; // Don't render this bid
//               }
              
//               return (
//                 <View key={accepted._id || idx} style={styles.bidCard}>
//                   <View style={styles.bidHeader}>
//                     <Image 
//                       source={{ uri: acceptedProfileImage }} 
//                       style={styles.bidderAvatar} 
//                     />
//                     <View style={styles.bidderInfo}>
//                       <Text style={styles.bidderName}>{acceptedUsername}</Text>
//                       <View style={styles.bidderStatus}>
//                         <View style={[
//                           styles.statusDot, 
//                           { backgroundColor: getDeliveryStatusColor(accepted.status) }
//                         ]} />
//                         <Text style={styles.bidderStatusText}>{accepted.status}</Text>
//                       </View>
//                     </View>
//                     <Text style={styles.bidPrice}>₹{accepted.price}</Text>
//                   </View>
                  
//                   <View style={styles.bidDetails}>
//                     <View style={styles.bidDetailItem}>
//                       <MaterialCommunityIcons name="truck" size={16} color="#666" />
//                       <Text style={styles.bidDetailText}>{accepted.vehicleType}</Text>
//                     </View>
//                     <View style={styles.bidDetailItem}>
//                       <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
//                       <Text style={styles.bidDetailText}>{accepted.tentativeTime}</Text>
//                     </View>
//                   </View>
                  
//                   <View style={styles.bidActions}>
//                     {/* Chat Button - Show for both order creator and accepted user */}
//                     <TouchableOpacity
//                       style={styles.chatButton}
//                       onPress={() => {
//                         let chatPartner;
//                         if (isOrderCreator) {
//                           // Order creator chatting with accepted user
//                           chatPartner = accepted;
//                         } else {
//                           // Accepted user chatting with order creator
//                           chatPartner = { userId: order.userId };
//                         }
//                         setSelectedUser(chatPartner);
                        
//                         // Load messages
//                         const userMessages = accepted.messages || [];
//                         setUserMessages(userMessages);
//                         setShowChat(true);
//                       }}
//                     >
//                       <Ionicons name="chatbubble-outline" size={18} color="#fff" />
//                       <Text style={styles.chatButtonText}>Chat</Text>
//                     </TouchableOpacity>

//                     {/* Confirm Button - ONLY for ORDER CREATOR */}
//                     {isOrderCreator && accepted.status === 'accepted' && (
//                       <TouchableOpacity
//                         style={styles.confirmBidButton}
//                         onPress={() => confirmOrderBid(orderId as string, acceptedUserId)}
//                       >
//                         <Ionicons name="checkmark-circle" size={18} color="#fff" />
//                         <Text style={styles.confirmBidButtonText}>Confirm</Text>
//                       </TouchableOpacity>
//                     )}

//                     {/* Update Price Button - ONLY for ACCEPTED USER (not order creator) */}
//                     {isAcceptedUser && accepted.status === 'accepted' && (
//                       <TouchableOpacity
//                         style={styles.updateBidButton}
//                         onPress={() => {
//                           setSelectedUser(accepted);
//                           setNewPrice(accepted.price.toString());
//                           setShowUpdatePrice(true);
//                         }}
//                       >
//                         <MaterialIcons name="edit" size={18} color={COLORS.primary} />
//                         <Text style={styles.updateBidButtonText}>Update Price</Text>
//                       </TouchableOpacity>
//                     )}

//                     {/* Delivery Status Update Buttons - ONLY for ACCEPTED USER */}
//                     {isAcceptedUser && accepted.status === 'accepted' && (
//                       <TouchableOpacity
//                         style={styles.deliveryStatusButton}
//                         onPress={() => updateDeliveryStatus(acceptedUserId, 'in-transit')}
//                       >
//                         <MaterialCommunityIcons name="truck-delivery" size={18} color="#fff" />
//                         <Text style={styles.deliveryStatusButtonText}>Start Delivery</Text>
//                       </TouchableOpacity>
//                     )}

//                     {isAcceptedUser && accepted.status === 'in-transit' && (
//                       <View style={styles.deliveryStatusActions}>
//                         <TouchableOpacity
//                           style={[styles.deliveryStatusButton, styles.deliveredButton]}
//                           onPress={() => updateDeliveryStatus(acceptedUserId, 'delivered')}
//                         >
//                           <Ionicons name="checkmark-circle" size={18} color="#fff" />
//                           <Text style={styles.deliveryStatusButtonText}>Delivered</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity
//                           style={[styles.deliveryStatusButton, styles.cancelledButton]}
//                           onPress={() => updateDeliveryStatus(acceptedUserId, 'cancelled')}
//                         >
//                           <Ionicons name="close-circle" size={18} color="#fff" />
//                           <Text style={styles.deliveryStatusButtonText}>Cancel</Text>
//                         </TouchableOpacity>
//                       </View>
//                     )}

//                     {/* Delivery Tracking Actions - ONLY for ACCEPTED USER */}
//                     {isAcceptedUser && (accepted.status === 'in-transit' || accepted.status === 'accepted') && (
//                       <View style={styles.deliveryTrackingActions}>
//                         {/* Upload Delivery Image */}
//                         <TouchableOpacity
//                           style={styles.trackingActionButton}
//                           onPress={() => {
//                             // For simplicity, using a placeholder image URL
//                             uploadDeliveryImage('https://via.placeholder.com/150', false);
//                           }}
//                         >
//                           <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
//                           <Text style={styles.trackingActionText}>Upload Image</Text>
//                         </TouchableOpacity>

//                         {/* Upload Delivery Image with Barcode */}
//                         <TouchableOpacity
//                           style={styles.trackingActionButton}
//                           onPress={() => {
//                             uploadDeliveryImage('https://via.placeholder.com/150', true);
//                           }}
//                         >
//                           <Ionicons name="barcode-outline" size={18} color={COLORS.primary} />
//                           <Text style={styles.trackingActionText}>Upload with Barcode</Text>
//                         </TouchableOpacity>

//                         {/* Set Recipient & Generate OTP */}
//                         <TouchableOpacity
//                           style={styles.trackingActionButton}
//                           onPress={() => {
//                             Alert.alert(
//                               'Recipient Mobile',
//                               'Enter recipient mobile number',
//                               [
//                                 { text: 'Cancel', style: 'cancel' },
//                                 {
//                                   text: 'OK',
//                                   onPress: () => {
//                                     if (recipientMobile) {
//                                       setRecipient();
//                                     }
//                                   }
//                                 }
//                               }
//                             ]
//                           }}
//                         >
//                           <Ionicons name="call-outline" size={18} color={COLORS.primary} />
//                           <Text style={styles.trackingActionText}>Set Recipient</Text>
//                         </TouchableOpacity>

//                         {/* Mark Barcode Scanned */}
//                         <TouchableOpacity
//                           style={styles.trackingActionButton}
//                           onPress={() => {
//                             Alert.alert(
//                               'Barcode Data',
//                               'Enter barcode data',
//                               [
//                                 { text: 'Cancel', style: 'cancel' },
//                                 {
//                                   text: 'OK',
//                                   onPress: () => {
//                                     if (barcodeData) {
//                                       markBarcodeScanned();
//                                     }
//                                   }
//                                 }
//                               }
//                             ]
//                           }}
//                         >
//                           <Ionicons name="scan-outline" size={18} color={COLORS.primary} />
//                           <Text style={styles.trackingActionText}>Scan Barcode</Text>
//                         </TouchableOpacity>
//                       </View>
//                     )}
//                   </View>
//                 </View>
//               );
//             })
//           ) : (
//             <View style={styles.noBidsContainer}>
//               <MaterialCommunityIcons name="truck-remove" size={64} color="#DDD" />
//               <Text style={styles.noBidsText}>No bids yet</Text>
//               <Text style={styles.noBidsSubtext}>Be the first to bid on this delivery</Text>
//             </View>
//           )}
//         </View>
//       )}

//       {/* Accept Modal - Only for non-order creators */}
//       {acceptModalVisible && !isOrderCreator && (
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Accept Order</Text>

//             <Text style={styles.modalLabel}>Tentative Delivery Time</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="e.g., 2 hours"
//               value={tentativeTime}
//               onChangeText={setTentativeTime}
//             />

//             <Text style={styles.modalLabel}>Your Price (₹)</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter your delivery price"
//               value={orderPrice}
//               onChangeText={setOrderPrice}
//               keyboardType="numeric"
//             />

//             <Text style={styles.modalLabel}>Vehicle Type</Text>
//             <View style={styles.pickerWrapper}>
//               <Picker
//                 selectedValue={acceptVehicleType}
//                 onValueChange={setAcceptVehicleType}
//                 style={styles.picker}
//               >
//                 <Picker.Item label="Select vehicle type" value="" />
//                 {vehicles.map(vehicle => (
//                   <Picker.Item key={vehicle._id} label={vehicle.vehicleType} value={vehicle.vehicleType} />
//                 ))}
//               </Picker>
//             </View>

//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={styles.cancelButton}
//                 onPress={() => setAcceptModalVisible(false)}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.confirmButton}
//                 onPress={handleSubmitAccept}
//               >
//                 <Text style={styles.confirmButtonText}>Accept Order</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       )}

//       {/* Update Price Modal - Only for accepted users */}
//       {showUpdatePrice && selectedUser && !isOrderCreator && (
//         <View style={styles.modalOverlay}>
//           <View style={styles.priceModalContainer}>
//             <Text style={styles.modalTitle}>
//               Update Bid Price
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
//                 onPress={() => {
//                   setShowUpdatePrice(false);
//                   setSelectedUser(null);
//                   setNewPrice('');
//                 }}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.confirmButton]}
//                 onPress={async () => {
//                   if (!newPrice.trim()) {
//                     Alert.alert("Error", "Please enter a new price");
//                     return;
//                   }
//                   await updateOrderBid(orderId as string, getAcceptedUserId(selectedUser), parseFloat(newPrice));
//                   setShowUpdatePrice(false);
//                   setSelectedUser(null);
//                   setNewPrice('');
//                   // Refresh order
//                   const orderRes = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}`);
//                   const updatedOrder = await orderRes.json();
//                   setOrder(updatedOrder);
//                 }}
//               >
//                 <Text style={styles.confirmButtonText}>Update Price</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       )}

//       {/* Chat Modal */}
//       {showChat && selectedUser && (
//         <View style={styles.chatModal}>
//           <View style={styles.chatHeader}>
//             <View style={styles.chatUserInfo}>
//               <Image 
//                 source={{ uri: isOrderCreator ? 
//                   getAcceptedProfileImage(selectedUser) : 
//                   (typeof order.userId === 'object' ? order.userId.profileImage : 'https://via.placeholder.com/40')
//                 }} 
//                 style={styles.chatAvatar}
//               />
//               <View>
//                 <Text style={styles.chatUserName}>
//                   {isOrderCreator ? 
//                     getAcceptedUsername(selectedUser) : 
//                     getUsername(order.userId)
//                   }
//                 </Text>
//                 <View style={styles.chatStatus}>
//                   <View style={[
//                     styles.onlineIndicator, 
//                     { backgroundColor: onlineUsers.includes(
//                       isOrderCreator ? 
//                       getAcceptedUserId(selectedUser) : 
//                       orderCreatorId
//                     ) ? '#4CAF50' : '#999' }
//                   ]} />
//                   <Text style={styles.chatStatusText}>
//                     {otherUserTyping ? 'Typing...' : 
//                      onlineUsers.includes(
//                        isOrderCreator ? 
//                        getAcceptedUserId(selectedUser) : 
//                        orderCreatorId
//                      ) ? 'Online' : 'Offline'}
//                   </Text>
//                 </View>
//               </View>
//             </View>
            
//             <View style={styles.chatHeaderActions}>
//               <TouchableOpacity onPress={() => {
//                 setShowChat(false);
//                 setSelectedUser(null);
//                 setUserMessages([]);
//               }}>
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
//     </SafeAreaView>
//   );
// }

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
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { io } from 'socket.io-client';
import COLORS from "@/constants/color";
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from "@react-native-picker/picker";
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface OrderItem {
  subItemId: {
    _id: string;
    name: string;
    images: string[];
    category: string;
    brand: string;
  };
  quantity: number;
  price: number;
  itemDetails: {
    name: string;
    category: string;
    brand: string;
    images: string[];
  };
}

interface AcceptedUser {
  _id?: string;
  userId: string | {
    _id: string;
    username: string;
    profileImage?: string;
  };
  vehicleType: string;
  tentativeTime: string;
  price: number;
  status: string;
  messages?: any[];
  deliveryDetails?: {
    deliveryBoyId?: string;
    deliveryStatus: string;
    currentLocation?: {
      lat: number;
      lng: number;
      timestamp: Date;
    };
    deliveryImage?: string;
    deliveryImageWithBarcode?: string;
    recipientMobile?: string;
    otpCode?: string;
    otpVerified: boolean;
    deliveredAt?: Date;
    barcodeScanned: boolean;
    barcodeData?: string;
  };
}

interface Order {
  _id: string;
  orderId: string;
  userId: string | {  // This can be string or object
    _id: string;
    username: string;
    profileImage?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  deliveryCharges: number;
  finalAmount: number;
  deliveryType: string;
  shopId: {
    _id: string;
    name: string;
    location: string;
  };
  deliveryAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  customAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentId: string;
  paymentStatus: string;
  orderStatus: string;
  deliveryStatus?: string;
  razorpayOrderId?: string;
  offers?: {
    code: string;
    discount: number;
    description: string;
  }[];
  acceptedUsers?: AcceptedUser[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function SingleOrder() {
  const { order: orderId } = useLocalSearchParams();
  const { user, token, fetchVehicles, vehicles, acceptOrder, updateOrderBid, confirmOrderBid, updateDeliveryStatus: updateDeliveryStatusStore } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [tentativeTime, setTentativeTime] = useState("");
  const [acceptVehicleType, setAcceptVehicleType] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [activeTab, setActiveTab] = useState<'details' | 'bids'>('details');
  const [showUpdatePrice, setShowUpdatePrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [liveLocation, setLiveLocation] = useState<any>(null);

  // Delivery tracking states
  const [recipientMobile, setRecipientMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [barcodeData, setBarcodeData] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Auto-manage live tracking based on order status
  useEffect(() => {
    if (!order || !user) return;

    const isAcceptedUser = order.acceptedUsers?.some(au => getAcceptedUserId(au) === user._id) || false;

    if (!isAcceptedUser) return;

    const shouldTrack = order.deliveryStatus === 'in-transit' || order.deliveryStatus === 'accepted' || order.orderStatus === 'confirmed';

    if (shouldTrack && !isTrackingLocation) {
      // Auto-start tracking when order becomes in-transit
      startLiveTracking();
    } else if (!shouldTrack && isTrackingLocation) {
      // Auto-stop tracking when order is delivered/cancelled
      stopLiveTracking();
    }
  }, [order?.deliveryStatus, order?.acceptedUsers, user?._id, isTrackingLocation]);

  // Helper function to get user ID from userId field (handles both string and object)
  const getUserId = (userIdField: any): string => {
    if (!userIdField) return '';
    
    if (typeof userIdField === 'string') {
      return userIdField;
    }
    
    if (typeof userIdField === 'object' && userIdField._id) {
      return userIdField._id;
    }
    
    // Try to extract ID from MongoDB ObjectId
    if (userIdField && typeof userIdField === 'object') {
      // Check if it has $oid format (MongoDB extended JSON)
      if (userIdField.$oid) {
        return userIdField.$oid;
      }
      
      // Try to get toString() if it's an ObjectId
      if (typeof userIdField.toString === 'function') {
        return userIdField.toString();
      }
    }
    
    return '';
  };

  // Helper function to get username from userId field
  const getUsername = (userIdField: any): string => {
    if (typeof userIdField === 'object' && userIdField.username) {
      return userIdField.username;
    }
    return 'User';
  };

  // Helper function to get accepted user ID
  const getAcceptedUserId = (acceptedUser: AcceptedUser): string => {
    return getUserId(acceptedUser.userId);
  };

  // Helper function to get accepted username
  const getAcceptedUsername = (acceptedUser: AcceptedUser): string => {
    if (typeof acceptedUser.userId === 'object' && acceptedUser.userId.username) {
      return acceptedUser.userId.username;
    }
    return 'Traveler';
  };

  // Helper function to get accepted profile image
  const getAcceptedProfileImage = (acceptedUser: AcceptedUser): string => {
    if (typeof acceptedUser.userId === 'object' && acceptedUser.userId.profileImage) {
      return acceptedUser.userId.profileImage;
    }
    return 'https://via.placeholder.com/40';
  };

  const handleSubmitAccept = async () => {
    if (!orderId) return;

    await acceptOrder(orderId as string, {
      tentativeDeliveryTime: tentativeTime,
      acceptedVehicleType: acceptVehicleType,
      price: parseFloat(orderPrice) || 0,
    });

    setAcceptModalVisible(false);
    setTentativeTime("");
    setOrderPrice("");
    setAcceptVehicleType("");
    setSelectedVehicleId("");
    // Refresh order
    const orderRes = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}`);
    const updatedOrder = await orderRes.json();
    setOrder(updatedOrder);
  };

  const updateDeliveryStatus = async (userId: string, status: string) => {
    await updateDeliveryStatusStore(orderId as string, userId, status);
    // Refresh order data
    const orderRes = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}`);
    const updatedOrder = await orderRes.json();
    setOrder(updatedOrder);
  };

  const startLiveTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for live tracking');
        return;
      }

      setIsTrackingLocation(true);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,      // every 5 sec
          distanceInterval: 10,    // every 10 meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;

          // Send location update via socket
          if (socket) {
            socket.emit('order:location-update', {
              orderId: orderId,
              lat: latitude,
              lng: longitude,
            });
          }
        }
      );

      // Store subscription - some versions return different object types
      setLocationSubscription(subscription);
      Alert.alert('Success', 'Live tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
      setIsTrackingLocation(false);
    }
  };

  const stopLiveTracking = () => {
    try {
      if (locationSubscription) {
        // Different versions of expo-location have different methods
        // Try multiple approaches
        if (typeof locationSubscription.remove === 'function') {
          locationSubscription.remove();
        } else if (typeof locationSubscription.unsubscribe === 'function') {
          locationSubscription.unsubscribe();
        } else if (typeof locationSubscription.cancel === 'function') {
          locationSubscription.cancel();
        }
        // Clear the subscription reference
        setLocationSubscription(null);
      }
      setIsTrackingLocation(false);
      Alert.alert('Success', 'Live tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      // Force cleanup even if remove fails
      setLocationSubscription(null);
      setIsTrackingLocation(false);
      Alert.alert('Success', 'Live tracking stopped');
    }
  };

  // Delivery tracking functions
  const uploadDeliveryImage = async (image: string, withBarcode: boolean = false) => {
    try {
      const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/upload-delivery-image`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id,
          image,
          withBarcode
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOrder(data.order);
      Alert.alert('Success', 'Delivery image uploaded successfully');
    } catch (error) {
      console.error('Error uploading delivery image:', error);
      Alert.alert('Error', 'Failed to upload delivery image');
    }
  };

  const setRecipient = async () => {
    if (!recipientMobile) {
      Alert.alert('Error', 'Please enter recipient mobile number');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/set-recipient`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id,
          recipientMobile
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOrder(data.order);
      setOtpCode(data.otpCode);
      setShowOtpModal(true);
    } catch (error) {
      console.error('Error setting recipient:', error);
      Alert.alert('Error', 'Failed to set recipient');
    }
  };

  const verifyOtp = async () => {
    if (!otpCode) {
      Alert.alert('Error', 'Please enter OTP');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/verify-otp`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id,
          otpCode: otpCode
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOrder(data.order);
      Alert.alert('Success', 'OTP verified successfully. Delivery completed!');
      setShowOtpModal(false);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP');
    }
  };

  const markBarcodeScanned = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/mark-barcode-scanned`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id,
          barcodeData: barcodeData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOrder(data.order);
      Alert.alert('Success', 'Barcode marked as scanned');
      setShowBarcodeModal(false);
    } catch (error) {
      console.error('Error marking barcode as scanned:', error);
      Alert.alert('Error', 'Failed to mark barcode as scanned');
    }
  };

  const checkDeliveryRequirements = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/check-delivery-requirements?userId=${user?._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.requirementsMet) {
        let missingItems = [];

        if (!data.hasDeliveryImage) missingItems.push("delivery image");
        if (!data.hasDeliveryImageWithBarcode) missingItems.push("delivery image with barcode");
        if (!data.otpVerified) missingItems.push("OTP verification");

        Alert.alert(
          'Incomplete Requirements',
          `Please complete the following before marking as delivered:\n\n• ${missingItems.join('\n• ')}`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking delivery requirements:', error);
      Alert.alert('Error', 'Failed to check delivery requirements');
      return false;
    }
  };

  const handleTyping = (typing: boolean) => {
    if (!socket || !selectedUser || !order) return;

    let roomId: string;

    const orderCreatorId = getUserId(order.userId);
    if (user._id === orderCreatorId) {
      roomId = `${orderId}-${getAcceptedUserId(selectedUser)}`;
    } else {
      roomId = `${orderId}-${user._id}`;
    }

    socket.emit('typing-order', {
      roomId,
      userId: user._id,
      isTyping: typing
    });

    setIsTyping(typing);
  };

  const sendMessage = async () => {
    if (!socket || !messageInput.trim() || !order) return;

    let targetUserId: string;

    const orderCreatorId = getUserId(order.userId);
    if (user._id === orderCreatorId) {
      if (!selectedUser) {
        Alert.alert('Error', 'Please select a user to chat with');
        return;
      }
      targetUserId = getAcceptedUserId(selectedUser);
    } else {
      targetUserId = orderCreatorId;
    }

    const messageData = {
      orderId: orderId as string,
      senderId: user._id,
      receiverId: targetUserId,
      message: messageInput.trim(),
      username: user.username
    };

    try {
      console.log('📤 Frontend: Sending order message via Socket.IO:', messageData);
      // Send via Socket.IO for real-time delivery
      socket.emit('sendOrderMessage', messageData);

      // Optimistic update - add message to UI immediately
      const optimisticMessage = {
        ...messageData,
        _id: Date.now().toString(), // Temporary ID
        createdAt: new Date().toISOString(),
        senderId: user._id,
        read: false
      };

      setUserMessages(prev => [...prev, optimisticMessage]);
      setMessageInput('');
      handleTyping(false);

    } catch (error) {
      console.error('Failed to send order message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#666';
    switch (status.toLowerCase()) {
      case 'placed': return '#FFA500';
      case 'confirmed': return '#4CAF50';
      case 'preparing': return '#2196F3';
      case 'ready': return '#8BC34A';
      case 'out_for_delivery': return '#FF9800';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    if (!status) return '#666';
    switch (status.toLowerCase()) {
      case 'accepted': return '#4CAF50';
      case 'in-transit': return '#2196F3';
      case 'delivered': return '#8BC34A';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log('🔍 Fetching order with ID:', orderId);
        console.log('🔑 Token available:', !!token, token ? token.substring(0, 20) + '...' : 'null');

        const headers: any = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
          console.log('📤 Sending Authorization header');
        } else {
          console.log('⚠️ No token available, sending request without auth');
        }

        const res = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}`, {
          headers
        });

        console.log('📡 Response status:', res.status);
        console.log('📡 Response ok:', res.ok);
        console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));

        const responseText = await res.text();
        console.log('📡 Raw response text:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log('📦 Parsed JSON data:', data);
        } catch (parseError) {
          console.error('❌ Failed to parse response as JSON:', parseError);
          data = { error: 'Invalid response format', raw: responseText };
        }

        console.log('📦 Order userId field:', data.userId);
        console.log('📦 Type of userId:', typeof data.userId);
        console.log('📦 Current user ID:', user?._id);

        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Debug: Log order and user info
  useEffect(() => {
    if (order && user) {
      console.log('=== USER CHECK ===');
      console.log('Current User ID:', user._id);
      console.log('Order userId field:', order.userId);
      console.log('Extracted Order Creator ID:', getUserId(order.userId));
      console.log('Is Order Creator?', user._id === getUserId(order.userId));
      console.log('Accepted Users:', order.acceptedUsers?.map(au => ({
        userId: au.userId,
        type: typeof au.userId,
        extractedId: getAcceptedUserId(au)
      })));
      console.log('=== END CHECK ===');
    }
  }, [order, user, activeTab]);

  // Socket.IO Connection
  useEffect(() => {
    if (!orderId || !user || !order) return;

    const newSocket = io('http://localhost:3001');

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Frontend: Connected to Socket.IO server:', newSocket.id);

      // Join the order chat room (all accepted users + order creator)
      console.log('🏠 Frontend: Joining order chat rooms...');
      newSocket.emit('joinOrderChat', {
        orderId: orderId as string,
        userId: user._id
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Frontend: Disconnected from Socket.IO server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Frontend: Socket.IO connection error:', error);
    });

    newSocket.on('joined-order-chat', ({ orderId }) => {
      console.log(`Joined order chat room: ${orderId}`);
    });

    newSocket.on('join-error', (error) => {
      console.error('Failed to join order chat:', error);
      Alert.alert('Error', error);
    });

    // Listen for real-time messages in this order
    newSocket.on('receiveOrderMessage', (message) => {
      console.log('🎧 RECEIVE ORDER MESSAGE EVENT TRIGGERED!');
      console.log('📦 Raw message data:', message);

      const { senderId, receiverId, orderId: msgOrderId } = message;

      // Only handle messages for this order
      if (msgOrderId !== orderId) {
        console.log('❌ Wrong order ID, ignoring');
        return;
      }

      // Simplified logic: show message if user is involved (either sender or receiver)
      const isUserInvolved = senderId === user._id || receiverId === user._id;

      if (isUserInvolved) {
        console.log('✅ User is involved, adding message to chat');

        // For accepted users, if message is from order creator, ensure we have a chat partner
        const orderCreatorId = getUserId(order.userId);
        if (user._id !== orderCreatorId && senderId === orderCreatorId && !selectedUser) {
          console.log('📨 Auto-setting selectedUser to order creator for accepted user');
          setSelectedUser({ userId: order.userId });
        }

        setUserMessages(prev => {
          // Check for existing optimistic message to replace (same message content and sender)
          const existingIndex = prev.findIndex(m =>
            m.senderId === message.senderId &&
            m.receiverId === message.receiverId &&
            m.message === message.message &&
            m.timestamp === message.timestamp
          );

          if (existingIndex !== -1) {
            console.log('🔄 Replacing optimistic message with real-time message');
            const updated = [...prev];
            updated[existingIndex] = message; // Replace optimistic with real message
            return updated;
          }

          console.log('📝 Adding new real-time message to UI');
          return [...prev, message];
        });
      } else {
        console.log('❌ User is not involved in this message');
      }
    });

    newSocket.on('user-typing-order', ({ roomId, userId, isTyping }) => {
      if (selectedUser && roomId === `${orderId}-${getAcceptedUserId(selectedUser)}`) {
        setOtherUserTyping(isTyping);
      }
    });

    // Join order tracking room for live GPS
    newSocket.emit('join:order-tracking', { orderId: orderId });

    // Listen for live location updates
    newSocket.on('order:location-receive', (locationData) => {
      console.log('📍 Received live location:', locationData);
      setLiveLocation(locationData);
    });

    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, [orderId, user, order]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Order Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={80} color="#E0E0E0" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {}}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const deliveryAddress = order.deliveryAddress || order.customAddress;
  const orderCreatorId = getUserId(order.userId);
  const isOrderCreator = user?._id === orderCreatorId;
  const isAcceptedUser = order.acceptedUsers?.some(au => getAcceptedUserId(au) === user?._id) || false;
  
  console.log('RENDER DEBUG:', {
    orderCreatorId,
    currentUserId: user?._id,
    isOrderCreator,
    acceptedUsersCount: order.acceptedUsers?.length || 0
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {}}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerRight} />
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
            Bids ({order.acceptedUsers?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'details' ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Order Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.orderIdContainer}>
                <Text style={styles.orderId}>Order #{order.orderId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus || 'placed') }]}>
                  <Text style={styles.statusText}>{order.orderStatus || 'placed'}</Text>
                </View>
              </View>
              {order.deliveryStatus && (
                <View style={styles.deliveryStatusContainer}>
                  <Text style={styles.deliveryStatusLabel}>Delivery Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getDeliveryStatusColor(order.deliveryStatus) }]}>
                    <Text style={styles.statusText}>{order.deliveryStatus}</Text>
                  </View>
                </View>
              )}

              {/* Live Tracking Section */}
              {(order.deliveryStatus === 'in-transit' || order.deliveryStatus === 'accepted' || (order.orderStatus === 'confirmed' && isAcceptedUser)) && (
                <View style={styles.liveTrackingContainer}>
                  <View style={styles.liveTrackingHeader}>
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                    <Text style={styles.liveTrackingTitle}>Live Tracking</Text>
                    {isTrackingLocation && (
                      <View style={styles.trackingIndicator}>
                        <View style={styles.trackingDot} />
                        <Text style={styles.trackingText}>Live</Text>
                      </View>
                    )}
                  </View>

                  {liveLocation && (
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationText}>
                        📍 Lat: {liveLocation.lat.toFixed(6)}, Lng: {liveLocation.lng.toFixed(6)}
                      </Text>
                      <Text style={styles.locationTime}>
                        Updated: {new Date(liveLocation.updatedAt).toLocaleTimeString()}
                      </Text>
                    </View>
                  )}

                  {liveLocation && (
                    <View style={styles.locationDisplay}>
                      <Text style={styles.locationTitle}>📍 Current Location</Text>
                      <Text style={styles.locationCoords}>
                        {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
                      </Text>
                      <Text style={styles.locationTimestamp}>
                        Last updated: {new Date(liveLocation.updatedAt).toLocaleTimeString()}
                      </Text>
                    </View>
                  )}

                  {/* Tracking Controls for Delivery Person */}
                  {isAcceptedUser && (order.deliveryStatus === 'in-transit' || order.deliveryStatus === 'accepted' || order.orderStatus === 'confirmed') && (
                    <View style={styles.trackingControls}>
                      {!isTrackingLocation ? (
                        <TouchableOpacity
                          style={styles.startTrackingButton}
                          onPress={startLiveTracking}
                        >
                          <Ionicons name="location" size={18} color="#fff" />
                          <Text style={styles.trackingButtonText}>Start Live Tracking</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.stopTrackingButton}
                          onPress={stopLiveTracking}
                        >
                          <Ionicons name="stop-circle" size={18} color="#fff" />
                          <Text style={styles.trackingButtonText}>Stop Tracking</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.dateText}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            {/* Shop Info */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Shop Details</Text>
              </View>
              <Text style={styles.shopName}>{order.shopId?.name || 'Shop Name'}</Text>
              <Text style={styles.shopLocation}>{order.shopId?.location || 'Shop Location'}</Text>
            </View>

            {/* Delivery Address */}
            {deliveryAddress && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                </View>
                <Text style={styles.addressText}>
                  {deliveryAddress.address}
                  {deliveryAddress.city && `, ${deliveryAddress.city}`}
                  {deliveryAddress.state && `, ${deliveryAddress.state}`}
                  {deliveryAddress.zipCode && ` - ${deliveryAddress.zipCode}`}
                </Text>
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Order Summary</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>₹{order.totalAmount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Charges:</Text>
                <Text style={styles.summaryValue}>₹{order.deliveryCharges}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount:</Text>
                <Text style={styles.summaryValue}>₹{order.finalAmount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Type:</Text>
                <Text style={styles.summaryValue}>{order.deliveryType === 'own_delivery' ? 'Own Delivery' : 'Shop Delivery'}</Text>
              </View>
            </View>

            {/* Payment Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Payment Details</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment ID:</Text>
                <Text style={styles.detailValue}>{order.paymentId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.paymentStatus) }]}>
                  <Text style={styles.statusText}>{order.paymentStatus}</Text>
                </View>
              </View>
              {order.razorpayOrderId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Razorpay Order ID:</Text>
                  <Text style={styles.detailValue}>{order.razorpayOrderId}</Text>
                </View>
              )}
            </View>

            {/* Order Items */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bag-outline" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Order Items ({order.items?.length || 0})</Text>
              </View>
              {(order.items || []).map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  {item.itemDetails?.images?.[0] && (
                    <Image source={{ uri: item.itemDetails.images[0] }} style={styles.itemImage} />
                  )}
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.itemDetails?.name || 'Item'}</Text>
                    <Text style={styles.itemCategory}>
                      {item.itemDetails?.category} • {item.itemDetails?.brand}
                    </Text>
                    <View style={styles.itemFooter}>
                      <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Offers */}
            {order.offers && order.offers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Applied Offers</Text>
                </View>
                {order.offers.map((offer, index) => (
                  <View key={index} style={styles.offerCard}>
                    <Text style={styles.offerCode}>{offer.code}</Text>
                    <Text style={styles.offerDescription}>{offer.description}</Text>
                    <Text style={styles.offerDiscount}>-₹{offer.discount}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Notes */}
            {order.notes && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Notes</Text>
                </View>
                <Text style={styles.notesText}>{order.notes}</Text>
              </View>
            )}

            {/* Messages Summary */}
            {order.acceptedUsers && order.acceptedUsers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Communication</Text>
                </View>
                {order.acceptedUsers.map((accepted, idx) => {
                  const messageCount = accepted.messages?.length || 0;
                  return (
                    <View key={idx} style={styles.messageSummary}>
                      <Text style={styles.messageSummaryText}>
                        {getAcceptedUsername(accepted)}: {messageCount} message{messageCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

          </View>

          {/* Accept Button for Travelers (NOT order creator) */}
          {user && !isOrderCreator && order.orderStatus === 'placed' && (
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => setAcceptModalVisible(true)}
            >
              <Text style={styles.acceptButtonText}>Accept Order for Delivery</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <View style={styles.bidsContainer}>
          <Text style={styles.bidsTitle}>Active Bids ({order.acceptedUsers?.length || 0})</Text>
          
          {Array.isArray(order.acceptedUsers) && order.acceptedUsers.length > 0 ? (
            order.acceptedUsers.map((accepted, idx) => {
              const acceptedUserId = getAcceptedUserId(accepted);
              const acceptedUsername = getAcceptedUsername(accepted);
              const acceptedProfileImage = getAcceptedProfileImage(accepted);
              
              console.log(`Bid ${idx} check:`, {
                acceptedUserId,
                currentUserId: user?._id,
                orderCreatorId,
                isOrderCreator,
                isAcceptedUser: acceptedUserId === user?._id
              });
              
              // RULE: Order creator sees ALL bids, Accepted user sees only their own bid
              const isAcceptedUser = acceptedUserId === user?._id;
              const shouldShow = isOrderCreator || isAcceptedUser;
              
              console.log(`Should show bid ${idx}?`, shouldShow);
              
              if (!shouldShow) {
                return null; // Don't render this bid
              }
              
              return (
                <View key={accepted._id || idx} style={styles.bidCard}>
                  <View style={styles.bidHeader}>
                    <Image 
                      source={{ uri: acceptedProfileImage }} 
                      style={styles.bidderAvatar} 
                    />
                    <View style={styles.bidderInfo}>
                      <Text style={styles.bidderName}>{acceptedUsername}</Text>
                      <View style={styles.bidderStatus}>
                        <View style={[
                          styles.statusDot, 
                          { backgroundColor: getDeliveryStatusColor(accepted.status) }
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
                    {/* Chat Button - Show for both order creator and accepted user */}
                    <TouchableOpacity
                      style={styles.chatButton}
                      onPress={() => {
                        let chatPartner;
                        if (isOrderCreator) {
                          // Order creator chatting with accepted user
                          chatPartner = accepted;
                        } else {
                          // Accepted user chatting with order creator
                          chatPartner = { userId: order.userId };
                        }
                        setSelectedUser(chatPartner);
                        
                        // Load messages
                        const userMessages = accepted.messages || [];
                        setUserMessages(userMessages);
                        setShowChat(true);
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                      <Text style={styles.chatButtonText}>Chat</Text>
                    </TouchableOpacity>

                    {/* Confirm Button - ONLY for ORDER CREATOR */}
                    {isOrderCreator && accepted.status === 'accepted' && (
                      <TouchableOpacity
                        style={styles.confirmBidButton}
                        onPress={() => confirmOrderBid(orderId as string, acceptedUserId)}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.confirmBidButtonText}>Confirm</Text>
                      </TouchableOpacity>
                    )}

                    {/* Update Price Button - ONLY for ACCEPTED USER (not order creator) */}
                    {isAcceptedUser && accepted.status === 'accepted' && (
                      <TouchableOpacity
                        style={styles.updateBidButton}
                        onPress={() => {
                          setSelectedUser(accepted);
                          setNewPrice(accepted.price.toString());
                          setShowUpdatePrice(true);
                        }}
                      >
                        <MaterialIcons name="edit" size={18} color={COLORS.primary} />
                        <Text style={styles.updateBidButtonText}>Update Price</Text>
                      </TouchableOpacity>
                    )}

                    {/* Delivery Status Update Buttons - ONLY for ACCEPTED USER */}
                    {isAcceptedUser && accepted.status === 'accepted' && (
                      <TouchableOpacity
                        style={styles.deliveryStatusButton}
                        onPress={() => updateDeliveryStatus(acceptedUserId, 'in-transit')}
                      >
                        <MaterialCommunityIcons name="truck-delivery" size={18} color="#fff" />
                        <Text style={styles.deliveryStatusButtonText}>Start Delivery</Text>
                      </TouchableOpacity>
                    )}

                    {isAcceptedUser && accepted.status === 'in-transit' && (
                      <View style={styles.deliveryStatusActions}>
                        <TouchableOpacity
                          style={[styles.deliveryStatusButton, styles.deliveredButton]}
                          onPress={() => updateDeliveryStatus(acceptedUserId, 'delivered')}
                        >
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          <Text style={styles.deliveryStatusButtonText}>Delivered</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.deliveryStatusButton, styles.cancelledButton]}
                          onPress={() => updateDeliveryStatus(acceptedUserId, 'cancelled')}
                        >
                          <Ionicons name="close-circle" size={18} color="#fff" />
                          <Text style={styles.deliveryStatusButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Delivery Tracking Actions - ONLY for ACCEPTED USER */}
                    {isAcceptedUser && (accepted.status === 'in-transit' || accepted.status === 'accepted') && (
                      <View style={styles.deliveryTrackingActions}>
                        {/* Upload Delivery Image */}
                        <TouchableOpacity
                          style={styles.trackingActionButton}
                          onPress={() => {
                            // For simplicity, using a placeholder image URL
                            uploadDeliveryImage('https://via.placeholder.com/150', false);
                          }}
                        >
                          <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
                          <Text style={styles.trackingActionText}>Upload Image</Text>
                        </TouchableOpacity>

                        {/* Upload Delivery Image with Barcode */}
                        <TouchableOpacity
                          style={styles.trackingActionButton}
                          onPress={() => {
                            uploadDeliveryImage('https://via.placeholder.com/150', true);
                          }}
                        >
                          <Ionicons name="barcode-outline" size={18} color={COLORS.primary} />
                          <Text style={styles.trackingActionText}>Upload with Barcode</Text>
                        </TouchableOpacity>

                        {/* Set Recipient & Generate OTP */}
                        <TouchableOpacity
                          style={styles.trackingActionButton}
                          onPress={() => {
                            Alert.alert(
                              'Recipient Mobile',
                              'Enter recipient mobile number',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'OK',
                                  onPress: () => {
                                    if (recipientMobile) {
                                      setRecipient();
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Ionicons name="call-outline" size={18} color={COLORS.primary} />
                          <Text style={styles.trackingActionText}>Set Recipient</Text>
                        </TouchableOpacity>

                        {/* Mark Barcode Scanned */}
                        <TouchableOpacity
                          style={styles.trackingActionButton}
                          onPress={() => {
                            Alert.alert(
                              'Barcode Data',
                              'Enter barcode data',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'OK',
                                  onPress: () => {
                                    if (barcodeData) {
                                      markBarcodeScanned();
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Ionicons name="scan-outline" size={18} color={COLORS.primary} />
                          <Text style={styles.trackingActionText}>Scan Barcode</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.noBidsContainer}>
              <MaterialCommunityIcons name="truck-remove" size={64} color="#DDD" />
              <Text style={styles.noBidsText}>No bids yet</Text>
              <Text style={styles.noBidsSubtext}>Be the first to bid on this delivery</Text>
            </View>
          )}
        </View>
      )}

      {/* Accept Modal - Only for non-order creators */}
      {acceptModalVisible && !isOrderCreator && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Accept Order</Text>

            <Text style={styles.modalLabel}>Tentative Delivery Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2 hours"
              value={tentativeTime}
              onChangeText={setTentativeTime}
            />

            <Text style={styles.modalLabel}>Your Price (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your delivery price"
              value={orderPrice}
              onChangeText={setOrderPrice}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Vehicle Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={acceptVehicleType}
                onValueChange={setAcceptVehicleType}
                style={styles.picker}
              >
                <Picker.Item label="Select vehicle type" value="" />
                {vehicles.map(vehicle => (
                  <Picker.Item key={vehicle._id} label={vehicle.vehicleType} value={vehicle.vehicleType} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAcceptModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSubmitAccept}
              >
                <Text style={styles.confirmButtonText}>Accept Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Update Price Modal - Only for accepted users */}
      {showUpdatePrice && selectedUser && !isOrderCreator && (
        <View style={styles.modalOverlay}>
          <View style={styles.priceModalContainer}>
            <Text style={styles.modalTitle}>
              Update Bid Price
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
                onPress={() => {
                  setShowUpdatePrice(false);
                  setSelectedUser(null);
                  setNewPrice('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={async () => {
                  if (!newPrice.trim()) {
                    Alert.alert("Error", "Please enter a new price");
                    return;
                  }
                  await updateOrderBid(orderId as string, getAcceptedUserId(selectedUser), parseFloat(newPrice));
                  setShowUpdatePrice(false);
                  setSelectedUser(null);
                  setNewPrice('');
                  // Refresh order
                  const orderRes = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}`);
                  const updatedOrder = await orderRes.json();
                  setOrder(updatedOrder);
                }}
              >
                <Text style={styles.confirmButtonText}>Update Price</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Chat Modal */}
      {showChat && selectedUser && (
        <View style={styles.chatModal}>
          <View style={styles.chatHeader}>
            <View style={styles.chatUserInfo}>
              <Image 
                source={{ uri: isOrderCreator ? 
                  getAcceptedProfileImage(selectedUser) : 
                  (typeof order.userId === 'object' ? order.userId.profileImage : 'https://via.placeholder.com/40')
                }} 
                style={styles.chatAvatar}
              />
              <View>
                <Text style={styles.chatUserName}>
                  {isOrderCreator ? 
                    getAcceptedUsername(selectedUser) : 
                    getUsername(order.userId)
                  }
                </Text>
                <View style={styles.chatStatus}>
                  <View style={[
                    styles.onlineIndicator, 
                    { backgroundColor: onlineUsers.includes(
                      isOrderCreator ? 
                      getAcceptedUserId(selectedUser) : 
                      orderCreatorId
                    ) ? '#4CAF50' : '#999' }
                  ]} />
                  <Text style={styles.chatStatusText}>
                    {otherUserTyping ? 'Typing...' : 
                     onlineUsers.includes(
                       isOrderCreator ? 
                       getAcceptedUserId(selectedUser) : 
                       orderCreatorId
                     ) ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.chatHeaderActions}>
              <TouchableOpacity onPress={() => {
                setShowChat(false);
                setSelectedUser(null);
                setUserMessages([]);
              }}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
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
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 20,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  orderId: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  deliveryStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  deliveryStatusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  offerCard: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  offerCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  offerDiscount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  messageSummary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
  },
  messageSummaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  liveTrackingContainer: {
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  liveTrackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveTrackingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  trackingText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationTime: {
    fontSize: 12,
    color: '#666',
  },
  trackingControls: {
    marginTop: 8,
  },
  startTrackingButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  stopTrackingButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  trackingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationDisplay: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  locationCoords: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  locationTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 10,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  shopLocation: {
    fontSize: 15,
    color: '#666',
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: width * 0.9,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  bidsContainer: {
    padding: 16,
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  bidsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    marginLeft: 4,
  },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bidderAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  bidderInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  bidderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  bidderStatusText: {
    fontSize: 14,
    color: '#666',
  },
  bidPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bidDetails: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingLeft: 72,
  },
  bidDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  bidDetailText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
  },
  bidActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingLeft: 72,
    gap: 12,
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  confirmBidButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  confirmBidButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  updateBidButton: {
    backgroundColor: '#f0f7ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  updateBidButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  deliveryStatusButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  deliveryStatusButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  deliveryStatusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deliveredButton: {
    backgroundColor: '#10b981',
  },
  cancelledButton: {
    backgroundColor: '#ef4444',
  },
  noBidsContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  noBidsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
  },
  noBidsSubtext: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 8,
  },
  priceModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  chatUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chatStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  chatStatusText: {
    fontSize: 14,
    color: '#666',
  },
  chatHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
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
    fontSize: 12,
    opacity: 0.7,
    marginRight: 4,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  deliveryTrackingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  trackingActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  trackingActionText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});

