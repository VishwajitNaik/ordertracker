// import React, { useEffect, useState } from "react";
// import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Modal, TextInput, ScrollView, Dimensions } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import { useAuthStore } from "@/store/authStore";
// import COLORS from "@/constants/color";
// import { router } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";

// const { width } = Dimensions.get('window');
// const CARD_WIDTH = 150; // Fixed width for horizontal scrolling
// const CARD_HEIGHT = 180; // Fixed height

// export default function Profile() {
//   const { travel, fetchAllUserSideTravels, products, fetchProducts, user, sendTravelRequest } = useAuthStore();
//   const [requestModalVisible, setRequestModalVisible] = useState(false);
//   const [selectedTravel, setSelectedTravel] = useState<any>(null);
//   const [selectedProduct, setSelectedProduct] = useState("");
//   const [requestPrice, setRequestPrice] = useState("");

//   useEffect(() => {
//     fetchAllUserSideTravels();
//     fetchProducts();
//   }, []);

//   const handleSendRequest = async () => {
//     if (!selectedProduct || !requestPrice) {
//       alert('Please select a product and enter price');
//       return;
//     }
//     await sendTravelRequest(selectedTravel._id, selectedProduct, parseFloat(requestPrice));
//     setRequestModalVisible(false);
//     setSelectedTravel(null);
//     setSelectedProduct("");
//     setRequestPrice("");
//   };

//   const formatDate = (dateString: string) => {
//     if (!dateString) return '';
//     try {
//       const date = new Date(dateString);
//       const day = String(date.getDate()).padStart(2, '0');
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const year = date.getFullYear();
//       return `${day}/${month}/${year}`;
//     } catch (error) {
//       return dateString; // fallback to original if parsing fails
//     }
//   };

//   // Group travels into rows of 10
//   const groupTravels = () => {
//     const rows = [];
//     for (let i = 0; i < travel.length; i += 10) {
//       rows.push(travel.slice(i, i + 10));
//     }
//     return rows;
//   };

//   const renderTravelCard = ({ item }: { item: any }) => {
//     const isOwner = user && item.createdBy && item.createdBy._id === user._id;
//     const hasRequested = user && item.requestedUsers && item.requestedUsers.some((req: any) => req.userId._id === user._id);

//     return (
//       <TouchableOpacity
//         style={styles.card}
//         onPress={() => router.push(`/travelInfo/${item._id}` as any)}
//         activeOpacity={0.8}
//       >
//         {item.vehicleId?.vehicleImages && item.vehicleId.vehicleImages.length > 0 ? (
//           <Image source={{ uri: item.vehicleId.vehicleImages[0] }} style={styles.vehicleImage} />
//         ) : (
//           <View style={styles.noImageContainer}>
//             <Ionicons name="car-outline" size={30} color="#ccc" />
//           </View>
//         )}

//         <View style={styles.cardContent}>
//           <Text style={styles.cardTitle} numberOfLines={1}>
//             {item.veichelType || "Travel"}
//           </Text>
//                     <Text style={styles.cardText} numberOfLines={1}>
//             {formatDate(item.date)}
//           </Text>
//           <Text style={styles.cardText} numberOfLines={1}>
//             From: {item.from}
//           </Text>
//           <Text style={styles.cardText} numberOfLines={1}>
//             To: {item.to}
//           </Text>


//           {hasRequested && (
//             <View style={styles.requestedBadge}>
//               <Text style={styles.requestedBadgeText}>Request Sent</Text>
//             </View>
//           )}

//           {!isOwner && !hasRequested && (
//             <TouchableOpacity
//               style={styles.cardRequestButton}
//               onPress={(e) => {
//                 e.stopPropagation();
//                 setSelectedTravel(item);
//                 setRequestModalVisible(true);
//               }}
//             >
//               <Text style={styles.cardRequestButtonText}>Request</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderRow = ({ item: rowItems, index }: { item: any[], index: number }) => (
//     <View style={styles.rowContainer}>
//       <Text style={styles.rowTitle}>Row {index + 1}</Text>
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         style={styles.rowScrollView}
//         contentContainerStyle={styles.rowContentContainer}
//       >
//         {rowItems.map((travel) => (
//           <View key={travel._id} style={styles.cardWrapper}>
//             {renderTravelCard({ item: travel })}
//           </View>
//         ))}
//       </ScrollView>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.heading}>All User Travels</Text>
//         <Text style={styles.subHeading}>
//           Scroll horizontally to see more →
//         </Text>
//       </View>

