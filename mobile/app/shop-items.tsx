// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   Dimensions,
//   ScrollView,
//   RefreshControl,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import COLORS from "@/constants/color";

// const { width } = Dimensions.get("window");
// const CARD_WIDTH = (width - 48) / 2; // 2 cards per row with padding
// const CARD_HEIGHT = 280;

// interface Item {
//   _id: string;
//   name: string;
//   description: string;
//   quantity: number;
//   MinPrice: number;
//   MaxPrice: number;
//   category: string;
//   images: string[];
//   brand: string;
//   model: string;
//   createdBy?: {
//     _id: string;
//     username: string;
//   };
// }

// export default function ShopItems() {
//   const router = useRouter();
//   const [items, setItems] = useState<Item[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchItems = async () => {
//     try {
//       setError(null);
//       const response = await fetch("http://localhost:3000/api/items/getAllUserSide");

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();

//       // Ensure data is an array
//       if (Array.isArray(data)) {
//         setItems(data);
//       } else if (data && Array.isArray(data.items)) {
//         setItems(data.items);
//       } else {
//         console.warn("API response is not an array:", data);
//         setItems([]);
//       }
//     } catch (error: any) {
//       console.error("Error fetching items:", error.message);
//       setError("Failed to load items. Please try again.");
//       setItems([]);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchItems();
//   }, []);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchItems();
//   };

//   const renderItemCard = ({ item }: { item: Item }) => (
//     <TouchableOpacity
//       key={item._id}
//       style={styles.itemCard}
//       onPress={() => router.push(`/items/${item._id}` as any)}
//       activeOpacity={0.9}
//     >
//       <View style={styles.imageContainer}>
//         <Image
//           source={{
//             uri: item.images && item.images.length > 0 && item.images[0]
//               ? item.images[0]
//               : undefined
//           }}
//           style={styles.itemImage}
//           onError={(e) => {
//             console.log("Item image failed to load:", item.images?.[0]);
//           }}
//         />
//         {(!item.images || item.images.length === 0 || !item.images[0]) && (
//           <View style={styles.itemImagePlaceholder}>
//             <Ionicons name="cube-outline" size={40} color="#ccc" />
//           </View>
//         )}
//         <View style={styles.categoryBadge}>
//           <Text style={styles.categoryText}>{item.category}</Text>
//         </View>
//         <View style={styles.quantityBadge}>
//           <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
//         </View>
//       </View>

//         <View style={styles.itemContent}>
//           <Text style={styles.itemName} numberOfLines={2}>
//             {item.name}
//           </Text>

//           <Text style={styles.itemBrand}>
//             {item.brand} - {item.model}
//           </Text>

//         <Text style={styles.itemDescription} numberOfLines={2}>
//           {item.description}
//         </Text>

//         <View style={styles.priceContainer}>
//           <View style={styles.priceRange}>
//             <Text style={styles.priceLabel}>Price Range:</Text>
//             <Text style={styles.priceText}>
//               ₹{item.MinPrice} - ₹{item.MaxPrice}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.itemFooter}>
//           <View style={styles.creatorInfo}>
//             <Ionicons name="person-outline" size={12} color="#666" />
//             <Text style={styles.creatorText}>
//               {item.createdBy?.username || 'Unknown'}
//             </Text>
//           </View>
//           <TouchableOpacity
//             style={styles.viewButton}
//             onPress={() => router.push(`/items/${item._id}` as any)}
//           >
//             <Text style={styles.viewButtonText}>View</Text>
//             <Ionicons name="arrow-forward" size={12} color="#007AFF" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <View style={styles.headerContent}>
//         <Text style={styles.headerTitle}>Shop Items</Text>
//         <Text style={styles.headerSubtitle}>Browse and purchase items</Text>
//       </View>
//       <TouchableOpacity
//         style={styles.backButton}
//         onPress={() => router.back()}
//       >
//         <Ionicons name="arrow-back" size={24} color="#333" />
//       </TouchableOpacity>
//     </View>
//   );

//   const renderStats = () => (
//     <View style={styles.statsContainer}>
//       <View style={styles.statCard}>
//         <View style={[styles.statIcon, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
//           <Ionicons name="cube-outline" size={24} color="#007AFF" />
//         </View>
//         <Text style={styles.statValue}>{items.length}</Text>
//         <Text style={styles.statLabel}>Total Items</Text>
//       </View>
//       <View style={styles.statCard}>
//         <View style={[styles.statIcon, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
//           <Ionicons name="layers-outline" size={24} color="#34C759" />
//         </View>
//         <Text style={styles.statValue}>
//           {Array.from(new Set(items.map(item => item.category))).length}
//         </Text>
//         <Text style={styles.statLabel}>Categories</Text>
//       </View>
//       <View style={styles.statCard}>
//         <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
//           <Ionicons name="business-outline" size={24} color="#FF9500" />
//         </View>
//         <Text style={styles.statValue}>
//           {Array.from(new Set(items.map(item => item.brand))).length}
//         </Text>
//         <Text style={styles.statLabel}>Brands</Text>
//       </View>
//     </View>
//   );

