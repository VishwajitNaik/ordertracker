// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   Image,
//   Dimensions,
//   ScrollView,
//   Animated,
//   TextInput,
// } from "react-native";
// import { useAuthStore } from "@/store/authStore";
// import { Ionicons } from "@expo/vector-icons";
// import COLORS from "@/constants/color";
// import { router } from "expo-router";
// import { launchImageLibrary } from 'react-native-image-picker';
// import { Platform } from 'react-native';
// import { Picker } from "@react-native-picker/picker";

// const { width } = Dimensions.get('window');
// const CARD_WIDTH = 150; // Fixed width for horizontal scrolling
// const CARD_HEIGHT = 180; // Fixed height

// export default function UserProducts() {
//   const { products, fetchProducts, addProduct, acceptProduct, user, fetchVehicles, vehicles, token } = useAuthStore();

//   const [modalVisible, setModalVisible] = useState(false);
//   const [title, setTitle] = useState("");
//   const [from, setFrom] = useState("");
//   const [to, setTo] = useState("");
//   const [description, setDescription] = useState("");
//   const [weight, setWeight] = useState("");
//   const [image, setImage] = useState<any>(null);
//   const [veichelType, setVeichelType] = useState("");
//   const [video, setVideo] = useState<any>(null);
//   const [acceptModalVisible, setAcceptModalVisible] = useState(false);
//   const [tentativeTime, setTentativeTime] = useState("");
//   const [acceptVehicleType, setAcceptVehicleType] = useState("");
//   const [selectedVehicleId, setSelectedVehicleId] = useState("");
//   const [acceptingProductId, setAcceptingProductId] = useState<string | null>(null);
//   const [productPrice, setProductPrice] = useState("");
//   const [userAddresses, setUserAddresses] = useState<any[]>([]);
//   const scrollX = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     fetchProducts();
//     fetchVehicles();
//     fetchUserAddresses();
//   }, []);

//   const fetchUserAddresses = async () => {
//     try {
//       console.log("🔍 fetchUserAddresses called");
//       if (!user) {
//         console.log("❌ No user found, returning early");
//         return;
//       }
//       console.log("👤 Fetching addresses for user:", user._id);
//       console.log("🔑 Using token:", token ? "present" : "missing");
//       const res = await fetch(`http://localhost:3000/api/userDetails/addresses/${user._id}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       console.log("📡 API response status:", res.status);
//       if (res.ok) {
//         const data = await res.json();
//         console.log("✅ Address data received:", data);
//         console.log("📊 Number of addresses:", data.length);
//         setUserAddresses(data);
//       } else {
//         console.log("❌ API response not ok:", res.status, res.statusText);
//       }
//     } catch (error) {
//       console.error("❌ Error fetching user addresses:", error);
//     }
//   };

//   const pickImage = () => {
//     if (Platform.OS === 'web') {
//       const input = document.createElement('input');
//       input.type = 'file';
//       input.accept = 'image/*';
//       input.onchange = (e: any) => {
//         const file = e.target.files[0];
//         if (file) {
//           setImage({
//             uri: URL.createObjectURL(file),
//             type: file.type,
//             fileName: file.name,
//           });
//         }
//       };
//       input.click();
//     } else {
//       launchImageLibrary({
//         mediaType: 'photo',
//         quality: 0.8,
//       }, (response) => {
//         if (!response.didCancel && response.assets && response.assets[0]) {
//           setImage(response.assets[0]);
//         }
//       });
//     }
//   };

//   const pickVideo = () => {
//     if (Platform.OS === 'web') {
//       const input = document.createElement('input');
//       input.type = 'file';
//       input.accept = 'video/*';
//       input.onchange = (e: any) => {
//         const file = e.target.files[0];
//         if (file) {
//           setVideo({
//             uri: URL.createObjectURL(file),
//             type: file.type,
//             fileName: file.name,
//           });
//         }
//       };
//       input.click();
//     } else {
//       launchImageLibrary({
//         mediaType: 'video',
//         quality: 0.8,
//       }, (response) => {
//         if (!response.didCancel && response.assets && response.assets[0]) {
//           setVideo(response.assets[0]);
//         }
//       });
//     }
//   };

//   const handleAddProduct = () => {
//     if (!image) {
//       alert('Please select an image');
//       return;
//     }
//     if (!from || !to || !description || !productPrice) {
//       alert('Please fill all required fields');
//       return;
//     }
//     addProduct({ Title: title, from, to, description, price: parseFloat(productPrice), weight, image, veichelType, video });
//     setModalVisible(false);
//     setTitle(""); setFrom(""); setTo(""); setDescription(""); setProductPrice(""); setWeight(""); setImage(null); setVeichelType(""); setVideo(null);
//   };

