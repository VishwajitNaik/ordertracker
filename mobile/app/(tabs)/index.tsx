import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";

// Import Product interface from authStore
interface Address {
  _id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

type Shop = {
  _id: string;
  name: string;
  shopType: string;
  location: Address;
  images: string[];
  openingTime: string;
  closingTime: string;
  status: string;
};
type Product = {
  _id: string;
  Title: string;
  from: string;
  to: string;
  description: string;
  price?: number;
  weight: string;
  image: string;
  veichelType: string;
  video?: string;
  status?: string;
  createdBy?: {
    _id: string;
    username: string;
    profileImage: string;
  };
  acceptedUsers?: {
    userId: {
      _id: string;
      username: string;
      profileImage: string;
    };
    vehicleType: string;
    tentativeTime: string;
    price: number;
    status: string;
  }[];
  createdAt?: string;
};

const { width } = Dimensions.get("window");
const CARD_WIDTH = 150; // Fixed width for horizontal scrolling
const CARD_HEIGHT = 200; // Fixed height

export default function Home() {
  const router = useRouter();
  const { products, fetchProducts, allShops, fetchAllShops, user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Filter products: only pending and accepted status
  const filteredProducts = products.filter(product =>
    product.status === 'pending' || product.status === 'accepted'
  );

  // Group products by veichelType (vehicle type)
  const groupProductsByVehicleType = () => {
    const grouped: { [key: string]: Product[] } = {};
    
    filteredProducts.forEach(product => {
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
        color: getVehicleTypeColor(vehicleType)
      }))
      .sort((a, b) => a.vehicleType.localeCompare(b.vehicleType));
  };

  // Get appropriate icon for vehicle type
  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType.toLowerCase()) {
      case 'bike':
      case 'bicycle':
        return 'bicycle-outline';
      case 'car':
        return 'car-outline';
      case 'truck':
        return 'car-sport-outline';
      case 'motorcycle':
        return 'bicycle-outline';
      case 'scooter':
        return 'bicycle-outline';
      case 'auto':
      case 'autorickshaw':
        return 'car-outline';
      case 'bus':
        return 'bus-outline';
      case 'van':
        return 'car-outline';
      case 'walk':
      case 'walking':
        return 'walk-outline';
      default:
        return 'cube-outline'; // For "Any" or unknown types
    }
  };

  // Get color for vehicle type
  const getVehicleTypeColor = (vehicleType: string) => {
    switch (vehicleType.toLowerCase()) {
      case 'bike':
        return '#4CAF50'; // Green
      case 'car':
        return '#2196F3'; // Blue
      case 'truck':
        return '#FF9800'; // Orange
      case 'motorcycle':
        return '#9C27B0'; // Purple
      case 'scooter':
        return '#00BCD4'; // Cyan
      case 'auto':
        return '#FF5722'; // Deep Orange
      case 'bus':
        return '#795548'; // Brown
      case 'van':
        return '#607D8B'; // Blue Grey
      case 'walk':
        return '#3F51B5'; // Indigo
      default:
        return '#007AFF'; // Default blue for "Any"
    }
  };

  const vehicleTypeGroups = groupProductsByVehicleType();

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 Loading data...");
        await Promise.all([fetchProducts(), fetchAllShops(1, 20)]);
        console.log("✅ Data loaded successfully");
        setLoading(false);
      } catch (error) {
        console.error("❌ Error loading data:", error);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    const initializeWallet = async () => {
      const { user, token } = useAuthStore.getState();
      if (user && token) {
        try {
          await useAuthStore.getState().fetchWalletBalance();
          await useAuthStore.getState().fetchWalletStats();
        } catch (error) {
          console.log("Wallet initialization:", error);
        }
      }
    };
    
    loadData();
    initializeWallet();

    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts().finally(() => setRefreshing(false));
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      key={item._id}
      style={styles.card}
      onPress={() => router.push(`/proInfo/${item._id}` as any)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image || 'https://via.placeholder.com/300' }} 
          style={styles.productImage}
          onError={(e) => {
            console.log("Image failed to load:", item.image);
          }}
        />
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>₹{item.price || '0'}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.Title || 'Untitled Product'}
        </Text>
        
        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={10} color="#4CAF50" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.from || 'Unknown'}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={10} color="#FF6B6B" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.to || 'Unknown'}
            </Text>
          </View>
        </View>
        
        <View style={styles.footerContainer}>
          <View style={styles.vehicleTypeBadge}>
            <Text style={styles.vehicleTypeText}>{item.veichelType || 'Any'}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              item.status === 'pending' && styles.statusPending,
              item.status === 'accepted' && styles.statusAccepted,
              item.status === 'delivered' && styles.statusDelivered
            ]}>
              <Text style={styles.statusText}>{item.status || 'unknown'}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVehicleTypeRow = (group: { 
    vehicleType: string; 
    products: Product[]; 
    icon: string; 
    color: string 
  }) => (
    <View key={group.vehicleType} style={styles.vehicleRowContainer}>
      {/* Row Header with Vehicle Type */}
      <View style={styles.vehicleRowHeader}>
        <View style={[styles.vehicleTypeIconContainer, { backgroundColor: `${group.color}15` }]}>
          <Ionicons name={group.icon as any} size={20} color={group.color} />
        </View>
        <View style={styles.vehicleTypeTitleContainer}>
          <Text style={styles.vehicleRowTitle}>
            {group.vehicleType.charAt(0).toUpperCase() + group.vehicleType.slice(1)} Deliveries
          </Text>
          <Text style={styles.vehicleRowCount}>
            {group.products.length} item{group.products.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      
      {/* Products Scroll */}
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
        
        {/* Show "View All" card if more than 5 items */}
        {group.products.length > 5 && (
          <TouchableOpacity 
            style={styles.viewAllCard}
            onPress={() => router.push(`/vehicle-type/${group.vehicleType}` as any)}
          >
            <View style={styles.viewAllContainer}>
              <Ionicons name="chevron-forward" size={24} color={group.color} />
              <Text style={[styles.viewAllText, { color: group.color }]}>
                View All
              </Text>
              <Text style={styles.viewAllCount}>
                +{group.products.length - 5} more
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#007AFF"]}
          tintColor="#007AFF"
        />
      }
    >
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>DeliverEase</Text>
          <Text style={styles.headerSubtitle}>Deliver anything, anywhere</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push("/profile" as any)}
        >
          <Ionicons name="person-circle-outline" size={28} color="#333" />
        </TouchableOpacity>
      </Animated.View>

      {/* Carousel */}
      <Animated.View 
        style={[
          styles.carouselContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
        >
          <View style={styles.carouselSlide}>
            <Image source={require("../../assets/images/banner1.jpeg")} style={styles.carouselImage} />
            <View style={styles.carouselOverlay}>
              <Text style={styles.carouselTitle}>Fast Delivery</Text>
              <Text style={styles.carouselText}>Connect with travelers</Text>
            </View>
          </View>
          <View style={styles.carouselSlide}>
            <Image source={require("../../assets/images/banner2.jpg")} style={styles.carouselImage} />
            <View style={styles.carouselOverlay}>
              <Text style={styles.carouselTitle}>Secure Shipping</Text>
              <Text style={styles.carouselText}>Your items are safe with us</Text>
            </View>
          </View>
          <View style={styles.carouselSlide}>
            <Image source={require("../../assets/images/banner3.jpg")} style={styles.carouselImage} />
            <View style={styles.carouselOverlay}>
              <Text style={styles.carouselTitle}>Easy Tracking</Text>
              <Text style={styles.carouselText}>Monitor your deliveries</Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.carouselPagination}>
          <View style={styles.paginationDot} />
          <View style={[styles.paginationDot, styles.paginationDotActive]} />
          <View style={styles.paginationDot} />
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View 
        style={[
          styles.actionsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.actionsScroll}
        >
           {[
            { icon: "storefront-outline", label: "Add Shop", route: "/shop" },
            { icon: "people-outline", label: "Create Group", route: "/group" },
            { icon: "car-outline", label: "Add Vehicle", route: "/vehicle" },
            { icon: "map-outline", label: "Set Travel", route: "/travel" },
            { icon: "chatbubble-outline", label: "Messages", route: "/message" },
            { icon: "person-circle-outline", label: "You", route: "/you" },
            { icon: "cube-outline", label: "My Products", route: "/userProducts" },
            { icon: "cart-outline", label: "Shop Items", route: "/shop-items" },
            { icon: "wallet-outline", label: "My Wallet", route: "/wallet" }
          ].map((action, index) => (
            <View key={index} style={styles.actionCardWrapper}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => router.push(action.route as any)}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name={action.icon as any} size={24} color="#007AFF" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.actionText}>{action.label}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Shops Section */}
      <View style={styles.shopsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Shops</Text>
          {Array.isArray(allShops) && allShops.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/all-shops" as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {Array.isArray(allShops) && allShops.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.shopsScrollView}
            contentContainerStyle={styles.shopsContentContainer}
          >
            {allShops.slice(0, 20).map((shop: Shop) => (
              <TouchableOpacity
                key={shop._id}
                style={styles.shopCard}
                onPress={() => router.push(`/shops/${shop._id}` as any)}
                activeOpacity={0.9}
              >
                <View style={styles.shopImageContainer}>
                  <Image
                    source={{
                      uri: shop.images && shop.images.length > 0 && shop.images[0]
                        ? shop.images[0]
                        : undefined
                    }}
                    style={styles.shopImage}
                    onError={(e) => {
                      console.log("Shop image failed to load:", shop.images?.[0]);
                    }}
                  />
                  {(!shop.images || shop.images.length === 0 || !shop.images[0]) && (
                    <View style={styles.shopImagePlaceholder}>
                      <Ionicons name="storefront-outline" size={40} color="#ccc" />
                    </View>
                  )}
                  <View style={styles.shopBadge}>
                    <Text style={styles.shopBadgeText}>{shop.shopType}</Text>
                  </View>
                </View>

                <View style={styles.shopContent}>
                  <Text style={styles.shopName} numberOfLines={1}>
                    {shop.name}
                  </Text>
                  <View style={styles.shopLocation}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text style={styles.shopLocationText} numberOfLines={1}>
                      {shop.location && shop.location.address ? `${shop.location.address}, ${shop.location.city}` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.shopStatus}>
                    <View style={[
                      styles.statusIndicator,
                      shop.status === 'open' && styles.statusOpen,
                      shop.status === 'closed' && styles.statusClosed
                    ]}>
                      <Text style={styles.statusText}>
                        {shop.status === 'open' ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* See All Card */}
            {Array.isArray(allShops) && allShops.length > 0 && (
              <TouchableOpacity
                style={styles.seeAllShopCard}
                onPress={() => router.push("/all-shops" as any)}
                activeOpacity={0.9}
              >
                <View style={styles.seeAllShopContainer}>
                  <Ionicons name="storefront-outline" size={32} color="#007AFF" />
                  <Text style={styles.seeAllShopText}>View All</Text>
                  <Text style={styles.seeAllShopCount}>
                    See all shops
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptyShopsContainer}>
            <Ionicons name="storefront-outline" size={60} color="#E0E0E0" />
            <Text style={styles.emptyShopsTitle}>No Shops Yet</Text>
            <Text style={styles.emptyShopsText}>
              Shops will be displayed here once added
            </Text>
          </View>
        )}
      </View>

      {/* Products Section */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Deliveries</Text>
          {filteredProducts.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/products" as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
            <Text style={styles.errorTitle}>Error Loading Products</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchProducts}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading deliveries...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No Deliveries Yet</Text>
            <Text style={styles.emptyText}>
              Start by creating a product for delivery
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push("/shop" as any)}
            >
              <Text style={styles.emptyButtonText}>Create Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Vehicle Type Categories */}
            {vehicleTypeGroups.map(renderVehicleTypeRow)}
          </>
        )}
      </View>

      {/* Vehicle Type Summary */}
      {vehicleTypeGroups.length > 0 && (
        <View style={styles.vehicleSummarySection}>
          <Text style={styles.sectionTitle}>Delivery Options</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.vehicleSummaryScroll}
          >
            {vehicleTypeGroups.map((group) => (
              <TouchableOpacity 
                key={group.vehicleType} 
                style={[styles.vehicleSummaryCard, { borderLeftColor: group.color }]}
                onPress={() => router.push(`/vehicle-type/${group.vehicleType}` as any)}
              >
                <View style={styles.vehicleSummaryContent}>
                  <View style={[styles.vehicleSummaryIcon, { backgroundColor: `${group.color}15` }]}>
                    <Ionicons name={group.icon as any} size={20} color={group.color} />
                  </View>
                  <View style={styles.vehicleSummaryInfo}>
                    <Text style={[styles.vehicleSummaryType, { color: group.color }]}>
                      {group.vehicleType.charAt(0).toUpperCase() + group.vehicleType.slice(1)}
                    </Text>
                    <Text style={styles.vehicleSummaryCount}>
                      {group.products.length} item{group.products.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Delivery Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
              <Ionicons name="cube-outline" size={24} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>{filteredProducts.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
            </View>
            <Text style={styles.statValue}>
              {filteredProducts.filter(p => p.status === 'accepted').length}
            </Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
              <Ionicons name="time-outline" size={24} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>
              {filteredProducts.filter(p => p.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
              <Ionicons name="layers-outline" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>{vehicleTypeGroups.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333"
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  carouselContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  carousel: {
    height: 180,
  },
  carouselSlide: {
    width: width,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: 180,
    resizeMode: "cover",
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  carouselText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  carouselPagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 12,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginLeft: 16,
    marginBottom: 16,
  },
  actionsScroll: {
    paddingHorizontal: 12,
    paddingRight: 4,
  },
  actionCardWrapper: { 
    alignItems: "center", 
    marginRight: 12,
  },
  actionCard: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { 
    marginTop: 6, 
    color: "#333", 
    fontWeight: "600", 
    textAlign: "center",
    fontSize: 12,
  },
  productsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  // Vehicle Type Row Styles
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
    fontWeight: '700',
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
    marginHorizontal: 4,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    height: 90,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    height: 36,
    lineHeight: 18,
    marginBottom: 6,
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  vehicleTypeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vehicleTypeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  statusAccepted: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  statusDelivered: {
    backgroundColor: 'rgba(88, 86, 214, 0.1)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  // View All Card Styles
  viewAllCard: {
    width: 80,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  viewAllContainer: {
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  viewAllCount: {
    fontSize: 11,
    color: '#999',
  },
  // Vehicle Summary Section
  vehicleSummarySection: {
    marginBottom: 24,
  },
  vehicleSummaryScroll: {
    paddingHorizontal: 12,
  },
  vehicleSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    minWidth: 140,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  vehicleSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleSummaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleSummaryInfo: {
    flex: 1,
  },
  vehicleSummaryType: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  vehicleSummaryCount: {
    fontSize: 12,
    color: '#666',
  },
  // Stats and Error Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    width: width * 0.22, // 22% of screen width
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 2,
    marginBottom: 8,
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
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  // Shops Section Styles
  shopsSection: {
    marginBottom: 24,
  },
  shopsScrollView: {
    flexDirection: 'row',
  },
  shopsContentContainer: {
    paddingHorizontal: 12,
  },
  shopCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 4,
  },
  shopImageContainer: {
    position: 'relative',
    height: 90,
  },
  shopImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  shopImagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  shopBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shopBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
  },
  shopContent: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    height: 18,
    marginBottom: 6,
  },
  shopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  shopLocationText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  shopStatus: {
    alignSelf: 'flex-start',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusOpen: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  statusClosed: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  seeAllShopCard: {
    width: 80,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  seeAllShopContainer: {
    alignItems: 'center',
  },
  seeAllShopText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
    marginBottom: 4,
  },
  seeAllShopCount: {
    fontSize: 11,
    color: '#999',
  },
  emptyShopsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyShopsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyShopsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