//   if (error) {
//     return (
//       <View style={styles.container}>
//         {renderHeader()}
//         <View style={styles.errorContainer}>
//           <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
//           <Text style={styles.errorTitle}>Error Loading Items</Text>
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity
//             style={styles.retryButton}
//             onPress={fetchItems}
//           >
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {renderHeader()}

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={["#007AFF"]}
//             tintColor="#007AFF"
//           />
//         }
//       >
//         {renderStats()}

//         <View style={styles.itemsSection}>
//           <Text style={styles.sectionTitle}>All Items</Text>

//           {loading ? (
//             <View style={styles.loadingContainer}>
//               <Ionicons name="cube-outline" size={60} color="#E0E0E0" />
//               <Text style={styles.loadingText}>Loading items...</Text>
//             </View>
//           ) : items.length === 0 ? (
//             <View style={styles.emptyContainer}>
//               <Ionicons name="cube-outline" size={80} color="#E0E0E0" />
//               <Text style={styles.emptyTitle}>No Items Available</Text>
//               <Text style={styles.emptyText}>
//                 Items will be displayed here once added by sellers
//               </Text>
//             </View>
//           ) : (
//             <FlatList
//               data={items}
//               keyExtractor={(item) => item._id}
//               renderItem={renderItemCard}
//               numColumns={2}
//               columnWrapperStyle={styles.row}
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={styles.itemsGrid}
//               ListFooterComponent={<View style={{ height: 20 }} />}
//             />
//           )}
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: 50,
//     paddingBottom: 16,
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   headerContent: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#333"
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 4,
//   },
//   backButton: {
//     padding: 8,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     justifyContent: 'space-between',
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginHorizontal: 4,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   statIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   statValue: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 11,
//     color: '#666',
//     textAlign: 'center',
//   },
//   itemsSection: {
//     paddingHorizontal: 16,
//     paddingBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#1A1A1A",
//     marginBottom: 16,
//   },
//   row: {
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   itemsGrid: {
//     paddingBottom: 20,
//   },
//   itemCard: {
//     width: CARD_WIDTH,
//     height: CARD_HEIGHT,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#e8e8e8',
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//     marginBottom: 8,
//   },
//   imageContainer: {
//     position: 'relative',
//     height: 140,
//   },
//   itemImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   itemImagePlaceholder: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f8f8',
//   },
//   categoryBadge: {
//     position: 'absolute',
//     top: 8,
//     left: 8,
//     backgroundColor: 'rgba(0, 122, 255, 0.9)',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   categoryText: {
//     fontSize: 10,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   quantityBadge: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     backgroundColor: 'rgba(52, 199, 89, 0.9)',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   quantityText: {
//     fontSize: 10,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   itemContent: {
//     padding: 12,
//     flex: 1,
//   },
//   itemName: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     marginBottom: 4,
//     height: 40,
//   },
//   itemBrand: {
//     fontSize: 12,
//     color: '#007AFF',
//     fontWeight: '600',
//     marginBottom: 6,
//   },
//   itemDescription: {
//     fontSize: 12,
//     color: '#666',
//     lineHeight: 16,
//     marginBottom: 8,
//     height: 32,
//   },
//   priceContainer: {
//     marginBottom: 8,
//   },
//   priceRange: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   priceLabel: {
//     fontSize: 11,
//     color: '#666',
//     fontWeight: '500',
//   },
//   priceText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#007AFF',
//   },
//   itemFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 'auto',
//   },
//   creatorInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   creatorText: {
//     fontSize: 11,
//     color: '#666',
//     marginLeft: 4,
//   },
//   viewButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     borderRadius: 8,
//   },
//   viewButtonText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginRight: 4,
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 60,
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#666',
//   },
//   errorContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 40,
//   },
//   errorTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#FF3B30',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: '#FF3B30',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 60,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#666',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyText: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
// });


import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/color";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 180; // Increased width for better content
const CARD_HEIGHT = 300; // Increased height for more content

interface Item {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  MinPrice: number;
  MaxPrice: number;
  category: string;
  images: string[];
  brand: string;
  model: string;
  createdBy?: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  shop_id?: {
    _id: string;
    name: string;
    location: string;
  };
}

// Get appropriate icon for category
const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('machine') || cat.includes('tool')) return 'construct-outline';
  if (cat.includes('electron')) return 'hardware-chip-outline';
  if (cat.includes('cloth') || cat.includes('fashion')) return 'shirt-outline';
  if (cat.includes('book') || cat.includes('station')) return 'book-outline';
  if (cat.includes('food') || cat.includes('grocery')) return 'fast-food-outline';
  if (cat.includes('sport') || cat.includes('fitness')) return 'fitness-outline';
  if (cat.includes('home') || cat.includes('furniture')) return 'home-outline';
  if (cat.includes('beauty') || cat.includes('cosmetic')) return 'flower-outline';
  if (cat.includes('toy') || cat.includes('game')) return 'game-controller-outline';
  if (cat.includes('car') || cat.includes('auto')) return 'car-outline';
  if (cat.includes('phone') || cat.includes('mobile')) return 'phone-portrait-outline';
  if (cat.includes('computer') || cat.includes('laptop')) return 'laptop-outline';
  return 'cube-outline';
};