//   const handleSubmitAccept = async () => {
//     if (!acceptingProductId) return;

//     await acceptProduct(acceptingProductId, {
//       tentativeDeliveryTime: tentativeTime,
//       acceptedVehicleType: acceptVehicleType,
//       price: parseFloat(productPrice) || 0,
//     });

//     setAcceptModalVisible(false);
//     setTentativeTime("");
//     setProductPrice("");
//     setAcceptVehicleType("");
//     setSelectedVehicleId("");
//     setAcceptingProductId(null);
//   };

//   // Filter products to show only user's products
//   const userProducts = products.filter(product => product.createdBy?._id === user?._id);

//   // Group user products into rows of 10
//   const groupProducts = () => {
//     const rows = [];
//     for (let i = 0; i < userProducts.length; i += 10) {
//       rows.push(userProducts.slice(i, i + 10));
//     }
//     return rows;
//   };

//   const renderProductCard = ({ item }: { item: any }) => {
//     console.log("🎴 Rendering user product card:", item._id, {
//       title: item.Title,
//       from: item.from,
//       to: item.to,
//       image: item.image ? "present" : "missing"
//     });

//     return (
//       <TouchableOpacity
//         style={styles.card}
//         onPress={() => router.push(`/proInfo/${item._id}` as any)}
//         activeOpacity={0.8}
//       >
//         {item.image ? (
//           <Image source={{ uri: item.image }} style={styles.productImage} />
//         ) : (
//           <View style={styles.noImageContainer}>
//             <Ionicons name="cube-outline" size={30} color="#ccc" />
//           </View>
//         )}

//         <View style={styles.cardContent}>
//           <Text style={styles.cardTitle} numberOfLines={2}>
//             {item.Title || "No Title"}
//           </Text>

//           <View style={styles.priceContainer}>
//             <Text style={styles.priceText}>
//               {item.price ? `₹${item.price}` : "N/A"}
//             </Text>
//           </View>

//           <View style={styles.locationRow}>
//             <Ionicons name="location-outline" size={10} color="#666" />
//             <Text style={styles.locationText} numberOfLines={1}>
//               From: {item.fromAddress ? `${item.fromAddress.address}, ${item.fromAddress.city}, ${item.fromAddress.state} ${item.fromAddress.zipCode}` : item.from}
//             </Text>
//           </View>

//           <View style={styles.locationRow}>
//             <Ionicons name="location-outline" size={10} color="#666" />
//             <Text style={styles.locationText} numberOfLines={1}>
//               To: {item.toAddress ? `${item.toAddress.address}, ${item.toAddress.city}, ${item.toAddress.state} ${item.toAddress.zipCode}` : item.to}
//             </Text>
//           </View>

//           <View style={styles.actionContainer}>
//             <View style={styles.ownerBadge}>
//               <Text style={styles.ownerBadgeText}>My Product</Text>
//             </View>
//           </View>
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
//         {rowItems.map((product) => (
//           <View key={product._id} style={styles.cardWrapper}>
//             {renderProductCard({ item: product })}
//           </View>
//         ))}
//       </ScrollView>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.heading}>Your Products</Text>
//         <Text style={styles.subHeading}>
//           Manage your delivery requests
//         </Text>
//       </View>

//       {userProducts.length === 0 ? (
//         <View style={styles.emptyState}>
//           <Ionicons name="cube-outline" size={80} color="#ccc" />
//           <Text style={styles.emptyStateText}>No products yet</Text>
//           <Text style={styles.emptyStateSubText}>
//             Tap the + button to add your first product
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={groupProducts()}
//           keyExtractor={(item, index) => `row-${index}`}
//           renderItem={renderRow}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.listContent}
//           ListHeaderComponent={<View style={{ height: 10 }} />}
//           ListFooterComponent={<View style={{ height: 100 }} />}
//         />
//       )}

//       <TouchableOpacity
//         style={styles.fab}
//         onPress={() => setModalVisible(true)}
//         activeOpacity={0.9}
//       >
//         <Ionicons name="add" size={28} color="#fff" />
//       </TouchableOpacity>