//       {travel.length === 0 ? (
//         <View style={styles.emptyState}>
//           <Text style={styles.emptyStateText}>No travels available</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={groupTravels()}
//           keyExtractor={(item, index) => `row-${index}`}
//           renderItem={renderRow}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.listContent}
//           ListHeaderComponent={<View style={{ height: 10 }} />}
//           ListFooterComponent={<View style={{ height: 100 }} />}
//         />
//       )}

//       {/* Request Modal */}
//       <Modal visible={requestModalVisible} animationType="slide" transparent>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <Text style={styles.modalTitle}>Send Request</Text>
//             <Text style={styles.modalSubtitle}>Travel: {selectedTravel?.veichelType}</Text>

//             <Text style={styles.label}>Select Product:</Text>
//             <View style={styles.pickerContainer}>
//               <Picker
//                 selectedValue={selectedProduct}
//                 onValueChange={setSelectedProduct}
//                 style={styles.picker}
//               >
//                 <Picker.Item label="Select a product..." value="" />
//                 {products
//                   .filter(product => product.createdBy?._id === user?._id)
//                   .map((product) => (
//                     <Picker.Item
//                       key={product._id}
//                       label={`${product.Title} - ₹${product.price || 'N/A'}`}
//                       value={product._id}
//                     />
//                   ))
//                 }
//               </Picker>
//             </View>

//             <TextInput
//               style={styles.input}
//               placeholder="Enter your bid price"
//               value={requestPrice}
//               onChangeText={setRequestPrice}
//               keyboardType="numeric"
//             />