// Get color for category
const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('machine') || cat.includes('tool')) return '#FF9500';
  if (cat.includes('electron')) return '#34C759';
  if (cat.includes('cloth') || cat.includes('fashion')) return '#FF2D55';
  if (cat.includes('book') || cat.includes('station')) return '#AF52DE';
  if (cat.includes('food') || cat.includes('grocery')) return '#FF3B30';
  if (cat.includes('sport') || cat.includes('fitness')) return '#007AFF';
  if (cat.includes('home') || cat.includes('furniture')) return '#5856D6';
  if (cat.includes('beauty') || cat.includes('cosmetic')) return '#FF9500';
  if (cat.includes('toy') || cat.includes('game')) return '#FFCC00';
  if (cat.includes('car') || cat.includes('auto')) return '#1C1C1E';
  if (cat.includes('phone') || cat.includes('mobile')) return '#32D74B';
  if (cat.includes('computer') || cat.includes('laptop')) return '#0A84FF';
  return '#8E8E93';
};

export default function ShopItems() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setError(null);
      const response = await fetch("http://localhost:3000/api/items/getAllUserSide");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray(data.items)) {
        setItems(data.items);
      } else if (data && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        console.warn("API response is not an array:", data);
        setItems([]);
      }
    } catch (error: any) {
      console.error("Error fetching items:", error.message);
      setError("Failed to load items. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  // Group items by category
  const groupItemsByCategory = () => {
    const grouped: { [key: string]: Item[] } = {};
    
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    
    // Convert to array format and sort alphabetically
    return Object.entries(grouped)
      .map(([category, items]) => ({
        category,
        items,
        icon: getCategoryIcon(category),
        color: getCategoryColor(category)
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  };

  const categoryGroups = groupItemsByCategory();

  const renderItemCard = (item: Item) => (
    <TouchableOpacity
      key={item._id}
      style={styles.itemCard}
      onPress={() => router.push(`/items/${item._id}` as any)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {item.images && item.images.length > 0 && item.images[0] ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.itemImage}
          />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="cube-outline" size={40} color="#ccc" />
          </View>
        )}
        
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        
        <View style={styles.quantityBadge}>
          <Ionicons name="layers-outline" size={12} color="#fff" />
          <Text style={styles.quantityText}>{item.quantity}</Text>
        </View>
      </View>

      <View style={styles.itemContent}>
        {/* Item Name and Brand/Model in same row */}
        <View style={styles.headerRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name || 'Unnamed Item'}
          </Text>
          {(item.brand || item.model) && (
            <View style={styles.brandModelContainer}>
              <Ionicons name="pricetag-outline" size={10} color="#666" />
              <Text style={styles.itemBrand} numberOfLines={1}>
                {item.brand} {item.model ? `- ${item.model}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Price Range */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price Range</Text>
          <View style={styles.priceRange}>
            <Text style={styles.minPrice}>₹{item.MinPrice || 0}</Text>
            <Ionicons name="remove-outline" size={12} color="#666" />
            <Text style={styles.maxPrice}>₹{item.MaxPrice || 0}</Text>
          </View>
        </View>

        {/* Shop Info */}
        {item.shop_id && (
          <View style={styles.shopInfo}>
            <View style={styles.shopAvatar}>
              <Ionicons name="storefront-outline" size={12} color="#007AFF" />
            </View>
            <View style={styles.shopDetails}>
              <Text style={styles.shopName} numberOfLines={1}>
                {item.shop_id.name || 'Unknown Shop'}
              </Text>
              {item.shop_id.location && (
              <Text style={styles.shopLocation} numberOfLines={1}>
                {String(item.shop_id.location)}
              </Text>
              )}
            </View>
          </View>
        )}

        {/* Footer with Creator and View Button */}
        <View style={styles.footerRow}>
          <View style={styles.creatorInfo}>
            <View style={styles.creatorAvatar}>
              <Ionicons name="person-outline" size={12} color="#666" />
            </View>
            <Text style={styles.creatorText} numberOfLines={1}>
              {item.createdBy?.username || 'Unknown Seller'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/items/${item._id}` as any);
            }}
          >
            <Text style={styles.viewButtonText}>View</Text>
            <Ionicons name="arrow-forward" size={12} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryRow = (group: { 
    category: string; 
    items: Item[]; 
    icon: string; 
    color: string 
  }) => (
    <View key={group.category} style={styles.categoryRowContainer}>
      {/* Category Header */}
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIconContainer, { backgroundColor: `${group.color}15` }]}>
          <Ionicons name={group.icon as any} size={20} color={group.color} />
        </View>
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryRowTitle}>
            {group.category}
          </Text>
          <Text style={styles.categoryRowCount}>
            {group.items.length} item{group.items.length !== 1 ? 's' : ''} available
          </Text>
        </View>
        {group.items.length > 5 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push(`/category/${group.category}` as any)}
          >
            <Text style={[styles.viewAllButtonText, { color: group.color }]}>
              View All
            </Text>
            <Ionicons name="chevron-forward" size={16} color={group.color} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Items Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.itemsScrollView}
        contentContainerStyle={styles.itemsScrollContent}
      >
        {group.items.slice(0, 10).map((item) => (
          <View key={item._id} style={styles.cardWrapper}>
            {renderItemCard(item)}
          </View>
        ))}
        
        {/* Show "View All" card if more than 10 items */}
        {group.items.length > 10 && (
          <TouchableOpacity 
            style={styles.viewAllCard}
            onPress={() => router.push(`/category/${group.category}` as any)}
          >
            <View style={styles.viewAllCardContent}>
              <Ionicons name="grid-outline" size={32} color={group.color} />
              <Text style={[styles.viewAllCardText, { color: group.color }]}>
                View All
              </Text>
              <Text style={styles.viewAllCardCount}>
                +{group.items.length - 10} more
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Shop Items</Text>
        <Text style={styles.headerSubtitle}>Browse by category</Text>
      </View>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => router.push("/search" as any)}
      >
        <Ionicons name="search-outline" size={22} color="#333" />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsScroll}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
            <Ionicons name="cube-outline" size={22} color="#007AFF" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
            <Ionicons name="layers-outline" size={22} color="#34C759" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{categoryGroups.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
            <Ionicons name="business-outline" size={22} color="#FF9500" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>
              {Array.from(new Set(items.map(item => item.brand).filter(Boolean))).length}
            </Text>
            <Text style={styles.statLabel}>Brands</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (error && !loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#FF3B30" />
          <Text style={styles.errorTitle}>Error Loading Items</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchItems}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderStats()}

        {/* Category Filter Bar */}
        {categoryGroups.length > 0 && (
          <View style={styles.categoryFilterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilterScroll}
            >
              {categoryGroups.map((group) => (
                <TouchableOpacity 
                  key={group.category}
                  style={[styles.categoryFilterItem, { borderColor: group.color }]}
                  onPress={() => router.push(`/category/${group.category}` as any)}
                >
                  <Ionicons name={group.icon as any} size={16} color={group.color} />
                  <Text style={[styles.categoryFilterText, { color: group.color }]}>
                    {group.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Items by Category */}
        <View style={styles.itemsSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading items...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={80} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No Items Available</Text>
              <Text style={styles.emptyText}>
                Items will be displayed here once added by sellers
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push("/add-item" as any)}
              >
                <Text style={styles.emptyButtonText}>Add Your First Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {categoryGroups.map(renderCategoryRow)}
            </>
          )}
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  searchButton: {
    padding: 8,
  },
  statsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statsScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  categoryFilterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryFilterScroll: {
    paddingHorizontal: 12,
  },
  categoryFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1.5,
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  itemsSection: {
    paddingTop: 20,
  },
  categoryRowContainer: {
    marginBottom: 28,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryRowTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  categoryRowCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  itemsScrollView: {
    flexDirection: 'row',
  },
  itemsScrollContent: {
    paddingHorizontal: 12,
  },
  cardWrapper: {
    marginHorizontal: 6,
  },
  itemCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fefbfb',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemImagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007AFF',
  },
  quantityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 4,
  },
  itemContent: {
    padding: 12,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 2,
    lineHeight: 18,
  },
  brandModelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemBrand: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
    flex: 1,
  },
  itemDescription: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
    height: 32,
  },
  priceContainer: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  minPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF3B30',
  },
  maxPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34C759',
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    padding: 6,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  shopAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  shopLocation: {
    fontSize: 9,
    color: '#666',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  creatorAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  bottomPadding: {
    height: 20,
  },
});