//       {/* Add Product Modal */}
//       <Modal visible={modalVisible} animationType="slide">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalHeading}>Add New Product</Text>
//               <TouchableOpacity onPress={() => setModalVisible(false)}>
//                 <Ionicons name="close" size={24} color="#333" />
//               </TouchableOpacity>
//             </View>

//             <ScrollView showsVerticalScrollIndicator={false}>
//               <TextInput
//                 placeholder="Product Title"
//                 value={title}
//                 onChangeText={setTitle}
//                 style={styles.input}
//               />
//               <View style={styles.pickerContainer}>
//                 <Text style={styles.pickerLabel}>From Address:</Text>
//                 <View style={styles.pickerWrapper}>
//                   <Picker
//                     selectedValue={from}
//                     onValueChange={(itemValue) => setFrom(itemValue)}
//                     style={styles.picker}
//                   >
//                     <Picker.Item label="Select from address..." value="" />
//                     {userAddresses.map((address) => (
//                       <Picker.Item
//                         key={address._id}
//                         label={`${address.address}, ${address.city}, ${address.state} - ${address.zipCode}`}
//                         value={address._id}
//                       />
//                     ))}
//                   </Picker>
//                 </View>
//               </View>

//               <View style={styles.pickerContainer}>
//                 <Text style={styles.pickerLabel}>To Address:</Text>
//                 <View style={styles.pickerWrapper}>
//                   <Picker
//                     selectedValue={to}
//                     onValueChange={(itemValue) => setTo(itemValue)}
//                     style={styles.picker}
//                   >
//                     <Picker.Item label="Select to address..." value="" />
//                     {userAddresses.map((address) => (
//                       <Picker.Item
//                         key={address._id}
//                         label={`${address.address}, ${address.city}, ${address.state} - ${address.zipCode}`}
//                         value={address._id}
//                       />
//                     ))}
//                   </Picker>
//                 </View>
//               </View>
//               <TextInput
//                 placeholder="Description (max 50 words)"
//                 value={description}
//                 onChangeText={setDescription}
//                 style={[styles.input, styles.textArea]}
//                 multiline
//                 numberOfLines={3}
//               />
//               <TextInput
//                 placeholder="Weight (kg)"
//                 value={weight}
//                 onChangeText={setWeight}
//                 style={styles.input}
//                 keyboardType="numeric"
//               />
//               <TextInput
//                 placeholder="Price (Rs.)"
//                 value={productPrice}
//                 onChangeText={setProductPrice}
//                 style={styles.input}
//                 keyboardType="numeric"
//               />

//               <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
//                 <Ionicons name="image-outline" size={20} color="#fff" />
//                 <Text style={styles.imagePickerText}>
//                   {image ? 'Change Product Image' : 'Select Product Image'}
//                 </Text>
//               </TouchableOpacity>

//               {image && (
//                 <Image source={{ uri: image.uri }} style={styles.selectedImage} />
//               )}

//               <TouchableOpacity style={styles.imagePickerButton} onPress={pickVideo}>
//                 <Ionicons name="videocam-outline" size={20} color="#fff" />
//                 <Text style={styles.imagePickerText}>
//                   {video ? 'Change Video' : 'Select Video (Optional, max 10 sec)'}
//                 </Text>
//               </TouchableOpacity>

//               <TextInput
//                 placeholder="Required Vehicle Type"
//                 value={veichelType}
//                 onChangeText={setVeichelType}
//                 style={styles.input}
//               />