//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={styles.cancelButton}
//                 onPress={() => {
//                   setRequestModalVisible(false);
//                   setSelectedTravel(null);
//                   setSelectedProduct("");
//                   setRequestPrice("");
//                 }}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.sendButton} onPress={handleSendRequest}>
//                 <Text style={styles.sendButtonText}>Send Request</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//   },
//   header: {
//     paddingHorizontal: 16,
//     paddingTop: 20,
//     paddingBottom: 10,
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   heading: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   subHeading: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 4,
//   },
//   listContent: {
//     paddingBottom: 20,
//   },
//   rowContainer: {
//     marginBottom: 20,
//     borderRadius: 12,
//   },
//   rowTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginLeft: 12,
//     marginBottom: 12,
//   },
//   rowScrollView: {
//     flexDirection: 'row',
//   },
//   rowContentContainer: {
//     paddingHorizontal: 8,
//   },
//   cardWrapper: {
//     marginHorizontal: 1.5, // 3px gap total (1.5 + 1.5)
//   },
//   card: {
//     width: CARD_WIDTH,
//     height: CARD_HEIGHT,
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#e8e8e8",
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   vehicleImage: {
//     width: '100%',
//     height: 90,
//     backgroundColor: '#f8f8f8',
//     resizeMode: 'cover',
//   },
//   noImageContainer: {
//     width: '100%',
//     height: 90,
//     backgroundColor: '#f8f8f8',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cardContent: {
//     padding: 8,
//     flex: 1,
//     justifyContent: 'space-between',
//   },
//   cardTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#333',
//     height: 40, // Increased height for larger text
//     lineHeight: 18,
//     marginBottom: 4,
//   },
//   cardText: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 2,
//     lineHeight: 14,
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   emptyStateText: {
//     fontSize: 16,
//     color: '#666',
//   },
//   cardRequestButton: {
//     backgroundColor: COLORS.primary,
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 4,
//     alignItems: 'center',
//     marginTop: 4,
//   },
//   cardRequestButtonText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   requestedBadge: {
//     backgroundColor: '#e8f5e8',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 4,
//     alignSelf: 'flex-start',
//     marginTop: 4,
//   },
//   requestedBadgeText: {
//     color: '#4CAF50',
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   requestButton: {
//     backgroundColor: COLORS.primary,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//     marginTop: 10,
//     alignItems: 'center',
//   },
//   requestButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   requestedCard: {
//     backgroundColor: '#e8f5e8',
//     borderColor: '#4CAF50',
//     borderWidth: 1,
//   },
//   requestedText: {
//     color: '#4CAF50',
//     fontSize: 14,
//     fontWeight: '600',
//     textAlign: 'center',
//     marginTop: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 20,
//     width: '90%',
//     maxWidth: 400,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 10,
//     color: COLORS.primary,
//   },
//   modalSubtitle: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//     color: '#666',
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 8,
//     color: '#333',
//   },
//   pickerContainer: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 8,
//     marginBottom: 15,
//     backgroundColor: '#f9f9f9',
//   },
//   picker: {
//     height: 50,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     marginBottom: 15,
//     backgroundColor: '#f9f9f9',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   cancelButton: {
//     backgroundColor: '#f0f0f0',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     flex: 1,
//     marginRight: 10,
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#666',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   sendButton: {
//     backgroundColor: COLORS.primary,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     flex: 1,
//     marginLeft: 10,
//     alignItems: 'center',
//   },
//   sendButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Modal, TextInput, ScrollView, Dimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.45; // 45% of screen width for better responsiveness
const CARD_HEIGHT = 220; // Increased height for better content display

export default function Profile() {
  const { travel, fetchAllUserSideTravels, products, fetchProducts, user, sendTravelRequest } = useAuthStore();
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [requestPrice, setRequestPrice] = useState("");

  useEffect(() => {
    fetchAllUserSideTravels();
    fetchProducts();
  }, []);

  const handleSendRequest = async () => {
    if (!selectedProduct || !requestPrice) {
      alert('Please select a product and enter price');
      return;
    }
    await sendTravelRequest(selectedTravel._id, selectedProduct, parseFloat(requestPrice));
    setRequestModalVisible(false);
    setSelectedTravel(null);
    setSelectedProduct("");
    setRequestPrice("");
  };

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

  // Group travels into rows of 2 for better mobile layout
  const groupTravels = () => {
    const rows = [];
    for (let i = 0; i < travel.length; i += 2) {
      rows.push(travel.slice(i, i + 2));
    }
    return rows;
  };

  const renderTravelCard = ({ item }: { item: any }) => {
    const isOwner = user && item.createdBy && item.createdBy._id === user._id;
    const hasRequested = user && item.requestedUsers && item.requestedUsers.some((req: any) => req.userId._id === user._id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          hasRequested && styles.requestedCard,
          isOwner && styles.ownerCard
        ]}
        onPress={() => router.push(`/travelInfo/${item._id}` as any)}
        activeOpacity={0.9}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {item.vehicleId?.vehicleImages && item.vehicleId.vehicleImages.length > 0 ? (
            <Image 
              source={{ uri: item.vehicleId.vehicleImages[0] }} 
              style={styles.vehicleImage} 
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="car-outline" size={40} color="#8E8E93" />
            </View>
          )}
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{item.veichelType || "Travel"}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.cardContent}>
          <View style={styles.routeContainer}>
            <View style={styles.routeDot} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.from}
            </Text>
          </View>
          
          <View style={styles.routeDivider}>
            <Ionicons name="arrow-down" size={12} color="#8E8E93" />
          </View>
          
          <View style={styles.routeContainer}>
            <View style={[styles.routeDot, styles.routeDotDest]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.to}
            </Text>
          </View>

          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>

          {/* Status/Button Section */}
          {hasRequested ? (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.statusText}>Request Sent</Text>
            </View>
          ) : isOwner ? (
            <View style={styles.statusContainer}>
              <Ionicons name="person" size={16} color="#FF9800" />
              <Text style={styles.ownerText}>Your Travel</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cardRequestButton}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedTravel(item);
                setRequestModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cardRequestButtonText}>Send Request</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRow = ({ item: rowItems, index }: { item: any[], index: number }) => (
    <View style={styles.rowContainer}>
      <View style={styles.rowHeader}>
        <View style={styles.rowIndicator}>
          <Text style={styles.rowIndicatorText}>{index + 1}</Text>
        </View>
        <Text style={styles.rowTitle}>Available Travels</Text>
      </View>
      <View style={styles.rowContent}>
        {rowItems.map((travel) => (
          <View key={travel._id} style={styles.cardWrapper}>
            {renderTravelCard({ item: travel })}
          </View>
        ))}
        {/* Add empty space if row has only one item */}
        {rowItems.length === 1 && <View style={styles.emptyCard} />}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.heading}>Available Travels</Text>
          <Text style={styles.subHeading}>
            Send delivery requests for your products
          </Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{travel.length}</Text>
            <Text style={styles.statLabel}>Travels</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {products.filter(p => p.createdBy?._id === user?._id).length}
            </Text>
            <Text style={styles.statLabel}>Your Products</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {travel.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={80} color="#E0E0E0" />
          <Text style={styles.emptyStateTitle}>No travels available</Text>
          <Text style={styles.emptyStateText}>
            Check back later for new travel opportunities
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupTravels()}
          keyExtractor={(item, index) => `row-${index}`}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<View style={{ height: 16 }} />}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      {/* Request Modal */}
      <Modal 
        visible={requestModalVisible} 
        animationType="slide" 
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Delivery Request</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setRequestModalVisible(false);
                  setSelectedTravel(null);
                  setSelectedProduct("");
                  setRequestPrice("");
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Travel Info */}
            <View style={styles.travelInfoCard}>
              <View style={styles.travelInfoHeader}>
                <Ionicons name="car-sport" size={20} color={COLORS.primary} />
                <Text style={styles.travelInfoTitle}>
                  {selectedTravel?.veichelType || "Travel Service"}
                </Text>
              </View>
              <View style={styles.travelInfoRow}>
                <View style={styles.travelInfoItem}>
                  <Ionicons name="navigate" size={14} color="#666" />
                  <Text style={styles.travelInfoText}>
                    {selectedTravel?.from} → {selectedTravel?.to}
                  </Text>
                </View>
                <View style={styles.travelInfoItem}>
                  <Ionicons name="calendar" size={14} color="#666" />
                  <Text style={styles.travelInfoText}>
                    {formatDate(selectedTravel?.date)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Product Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Product to Deliver</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedProduct}
                  onValueChange={setSelectedProduct}
                  style={styles.picker}
                  dropdownIconColor={COLORS.primary}
                >
                  <Picker.Item 
                    label="Choose a product..." 
                    value="" 
                    color="#999"
                  />
                  {products
                    .filter(product => product.createdBy?._id === user?._id)
                    .map((product) => (
                      <Picker.Item
                        key={product._id}
                        label={`${product.Title} - ₹${product.price || '0'}`}
                        value={product._id}
                      />
                    ))
                  }
                </Picker>
              </View>
            </View>

            {/* Price Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Offer Price (₹)</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.pricePrefix}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Enter amount"
                  value={requestPrice}
                  onChangeText={setRequestPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setRequestModalVisible(false);
                  setSelectedTravel(null);
                  setSelectedProduct("");
                  setRequestPrice("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  (!selectedProduct || !requestPrice) && styles.sendButtonDisabled
                ]} 
                onPress={handleSendRequest}
                disabled={!selectedProduct || !requestPrice}
              >
                <Text style={styles.sendButtonText}>Send Request</Text>
                <Ionicons name="paper-plane" size={18} color="#fff" />
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  headerContent: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    lineHeight: 20,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  rowContainer: {
    marginBottom: 24,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  rowIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  emptyCard: {
    width: CARD_WIDTH,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  requestedCard: {
    borderColor: '#4CAF50',
    borderWidth: 1.5,
  },
  ownerCard: {
    borderColor: '#FF9800',
    borderWidth: 1.5,
  },
  imageContainer: {
    position: 'relative',
    height: 100,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadge: {
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
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  routeDotDest: {
    backgroundColor: '#FF6B6B',
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  routeDivider: {
    alignItems: 'center',
    marginVertical: 4,
    marginLeft: 3,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  ownerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    marginLeft: 4,
  },
  cardRequestButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
  },
  cardRequestButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  travelInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  travelInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  travelInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  travelInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  travelInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  travelInfoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FCFCFC',
  },
  picker: {
    height: 56,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 16,
  },
  pricePrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  sendButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});