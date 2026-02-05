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
  Platform,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { ToastManager } from "@/components/Toast";

const { width, height } = Dimensions.get("window");

interface Product {
  _id: string;
  Title: string;
  fromLocation: {
    text: string;
    lat: number;
    lng: number;
  };
  toLocation: {
    text: string;
    lat: number;
    lng: number;
  };
  description: string;
  price: number;
  weight: string;
  image: string;
  status: string;
  createdBy?: {
    _id: string;
    username: string;
  };
  acceptedUsers: Array<{
    userId: {
      _id: string;
      username: string;
    };
    status: string;
    deliveryDetails: {
      deliveryStatus: string;
      currentLocation: {
        lat: number;
        lng: number;
        timestamp: Date;
      };
      deliveryImage: string;
      deliveryImageWithBarcode: string;
      recipientMobile: string;
      otpCode: string;
      otpVerified: boolean;
      deliveredAt: Date;
      barcodeScanned: boolean;
      barcodeData: string;
    };
  }>;
}

export default function DeliveryTracking() {
  const { productId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Form states
  const [recipientMobile, setRecipientMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [barcodeData, setBarcodeData] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  // Completion tracking states
  const [requirementsMet, setRequirementsMet] = useState({
    locationUpdated: false,
    productImageUploaded: false,
    recipientSet: false,
    otpVerified: false,
    barcodeScanned: false,
  });

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const fetchProductData = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/products/${productId}`);
      const data = await res.json();
      setProduct(data);
      
      // Update requirements status when product data is loaded
      updateRequirementsStatus(data);
    } catch (err) {
      console.error("Failed to fetch product:", err);
      Alert.alert("Error", "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const updateRequirementsStatus = (productData: Product) => {
    const currentAcceptedUser = productData.acceptedUsers?.find(
      acceptedUser => acceptedUser.userId._id === user?._id
    );

    if (currentAcceptedUser) {
      const deliveryDetails = currentAcceptedUser.deliveryDetails || {};
      
      setRequirementsMet({
        locationUpdated: !!deliveryDetails.currentLocation?.lat && !!deliveryDetails.currentLocation?.lng,
        productImageUploaded: !!deliveryDetails.deliveryImage,
        recipientSet: !!deliveryDetails.recipientMobile,
        otpVerified: !!deliveryDetails.otpVerified,
        barcodeScanned: !!deliveryDetails.barcodeScanned,
      });
    }
  };

  const checkAllRequirementsMet = () => {
    return (
      requirementsMet.locationUpdated &&
      requirementsMet.productImageUploaded &&
      requirementsMet.recipientSet &&
      requirementsMet.otpVerified
      // barcodeScanned is optional, so not required
    );
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required for tracking");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  };

  const updateLocation = async () => {
    setTrackingLoading(true);
    try {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) {
        ToastManager.show("Failed to get current location", "error");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/products/${productId}/update-location`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        ToastManager.show("Location updated successfully!", "success");
        setProduct(data.product);
        updateRequirementsStatus(data.product);
        
        // If this is the first location update, update status to in-transit
        if (product?.status === 'accepted') {
          fetchProductData(); // Refresh to get updated status
        }
      } else {
        ToastManager.show(data.message || "Failed to update location", "error");
      }
    } catch (err) {
      console.error("Error updating location:", err);
      ToastManager.show("Failed to update location", "error");
    } finally {
      setTrackingLoading(false);
    }
  };

  const updateDeliveryStatus = async (status: string) => {
    try {
      // Check if all requirements are met before marking as delivered
      if (!checkAllRequirementsMet()) {
        Alert.alert(
          'Incomplete Requirements',
          'Please complete all required steps before marking as delivered.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/products/${productId}/update-delivery-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id,
          deliveryStatus: status
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setProduct(data.product);
        Alert.alert('Success', `Delivery status updated to: ${status}`);
      } else {
        Alert.alert('Error', data.message || 'Failed to update delivery status');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      Alert.alert('Error', 'Failed to update delivery status');
    }
  };

  const uploadDeliveryImage = async (imageUri: string, withBarcode: boolean = false) => {
    setImageLoading(true);
    try {
      // Create FormData
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // For web, convert blob URL to actual file
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const fileName = imageUri.split('/').pop() || `delivery_${Date.now()}.${blob.type.split('/')[1]}`;
        formData.append('image', blob, fileName);
      } else {
        // Get file name and type from URI
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        // IMPORTANT: Get the actual file name from the URI
        const fileName = imageUri.split('/').pop() || `delivery_${Date.now()}.${fileType}`;
        
        // Create the file object properly
        const file = {
          uri: imageUri,
          type: `image/${fileType}`,
          name: fileName,
        };
        
        // Append the file
        formData.append('image', file as any);
      }
      
      formData.append('userId', user?._id || '');
      formData.append('withBarcode', withBarcode.toString());

      const token = await AsyncStorage.getItem("token");
      console.log('📤 Uploading image:', {
        productId,
        userId: user?._id,
        withBarcode,
        platform: Platform.OS
      });

      // Also make sure your backend route is expecting FormData
      const response = await fetch(`http://localhost:3000/api/products/${productId}/upload-delivery-image`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let React Native set it
        },
        body: formData,
      });

      const data = await response.json();
      console.log('📥 Upload response:', data);
      
      if (data.success) {
        setProduct(data.product);
        updateRequirementsStatus(data.product);
        ToastManager.show('Delivery image uploaded successfully', 'success');
      } else {
        ToastManager.show(data.message || 'Failed to upload delivery image', 'error');
      }
    } catch (error: any) {
      console.error('❌ Error uploading delivery image:', error);
      ToastManager.show('Failed to upload delivery image: ' + error.message, 'error');
    } finally {
      setImageLoading(false);
    }
  };

  const setRecipient = async () => {
    if (!recipientMobile) {
      Alert.alert('Error', 'Please enter recipient mobile number');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(recipientMobile)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/products/${productId}/set-recipient`, {
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

      const data = await response.json();
      
      if (data.success) {
        setProduct(data.product);
        updateRequirementsStatus(data.product);
        setOtpCode(data.otpCode);
        setShowOtpModal(true);
        Alert.alert('Success', 'Recipient set successfully. OTP generated.');
      } else {
        Alert.alert('Error', data.message || 'Failed to set recipient');
      }
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

    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otpCode)) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/products/${productId}/verify-otp`, {
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

      const data = await response.json();
      
      if (data.success) {
        setProduct(data.product);
        updateRequirementsStatus(data.product);
        setShowOtpModal(false);
        Alert.alert('Success', 'OTP verified successfully. Delivery completed!');
      } else {
        Alert.alert('Error', data.message || 'Failed to verify OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const markBarcodeScanned = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/products/${productId}/mark-barcode-scanned`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id,
          barcodeData: barcodeData || `scanned_${Date.now()}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setProduct(data.product);
        updateRequirementsStatus(data.product);
        setShowBarcodeModal(false);
        Alert.alert('Success', 'Barcode marked as scanned');
      } else {
        Alert.alert('Error', data.message || 'Failed to mark barcode as scanned');
      }
    } catch (error) {
      console.error('Error marking barcode as scanned:', error);
      Alert.alert('Error', 'Failed to mark barcode as scanned');
    }
  };

  const pickImage = async (withBarcode: boolean = false) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImageLoading(true);
      try {
        await uploadDeliveryImage(result.assets[0].uri, withBarcode);
      } catch (error) {
        console.error('❌ Error in pickImage:', error);
        ToastManager.show('Failed to process image', 'error');
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handleMarkDelivered = async () => {
    // Show confirmation
    Alert.alert(
      'Confirm Delivery',
      'Are you sure you want to mark this delivery as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Mark Delivered', 
          style: 'destructive',
          onPress: () => updateDeliveryStatus('delivered')
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading delivery details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={100} color="#E0E0E0" />
          <Text style={styles.errorTitle}>Product Not Found</Text>
          <Text style={styles.errorMessage}>
            The product details you're looking for are not available.
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

  const currentAcceptedUser = product.acceptedUsers?.find(
    acceptedUser => acceptedUser.userId._id === user?._id
  );

  const isDeliveryPerson = !!currentAcceptedUser;
  const isProductCreator = product.createdBy?._id === user?._id;

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
          <Text style={styles.headerTitle}>Delivery Tracking</Text>
          <Text style={styles.headerSubtitle}>{product.Title}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Delivery Requirements Progress */}
        {isDeliveryPerson && currentAcceptedUser && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Delivery Progress</Text>
            <Text style={styles.progressSubtitle}>
              Complete all required steps to mark delivery as completed
            </Text>
            
            <View style={styles.requirementsList}>
              <RequirementItem
                completed={requirementsMet.locationUpdated}
                title="Update Location"
                description="Share your current location"
              />
              
              <RequirementItem
                completed={requirementsMet.productImageUploaded}
                title="Upload Product Image"
                description="Take a photo of the product"
              />
              
              <RequirementItem
                completed={requirementsMet.recipientSet}
                title="Set Recipient"
                description="Enter recipient mobile number"
              />
              
              <RequirementItem
                completed={requirementsMet.otpVerified}
                title="Verify OTP"
                description="Enter OTP received by recipient"
              />
              
              <RequirementItem
                completed={requirementsMet.barcodeScanned}
                title="Scan Barcode"
                description="Optional - Scan product barcode"
                optional={true}
              />
            </View>

            {checkAllRequirementsMet() && (
              <View style={styles.allCompleteContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.allCompleteText}>All requirements completed! You can now mark as delivered.</Text>
              </View>
            )}
          </View>
        )}

        {/* Product Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
            <Text style={styles.summaryTitle}>Product Details</Text>
          </View>
          
          <View style={styles.summaryDetails}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Product</Text>
              <Text style={styles.summaryValue}>{product.Title}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={[styles.summaryValue, styles.statusText, 
                product.status === 'pending' ? styles.statusPending : 
                product.status === 'accepted' ? styles.statusAccepted : 
                product.status === 'in-transit' ? styles.statusInTransit : styles.statusDelivered]}>
                {product.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Actions */}
        {isDeliveryPerson && currentAcceptedUser && (
          <>
            {/* Delivery Person Details */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="location-outline" size={24} color={COLORS.primary} />
                <Text style={styles.summaryTitle}>Your Delivery Status</Text>
              </View>
              
              <View style={styles.summaryDetails}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Status</Text>
                  <Text style={[styles.summaryValue, styles.statusText,
                    currentAcceptedUser.status === 'accepted' ? styles.statusAccepted :
                    currentAcceptedUser.status === 'in-transit' ? styles.statusInTransit :
                    currentAcceptedUser.status === 'delivered' ? styles.statusDelivered : styles.statusFailed]}>
                    {currentAcceptedUser.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Actions */}
            <View style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>Delivery Actions</Text>
              
              {/* Update Location Button */}
              <TouchableOpacity
                style={[styles.actionButton, trackingLoading && styles.actionButtonDisabled]}
                onPress={updateLocation}
                disabled={trackingLoading}
                activeOpacity={0.8}
              >
                {trackingLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="locate-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>
                      {requirementsMet.locationUpdated ? 'Update Location Again' : 'Update Location'}
                    </Text>
                    {requirementsMet.locationUpdated && (
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" style={styles.completedIcon} />
                    )}
                  </>
                )}
              </TouchableOpacity>

              {/* Image Upload Buttons */}
              <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>Upload Delivery Images</Text>
                <View style={styles.imageButtons}>
                  <TouchableOpacity
                    style={[styles.imageButton, imageLoading && styles.actionButtonDisabled]}
                    onPress={() => pickImage(false)}
                    disabled={imageLoading}
                    activeOpacity={0.8}
                  >
                    {imageLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={20} color="#fff" />
                        <Text style={styles.imageButtonText}>Product Image</Text>
                        {requirementsMet.productImageUploaded && (
                          <Ionicons name="checkmark-circle" size={16} color="#10b981" style={styles.completedIcon} />
                        )}
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.imageButton, imageLoading && styles.actionButtonDisabled]}
                    onPress={() => pickImage(true)}
                    disabled={imageLoading}
                    activeOpacity={0.8}
                  >
                    {imageLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="barcode-outline" size={20} color="#fff" />
                        <Text style={styles.imageButtonText}>With Barcode</Text>
                        {requirementsMet.barcodeScanned && (
                          <Ionicons name="checkmark-circle" size={16} color="#10b981" style={styles.completedIcon} />
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* OTP Setup */}
              <View style={styles.otpSection}>
                <Text style={styles.sectionTitle}>Recipient & OTP Verification</Text>
                <View style={styles.otpInputContainer}>
                  <TextInput
                    style={styles.otpInput}
                    value={recipientMobile}
                    onChangeText={setRecipientMobile}
                    placeholder="Enter recipient mobile"
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!requirementsMet.recipientSet}
                  />
                  <TouchableOpacity
                    style={[styles.otpButton, 
                      (!recipientMobile || requirementsMet.recipientSet) && styles.actionButtonDisabled]}
                    onPress={setRecipient}
                    disabled={!recipientMobile || requirementsMet.recipientSet}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.otpButtonText}>
                      {requirementsMet.recipientSet ? 'Recipient Set' : 'Set Recipient'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {requirementsMet.recipientSet && !requirementsMet.otpVerified && (
                  <TouchableOpacity
                    style={[styles.otpVerifyButton, otpLoading && styles.actionButtonDisabled]}
                    onPress={() => setShowOtpModal(true)}
                    disabled={otpLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.otpButtonText}>Enter & Verify OTP</Text>
                  </TouchableOpacity>
                )}
                
                {requirementsMet.otpVerified && (
                  <View style={styles.otpVerifiedContainer}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.otpVerifiedText}>OTP Verified Successfully</Text>
                  </View>
                )}
              </View>

              {/* Barcode Scan - Optional */}
              <View style={styles.barcodeSection}>
                <Text style={styles.sectionTitle}>Barcode Scan (Optional)</Text>
                <View style={styles.barcodeInputContainer}>
                  <TextInput
                    style={styles.barcodeInput}
                    value={barcodeData}
                    onChangeText={setBarcodeData}
                    placeholder="Enter barcode data or scan"
                    editable={!requirementsMet.barcodeScanned}
                  />
                  <TouchableOpacity
                    style={[styles.barcodeButton, 
                      requirementsMet.barcodeScanned && styles.actionButtonDisabled]}
                    onPress={() => setShowBarcodeModal(true)}
                    disabled={requirementsMet.barcodeScanned}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.barcodeButtonText}>
                      {requirementsMet.barcodeScanned ? 'Barcode Scanned' : 'Mark as Scanned'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mark Delivered Button - Only shown when all requirements are met */}
              {checkAllRequirementsMet() && (
                <TouchableOpacity
                  style={[styles.markDeliveredButton, currentAcceptedUser.status === 'delivered' && styles.actionButtonDisabled]}
                  onPress={handleMarkDelivered}
                  disabled={currentAcceptedUser.status === 'delivered'}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-done-outline" size={24} color="#fff" />
                  <Text style={styles.markDeliveredText}>Mark as Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSubtitle}>
              Share this OTP with the recipient: 
              <Text style={styles.otpCode}> {otpCode}</Text>
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Enter OTP received by recipient"
              keyboardType="numeric"
              maxLength={6}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowOtpModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, otpLoading && styles.actionButtonDisabled]}
                onPress={verifyOtp}
                disabled={otpLoading}
                activeOpacity={0.8}
              >
                {otpLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Modal */}
      <Modal
        visible={showBarcodeModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Barcode Scan</Text>
            <Text style={styles.modalSubtitle}>Barcode Data: {barcodeData || 'Auto-generated'}</Text>
            
            <Text style={styles.modalText}>Are you sure the barcode has been scanned successfully?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowBarcodeModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={markBarcodeScanned}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Confirm Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Requirement Item Component
const RequirementItem = ({ 
  completed, 
  title, 
  description, 
  optional = false 
}: { 
  completed: boolean; 
  title: string; 
  description: string; 
  optional?: boolean;
}) => (
  <View style={styles.requirementItem}>
    <View style={[styles.requirementIcon, completed && styles.requirementIconCompleted]}>
      {completed ? (
        <Ionicons name="checkmark" size={16} color="#fff" />
      ) : (
        <Text style={styles.requirementNumber}>{optional ? '?' : '!'}</Text>
      )}
    </View>
    <View style={styles.requirementContent}>
      <Text style={[styles.requirementTitle, completed && styles.requirementTitleCompleted]}>
        {title}
        {optional && <Text style={styles.optionalText}> (Optional)</Text>}
      </Text>
      <Text style={styles.requirementDescription}>{description}</Text>
    </View>
  </View>
);

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
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  progressCard: {
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
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  requirementsList: {
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  requirementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requirementIconCompleted: {
    backgroundColor: '#10b981',
  },
  requirementNumber: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 12,
  },
  requirementContent: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  requirementTitleCompleted: {
    color: '#10b981',
    textDecorationLine: 'line-through',
  },
  requirementDescription: {
    fontSize: 12,
    color: '#666',
  },
  optionalText: {
    color: '#6c757d',
    fontSize: 12,
  },
  allCompleteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  allCompleteText: {
    fontSize: 14,
    color: '#0f5132',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
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
  statusText: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusPending: {
    color: '#856404',
  },
  statusAccepted: {
    color: '#0f5132',
  },
  statusInTransit: {
    color: '#055160',
  },
  statusDelivered: {
    color: '#198754',
  },
  statusFailed: {
    color: '#721c24',
  },
  actionsCard: {
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
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
    shadowColor: 'transparent',
    elevation: 0,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedIcon: {
    marginLeft: 8,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  otpSection: {
    marginBottom: 20,
  },
  otpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  otpInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  otpButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  otpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  otpVerifyButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  otpVerifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    marginTop: 8,
  },
  otpVerifiedText: {
    fontSize: 14,
    color: '#0f5132',
    fontWeight: '600',
    marginLeft: 8,
  },
  barcodeSection: {
    marginBottom: 20,
  },
  barcodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  barcodeButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  barcodeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  markDeliveredButton: {
    backgroundColor: '#198754',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  markDeliveredText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10000,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  otpCode: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 16,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 0,
    marginLeft: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonTextSecondary: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   StatusBar,
//   SafeAreaView,
//   TextInput,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
//   Dimensions,
//   Modal,
// } from "react-native";
// import { useLocalSearchParams, router } from "expo-router";
// import { useAuthStore } from "@/store/authStore";
// import * as Location from "expo-location";
// import * as ImagePicker from "expo-image-picker";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import COLORS from "@/constants/color";
// import { Ionicons } from "@expo/vector-icons";
// import { ToastManager } from "@/components/Toast";

// const { width, height } = Dimensions.get("window");

// interface Product {
//   _id: string;
//   Title: string;
//   fromLocation: {
//     text: string;
//     lat: number;
//     lng: number;
//   };
//   toLocation: {
//     text: string;
//     lat: number;
//     lng: number;
//   };
//   description: string;
//   price: number;
//   weight: string;
//   image: string;
//   status: string;
//   createdBy?: {
//     _id: string;
//     username: string;
//   };
//   acceptedUsers: Array<{
//     userId: {
//       _id: string;
//       username: string;
//     };
//     deliveryDetails: {
//       deliveryStatus: string;
//       currentLocation: {
//         lat: number;
//         lng: number;
//         timestamp: Date;
//       };
//       deliveryImage: string;
//       deliveryImageWithBarcode: string;
//       recipientMobile: string;
//       otpCode: string;
//       otpVerified: boolean;
//       deliveredAt: Date;
//       barcodeScanned: boolean;
//       barcodeData: string;
//     };
//   }>;
// }

// export default function DeliveryTracking() {
//   const { productId } = useLocalSearchParams();
//   const { user } = useAuthStore();
//   const [product, setProduct] = useState<Product | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [trackingLoading, setTrackingLoading] = useState(false);
//   const [imageLoading, setImageLoading] = useState(false);
//   const [otpLoading, setOtpLoading] = useState(false);
  
//   // Form states
//   const [recipientMobile, setRecipientMobile] = useState("");
//   const [otpCode, setOtpCode] = useState("");
//   const [barcodeData, setBarcodeData] = useState("");
//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [showBarcodeModal, setShowBarcodeModal] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/products/${productId}`);
//         const data = await res.json();
//         setProduct(data);
//       } catch (err) {
//         console.error("Failed to fetch product:", err);
//         Alert.alert("Error", "Failed to load product details");
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (productId) fetchData();
//   }, [productId]);

//   const getCurrentLocation = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert("Permission denied", "Location permission is required for tracking");
//         return null;
//       }

//       const location = await Location.getCurrentPositionAsync({});
//       return {
//         lat: location.coords.latitude,
//         lng: location.coords.longitude,
//       };
//     } catch (error) {
//       console.error("Error getting location:", error);
//       return null;
//     }
//   };

//   const updateLocation = async () => {
//     setTrackingLoading(true);
//     try {
//       const currentLocation = await getCurrentLocation();
//       if (!currentLocation) return;

//       const response = await fetch(`http://localhost:3000/api/products/${productId}/update-location`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${await AsyncStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({
//           userId: user?._id,
//           ...currentLocation,
//         }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         ToastManager.show("Location updated successfully!", "success");
//         setProduct(data.product);
//       } else {
//         ToastManager.show(data.message || "Failed to update location", "error");
//       }
//     } catch (err) {
//       console.error("Error updating location:", err);
//       ToastManager.show("Failed to update location", "error");
//     } finally {
//       setTrackingLoading(false);
//     }
//   };

//   const updateDeliveryStatus = async (status: string) => {
//     try {
//       console.log('updateDeliveryStatus called with status:', status);
//       console.log('User ID:', user?._id);
//       console.log('Product ID:', productId);
      
//       // Check if all required steps are completed before marking as delivered
//       if (status === 'delivered') {
//         const token = await AsyncStorage.getItem("token");
//         console.log('Token present:', !!token);
        
//         const response = await fetch(`http://localhost:3000/api/products/${productId}/check-delivery-requirements?userId=${user?._id}`, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//           },
//         });

//         console.log('Check requirements response status:', response.status);

//         if (!response.ok) {
//           const errorText = await response.text();
//           console.error('Check requirements failed:', errorText);
//           const errorData = JSON.parse(errorText);
//           if (errorData.message === 'User not found in accepted users') {
//             Alert.alert(
//               'Access Denied',
//               'Only the delivery person can mark this as delivered. Please log in as the user who accepted this delivery request.',
//               [{ text: 'OK', style: 'default' }]
//             );
//             return;
//           }
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Requirements check data:', data);
        
//         // Check if delivery requirements are met (images uploaded, OTP verified, barcode scanned)
//         if (!data.requirementsMet) {
//           let missingItems = [];
          
//           if (!data.hasDeliveryImage) missingItems.push("delivery image");
//           if (!data.hasDeliveryImageWithBarcode) missingItems.push("delivery image with barcode");
//           if (!data.otpVerified) missingItems.push("OTP verification");
//           // Note: barcode scan is optional for now, so we don't check it

//           console.log('Missing items:', missingItems);
//           Alert.alert(
//             'Incomplete Requirements',
//             `Please complete the following before marking as delivered:\n\n• ${missingItems.join('\n• ')}`,
//             [
//               { text: 'OK', style: 'default' }
//             ]
//           );
//           return;
//         }
//       }

//       const token = await AsyncStorage.getItem("token");
//       const response = await fetch(`http://localhost:3000/api/products/${productId}/update-delivery-status`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           userId: user?._id,
//           deliveryStatus: status
//         }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Update delivery status failed:', errorText);
//         const errorData = JSON.parse(errorText);
//         if (errorData.message === 'User not found in accepted users' || errorData.message === 'Bid not found') {
//           Alert.alert(
//             'Access Denied',
//             'Only the delivery person can update delivery status. Please log in as the user who accepted this delivery request.',
//             [{ text: 'OK', style: 'default' }]
//           );
//           return;
//         }
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log('Update delivery status response:', data);
//       setProduct(data.product);
//       Alert.alert('Success', `Delivery status updated to: ${status}`);
//     } catch (error) {
//       console.error('Error updating delivery status:', error);
//       Alert.alert('Error', 'Failed to update delivery status');
//     }
//   };

//   const uploadDeliveryImage = async (image: string, withBarcode: boolean = false) => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const response = await fetch(`http://localhost:3000/api/products/${productId}/upload-delivery-image`, {
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
//       setProduct(data.product);
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
//       const token = await AsyncStorage.getItem("token");
//       const response = await fetch(`http://localhost:3000/api/products/${productId}/set-recipient`, {
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
//       setProduct(data.product);
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
//       const token = await AsyncStorage.getItem("token");
//       const response = await fetch(`http://localhost:3000/api/products/${productId}/verify-otp`, {
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
//       setProduct(data.product);
//       Alert.alert('Success', 'OTP verified successfully. Delivery completed!');
//     } catch (error) {
//       console.error('Error verifying OTP:', error);
//       Alert.alert('Error', 'Failed to verify OTP');
//     }
//   };

//   const markBarcodeScanned = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const response = await fetch(`http://localhost:3000/api/products/${productId}/mark-barcode-scanned`, {
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
//       setProduct(data.product);
//       Alert.alert('Success', 'Barcode marked as scanned');
//     } catch (error) {
//       console.error('Error marking barcode as scanned:', error);
//       Alert.alert('Error', 'Failed to mark barcode as scanned');
//     }
//   };

//   const pickImage = async (withBarcode: boolean = false) => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 1,
//     });

//     if (!result.canceled && result.assets && result.assets[0]) {
//       setImageLoading(true);
//       try {
//         await uploadDeliveryImage(result.assets[0].uri, withBarcode);
//       } finally {
//         setImageLoading(false);
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
//         <View style={styles.loadingContent}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//           <Text style={styles.loadingText}>Loading delivery details...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!product) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
//         <View style={styles.errorContent}>
//           <Ionicons name="alert-circle-outline" size={100} color="#E0E0E0" />
//           <Text style={styles.errorTitle}>Product Not Found</Text>
//           <Text style={styles.errorMessage}>
//             The product details you're looking for are not available.
//           </Text>
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => router.back()}
//           >
//             <Ionicons name="arrow-back" size={20} color="#fff" />
//             <Text style={styles.backButtonText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const currentAcceptedUser = product.acceptedUsers.find(
//     acceptedUser => acceptedUser.userId._id === user?._id
//   );

//   // Check if current user is the delivery person
//   const isDeliveryPerson = !!currentAcceptedUser;
//   const isProductCreator = product.createdBy?._id === user?._id;

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
//       {/* Fixed Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.back()}
//           activeOpacity={0.8}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <View style={styles.headerContent}>
//           <Text style={styles.headerTitle}>Delivery Tracking</Text>
//           <Text style={styles.headerSubtitle}>{product.Title}</Text>
//         </View>
//       </View>

//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Product Summary */}
//         <View style={styles.summaryCard}>
//           <View style={styles.summaryHeader}>
//             <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
//             <Text style={styles.summaryTitle}>Product Details</Text>
//           </View>
          
//           <View style={styles.summaryDetails}>
//             <View style={styles.summaryRow}>
//               <Text style={styles.summaryLabel}>Product</Text>
//               <Text style={styles.summaryValue}>{product.Title}</Text>
//             </View>
            
//             <View style={styles.summaryRow}>
//               <Text style={styles.summaryLabel}>Description</Text>
//               <Text style={styles.summaryValue}>{product.description}</Text>
//             </View>
            
//             <View style={styles.summaryRow}>
//               <Text style={styles.summaryLabel}>Weight</Text>
//               <Text style={styles.summaryValue}>{product.weight}</Text>
//             </View>
            
//             <View style={styles.summaryRow}>
//               <Text style={styles.summaryLabel}>Price</Text>
//               <Text style={styles.summaryValue}>₹{product.price}</Text>
//             </View>
            
//             <View style={styles.summaryRow}>
//               <Text style={styles.summaryLabel}>Status</Text>
//               <Text style={[styles.summaryValue, styles.statusText, 
//                 product.status === 'pending' ? styles.statusPending : 
//                 product.status === 'accepted' ? styles.statusAccepted : 
//                 product.status === 'in-transit' ? styles.statusInTransit : styles.statusDelivered]}>
//                 {product.status}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Delivery Details */}
//         {isProductCreator && !isDeliveryPerson && (
//           <View style={styles.summaryCard}>
//             <Text style={styles.actionsTitle}>Access Restricted</Text>
//             <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
//               You are the product creator. Only the delivery person can access delivery tracking features.
//             </Text>
//           </View>
//         )}
//         {currentAcceptedUser && (
//           <View style={styles.summaryCard}>
//             <View style={styles.summaryHeader}>
//               <Ionicons name="location-outline" size={24} color={COLORS.primary} />
//               <Text style={styles.summaryTitle}>Delivery Details</Text>
//             </View>
            
//             <View style={styles.summaryDetails}>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Delivery Status</Text>
//                 <Text style={[styles.summaryValue, styles.statusText,
//                   currentAcceptedUser.deliveryDetails.deliveryStatus === 'pending' ? styles.statusPending :
//                   currentAcceptedUser.deliveryDetails.deliveryStatus === 'in-transit' ? styles.statusInTransit :
//                   currentAcceptedUser.deliveryDetails.deliveryStatus === 'delivered' ? styles.statusDelivered : styles.statusFailed]}>
//                   {currentAcceptedUser.deliveryDetails.deliveryStatus}
//                 </Text>
//               </View>
              
//               {currentAcceptedUser.deliveryDetails.currentLocation && 
//                currentAcceptedUser.deliveryDetails.currentLocation.lat !== undefined && 
//                currentAcceptedUser.deliveryDetails.currentLocation.lng !== undefined && (
//                 <View style={styles.summaryRow}>
//                   <Text style={styles.summaryLabel}>Current Location</Text>
//                   <Text style={styles.summaryValue}>
//                     {currentAcceptedUser.deliveryDetails.currentLocation.lat.toFixed(6)}, 
//                     {currentAcceptedUser.deliveryDetails.currentLocation.lng.toFixed(6)}
//                   </Text>
//                 </View>
//               )}
              
//               {currentAcceptedUser.deliveryDetails.recipientMobile && (
//                 <View style={styles.summaryRow}>
//                   <Text style={styles.summaryLabel}>Recipient Mobile</Text>
//                   <Text style={styles.summaryValue}>{currentAcceptedUser.deliveryDetails.recipientMobile}</Text>
//                 </View>
//               )}
              
//               {currentAcceptedUser.deliveryDetails.otpVerified && (
//                 <View style={styles.summaryRow}>
//                   <Text style={styles.summaryLabel}>OTP Verified</Text>
//                   <Text style={[styles.summaryValue, styles.statusText, styles.statusAccepted]}>Yes</Text>
//                 </View>
//               )}
              
//               {currentAcceptedUser.deliveryDetails.barcodeScanned && (
//                 <View style={styles.summaryRow}>
//                   <Text style={styles.summaryLabel}>Barcode Scanned</Text>
//                   <Text style={[styles.summaryValue, styles.statusText, styles.statusAccepted]}>Yes</Text>
//                 </View>
//               )}
//             </View>
//           </View>
//         )}

//         {/* Delivery Images Display */}
//         {currentAcceptedUser && (
//           <View style={styles.summaryCard}>
//             <View style={styles.summaryHeader}>
//               <Ionicons name="image-outline" size={24} color={COLORS.primary} />
//               <Text style={styles.summaryTitle}>Delivery Images</Text>
//             </View>

//             {currentAcceptedUser.deliveryDetails.deliveryImage ? (
//               <View style={styles.imageDisplayContainer}>
//                 <Text style={styles.imageLabel}>Product Image</Text>
//                 <Image
//                   source={{ uri: currentAcceptedUser.deliveryDetails.deliveryImage }}
//                   style={styles.deliveryImage}
//                   resizeMode="cover"
//                 />
//               </View>
//             ) : (
//               <View style={styles.noImageContainer}>
//                 <Ionicons name="camera-outline" size={40} color="#ccc" />
//                 <Text style={styles.noImageText}>No product image uploaded yet</Text>
//               </View>
//             )}

//             {currentAcceptedUser.deliveryDetails.deliveryImageWithBarcode ? (
//               <View style={styles.imageDisplayContainer}>
//                 <Text style={styles.imageLabel}>Image with Barcode</Text>
//                 <Image
//                   source={{ uri: currentAcceptedUser.deliveryDetails.deliveryImageWithBarcode }}
//                   style={styles.deliveryImage}
//                   resizeMode="cover"
//                 />
//               </View>
//             ) : (
//               <View style={styles.noImageContainer}>
//                 <Ionicons name="barcode-outline" size={40} color="#ccc" />
//                 <Text style={styles.noImageText}>No barcode image uploaded yet</Text>
//               </View>
//             )}
//           </View>
//         )}

//         {/* Actions */}
//         {currentAcceptedUser && (
//           <View style={styles.actionsCard}>
//             <Text style={styles.actionsTitle}>Delivery Actions</Text>
            
//             <View style={styles.actionButtons}>
//               <TouchableOpacity
//                 style={[styles.actionButton, trackingLoading && styles.actionButtonDisabled]}
//                 onPress={updateLocation}
//                 disabled={trackingLoading}
//                 activeOpacity={0.8}
//               >
//                 {trackingLoading ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <>
//                     <Ionicons name="locate-outline" size={20} color="#fff" />
//                     <Text style={styles.actionButtonText}>Update Location</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
 
//               {isDeliveryPerson && (
//                 <TouchableOpacity
//                   style={[styles.actionButton, styles.actionButtonSecondary]}
//                   onPress={() => updateDeliveryStatus('delivered')}
//                   activeOpacity={0.8}
//                 >
//                   <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
//                   <Text style={styles.actionButtonText}>Mark Delivered</Text>
//                 </TouchableOpacity>
//               )}
//             </View>

//             {/* Image Upload */}
//             <View style={styles.imageSection}>
//               <Text style={styles.sectionTitle}>Upload Images</Text>
//               <View style={styles.imageButtons}>
//                 <TouchableOpacity
//                   style={[styles.imageButton, imageLoading && styles.actionButtonDisabled]}
//                   onPress={() => pickImage(false)}
//                   disabled={imageLoading}
//                   activeOpacity={0.8}
//                 >
//                   {imageLoading ? (
//                     <ActivityIndicator size="small" color="#fff" />
//                   ) : (
//                     <>
//                       <Ionicons name="camera-outline" size={20} color="#fff" />
//                       <Text style={styles.imageButtonText}>Product Image</Text>
//                     </>
//                   )}
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.imageButton, imageLoading && styles.actionButtonDisabled]}
//                   onPress={() => pickImage(true)}
//                   disabled={imageLoading}
//                   activeOpacity={0.8}
//                 >
//                   {imageLoading ? (
//                     <ActivityIndicator size="small" color="#fff" />
//                   ) : (
//                     <>
//                       <Ionicons name="barcode-outline" size={20} color="#fff" />
//                       <Text style={styles.imageButtonText}>With Barcode</Text>
//                     </>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* OTP Setup */}
//             <View style={styles.otpSection}>
//               <Text style={styles.sectionTitle}>Set Recipient & OTP</Text>
//               <View style={styles.otpInputContainer}>
//                 <TextInput
//                   style={styles.otpInput}
//                   value={recipientMobile}
//                   onChangeText={setRecipientMobile}
//                   placeholder="Enter recipient mobile number"
//                   keyboardType="phone-pad"
//                   maxLength={10}
//                 />
//                 <TouchableOpacity
//                   style={[styles.otpButton, !recipientMobile && styles.actionButtonDisabled]}
//                   onPress={setRecipient}
//                   disabled={!recipientMobile}
//                   activeOpacity={0.8}
//                 >
//                   <Text style={styles.otpButtonText}>Set Recipient</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Barcode Scan */}
//             <View style={styles.barcodeSection}>
//               <Text style={styles.sectionTitle}>Barcode Scan</Text>
//               <View style={styles.barcodeInputContainer}>
//                 <TextInput
//                   style={styles.barcodeInput}
//                   value={barcodeData}
//                   onChangeText={setBarcodeData}
//                   placeholder="Enter barcode data"
//                 />
//                 <TouchableOpacity
//                   style={[styles.barcodeButton, !barcodeData && styles.actionButtonDisabled]}
//                   onPress={() => setShowBarcodeModal(true)}
//                   disabled={!barcodeData}
//                   activeOpacity={0.8}
//                 >
//                   <Text style={styles.barcodeButtonText}>Mark Scanned</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         )}
//       </ScrollView>

//       {/* OTP Modal */}
//       <Modal
//         visible={showOtpModal}
//         transparent
//         animationType="slide"
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Enter OTP</Text>
//             <Text style={styles.modalSubtitle}>Share this OTP with the recipient: <Text style={styles.otpCode}>{otpCode}</Text></Text>
            
//             <TextInput
//               style={styles.modalInput}
//               value={otpCode}
//               onChangeText={setOtpCode}
//               placeholder="Enter OTP received by recipient"
//               keyboardType="numeric"
//               maxLength={6}
//             />
            
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalButtonSecondary]}
//                 onPress={() => setShowOtpModal(false)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={[styles.modalButton, otpLoading && styles.actionButtonDisabled]}
//                 onPress={verifyOtp}
//                 disabled={otpLoading}
//                 activeOpacity={0.8}
//               >
//                 {otpLoading ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Text style={styles.modalButtonText}>Verify OTP</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Barcode Modal */}
//       <Modal
//         visible={showBarcodeModal}
//         transparent
//         animationType="slide"
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Confirm Barcode Scan</Text>
//             <Text style={styles.modalSubtitle}>Barcode Data: {barcodeData}</Text>
            