//               <View style={styles.modalActions}>
//                 <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
//                   <Text style={styles.cancelButtonText}>Cancel</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.modalButton} onPress={handleAddProduct}>
//                   <Text style={styles.modalButtonText}>Add Product</Text>
//                 </TouchableOpacity>
//               </View>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* Accept Product Modal */}
//       <Modal visible={acceptModalVisible} animationType="slide">
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
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5"
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
//     color: "#333"
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
//     elevation: 2,
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
//     marginHorizontal: 4,
//   },
//   card: {
//     width: CARD_WIDTH,
//     height: CARD_HEIGHT,
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#e8e8e8",
//     overflow: 'hidden',
//   },
//   productImage: {
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
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#333',
//     height: 34, // Fixed height for 2 lines
//     lineHeight: 16,
//   },
//   priceContainer: {
//     marginTop: 4,
//   },
//   priceText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: COLORS.primary,
//   },
//   locationRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 4,
//   },
//   locationText: {
//     fontSize: 10,
//     color: '#666',
//     marginLeft: 4,
//     flex: 1,
//   },
//   actionContainer: {
//     marginTop: 6,
//   },
//   acceptButton: {
//     backgroundColor: COLORS.primary,
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 4,
//     alignItems: 'center',
//   },
//   acceptButtonText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: '600',
//   },
//   ownerBadge: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 4,
//     alignItems: 'center',
//   },
//   ownerBadgeText: {
//     fontSize: 11,
//     color: '#fff',
//     fontWeight: '600',
//   },
//   acceptedBadge: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 4,
//     alignItems: 'center',
//   },
//   acceptedBadgeText: {
//     fontSize: 11,
//     color: '#fff',
//     fontWeight: '600',
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   emptyStateText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#999',
//     marginTop: 16,
//   },
//   emptyStateSubText: {
//     fontSize: 14,
//     color: '#ccc',
//     textAlign: 'center',
//     marginTop: 8,
//     lineHeight: 20,
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 24,
//     right: 24,
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: COLORS.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     zIndex: 100,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.25)",
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: "#fff",
//     marginTop: 40,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   modalHeading: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#333"
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//     borderRadius: 10,
//     padding: 14,
//     marginBottom: 16,
//     fontSize: 16,
//     backgroundColor: "#fafafa",
//   },
//   textArea: {
//     minHeight: 80,
//     textAlignVertical: 'top',
//   },
//   imagePickerButton: {
//     flexDirection: "row",
//     backgroundColor: COLORS.primary,
//     padding: 16,
//     borderRadius: 10,
//     marginBottom: 16,
//     alignItems: "center",
//     justifyContent: "center"
//   },
//   imagePickerText: {
//     color: "#fff",
//     marginLeft: 10,
//     fontSize: 16,
//     fontWeight: "600"
//   },
//   selectedImage: {
//     width: 120,
//     height: 120,
//     borderRadius: 10,
//     marginBottom: 16,
//     alignSelf: "center",
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 10,
//   },
//   modalButton: {
//     backgroundColor: COLORS.primary,
//     padding: 16,
//     borderRadius: 10,
//     alignItems: "center",
//     flex: 1,
//     marginHorizontal: 5,
//   },
//   cancelButton: {
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   cancelButtonText: {
//     color: "#666",
//     fontWeight: "600",
//     fontSize: 16
//   },
//   modalButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 16
//   },
//   pickerContainer: {
//     marginBottom: 15,
//   },
//   pickerLabel: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 8,
//   },
//   pickerWrapper: {
//     borderWidth: 1.5,
//     borderColor: '#E0E0E0',
//     borderRadius: 12,
//     overflow: 'hidden',
//     backgroundColor: '#FCFCFC',
//   },
//   picker: {
//     height: 56,
//     color: "#333",
//   },
//   selectedVehicleInfo: {
//     backgroundColor: "#e8f5e8",
//     padding: 10,
//     borderRadius: 8,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: "#4CAF50",
//   },
//   selectedVehicleText: {
//     fontSize: 14,
//     color: "#2E7D32",
//     fontWeight: "600",
//   },
// });


import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  ScrollView,
  Animated,
  TextInput,
} from "react-native";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/color";
import { router } from "expo-router";
import { launchImageLibrary } from 'react-native-image-picker';
import { Platform } from 'react-native';
import { Picker } from "@react-native-picker/picker";

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.45; // 45% of screen width for better layout
const CARD_HEIGHT = 260; // Increased height for better content display

