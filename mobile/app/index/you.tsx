import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Image,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";
import { Ionicons, FontAwesome5, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";

const { width, height } = Dimensions.get("window");

interface Product {
  _id: string;
  Title: string;
  from: string;
  to: string;
  fromAddress?: any;
  toAddress?: any;
  description: string;
  price?: number;
  weight: string;
  image: string;
  veichelType: string;
  status: string;
  createdBy?: any;
  acceptedUsers?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface Order {
  _id: string;
  orderId: string;
  userId: any;
  items: any[];
  totalAmount: number;
  finalAmount: number;
  orderStatus: string;
  deliveryStatus?: string;
  deliveryAddress?: any;
  shopId?: any;
  paymentId?: string;
  paymentStatus?: string;
  razorpayOrderId?: string;
  offers?: any[];
  acceptedUsers?: any[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Travel {
  _id: string;
  veichelType: string;
  from: string;
  to: string;
  date: string;
  gotime: string;
  arrivaltime: string;
  status?: string;
  createdBy?: any;
  requestedUsers?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface Vehicle {
  _id: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleColor?: string;
  vehicleYear?: number;
  fuelType?: string;
  vehicleImages?: string[];
  verificationStatus: string;
  isActive: boolean;
}

export default function YouPage() {
  const router = useRouter();
  const { user, userDashboard, fetchUserDashboard } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'myorders' | 'accepted' | 'orders' | 'travels' | 'vehicles'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const tabs = [
    { key: 'products', label: 'My Products', icon: 'cube-outline' },
    { key: 'myorders', label: 'My Orders', icon: 'receipt-outline' },
    { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle-outline' },
    { key: 'orders', label: 'Accepted Orders', icon: 'bag-check-outline' },
    { key: 'travels', label: 'My Travels', icon: 'map-outline' },
    { key: 'vehicles', label: 'My Vehicles', icon: 'car-outline' },
  ];

  useEffect(() => {
    if (user?._id) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      await fetchUserDashboard(user._id);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      Alert.alert("Error", "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#666';
    switch (status?.toLowerCase()) {
      case 'pending': return '#FFA500';
      case 'accepted': return '#4CAF50';
      case 'confirmed': return '#4CAF50';
      case 'in-transit': return '#2196F3';
      case 'out_for_delivery': return '#FF9800';
      case 'delivered': return '#8BC34A';
      case 'cancelled': return '#F44336';
      case 'completed': return '#8BC34A';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'time-outline';
      case 'accepted': return 'checkmark-circle-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'in-transit': return 'car-outline';
      case 'out_for_delivery': return 'rocket-outline';
      case 'delivered': return 'checkmark-done-outline';
      case 'cancelled': return 'close-circle-outline';
      case 'completed': return 'checkmark-done-outline';
      default: return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredData = () => {
    let data: any[] = [];

    switch (activeTab) {
      case 'products':
        data = userDashboard?.userProducts || [];
        break;
      case 'myorders':
        data = userDashboard?.userOrders || [];
        break;
      case 'accepted':
        data = [
          ...(userDashboard?.acceptedProducts || []).map((item: Product) => ({ ...item, type: 'product' })),
          ...(userDashboard?.acceptedOrders || []).map((item: Order) => ({ ...item, type: 'order' }))
        ];
        break;
      case 'orders':
        data = userDashboard?.acceptedOrders || [];
        break;
      case 'travels':
        data = userDashboard?.userTravels || [];
        break;
      case 'vehicles':
        data = userDashboard?.userVehicles || [];
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => {
        if (activeTab === 'products') {
          const product = item as Product;
          return (
            product.Title?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query) ||
            product.veichelType?.toLowerCase().includes(query) ||
            product.status?.toLowerCase().includes(query)
          );
        } else if (activeTab === 'orders' || activeTab === 'myorders') {
          const order = item as Order;
          return (
            order.orderId?.toLowerCase().includes(query) ||
            order.orderStatus?.toLowerCase().includes(query) ||
            order.shopId?.name?.toLowerCase().includes(query) ||
            `${order.finalAmount}`.includes(query)
          );
        } else if (activeTab === 'travels') {
          const travel = item as Travel;
          return (
            travel.from?.toLowerCase().includes(query) ||
            travel.to?.toLowerCase().includes(query) ||
            travel.veichelType?.toLowerCase().includes(query) ||
            travel.status?.toLowerCase().includes(query)
          );
        } else if (activeTab === 'vehicles') {
          const vehicle = item as Vehicle;
          return (
            vehicle.vehicleType?.toLowerCase().includes(query) ||
            vehicle.vehicleNumber?.toLowerCase().includes(query) ||
            vehicle.vehicleBrand?.toLowerCase().includes(query) ||
            vehicle.vehicleModel?.toLowerCase().includes(query) ||
            vehicle.verificationStatus?.toLowerCase().includes(query)
          );
        }
        return true;
      });
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      data = data.filter(item => {
        if (activeTab === 'vehicles') {
          const vehicle = item as Vehicle;
          return vehicle.verificationStatus === selectedFilter;
        }
        return item.status === selectedFilter;
      });
    }

    // Apply sorting
    data.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || a.updatedAt || 0).getTime() - new Date(b.createdAt || b.updatedAt || 0).getTime();
        case 'price_high':
          return (b.price || b.finalAmount || 0) - (a.price || a.finalAmount || 0);
        case 'price_low':
          return (a.price || a.finalAmount || 0) - (b.price || b.finalAmount || 0);
        default:
          return 0;
      }
    });

    return data;
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedItem(item);
        setDetailModalVisible(true);
      }}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="cube-outline" size={40} color="#ccc" />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={12} color="#fff" />
          <Text style={styles.statusBadgeText}>{item.status || 'unknown'}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.Title || 'Untitled Product'}
        </Text>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="car-outline" size={12} color="#666" />
            <Text style={styles.metaText}>{item.veichelType || 'Any'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="scale-outline" size={12} color="#666" />
            <Text style={styles.metaText}>{item.weight || '0'} kg</Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#4CAF50" />
            <Text style={styles.locationText} numberOfLines={1}>
              From: {item.fromAddress ? `${item.fromAddress.address}, ${item.fromAddress.city}, ${item.fromAddress.state} ${item.fromAddress.zipCode}` : item.from}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color="#FF6B6B" />
            <Text style={styles.locationText} numberOfLines={1}>
              To: {item.toAddress ? `${item.toAddress.address}, ${item.toAddress.city}, ${item.toAddress.state} ${item.toAddress.zipCode}` : item.to}
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{item.price || '0'}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt || '')}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/proInfo/${item._id}` as any)}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => {
              // Navigate to edit or other action
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderOrderCard = ({ item }: { item: Order }) => {
    const userAcceptance = item.acceptedUsers?.find((accepted: any) => accepted.userId._id === user._id);
    const firstItemImage = item.items?.[0]?.itemDetails?.images?.[0];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedItem(item);
          setDetailModalVisible(true);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.cardImageContainer}>
          {firstItemImage ? (
            <Image source={{ uri: firstItemImage }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="bag-outline" size={40} color="#ccc" />
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) }]}>
            <Ionicons name={getStatusIcon(item.orderStatus)} size={12} color="#fff" />
            <Text style={styles.statusBadgeText}>{item.orderStatus || 'unknown'}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            Order #{item.orderId}
          </Text>

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="storefront-outline" size={12} color="#666" />
              <Text style={styles.metaText}>{item.shopId?.name || 'Unknown Shop'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cube-outline" size={12} color="#666" />
              <Text style={styles.metaText}>{item.items?.length || 0} items</Text>
            </View>
          </View>

          <View style={styles.orderDetails}>
            {item.deliveryAddress && (
              <Text style={styles.detailText} numberOfLines={1}>
                📍 {item.deliveryAddress.address}, {item.deliveryAddress.city}
              </Text>
            )}
            <Text style={styles.detailText}>
              Accepted by: {item.acceptedUsers?.length || 0} traveler{item.acceptedUsers?.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>₹{item.finalAmount}</Text>
            <Text style={styles.dateText}>{formatDate(item.createdAt || '')}</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/orderInfo/${item._id}` as any)}
            >
              <Text style={styles.actionButtonText}>Track Order</Text>
            </TouchableOpacity>
            {userAcceptance && (
              <View style={styles.acceptedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.acceptedBadgeText}>You accepted</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVehicleCard = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedItem(item);
        setDetailModalVisible(true);
      }}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        {item.vehicleImages?.[0] ? (
          <Image source={{ uri: item.vehicleImages[0] }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <FontAwesome5 name="car" size={40} color="#ccc" />
          </View>
        )}
        <View style={[
          styles.verificationBadge,
          { backgroundColor: item.verificationStatus === 'approved' ? '#4CAF50' : '#FF9800' }
        ]}>
          <Text style={styles.verificationBadgeText}>
            {item.verificationStatus === 'approved' ? '✓ Approved' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.vehicleBrand} {item.vehicleModel}
        </Text>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <FontAwesome5 name="car" size={12} color="#666" />
            <Text style={styles.metaText}>{item.vehicleType}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="confirmation-number" size={12} color="#666" />
            <Text style={styles.metaText}>{item.vehicleNumber}</Text>
          </View>
        </View>

        <View style={styles.vehicleDetails}>
          <Text style={styles.detailText}>{item.vehicleColor || 'N/A'}</Text>
          <Text style={styles.detailText}>{item.vehicleYear || 'N/A'}</Text>
          <Text style={styles.detailText}>{item.fuelType || 'N/A'}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, !item.isActive && styles.disabledButton]}
            onPress={() => {
              // Toggle vehicle active status
            }}
            disabled={!item.isActive}
          >
            <Text style={styles.actionButtonText}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTravelCard = ({ item }: { item: Travel }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedItem(item);
        setDetailModalVisible(true);
      }}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        <View style={styles.travelImagePlaceholder}>
          <LinearGradient
            colors={['#4CAF50', '#8BC34A']}
            style={styles.travelGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="map-outline" size={40} color="#fff" />
          </LinearGradient>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'scheduled') }]}>
          <Ionicons name={getStatusIcon(item.status || 'scheduled')} size={12} color="#fff" />
          <Text style={styles.statusBadgeText}>{item.status || 'scheduled'}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.from} → {item.to}
        </Text>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="car-outline" size={12} color="#666" />
            <Text style={styles.metaText}>{item.veichelType}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color="#666" />
            <Text style={styles.metaText}>{item.requestedUsers?.length || 0} requests</Text>
          </View>
        </View>

        <View style={styles.travelDetails}>
          <Text style={styles.detailText}>📅 {item.date}</Text>
          <Text style={styles.detailText}>🕐 {item.gotime} - {item.arrivaltime}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/travelInfo/${item._id}` as any)}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAcceptedCard = ({ item }: { item: any }) => {
    if (item.type === 'product') {
      return renderProductCard({ item });
    } else {
      return renderOrderCard({ item });
    }
  };

  const renderCard = (item: any) => {
    switch (activeTab) {
      case 'products':
        return renderProductCard({ item });
      case 'myorders':
      case 'orders':
        return renderOrderCard({ item });
      case 'accepted':
        return renderAcceptedCard({ item });
      case 'travels':
        return renderTravelCard({ item });
      case 'vehicles':
        return renderVehicleCard({ item });
      default:
        return null;
    }
  };

  const renderFilters = () => {
    const statusFilters = [
      { label: 'All', value: 'all' },
      { label: 'Pending', value: 'pending' },
      { label: 'Accepted', value: 'accepted' },
      { label: 'In Transit', value: 'in-transit' },
      { label: 'Delivered', value: 'delivered' },
      { label: 'Cancelled', value: 'cancelled' },
    ];

    const vehicleStatusFilters = [
      { label: 'All', value: 'all' },
      { label: 'Approved', value: 'approved' },
      { label: 'Pending', value: 'pending' },
      { label: 'Rejected', value: 'rejected' },
    ];

    const sortOptions = [
      { label: 'Newest First', value: 'newest' },
      { label: 'Oldest First', value: 'oldest' },
      { label: 'Price: High to Low', value: 'price_high' },
      { label: 'Price: Low to High', value: 'price_low' },
    ];

    const currentFilters = activeTab === 'vehicles' ? vehicleStatusFilters : statusFilters;

    return (
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedFilter}
                onValueChange={setSelectedFilter}
                style={styles.picker}
              >
                {currentFilters.map(filter => (
                  <Picker.Item key={filter.value} label={filter.label} value={filter.value} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={sortBy}
                onValueChange={setSortBy}
                style={styles.picker}
              >
                {sortOptions.map(option => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => {
            setSelectedFilter('all');
            setSortBy('newest');
          }}
        >
          <Text style={styles.clearFiltersText}>Reset Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDetailModal = () => {
    if (!selectedItem) return null;

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'products' ? 'Product Details' :
                 activeTab === 'orders' || activeTab === 'myorders' ? 'Order Details' :
                 activeTab === 'vehicles' ? 'Vehicle Details' :
                 activeTab === 'travels' ? 'Travel Details' : 'Details'}
              </Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedItem.image && (
                <Image source={{ uri: selectedItem.image }} style={styles.modalImage} />
              )}
              
              {selectedItem.vehicleImages?.[0] && (
                <Image source={{ uri: selectedItem.vehicleImages[0] }} style={styles.modalImage} />
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedItem.status || selectedItem.orderStatus || selectedItem.verificationStatus) }]}>
                  <Ionicons name={getStatusIcon(selectedItem.status || selectedItem.orderStatus || '')} size={16} color="#fff" />
                  <Text style={styles.statusBadgeLargeText}>
                    {selectedItem.status || selectedItem.orderStatus || selectedItem.verificationStatus}
                  </Text>
                </View>
              </View>

              {selectedItem.Title && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailValue}>{selectedItem.Title}</Text>
                </View>
              )}

              {selectedItem.orderId && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>{selectedItem.orderId}</Text>
                </View>
              )}

              {selectedItem.vehicleNumber && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Vehicle Number</Text>
                  <Text style={styles.detailValue}>{selectedItem.vehicleNumber}</Text>
                </View>
              )}

              {selectedItem.price !== undefined && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>₹{selectedItem.price}</Text>
                </View>
              )}

              {selectedItem.finalAmount !== undefined && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Total Amount</Text>
                  <Text style={styles.detailValue}>₹{selectedItem.finalAmount}</Text>
                </View>
              )}

              {selectedItem.createdAt && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{formatDateTime(selectedItem.createdAt)}</Text>
                </View>
              )}

              {selectedItem.updatedAt && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Last Updated</Text>
                  <Text style={styles.detailValue}>{formatDateTime(selectedItem.updatedAt)}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.secondaryButton]}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setDetailModalVisible(false);
                    if (activeTab === 'products') {
                      router.push(`/proInfo/${selectedItem._id}` as any);
                    } else if (activeTab === 'orders' || activeTab === 'myorders') {
                      router.push(`/orderInfo/${selectedItem._id}` as any);
                    } else if (activeTab === 'travels') {
                      router.push(`/travelInfo/${selectedItem._id}` as any);
                    }
                  }}
                >
                  <Text style={styles.primaryButtonText}>View Full Details</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredData = getFilteredData();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#3b82f6", "#1d4ed8"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle" size={48} color="#fff" />
            )}
          </View>
          <Text style={styles.headerTitle}>{user?.username || 'User'}'s Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track all your activities</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={22} color={showFilters ? '#FFD700' : '#fff'} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search in ${activeTab}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {showFilters && renderFilters()}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {tabs.map((tab) => {
          let count = 0;
          switch (tab.key) {
            case 'products':
              count = userDashboard?.userProducts?.length || 0;
              break;
            case 'myorders':
              count = userDashboard?.userOrders?.length || 0;
              break;
            case 'accepted':
              count = (userDashboard?.acceptedProducts?.length || 0) + (userDashboard?.acceptedOrders?.length || 0);
              break;
            case 'orders':
              count = userDashboard?.acceptedOrders?.length || 0;
              break;
            case 'travels':
              count = userDashboard?.userTravels?.length || 0;
              break;
            case 'vehicles':
              count = userDashboard?.userVehicles?.length || 0;
              break;
          }

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.key ? COLORS.primary : '#666'} 
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.content}>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => renderCard(item)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name={activeTab === 'products' ? 'cube-outline' : 
                      activeTab === 'orders' ? 'receipt-outline' : 
                      activeTab === 'vehicles' ? 'car-outline' : 
                      activeTab === 'travels' ? 'map-outline' : 
                      'checkmark-circle-outline'} 
                size={80} 
                color="#e2e8f0" 
              />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No Results Found' : 
                 activeTab === 'products' ? 'No Products Yet' :
                 activeTab === 'myorders' ? 'No Orders Yet' :
                 activeTab === 'accepted' ? 'No Accepted Deliveries' :
                 activeTab === 'orders' ? 'No Accepted Orders' :
                 activeTab === 'travels' ? 'No Travels Yet' :
                 'No Vehicles Yet'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Try different search terms' :
                 activeTab === 'products' ? 'You haven\'t created any products for delivery' :
                 activeTab === 'myorders' ? 'You haven\'t placed any orders yet' :
                 activeTab === 'accepted' ? 'You haven\'t accepted any deliveries yet' :
                 activeTab === 'orders' ? 'You haven\'t accepted any orders for delivery' :
                 activeTab === 'travels' ? 'You haven\'t created any travel routes' :
                 'You haven\'t registered any vehicles yet'}
              </Text>
            </View>
          }
        />
      </View>

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#e0f2fe",
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
  filterColumn: {
    flex: 1,
    marginHorizontal: 6,
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
  picker: {
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
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    maxHeight: 80,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    minWidth: 120,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    minWidth: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    paddingHorizontal: 4,
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: (width - 36) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
  },
  cardImageContainer: {
    position: 'relative',
    height: 120,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelImagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  travelGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  verificationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    height: 36,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 8,
  },
  travelDetails: {
    marginBottom: 8,
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    minWidth: 40,
    flex: 0,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  acceptedBadgeText: {
    fontSize: 10,
    color: '#065f46',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalContent: {
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    resizeMode: 'cover',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeLargeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
});


// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
//   SafeAreaView,
//   ActivityIndicator,
//   Image,
//   FlatList,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuthStore } from "@/store/authStore";
// import COLORS from "@/constants/color";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";

// const { width, height } = Dimensions.get("window");

// interface Product {
//   _id: string;
//   Title: string;
//   from: string;
//   to: string;
//   fromAddress?: any;
//   toAddress?: any;
//   description: string;
//   price?: number;
//   weight: string;
//   image: string;
//   veichelType: string;
//   status: string;
//   createdBy?: any;
//   acceptedUsers?: any[];
// }

// interface Order {
//   _id: string;
//   orderId: string;
//   userId: any;
//   items: any[];
//   totalAmount: number;
//   finalAmount: number;
//   orderStatus: string;
//   deliveryAddress?: any;
//   shopId?: any;
//   acceptedUsers?: any[];
// }

// interface Travel {
//   _id: string;
//   veichelType: string;
//   from: string;
//   to: string;
//   date: string;
//   gotime: string;
//   arrivaltime: string;
//   status?: string;
//   createdBy?: any;
//   requestedUsers?: any[];
// }

// export default function YouPage() {
//   const router = useRouter();
//   const { user, userDashboard, fetchUserDashboard } = useAuthStore();
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState<'products' | 'myorders' | 'accepted' | 'orders' | 'travels'>('products');

//   useEffect(() => {
//     if (user?._id) {
//       loadDashboard();
//     }
//   }, [user]);

//   const loadDashboard = async () => {
//     try {
//       await fetchUserDashboard(user._id);
//     } catch (error) {
//       console.error("Error loading dashboard:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'pending': return '#FFA500';
//       case 'accepted': return '#4CAF50';
//       case 'in-transit': return '#2196F3';
//       case 'delivered': return '#8BC34A';
//       case 'cancelled': return '#F44336';
//       default: return '#666';
//     }
//   };

//   const renderProductCard = ({ item }: { item: Product }) => (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() => router.push(`/proInfo/${item._id}` as any)}
//       activeOpacity={0.9}
//     >
//       <View style={styles.cardHeader}>
//         <Text style={styles.cardTitle} numberOfLines={1}>
//           {item.Title || 'Untitled Product'}
//         </Text>
//         <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
//           <Text style={styles.statusText}>{item.status || 'unknown'}</Text>
//         </View>
//       </View>

//       <View style={styles.cardContent}>
//         <View style={styles.locationContainer}>
//           <View style={styles.locationRow}>
//             <Ionicons name="location-outline" size={12} color="#4CAF50" />
//             <Text style={styles.locationText} numberOfLines={1}>
//               From: {item.fromAddress ? `${item.fromAddress.address}, ${item.fromAddress.city}` : item.from}
//             </Text>
//           </View>
//           <View style={styles.locationRow}>
//             <Ionicons name="location" size={12} color="#FF6B6B" />
//             <Text style={styles.locationText} numberOfLines={1}>
//               To: {item.toAddress ? `${item.toAddress.address}, ${item.toAddress.city}` : item.to}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.cardFooter}>
//           <View style={styles.vehicleTypeBadge}>
//             <Text style={styles.vehicleTypeText}>{item.veichelType || 'Any'}</Text>
//           </View>
//           <Text style={styles.priceText}>₹{item.price || '0'}</Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   const renderOrderCard = ({ item }: { item: Order }) => {
//     const userAcceptance = item.acceptedUsers?.find((accepted: any) => accepted.userId._id === user._id);

//     return (
//       <TouchableOpacity
//         style={styles.card}
//         onPress={() => router.push(`/orderInfo/${item._id}` as any)}
//         activeOpacity={0.9}
//       >
//         <View style={styles.cardHeader}>
//           <Text style={styles.cardTitle} numberOfLines={1}>
//             Order {item.orderId}
//           </Text>
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userAcceptance?.status || item.orderStatus) }]}>
//             <Text style={styles.statusText}>{userAcceptance?.status || item.orderStatus}</Text>
//           </View>
//         </View>

//         <View style={styles.cardContent}>
//           <View style={styles.orderDetails}>
//             <Text style={styles.orderText}>
//               Items: {item.items?.length || 0} • Total: ₹{item.finalAmount}
//             </Text>
//             <Text style={styles.orderText}>
//               Shop: {item.shopId?.name || 'Unknown Shop'}
//             </Text>
//             {item.deliveryAddress && (
//               <Text style={styles.orderText} numberOfLines={1}>
//                 Delivery: {item.deliveryAddress.address}, {item.deliveryAddress.city}
//               </Text>
//             )}
//           </View>

//           <View style={styles.cardFooter}>
//             <View style={styles.vehicleTypeBadge}>
//               <Text style={styles.vehicleTypeText}>{userAcceptance?.vehicleType || 'N/A'}</Text>
//             </View>
//             <Text style={styles.priceText}>₹{userAcceptance?.price || '0'}</Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderTravelCard = ({ item }: { item: Travel }) => (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() => router.push(`/travelInfo/${item._id}` as any)}
//       activeOpacity={0.9}
//     >
//       <View style={styles.cardHeader}>
//         <Text style={styles.cardTitle} numberOfLines={1}>
//           Travel Route
//         </Text>
//         <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'scheduled') }]}>
//           <Text style={styles.statusText}>{item.status || 'scheduled'}</Text>
//         </View>
//       </View>

//       <View style={styles.cardContent}>
//         <View style={styles.locationContainer}>
//           <View style={styles.locationRow}>
//             <Ionicons name="location-outline" size={12} color="#4CAF50" />
//             <Text style={styles.locationText} numberOfLines={1}>
//               From: {item.from}
//             </Text>
//           </View>
//           <View style={styles.locationRow}>
//             <Ionicons name="location" size={12} color="#FF6B6B" />
//             <Text style={styles.locationText} numberOfLines={1}>
//               To: {item.to}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.travelDetails}>
//           <Text style={styles.travelText}>
//             Date: {item.date} • Time: {item.gotime} - {item.arrivaltime}
//           </Text>
//           <Text style={styles.travelText}>
//             Vehicle: {item.veichelType} • Requests: {item.requestedUsers?.length || 0}
//           </Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   const renderAcceptedProductCard = ({ item }: { item: Product }) => {
//     const userAcceptance = item.acceptedUsers?.find((accepted: any) => accepted.userId._id === user._id);

//     return (
//       <TouchableOpacity
//         style={styles.card}
//         onPress={() => router.push(`/proInfo/${item._id}` as any)}
//         activeOpacity={0.9}
//       >
//         <View style={styles.cardHeader}>
//           <Text style={styles.cardTitle} numberOfLines={1}>
//             {item.Title || 'Untitled Product'}
//           </Text>
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userAcceptance?.status) }]}>
//             <Text style={styles.statusText}>{userAcceptance?.status || 'unknown'}</Text>
//           </View>
//         </View>

//         <View style={styles.cardContent}>
//           <Text style={styles.ownerText}>
//             From: {item.createdBy?.username || 'Unknown User'}
//           </Text>

//           <View style={styles.locationContainer}>
//             <View style={styles.locationRow}>
//               <Ionicons name="location-outline" size={12} color="#4CAF50" />
//               <Text style={styles.locationText} numberOfLines={1}>
//                 From: {item.fromAddress ? `${item.fromAddress.address}, ${item.fromAddress.city}` : item.from}
//               </Text>
//             </View>
//             <View style={styles.locationRow}>
//               <Ionicons name="location" size={12} color="#FF6B6B" />
//               <Text style={styles.locationText} numberOfLines={1}>
//                 To: {item.toAddress ? `${item.toAddress.address}, ${item.toAddress.city}` : item.to}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.cardFooter}>
//             <View style={styles.vehicleTypeBadge}>
//               <Text style={styles.vehicleTypeText}>{userAcceptance?.vehicleType || 'N/A'}</Text>
//             </View>
//             <Text style={styles.priceText}>₹{userAcceptance?.price || '0'}</Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderAcceptedOrderCard = ({ item }: { item: Order }) => {
//     const userAcceptance = item.acceptedUsers?.find((accepted: any) => accepted.userId._id === user._id);

//     return (
//       <TouchableOpacity
//         style={styles.card}
//         onPress={() => router.push(`/orderInfo/${item._id}` as any)}
//         activeOpacity={0.9}
//       >
//         <View style={styles.cardHeader}>
//           <Text style={styles.cardTitle} numberOfLines={1}>
//             Order {item.orderId}
//           </Text>
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userAcceptance?.status) }]}>
//             <Text style={styles.statusText}>{userAcceptance?.status || 'unknown'}</Text>
//           </View>
//         </View>

//         <View style={styles.cardContent}>
//           <Text style={styles.ownerText}>
//             From: {item.userId?.username || 'Unknown User'}
//           </Text>

//           <View style={styles.orderDetails}>
//             <Text style={styles.orderText}>
//               Items: {item.items?.length || 0} • Total: ₹{item.finalAmount}
//             </Text>
//             <Text style={styles.orderText}>
//               Shop: {item.shopId?.name || 'Unknown Shop'}
//             </Text>
//             {item.deliveryAddress && (
//               <Text style={styles.orderText} numberOfLines={1}>
//                 Delivery: {item.deliveryAddress.address}, {item.deliveryAddress.city}
//               </Text>
//             )}
//           </View>

//           <View style={styles.cardFooter}>
//             <View style={styles.vehicleTypeBadge}>
//               <Text style={styles.vehicleTypeText}>{userAcceptance?.vehicleType || 'N/A'}</Text>
//             </View>
//             <Text style={styles.priceText}>₹{userAcceptance?.price || '0'}</Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderUserOrderCard = ({ item }: { item: Order }) => {
//     return (
//       <TouchableOpacity
//         style={styles.card}
//         onPress={() => router.push(`/orderInfo/${item._id}` as any)}
//         activeOpacity={0.9}
//       >
//         <View style={styles.cardHeader}>
//           <Text style={styles.cardTitle} numberOfLines={1}>
//             Order {item.orderId}
//           </Text>
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) }]}>
//             <Text style={styles.statusText}>{item.orderStatus || 'unknown'}</Text>
//           </View>
//         </View>

//         <View style={styles.cardContent}>
//           <View style={styles.orderDetails}>
//             <Text style={styles.orderText}>
//               Items: {item.items?.length || 0} • Total: ₹{item.finalAmount}
//             </Text>
//             <Text style={styles.orderText}>
//               Shop: {item.shopId?.name || 'Unknown Shop'}
//             </Text>
//             {item.deliveryAddress && (
//               <Text style={styles.orderText} numberOfLines={1}>
//                 Delivery: {item.deliveryAddress.address}, {item.deliveryAddress.city}
//               </Text>
//             )}
//           </View>

//           <View style={styles.deliveryInfo}>
//             <Text style={styles.deliveryText}>
//               Accepted by: {item.acceptedUsers?.length || 0} traveler{item.acceptedUsers?.length !== 1 ? 's' : ''}
//             </Text>
//             {item.acceptedUsers && item.acceptedUsers.length > 0 && (
//               <Text style={styles.deliveryText}>
//                 Current: {item.acceptedUsers.find((accepted: any) => accepted.status === 'in-transit')?.userId?.username || 'None'}
//               </Text>
//             )}
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//           <Text style={styles.loadingText}>Loading your dashboard...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const tabs = [
//     { key: 'products', label: 'My Products', count: userDashboard?.userProducts?.length || 0 },
//     { key: 'myorders', label: 'My Orders', count: userDashboard?.userOrders?.length || 0 },
//     { key: 'accepted', label: 'Accepted Deliveries', count: (userDashboard?.acceptedProducts?.length || 0) + (userDashboard?.acceptedOrders?.length || 0) },
//     { key: 'orders', label: 'Accepted Orders', count: userDashboard?.acceptedOrders?.length || 0 },
//     { key: 'travels', label: 'My Travels', count: userDashboard?.userTravels?.length || 0 },
//   ];

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <LinearGradient
//         colors={["#3b82f6", "#1d4ed8"]}
//         style={styles.header}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 0 }}
//       >
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.backButton}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <View style={styles.headerContent}>
//           <Ionicons name="person-circle" size={32} color="#fff" />
//           <Text style={styles.headerTitle}>Your Dashboard</Text>
//           <Text style={styles.headerSubtitle}>Track all your activities</Text>
//         </View>
//       </LinearGradient>

//       <View style={styles.container}>
//         {/* Tab Navigation */}
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={styles.tabContainer}
//           contentContainerStyle={styles.tabContent}
//         >
//           {tabs.map((tab) => (
//             <TouchableOpacity
//               key={tab.key}
//               style={[styles.tab, activeTab === tab.key && styles.tabActive]}
//               onPress={() => setActiveTab(tab.key as any)}
//             >
//               <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
//                 {tab.label}
//               </Text>
//               <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
//                 <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
//                   {tab.count}
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Content */}
//         <View style={styles.content}>
//           {activeTab === 'products' && (
//             <FlatList
//               data={userDashboard?.userProducts || []}
//               keyExtractor={(item) => item._id}
//               renderItem={renderProductCard}
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={styles.listContainer}
//               ListEmptyComponent={
//                 <View style={styles.emptyState}>
//                   <Ionicons name="cube-outline" size={60} color="#cbd5e1" />
//                   <Text style={styles.emptyStateTitle}>No Products Yet</Text>
//                   <Text style={styles.emptyStateText}>
//                     You haven't created any products for delivery
//                   </Text>
//                 </View>
//               }
//             />
//           )}

//           {activeTab === 'accepted' && (
//             <ScrollView showsVerticalScrollIndicator={false}>
//               {/* Accepted Products */}
//               {userDashboard?.acceptedProducts?.length > 0 && (
//                 <View style={styles.section}>
//                   <Text style={styles.sectionTitle}>Accepted Products</Text>
//                   {userDashboard.acceptedProducts.map((product: Product) => (
//                     <View key={product._id} style={styles.listItem}>
//                       {renderAcceptedProductCard({ item: product })}
//                     </View>
//                   ))}
//                 </View>
//               )}

//               {/* Accepted Orders */}
//               {userDashboard?.acceptedOrders?.length > 0 && (
//                 <View style={styles.section}>
//                   <Text style={styles.sectionTitle}>Accepted Orders</Text>
//                   {userDashboard.acceptedOrders.map((order: Order) => (
//                     <View key={order._id} style={styles.listItem}>
//                       {renderAcceptedOrderCard({ item: order })}
//                     </View>
//                   ))}
//                 </View>
//               )}

//               {(!userDashboard?.acceptedProducts?.length && !userDashboard?.acceptedOrders?.length) && (
//                 <View style={styles.emptyState}>
//                   <Ionicons name="checkmark-circle-outline" size={60} color="#cbd5e1" />
//                   <Text style={styles.emptyStateTitle}>No Accepted Deliveries</Text>
//                   <Text style={styles.emptyStateText}>
//                     You haven't accepted any deliveries yet
//                   </Text>
//                 </View>
//               )}
//             </ScrollView>
//           )}

//           {activeTab === 'myorders' && (
//             <FlatList
//               data={userDashboard?.userOrders || []}
//               keyExtractor={(item) => item._id}
//               renderItem={renderUserOrderCard}
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={styles.listContainer}
//               ListEmptyComponent={
//                 <View style={styles.emptyState}>
//                   <Ionicons name="receipt-outline" size={60} color="#cbd5e1" />
//                   <Text style={styles.emptyStateTitle}>No Orders Yet</Text>
//                   <Text style={styles.emptyStateText}>
//                     You haven't placed any orders yet
//                   </Text>
//                 </View>
//               }
//             />
//           )}

//           {activeTab === 'orders' && (
//             <FlatList
//               data={userDashboard?.acceptedOrders || []}
//               keyExtractor={(item) => item._id}
//               renderItem={renderAcceptedOrderCard}
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={styles.listContainer}
//               ListEmptyComponent={
//                 <View style={styles.emptyState}>
//                   <Ionicons name="receipt-outline" size={60} color="#cbd5e1" />
//                   <Text style={styles.emptyStateTitle}>No Accepted Orders</Text>
//                   <Text style={styles.emptyStateText}>
//                     You haven't accepted any orders for delivery
//                   </Text>
//                 </View>
//               }
//             />
//           )}

//           {activeTab === 'travels' && (
//             <FlatList
//               data={userDashboard?.userTravels || []}
//               keyExtractor={(item) => item._id}
//               renderItem={renderTravelCard}
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={styles.listContainer}
//               ListEmptyComponent={
//                 <View style={styles.emptyState}>
//                   <Ionicons name="map-outline" size={60} color="#cbd5e1" />
//                   <Text style={styles.emptyStateTitle}>No Travels Yet</Text>
//                   <Text style={styles.emptyStateText}>
//                     You haven't created any travel routes
//                   </Text>
//                 </View>
//               }
//             />
//           )}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#f8fafc",
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 30,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   backButton: {
//     marginRight: 15,
//     padding: 8,
//   },
//   headerContent: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "800",
//     color: "#fff",
//     marginTop: 8,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: "#e0f2fe",
//     marginTop: 4,
//   },
//   container: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#64748b',
//   },
//   tabContainer: {
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   tabContent: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//   },
//   tab: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     borderRadius: 20,
//     backgroundColor: '#f1f5f9',
//   },
//   tabActive: {
//     backgroundColor: COLORS.primary,
//   },
//   tabText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#64748b',
//     marginRight: 8,
//   },
//   tabTextActive: {
//     color: '#fff',
//   },
//   tabBadge: {
//     backgroundColor: '#e2e8f0',
//     borderRadius: 10,
//     minWidth: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   tabBadgeActive: {
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   tabBadgeText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#64748b',
//   },
//   tabBadgeTextActive: {
//     color: '#fff',
//   },
//   content: {
//     flex: 1,
//   },
//   listContainer: {
//     padding: 20,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     marginLeft: 20,
//     marginBottom: 12,
//   },
//   listItem: {
//     marginHorizontal: 20,
//     marginBottom: 12,
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//     borderWidth: 1,
//     borderColor: '#F0F0F0',
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     flex: 1,
//     marginRight: 8,
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   statusText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   cardContent: {
//     marginBottom: 12,
//   },
//   ownerText: {
//     fontSize: 14,
//     color: '#64748b',
//     marginBottom: 8,
//     fontStyle: 'italic',
//   },
//   locationContainer: {
//     marginBottom: 8,
//   },
//   locationRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   locationText: {
//     fontSize: 13,
//     color: '#64748b',
//     marginLeft: 6,
//     flex: 1,
//   },
//   orderDetails: {
//     marginBottom: 8,
//   },
//   orderText: {
//     fontSize: 13,
//     color: '#64748b',
//     marginBottom: 2,
//   },
//   travelDetails: {
//     marginTop: 8,
//   },
//   travelText: {
//     fontSize: 13,
//     color: '#64748b',
//     marginBottom: 2,
//   },
//   cardFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   vehicleTypeBadge: {
//     backgroundColor: '#f1f5f9',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   vehicleTypeText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#475569',
//   },
//   priceText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: COLORS.primary,
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   emptyStateTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#475569',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateText: {
//     fontSize: 16,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   deliveryInfo: {
//     marginTop: 8,
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#F0F0F0',
//   },
//   deliveryText: {
//     fontSize: 13,
//     color: '#64748b',
//     marginBottom: 2,
//   },
// });