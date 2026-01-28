import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  ScrollView,
  Animated,
} from "react-native";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/color";
import { router } from "expo-router";
import { launchImageLibrary } from 'react-native-image-picker';
import { Platform } from 'react-native';
import { Picker } from "@react-native-picker/picker";

const { width } = Dimensions.get('window');
const CARD_WIDTH = 160;
const CARD_HEIGHT = 260;

// Get appropriate icon for vehicle type
const getVehicleIcon = (vehicleType: string) => {
  const type = vehicleType.toLowerCase();
  if (type.includes('bike') || type.includes('cycle')) return 'bicycle-outline';
  if (type.includes('car')) return 'car-outline';
  if (type.includes('truck')) return 'car-sport-outline';
  if (type.includes('motor')) return 'bicycle-outline';
  if (type.includes('scooter')) return 'bicycle-outline';
  if (type.includes('auto')) return 'car-outline';
  if (type.includes('bus')) return 'bus-outline';
  if (type.includes('van')) return 'car-outline';
  if (type.includes('walk')) return 'walk-outline';
  return 'cube-outline';
};

// Get color for vehicle type
const getVehicleColor = (vehicleType: string) => {
  const type = vehicleType.toLowerCase();
  if (type.includes('bike')) return '#4CAF50';
  if (type.includes('car')) return '#2196F3';
  if (type.includes('truck')) return '#FF9800';
  if (type.includes('motor')) return '#9C27B0';
  if (type.includes('scooter')) return '#00BCD4';
  if (type.includes('auto')) return '#FF5722';
  if (type.includes('bus')) return '#795548';
  if (type.includes('van')) return '#607D8B';
  if (type.includes('walk')) return '#3F51B5';
  return '#007AFF';
};