//             <Text style={styles.modalText}>Are you sure the barcode has been scanned successfully?</Text>
            
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalButtonSecondary]}
//                 onPress={() => setShowBarcodeModal(false)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={styles.modalButton}
//                 onPress={markBarcodeScanned}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.modalButtonText}>Confirm Scan</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8F9FA",
//   },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: "#F8F9FA",
//   },
//   loadingContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//     fontWeight: '500',
//   },
//   errorContainer: {
//     flex: 1,
//     backgroundColor: "#F8F9FA",
//   },
//   errorContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   errorTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#333',
//     marginTop: 20,
//     marginBottom: 8,
//   },
//   errorMessage: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 32,
//   },
//   header: {
//     backgroundColor: COLORS.primary,
//     paddingTop: 12,
//     paddingBottom: 16,
//     paddingHorizontal: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//     zIndex: 10,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   backButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   headerContent: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//     letterSpacing: 0.5,
//   },
//   headerSubtitle: {
//     fontSize: 12,
//     color: 'rgba(255, 255, 255, 0.9)',
//     marginTop: 2,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 40,
//   },
//   summaryCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     margin: 16,
//     marginTop: 20,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   summaryHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   summaryTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     marginLeft: 10,
//   },
//   summaryDetails: {
//     backgroundColor: '#F8F9FA',
//     borderRadius: 12,
//     padding: 16,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   summaryRowLast: {
//     borderBottomWidth: 0,
//   },
//   summaryLabel: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//   },
//   summaryValue: {
//     fontSize: 14,
//     color: '#333',
//     fontWeight: '600',
//   },
//   statusText: {
//     fontWeight: '700',
//     textTransform: 'uppercase',
//   },
//   statusPending: {
//     color: '#856404',
//   },
//   statusAccepted: {
//     color: '#0f5132',
//   },
//   statusInTransit: {
//     color: '#055160',
//   },
//   statusDelivered: {
//     color: '#198754',
//   },
//   statusFailed: {
//     color: '#721c24',
//   },
//   actionsCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     marginHorizontal: 16,
//     marginBottom: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   actionsTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     marginBottom: 16,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 20,
//   },
//   actionButton: {
//     flex: 1,
//     backgroundColor: COLORS.primary,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     marginRight: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   actionButtonSecondary: {
//     backgroundColor: '#6c757d',
//     marginRight: 0,
//     marginLeft: 8,
//   },
//   actionButtonDisabled: {
//     backgroundColor: '#ccc',
//     shadowColor: 'transparent',
//     elevation: 0,
//   },
//   actionButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   imageSection: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 12,
//   },
//   imageButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   imageButton: {
//     flex: 1,
//     backgroundColor: COLORS.primary,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     marginRight: 8,
//   },
//   imageButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   otpSection: {
//     marginBottom: 20,
//   },
//   otpInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   otpInput: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#333',
//     marginRight: 8,
//   },
//   otpButton: {
//     backgroundColor: COLORS.primary,
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   otpButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   barcodeSection: {},
//   barcodeInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   barcodeInput: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#333',
//     marginRight: 8,
//   },
//   barcodeButton: {
//     backgroundColor: COLORS.primary,
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   barcodeButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 24,
//     width: '100%',
//     maxWidth: 400,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   modalSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   otpCode: {
//     fontWeight: '700',
//     color: COLORS.primary,
//   },
//   modalInput: {
//     backgroundColor: '#F8F9FA',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#333',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   modalText: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 20,
//     lineHeight: 20,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modalButton: {
//     flex: 1,
//     backgroundColor: COLORS.primary,
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 12,
//     marginRight: 8,
//   },
//   modalButtonSecondary: {
//     backgroundColor: 'transparent',
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     marginRight: 0,
//     marginLeft: 8,
//   },
//   modalButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   modalButtonTextSecondary: {
//     color: '#666',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   imageDisplayContainer: {
//     marginBottom: 20,
//   },
//   imageLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   deliveryImage: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//     backgroundColor: '#F0F0F0',
//   },
//   noImageContainer: {
//     backgroundColor: '#F8F9FA',
//     borderRadius: 12,
//     padding: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   noImageText: {
//     fontSize: 14,
//     color: '#999',
//     marginTop: 8,
//     textAlign: 'center',
//   },
// });