export default function UserProducts() {
  const { products, fetchProducts, addProduct, acceptProduct, user, fetchVehicles, vehicles, token } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [image, setImage] = useState<any>(null);
  const [veichelType, setVeichelType] = useState("");
  const [video, setVideo] = useState<any>(null);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [tentativeTime, setTentativeTime] = useState("");
  const [acceptVehicleType, setAcceptVehicleType] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [acceptingProductId, setAcceptingProductId] = useState<string | null>(null);
  const [productPrice, setProductPrice] = useState("");
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProducts();
    fetchVehicles();
    fetchUserAddresses();
  }, []);

  const fetchUserAddresses = async () => {
    try {
      console.log("🔍 fetchUserAddresses called");
      if (!user) {
        console.log("❌ No user found, returning early");
        return;
      }
      console.log("👤 Fetching addresses for user:", user._id);
      console.log("🔑 Using token:", token ? "present" : "missing");
      const res = await fetch(`http://localhost:3000/api/userDetails/addresses/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("📡 API response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("✅ Address data received:", data);
        console.log("📊 Number of addresses:", data.length);
        setUserAddresses(data);
      } else {
        console.log("❌ API response not ok:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("❌ Error fetching user addresses:", error);
    }
  };

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
    addProduct({ Title: title, from, to, description, price: parseFloat(productPrice), weight, image, veichelType, video });
    setModalVisible(false);
    setTitle(""); setFrom(""); setTo(""); setDescription(""); setProductPrice(""); setWeight(""); setImage(null); setVeichelType(""); setVideo(null);
  };

  const handleSubmitAccept = async () => {
    if (!acceptingProductId) return;

    await acceptProduct(acceptingProductId, {
      tentativeDeliveryTime: tentativeTime,
      acceptedVehicleType: acceptVehicleType,
      price: parseFloat(productPrice) || 0,
    });

    setAcceptModalVisible(false);
    setTentativeTime("");
    setProductPrice("");
    setAcceptVehicleType("");
    setSelectedVehicleId("");
    setAcceptingProductId(null);
  };

  // Filter products to show only user's products
  const userProducts = products.filter(product => product.createdBy?._id === user?._id);

  // Group user products into rows of 2 (2 columns per row)
  const groupProducts = () => {
    const rows = [];
    for (let i = 0; i < userProducts.length; i += 2) {
      rows.push(userProducts.slice(i, i + 2));
    }
    return rows;
  };

  const renderProductCard = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/proInfo/${item._id}` as any)}
        activeOpacity={0.8}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="cube-outline" size={40} color="#ccc" />
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
            <Ionicons name="location-outline" size={12} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              From: {item.fromAddress ? `${item.fromAddress.address}, ${item.fromAddress.city}, ${item.fromAddress.state} ${item.fromAddress.zipCode}` : item.from}
            </Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              To: {item.toAddress ? `${item.toAddress.address}, ${item.toAddress.city}, ${item.toAddress.state} ${item.toAddress.zipCode}` : item.to}
            </Text>
          </View>

          <View style={styles.actionContainer}>
            <View style={styles.ownerBadge}>
              <Ionicons name="person-circle" size={14} color="#fff" />
              <Text style={styles.ownerBadgeText}>My Product</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRow = ({ item: rowItems, index }: { item: any[], index: number }) => (
    <View style={styles.rowContainer}>
      <View style={styles.rowCards}>
        {rowItems.map((product) => (
          <View key={product._id} style={styles.cardWrapper}>
            {renderProductCard({ item: product })}
          </View>
        ))}
        {/* If odd number of items, add empty space for alignment */}
        {rowItems.length === 1 && (
          <View style={styles.emptyCardSpace} />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Your Products</Text>
          <Text style={styles.subHeading}>
            Manage your delivery requests ({userProducts.length})
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {userProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="cube-outline" size={80} color="#ccc" />
          </View>
          <Text style={styles.emptyStateText}>No products yet</Text>
          <Text style={styles.emptyStateSubText}>
            Start by adding your first product for delivery
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyStateButtonText}>Add First Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groupProducts()}
          keyExtractor={(item, index) => `row-${index}`}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<View style={{ height: 10 }} />}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      {/* Add Product Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Add New Product</Text>
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

              <TouchableOpacity style={styles.imagePickerButton} onPress={pickVideo}>
                <Ionicons name="videocam-outline" size={20} color="#fff" />
                <Text style={styles.imagePickerText}>
                  {video ? 'Change Video' : 'Select Video (Optional, max 10 sec)'}
                </Text>
              </TouchableOpacity>

              <TextInput
                placeholder="Required Vehicle Type"
                value={veichelType}
                onChangeText={setVeichelType}
                style={styles.input}
              />

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
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60, // Added more top padding
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333"
  },
  subHeading: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  rowContainer: {
    marginBottom: 16,
  },
  rowCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: 'hidden',
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    height: CARD_HEIGHT,
  },
  productImage: {
    width: '100%',
    height: 110,
    backgroundColor: '#f8f8f8',
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
    height: 36, // Fixed height for 2 lines
    marginBottom: 4,
  },
  priceContainer: {
    marginBottom: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 14,
  },
  actionContainer: {
    marginTop: 8,
  },
  ownerBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  ownerBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyCardSpace: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
    fontWeight: "bold",
    color: "#333"
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
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
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
    borderColor: '#e0e0e0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FCFCFC',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  picker: {
    height: 56,
    color: "#333",
  },
  selectedVehicleInfo: {
    backgroundColor: "#e8f5e8",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedVehicleText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
});