export default function MainPage() {
  const { products, orders, fetchProducts, fetchOrders, addProduct, acceptProduct, acceptOrder, user, fetchVehicles, vehicles, token } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [image, setImage] = useState<any>(null);
  const [veichelType, setVeichelType] = useState("Any");
  const [video, setVideo] = useState<any>(null);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [tentativeTime, setTentativeTime] = useState("");
  const [acceptVehicleType, setAcceptVehicleType] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [acceptingProductId, setAcceptingProductId] = useState<string | null>(null);
  const [productPrice, setProductPrice] = useState("");
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  
  // Filter states
  const [selectedWeightFilter, setSelectedWeightFilter] = useState<string>("all");
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchVehicles();
    fetchUserAddresses();
  }, []);

  const fetchUserAddresses = async () => {
    try {
      if (!user) return;
      const res = await fetch(`http://localhost:3000/api/userDetails/addresses/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUserAddresses(data);
      }
    } catch (error) {
      console.error("Error fetching user addresses:", error);
    }
  };

  // Combine products and orders into deliveries
  const combinedDeliveries = [
    ...products.filter(product =>
      product.status === 'pending' || product.status === 'accepted'
    ).map(product => ({
      ...product,
      type: 'product',
      from: product.fromAddress ? `${product.fromAddress.address}, ${product.fromAddress.city}, ${product.fromAddress.state} ${product.fromAddress.zipCode}` : product.from,
      to: product.toAddress ? `${product.toAddress.address}, ${product.toAddress.city}, ${product.toAddress.state} ${product.toAddress.zipCode}` : product.to
    })),
    ...orders.map(order => ({
      _id: order._id,
      Title: `Order ${order.orderId}`,
      from: order.shopId?.location || 'Shop Location',
      to: order.deliveryAddress?.address || order.customAddress?.address || 'Delivery Address',
      description: order.notes || `Order with ${order.items.length} items`,
      price: order.finalAmount,
      weight: order.items.reduce((total: number, item: any) => total + (item.quantity * (item.itemDetails?.weight || 1)), 0).toString(),
      veichelType: 'Order Delivery',
      image: order.items[0]?.itemDetails?.images?.[0] || null,
      status: 'pending',
      type: 'order',
      orderData: order
    }))
  ];

  // Apply additional filters
  const getFilteredProducts = () => {
    let filtered = combinedDeliveries;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(delivery => {
        const searchableFields = [
          delivery.Title || '',
          delivery.from || '',
          delivery.to || '',
          delivery.veichelType || '',
          delivery.weight || '',
          delivery.price?.toString() || '',
          delivery.description || ''
        ];

        return searchableFields.some(field =>
          field.toLowerCase().includes(query)
        );
      });
    }

    // Filter by weight
    if (selectedWeightFilter !== "all") {
      const [min, max] = selectedWeightFilter.split('-').map(Number);
      filtered = filtered.filter(delivery => {
        const weightNum = parseFloat(delivery.weight) || 0;
        return weightNum >= min && weightNum <= max;
      });
    }

    // Filter by vehicle type
    if (selectedVehicleFilter !== "all") {
      filtered = filtered.filter(delivery =>
        delivery.veichelType === selectedVehicleFilter
      );
    }

    return filtered;
  };

  const finalFilteredProducts = getFilteredProducts();

  // Group products by veichelType (vehicle type)
  const groupProductsByVehicleType = () => {
    const grouped: { [key: string]: any[] } = {};
    
    finalFilteredProducts.forEach(product => {
      const vehicleType = product.veichelType || 'Any';
      if (!grouped[vehicleType]) {
        grouped[vehicleType] = [];
      }
      grouped[vehicleType].push(product);
    });
    
    // Convert to array format and sort by vehicle type
    return Object.entries(grouped)
      .map(([vehicleType, products]) => ({
        vehicleType,
        products,
        icon: getVehicleIcon(vehicleType),
        color: getVehicleColor(vehicleType)
      }))
      .sort((a, b) => a.vehicleType.localeCompare(b.vehicleType));
  };

  const vehicleTypeGroups = groupProductsByVehicleType();

  // Get unique vehicle types for filter dropdown
  const uniqueVehicleTypes = Array.from(
    new Set(combinedDeliveries.map(d => d.veichelType || 'Any'))
  ).sort();

  const pickImage = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          setImage({
            uri: URL.createObjectURL(file),
            type: file.type,
            fileName: file.name,
          });
        }
      };
      input.click();
    } else {
      launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      }, (response) => {
        if (!response.didCancel && response.assets && response.assets[0]) {
          setImage(response.assets[0]);
        }
      });
    }
  };

  const pickVideo = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          setVideo({
            uri: URL.createObjectURL(file),
            type: file.type,
            fileName: file.name,
          });
        }
      };
      input.click();
    } else {
      launchImageLibrary({
        mediaType: 'video',
        quality: 0.8,
      }, (response) => {
        if (!response.didCancel && response.assets && response.assets[0]) {
          setVideo(response.assets[0]);
        }
      });
    }
  };

  const handleAddProduct = () => {
    if (!image) {
      alert('Please select an image');
      return;
    }
    if (!from || !to || !description || !productPrice) {
      alert('Please fill all required fields');
      return;
    }
    addProduct({ 
      Title: title, 
      from, 
      to, 
      description, 
      price: parseFloat(productPrice), 
      weight, 
      image, 
      veichelType, 
      video 
    });
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle(""); 
    setFrom(""); 
    setTo(""); 
    setDescription(""); 
    setProductPrice(""); 
    setWeight(""); 
    setImage(null); 
    setVeichelType("Any"); 
    setVideo(null);
  };

  const handleSubmitAccept = async () => {
    if (!acceptingProductId) return;

    const item = combinedDeliveries.find(d => d._id === acceptingProductId);
    if (item?.type === 'order') {
      await acceptOrder(acceptingProductId, {
        tentativeDeliveryTime: tentativeTime,
        acceptedVehicleType: acceptVehicleType,
        price: parseFloat(productPrice) || 0,
      });
    } else {
      await acceptProduct(acceptingProductId, {
        tentativeDeliveryTime: tentativeTime,
        acceptedVehicleType: acceptVehicleType,
        price: parseFloat(productPrice) || 0,
      });
    }

    setAcceptModalVisible(false);
    resetAcceptForm();
  };

  const resetAcceptForm = () => {
    setTentativeTime("");
    setProductPrice("");
    setAcceptVehicleType("");
    setSelectedVehicleId("");
    setAcceptingProductId(null);
  };

  const renderProductCard = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => item.type === 'product' ? router.push(`/proInfo/${item._id}` as any) : router.push(`/orderInfo/${item._id}` as any)}
        activeOpacity={0.9}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="cube-outline" size={30} color="#ccc" />
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.Title || "No Title"}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              {item.price ? `₹${item.price}` : "N/A"}
            </Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={10} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.from || "N/A"}
            </Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={10} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.to || "N/A"}
            </Text>
          </View>

          <View style={styles.productFooter}>
            <View style={styles.vehicleTypeBadge}>
              <Text style={styles.vehicleTypeText}>{item.veichelType || 'Any'}</Text>
            </View>
            
            <View style={styles.weightBadge}>
              <Text style={styles.weightText}>{item.weight || '0'} kg</Text>
            </View>
          </View>

          <View style={styles.actionContainer}>
            {item.type === 'product' ? (
              user && item.createdBy && item.createdBy._id !== user._id ? (
                item.acceptedUsers && item.acceptedUsers.some((accepted: any) => accepted.userId._id === user._id) ? (
                  <View style={styles.acceptedBadge}>
                    <Text style={styles.acceptedBadgeText}>Accepted</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setAcceptingProductId(item._id);
                      setAcceptModalVisible(true);
                    }}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={[
                  styles.statusBadge,
                  item.status === 'pending' && styles.statusPending,
                  item.status === 'accepted' && styles.statusAccepted
                ]}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              )
            ) : (
              // For orders
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setAcceptingProductId(item._id);
                  setAcceptModalVisible(true);
                }}
              >
                <Text style={styles.acceptButtonText}>Accept Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVehicleTypeRow = (group: { 
    vehicleType: string; 
    products: any[]; 
    icon: string; 
    color: string 
  }) => (
    <View key={group.vehicleType} style={styles.vehicleRowContainer}>
      <View style={styles.vehicleRowHeader}>
        <View style={[styles.vehicleTypeIconContainer, { backgroundColor: `${group.color}15` }]}>
          <Ionicons name={group.icon as any} size={20} color={group.color} />
        </View>
        <View style={styles.vehicleTypeTitleContainer}>
          <Text style={styles.vehicleRowTitle}>
            {group.vehicleType}
          </Text>
          <Text style={styles.vehicleRowCount}>
            {group.products.length} item{group.products.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rowScrollView}
        contentContainerStyle={styles.rowContentContainer}
      >
        {group.products.map((product) => (
          <View key={product._id} style={styles.cardWrapper}>
            {renderProductCard({ item: product })}
          </View>
        ))}
        
        {/* Show "View All" card if more than 10 items */}
        {group.products.length > 10 && (
          <TouchableOpacity 
            style={styles.viewAllCard}
            onPress={() => router.push(`/vehicle-type/${group.vehicleType}` as any)}
          >
            <View style={styles.viewAllCardContent}>
              <Ionicons name="grid-outline" size={32} color={group.color} />
              <Text style={[styles.viewAllCardText, { color: group.color }]}>
                View All
              </Text>
              <Text style={styles.viewAllCardCount}>
                +{group.products.length - 10} more
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.heading}>Available Deliveries</Text>
          <Text style={styles.subHeading}>
            Send & accept delivery requests
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={24} color={showFilters ? COLORS.primary : "#666"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Section - Always visible */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, address, weight, price, vehicle type..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters Section */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Weight (kg)</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedWeightFilter}
                  onValueChange={setSelectedWeightFilter}
                  style={styles.filterPicker}
                >
                  <Picker.Item label="All Weights" value="all" />
                  <Picker.Item label="0-5 kg" value="0-5" />
                  <Picker.Item label="5-10 kg" value="5-10" />
                  <Picker.Item label="10-20 kg" value="10-20" />
                  <Picker.Item label="20+ kg" value="20-100" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Vehicle Type</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedVehicleFilter}
                  onValueChange={setSelectedVehicleFilter}
                  style={styles.filterPicker}
                >
                  <Picker.Item label="All Types" value="all" />
                  {uniqueVehicleTypes.map(type => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSelectedWeightFilter("all");
              setSelectedVehicleFilter("all");
              setSearchQuery("");
            }}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
            <Ionicons name="cube-outline" size={20} color="#007AFF" />
          </View>
          <Text style={styles.statValue}>{finalFilteredProducts.length}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
            <Ionicons name="time-outline" size={20} color="#FF9500" />
          </View>
          <Text style={styles.statValue}>
            {finalFilteredProducts.filter(p => p.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
          </View>
          <Text style={styles.statValue}>
            {finalFilteredProducts.filter(p => p.status === 'accepted').length}
          </Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
      </View>

      {/* Main Content */}
      {finalFilteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={80} color="#E0E0E0" />
          <Text style={styles.emptyStateText}>No Deliveries Available</Text>
          <Text style={styles.emptyStateSubText}>
            {combinedDeliveries.length === 0
              ? "No pending or accepted deliveries found"
              : "No deliveries match your filters"}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Vehicle Type Categories */}
          {vehicleTypeGroups.map(renderVehicleTypeRow)}
        </ScrollView>
      )}


      {/* Add Product Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Add New Delivery</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput 
                placeholder="Product Title" 
                value={title} 
                onChangeText={setTitle} 
                style={styles.input} 
              />
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>From Address:</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={from}
                    onValueChange={(itemValue) => setFrom(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select from address..." value="" />
                    {userAddresses.map((address) => (
                      <Picker.Item
                        key={address._id}
                        label={`${address.address}, ${address.city}, ${address.state} - ${address.zipCode}`}
                        value={address._id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>To Address:</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={to}
                    onValueChange={(itemValue) => setTo(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select to address..." value="" />
                    {userAddresses.map((address) => (
                      <Picker.Item
                        key={address._id}
                        label={`${address.address}, ${address.city}, ${address.state} - ${address.zipCode}`}
                        value={address._id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              <TextInput 
                placeholder="Description (max 50 words)" 
                value={description} 
                onChangeText={setDescription} 
                style={[styles.input, styles.textArea]} 
                multiline 
                numberOfLines={3}
              />
              <TextInput
                placeholder="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                style={styles.input}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="Price (Rs.)"
                value={productPrice}
                onChangeText={setProductPrice}
                style={styles.input}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color="#fff" />
                <Text style={styles.imagePickerText}>
                  {image ? 'Change Product Image' : 'Select Product Image'}
                </Text>
              </TouchableOpacity>

              {image && (
                <Image source={{ uri: image.uri }} style={styles.selectedImage} />
              )}

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Required Vehicle Type:</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={veichelType}
                    onValueChange={setVeichelType}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select vehicle type..." value="" />
                    <Picker.Item label="Any" value="Any" />
                    <Picker.Item label="Bike" value="Bike" />
                    <Picker.Item label="Car" value="Car" />
                    <Picker.Item label="Truck" value="Truck" />
                    <Picker.Item label="Motorcycle" value="Motorcycle" />
                    <Picker.Item label="Scooter" value="Scooter" />
                    <Picker.Item label="Auto" value="Auto" />
                    <Picker.Item label="Bus" value="Bus" />
                    <Picker.Item label="Van" value="Van" />
                    <Picker.Item label="Walk" value="Walk" />
                  </Picker>
                </View>
              </View>

              <TouchableOpacity style={[styles.imagePickerButton, { backgroundColor: '#666' }]} onPress={pickVideo}>
                <Ionicons name="videocam-outline" size={20} color="#fff" />
                <Text style={styles.imagePickerText}>
                  {video ? 'Change Video' : 'Select Video (Optional)'}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={handleAddProduct}>
                  <Text style={styles.modalButtonText}>Add Product</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Accept Product Modal */}
      <Modal visible={acceptModalVisible} animationType="slide">
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
                        label={`${vehicle.vehicleType} - ${vehicle.vehicleNumber}`}
                        value={vehicle._id}
                      />
                    ))
                  }
                </Picker>
              </View>
            </View>

            {acceptVehicleType && (
              <View style={styles.selectedVehicleInfo}>
                <Text style={styles.selectedVehicleText}>Selected: {acceptVehicleType}</Text>
              </View>
            )}

            <TextInput
              placeholder="Your Price Offer (in Rs.)"
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
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F9FA" 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerContent: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A"
  },
  subHeading: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FCFCFC',
  },
  filterPicker: {
    height: 44,
    fontSize: 14,
  },
  clearFiltersButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  vehicleRowContainer: {
    marginBottom: 24,
  },
  vehicleRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  vehicleTypeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleTypeTitleContainer: {
    flex: 1,
  },
  vehicleRowTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  vehicleRowCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rowScrollView: {
    flexDirection: 'row',
  },
  rowContentContainer: {
    paddingHorizontal: 12,
  },
  cardWrapper: {
    marginHorizontal: 6,
  },
    card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 16, 
  },

  productImage: {
    width: '100%',
    height: 90, // Reduced from 100
    backgroundColor: '#f8f8f8',
    resizeMode: 'cover',
  },

  noImageContainer: {
    width: '100%',
    height: 90, // Reduced from 100
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardContent: {
    padding: 10, // Reduced from 12
    flex: 1,
    justifyContent: 'space-between', // Added to space content
  },

  cardTitle: {
    fontSize: 13, // Slightly smaller
    fontWeight: '800',
    color: '#1A1A1A',
    height: 32, // Reduced from 36
    lineHeight: 16, // Reduced from 18
    marginBottom: 4,
  },

  priceContainer: {
    marginBottom: 4, // Reduced from 6
  },

  priceText: {
    fontSize: 14, // Reduced from 15
    fontWeight: '800',
    color: COLORS.primary,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1, // Reduced from 2
  },

  locationText: {
    fontSize: 10, // Reduced from 11
    color: '#666',
    marginLeft: 3, // Reduced from 4
    flex: 1,
  },

  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4, // Reduced from 6
    marginBottom: 6, // Reduced from 8
  },

  vehicleTypeBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6, // Reduced from 8
    paddingVertical: 2, // Reduced from 3
    borderRadius: 4, // Reduced from 6
  },

  vehicleTypeText: {
    fontSize: 9, // Reduced from 10
    color: '#666',
    fontWeight: '600',
  },

  weightBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6, // Reduced from 8
    paddingVertical: 2, // Reduced from 3
    borderRadius: 4, // Reduced from 6
  },

  weightText: {
    fontSize: 9, // Reduced from 10
    color: '#4CAF50',
    fontWeight: '600',
  },

  actionContainer: {
    marginTop: 'auto',
    paddingTop: 2, // Added small padding
  },

  acceptButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 4, // Added horizontal padding
    borderRadius: 6,
    alignItems: 'center',
    minHeight: 28, // Ensure minimum height
  },

  acceptButtonText: {
    color: '#fff',
    fontSize: 11, // Reduced from 12
    fontWeight: '700',
    textAlign: 'center',
  },

  acceptedBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 4, // Added horizontal padding
    borderRadius: 6,
    alignItems: 'center',
    minHeight: 28, // Ensure minimum height
  },

  acceptedBadgeText: {
    fontSize: 11, // Reduced from 12
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  statusBadge: {
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  statusAccepted: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },

  viewAllCard: {
    width: 120,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  viewAllCardContent: {
    alignItems: 'center',
  },
  viewAllCardText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  viewAllCardCount: {
    fontSize: 11,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#999',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
    fontWeight: "800", 
    color: "#1A1A1A" 
  },
  input: { 
    borderWidth: 1.5, 
    borderColor: "#E0E0E0", 
    borderRadius: 10, 
    padding: 14, 
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePickerButton: { 
    flexDirection: "row", 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 10, 
    marginBottom: 16, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  imagePickerText: { 
    color: "#fff", 
    marginLeft: 10, 
    fontSize: 16, 
    fontWeight: "600" 
  },
  selectedImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 10, 
    marginBottom: 16, 
    alignSelf: "center",
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 10, 
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: { 
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: { 
    color: "#666", 
    fontWeight: "600", 
    fontSize: 16 
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
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
  picker: {
    height: 56,
    color: "#333",
  },
  selectedVehicleInfo: {
    backgroundColor: "#E8F5E8",
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
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
});