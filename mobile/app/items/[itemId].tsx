// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Modal,
//   FlatList,
//   SectionList,
//   Dimensions,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useAuthStore } from "@/store/authStore";
// import { launchImageLibrary } from 'react-native-image-picker';

// const { width, height } = Dimensions.get("window");

// export default function ItemDetails() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const addSubItem = useAuthStore((state) => state.addSubItem); // You need to define this in your auth store
//   const fetchSubItems = useAuthStore((state) => state.fetchSubItems);
//   const subItems = useAuthStore((state) => state.subItems); // sub items list

//   const [item, setItem] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);

//   const [form, setForm] = useState({
//     name: "",
//     description: "",
//     quantity: "",
//     Price: "",
//     category: "",
//     brand: "",
//     model: "",
//     images: [] as any[],
//   });

//   // Fetch the selected item by ID on mount
//   useEffect(() => {
//     const fetchSingleItem = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/items/${params.itemId}`);
//         if (res.ok) {
//           const fetchedItem = await res.json();
//           setItem(fetchedItem);
//           // Fetch sub items for this item
//           await fetchSubItems(fetchedItem._id);
//         }
//       } catch (err) {
//         console.error("Error loading item:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (params.itemId) fetchSingleItem();
//   }, [params.itemId, fetchSubItems]);

//   // Handle form change
//   const handleChange = (key: string, value: string) => {
//     setForm((prev) => ({ ...prev, [key]: value }));
//   };

//   const pickImages = () => {
//     if (form.images.length >= 3) {
//       Alert.alert("Limit Reached", "You can only select up to 3 images");
//       return;
//     }

//     launchImageLibrary({
//       mediaType: 'photo',
//       quality: 0.8,
//       selectionLimit: 3 - form.images.length,
//     }, (response) => {
//       if (response.didCancel) {
//         return;
//       }

//       if (response.errorMessage) {
//         Alert.alert('Error', response.errorMessage);
//         return;
//       }

//       if (response.assets && response.assets.length > 0) {
//         const newImages = response.assets.map(asset => ({
//           uri: asset.uri,
//           type: asset.type || 'image/jpeg',
//           fileName: asset.fileName || `image_${Date.now()}.jpg`,
//         }));

//         setForm(prev => ({
//           ...prev,
//           images: [...prev.images, ...newImages]
//         }));
//       }
//     });
//   };

//   const removeImage = (index: number) => {
//     setForm(prev => ({
//       ...prev,
//       images: prev.images.filter((_, i) => i !== index)
//     }));
//   };

//   // Add sub item form submit handler
//   const handleAddSubItem = async () => {
//     // Check required text fields
//     const reqFields = ["name", "description", "quantity", "Price", "category", "brand", "model"];
//     for (const f of reqFields) {
//       const value = form[f as keyof typeof form];
//       if (typeof value === 'string' && !value.trim()) {
//         Alert.alert("Validation Error", `Please fill in the ${f} field.`);
//         return;
//       }
//     }

//     // Check if at least one image is selected
//     if (!form.images || form.images.length === 0) {
//       Alert.alert("Validation Error", "Please select at least one image.");
//       return;
//     }

//     const dataToSend = {
//       ...form,
//       quantity: Number(form.quantity),
//       Price: Number(form.Price),
//       parentItemId: item._id,
//     };

//     try {
//       await addSubItem(dataToSend);
//       Alert.alert("Success", "Sub item added.");
//       setModalVisible(false);
//       setForm({
//         name: "",
//         description: "",
//         quantity: "",
//         Price: "",
//         category: "",
//         brand: "",
//         model: "",
//         images: [],
//       });
//       // Refresh sub items list after add
//       await fetchSubItems(item._id);
//     } catch (err: any) {
//       Alert.alert("Error", err.message || "Failed to add sub item.");
//     }
//   };

//   // Group sub items by category for display
//   const groupedItems = subItems.reduce((acc: any, item: any) => {
//     const cat = item.category || "Uncategorized";
//     if (!acc[cat]) acc[cat] = [];
//     acc[cat].push(item);
//     return acc;
//   }, {});
//   const sections = Object.keys(groupedItems).map((title) => ({
//     title,
//     data: groupedItems[title],
//   }));

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator color="#007AFF" size="large" />
//         <Text>Loading item...</Text>
//       </View>
//     );
//   }

//   if (!item) {
//     return (
//       <View style={styles.center}>
//         <Text>Item not found.</Text>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
//       <ScrollView contentContainerStyle={styles.container}>
//         {/* Item Image Carousel */}
//         <View style={styles.header}>
//           {item.images && item.images.length > 0 ? (
//             <View style={styles.imageSliderContainer}>
//               <Image source={{ uri: item.images[currentImageIndex] }} style={styles.carouselImage} />

//               {item.images.length > 1 && (
//                 <>
//                   {/* Left Arrow */}
//                   <TouchableOpacity
//                     style={[styles.sliderArrow, styles.leftArrow]}
//                     onPress={() => setCurrentImageIndex(
//                       currentImageIndex === 0 ? item.images.length - 1 : currentImageIndex - 1
//                     )}
//                   >
//                     <Ionicons name="chevron-back" size={24} color="#fff" />
//                   </TouchableOpacity>

//                   {/* Right Arrow */}
//                   <TouchableOpacity
//                     style={[styles.sliderArrow, styles.rightArrow]}
//                     onPress={() => setCurrentImageIndex(
//                       currentImageIndex === item.images.length - 1 ? 0 : currentImageIndex + 1
//                     )}
//                   >
//                     <Ionicons name="chevron-forward" size={24} color="#fff" />
//                   </TouchableOpacity>

//                   {/* Dots Indicator */}
//                   <View style={styles.dotsContainer}>
//                     {item.images.map((_: string, index: number) => (
//                       <TouchableOpacity
//                         key={index}
//                         style={[
//                           styles.dot,
//                           index === currentImageIndex && styles.activeDot
//                         ]}
//                         onPress={() => setCurrentImageIndex(index)}
//                       />
//                     ))}
//                   </View>
//                 </>
//               )}
//             </View>
//           ) : (
//             <View style={[styles.carouselImage, styles.placeholder]}>
//               <Text style={{ color: "#777" }}>No Images</Text>
//             </View>
//           )}
//           <Text style={styles.title}>{item.name}</Text>
//           <Text style={styles.subtitle}>{item.category}</Text>
//         </View>

//         {/* Item Details */}
//         <View style={styles.card}>
//           <Text style={styles.info}>Quantity: {item.quantity}</Text>
//           <Text style={styles.info}>Price: ₹{item.MinPrice} - ₹{item.MaxPrice}</Text>
//           <Text style={styles.info}>Description: {item.description}</Text>
//           <Text style={styles.info}>Brand: {item.brand}</Text>
//           <Text style={styles.info}>Model: {item.model}</Text>
//         </View>

//         {/* Button to open add sub item modal */}
//         <View style={styles.card}>
//           <TouchableOpacity style={styles.smallButton} onPress={() => setModalVisible(true)}>
//             <Text style={styles.buttonText}>+ Add Sub Item</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Modal for Add Sub Item Form */}
//         <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalView}>
//               <ScrollView contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
//                 <Text style={[styles.title, { fontSize: 20, marginBottom: 10, textAlign: "center" }]}>Add Sub Item</Text>
//                 {[
//                   { label: "Name", key: "name" },
//                   { label: "Description", key: "description", multiline: true },
//                   { label: "Quantity", key: "quantity", keyboardType: "numeric" },
//                   { label: "Price", key: "Price", keyboardType: "numeric" },
//                   { label: "Category", key: "category" },
//                   { label: "Brand", key: "brand" },
//                   { label: "Model", key: "model" },
//                 ].map(({ label, key, keyboardType, multiline }) => (
//                   <TextInput
//                     key={key}
//                     style={[styles.input, multiline && { height: 80 }]}
//                     placeholder={label + " *"}
//                     value={form[key as keyof typeof form] as string}
//                     onChangeText={(text) => handleChange(key, text)}
//                     multiline={multiline}
//                     numberOfLines={multiline ? 4 : 1}
//                     keyboardType={keyboardType as any}
//                   />
//                 ))}

//                 {/* Images Section */}
//                 <View style={styles.imagesContainer}>
//                   <View style={styles.inputLabelContainer}>
//                     <Ionicons name="images" size={18} color="#3b82f6" style={styles.inputIcon} />
//                     <Text style={styles.inputLabel}>Sub Item Images (Max 3) *</Text>
//                   </View>

//                   <TouchableOpacity
//                     style={styles.addImageButton}
//                     onPress={pickImages}
//                     activeOpacity={0.8}
//                   >
//                     <Ionicons name="add-circle" size={24} color="#3b82f6" />
//                     <Text style={styles.addImageText}>
//                       Add Images ({form.images.length}/3)
//                     </Text>
//                   </TouchableOpacity>

//                   {form.images.length > 0 && (
//                     <View style={styles.imagesPreview}>
//                       {form.images.map((image, index) => (
//                         <View key={index} style={styles.imageWrapper}>
//                           <Image source={{ uri: image.uri }} style={styles.imagePreview} />
//                           <TouchableOpacity
//                             style={styles.removeImageButton}
//                             onPress={() => removeImage(index)}
//                           >
//                             <Ionicons name="close-circle" size={20} color="#fff" />
//                           </TouchableOpacity>
//                         </View>
//                       ))}
//                     </View>
//                   )}
//                 </View>

//                 <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={handleAddSubItem}>
//                   <Text style={styles.buttonText}>Add Sub Item</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
//                   <Text style={{ textAlign: "center", color: "#007AFF" }}>Cancel</Text>
//                 </TouchableOpacity>
//               </ScrollView>
//             </View>
//           </View>
//         </Modal>

//         {/* SectionList for sub items grouped by category */}
//         <View style={{ flex: 1, width: "100%", marginTop: 20 }}>
//           <SectionList
//             sections={sections}
//             keyExtractor={(item) => item._id}
//             renderSectionHeader={({ section }) => (
//               <>
//                 <Text style={styles.sectionHeader}>{section.title}</Text>
//                 <FlatList
//                   data={section.data}
//                   horizontal
//                   showsHorizontalScrollIndicator={false}
//                   keyExtractor={(item) => item._id}
//                   contentContainerStyle={{ paddingHorizontal: 16 }}
//                   renderItem={({ item }) => (
//                     <TouchableOpacity
//                       onPress={() => router.push(`/subItems/${item._id}` as any)}
//                       style={styles.itemCard}
//                     >
//                       {item.images && item.images.length > 0 ? (
//                         <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
//                       ) : (
//                         <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
//                           <Ionicons name="image-outline" size={24} color="#cbd5e1" />
//                         </View>
//                       )}
//                       <Text style={styles.itemTitle}>{item.name}</Text>
//                       <Text style={styles.itemInfo}>Qty: {item.quantity}</Text>
//                       <Text style={styles.itemInfo}>
//                         ₹{item.Price}
//                       </Text>
//                     </TouchableOpacity>
//                   )}
//                 />
//               </>
//             )}
//             renderItem={() => null}
//           />
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     alignItems: "center",
//   },
//   card: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 20,
//     alignItems: "center",
//     elevation: 3,
//     width: "100%",
//   },
//   image: {
//     width: 120,
//     height: 120,
//     borderRadius: 12,
//     marginBottom: 15,
//     backgroundColor: "#eee",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   placeholder: {
//     backgroundColor: "#eee",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   info: {
//     fontSize: 16,
//     color: "#444",
//     marginBottom: 6,
//     textAlign: "center",
//   },
//   smallButton: {
//     backgroundColor: "#007AFF",
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     alignSelf: "flex-start",
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 18,
//     textAlign: "center",
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.3)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalView: {
//     backgroundColor: "white",
//     borderRadius: 12,
//     width: "90%",
//     maxHeight: "90%",
//     padding: 20,
//     elevation: 5,
//   },
//   input: {
//     height: 50,
//     borderColor: "#ddd",
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     fontSize: 16,
//     backgroundColor: "#fafafa",
//   },
//   sectionHeader: {
//     fontWeight: "bold",
//     fontSize: 22,
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     backgroundColor: "#f0f0f0",
//   },
//   itemCard: {
//     width: 160,
//     backgroundColor: "#fff",
//     marginRight: 16,
//     borderRadius: 10,
//     padding: 15,
//     elevation: 2,
//     alignItems: "center",
//   },
//   itemImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//     marginBottom: 10,
//     backgroundColor: "#eee",
//   },
//   itemImagePlaceholder: {
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f1f5f9",
//   },
//   itemTitle: {
//     fontWeight: "bold",
//     fontSize: 16,
//     marginBottom: 4,
//     textAlign: "center",
//   },
//   itemInfo: {
//     fontSize: 14,
//     color: "#666",
//     textAlign: "center",
//     marginBottom: 2,
//   },
//     button: {
//     backgroundColor: "#007AFF",
//     paddingVertical: 15,
//     borderRadius: 10,
//     marginTop: 15,
//   },
//   header: {
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   carouselImage: {
//     width: Dimensions.get('window').width,
//     height: Dimensions.get('window').height * 0.3,
//     marginBottom: 20,
//     resizeMode: 'cover',
//   },
//   imageSliderContainer: {
//     position: "relative",
//   },
//   sliderArrow: {
//     position: "absolute",
//     top: "50%",
//     transform: [{ translateY: -12 }],
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     borderRadius: 20,
//     width: 40,
//     height: 40,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   leftArrow: {
//     left: 10,
//   },
//   rightArrow: {
//     right: 10,
//   },
//   dotsContainer: {
//     position: "absolute",
//     bottom: 10,
//     left: 0,
//     right: 0,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   dot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "rgba(255, 255, 255, 0.5)",
//     marginHorizontal: 4,
//   },
//   activeDot: {
//     backgroundColor: "#fff",
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "#666",
//     marginBottom: 15,
//     textAlign: "center",
//   },
//   imagesContainer: {
//     marginBottom: 16,
//   },
//   inputLabelContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   inputIcon: {
//     marginRight: 8,
//   },
//   inputLabel: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#475569",
//   },
//   addImageButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#f1f5f9",
//     borderWidth: 2,
//     borderColor: "#e2e8f0",
//     borderStyle: "dashed",
//     borderRadius: 12,
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     marginTop: 8,
//   },
//   addImageText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#475569",
//     marginLeft: 8,
//   },
//   imagesPreview: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     marginTop: 12,
//     gap: 8,
//   },
//   imageWrapper: {
//     position: "relative",
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//     overflow: "hidden",
//     backgroundColor: "#f8fafc",
//   },
//   imagePreview: {
//     width: "100%",
//     height: "100%",
//     resizeMode: "cover",
//   },
//   removeImageButton: {
//     position: "absolute",
//     top: -8,
//     right: -8,
//     backgroundColor: "#ef4444",
//     borderRadius: 12,
//     width: 24,
//     height: 24,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  SectionList,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { launchImageLibrary } from 'react-native-image-picker';
import CheckoutModal from "@/components/CheckoutModal";

// Cart functionality will be imported inside the component

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.65;

export default function ItemDetails() {
   const params = useLocalSearchParams();
   const router = useRouter();
   const addSubItem = useAuthStore((state) => state.addSubItem);
   const fetchSubItems = useAuthStore((state) => state.fetchSubItems);
   const subItems = useAuthStore((state) => state.subItems);
   const addToCart = useAuthStore((state) => state.addToCart);
   const checkout = useAuthStore((state) => state.checkout);

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [selectedItemForCheckout, setSelectedItemForCheckout] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const loadingSpin = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef<Animated.Value[]>([]);

  const { shops, user } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    description: "",
    quantity: "",
    Price: "",
    category: "",
    brand: "",
    model: "",
    shop_id: "",
    images: [] as any[],
  });
  const [showShopPicker, setShowShopPicker] = useState(false);

  // Loading animation
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(loadingSpin, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading]);

  // Initialize animations for cards
  useEffect(() => {
    if (subItems.length > 0) {
      cardAnimations.current = subItems.map(() => new Animated.Value(1)); // Start visible
    }
  }, [subItems.length]);

  // Start animations when component mounts or item changes
  useEffect(() => {
    if (item) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

    }
  }, [item]);

  // Fetch the selected item by ID on mount
  useEffect(() => {
    const fetchSingleItem = async () => {
      try {
        const itemId = params?.itemId;
        if (!itemId) {
          console.error("No itemId provided in params");
          setLoading(false);
          return;
        }

        const res = await fetch(`http://localhost:3000/api/items/${itemId}`);
        if (res.ok) {
          const fetchedItem = await res.json();
          setItem(fetchedItem);
          await fetchSubItems(fetchedItem._id);
        } else {
          console.error("Failed to fetch item:", res.status);
        }
      } catch (err) {
        console.error("Error loading item:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params?.itemId) {
      fetchSingleItem();
    } else {
      setLoading(false);
    }
  }, [params?.itemId, fetchSubItems]);

  // Handle form change
  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickImages = () => {
    if (form.images.length >= 3) {
      Alert.alert("Limit Reached", "You can only select up to 3 images");
      return;
    }

    launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 3 - form.images.length,
    }, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newImages = response.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
        }));

        setForm(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
        
        // Animation for new images
        Animated.sequence([
          Animated.timing(imageScale, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(imageScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  };

  const removeImage = (index: number) => {
    Animated.sequence([
      Animated.timing(imageScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
      Animated.spring(imageScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  };

  // Button press animations
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

  // Add sub item form submit handler
  const handleAddSubItem = async () => {
    // Validation animation
    const reqFields = ["name", "description", "quantity", "Price", "category", "brand", "model"];
    let hasError = false;
    
    for (const f of reqFields) {
      const value = form[f as keyof typeof form];
      if (typeof value === 'string' && !value.trim()) {
        hasError = true;
        // Shake animation for error
        const shakeAnim = new Animated.Value(0);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
        break;
      }
    }

    if (hasError) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    if (!form.images || form.images.length === 0) {
      Alert.alert("Validation Error", "Please select at least one image.");
      return;
    }

    const dataToSend = {
      ...form,
      quantity: Number(form.quantity),
      Price: Number(form.Price),
      parentItemId: item._id,
    };

    try {
      await addSubItem(dataToSend);
      
      // Success animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert("Success", "Sub item added successfully!");
      setModalVisible(false);
      setForm({
        name: "",
        description: "",
        quantity: "",
        Price: "",
        category: "",
        brand: "",
        model: "",
        shop_id: "",
        images: [],
      });
      
      await fetchSubItems(item._id);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add sub item.");
    }
  };

  // Group sub items by category for display
  const groupedItems = (subItems || []).reduce((acc: any, item: any) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const sections = Object.keys(groupedItems).map((title) => ({
    title,
    data: groupedItems[title],
  }));

  console.log("SubItems sections:", sections);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[
          styles.loadingAnimation,
          {
            transform: [
              { rotate: loadingSpin.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              })},
              { scale: pulseAnim }
            ]
          }
        ]}>
          <Ionicons name="cube" size={80} color="#007AFF" />
        </Animated.View>
        <Animated.Text style={[
          styles.loadingText,
          { opacity: pulseAnim, transform: [{ scale: pulseAnim }] }
        ]}>
          Loading item details...
        </Animated.Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Animated.View style={[
          styles.errorAnimation,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <Ionicons name="alert-circle-outline" size={100} color="#FF3B30" />
        </Animated.View>
        <Text style={styles.errorTitle}>Item not found</Text>
        <Text style={styles.errorText}>The item you're looking for doesn't exist or has been removed.</Text>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined} 
      style={styles.keyboardView}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => router.back()}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.headerTitle}>Item Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Item Image Carousel */}
        <Animated.View style={[
          styles.carouselContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
        ]}>
          {item.images && item.images.length > 0 ? (
            <View style={styles.imageContainer}>
              <Animated.Image 
                source={{ uri: item.images[currentImageIndex] }} 
                style={[
                  styles.carouselImage,
                  { transform: [{ scale: scaleAnim }] }
                ]}
              />

              {item.images.length > 1 && (
                <>
                  {/* Left Arrow - Fixed position */}
                  <Animated.View style={[styles.sliderArrowContainer, styles.leftArrowContainer]}>
                    <TouchableOpacity
                      style={styles.sliderArrow}
                      onPress={() => {
                        Animated.sequence([
                          Animated.timing(scaleAnim, {
                            toValue: 0.95,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                          Animated.timing(scaleAnim, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();
                        setCurrentImageIndex(
                          currentImageIndex === 0 ? item.images.length - 1 : currentImageIndex - 1
                        );
                      }}
                    >
                      <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Right Arrow - Fixed position */}
                  <Animated.View style={[styles.sliderArrowContainer, styles.rightArrowContainer]}>
                    <TouchableOpacity
                      style={styles.sliderArrow}
                      onPress={() => {
                        Animated.sequence([
                          Animated.timing(scaleAnim, {
                            toValue: 0.95,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                          Animated.timing(scaleAnim, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();
                        setCurrentImageIndex(
                          currentImageIndex === item.images.length - 1 ? 0 : currentImageIndex + 1
                        );
                      }}
                    >
                      <Ionicons name="chevron-forward" size={28} color="#fff" />
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Dots Indicator - Keep at bottom */}
                  <View style={styles.dotsContainer}>
                    {item.images.map((_: string, index: number) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.dot,
                          index === currentImageIndex && styles.activeDot,
                          {
                            transform: [{
                              scale: index === currentImageIndex 
                                ? scaleAnim.interpolate({
                                    inputRange: [0.95, 1],
                                    outputRange: [1.2, 1]
                                  })
                                : 1
                            }]
                          }
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : (
            <Animated.View style={[
              styles.carouselImage,
              styles.placeholder,
              { opacity: fadeAnim }
            ]}>
              <Ionicons name="image-outline" size={60} color="#cbd5e1" />
              <Text style={{ color: "#94a3b8", marginTop: 10 }}>No Images Available</Text>
            </Animated.View>
          )}
          
          <Animated.Text style={[
            styles.title,
            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
          ]}>
            {item.name}
          </Animated.Text>
          
          <Animated.View style={[
            styles.categoryBadge,
            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
          ]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </Animated.View>
        </Animated.View>

        {/* Item Details Card */}
        <Animated.View style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
        ]}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="cube-outline" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Quantity</Text>
              <Text style={styles.infoValue}>{item.quantity}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={20} color="#34C759" />
              <Text style={styles.infoLabel}>Price Range</Text>
              <Text style={styles.priceRange}>
                ₹{item.MinPrice} - ₹{item.MaxPrice}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={20} color="#FF9500" />
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={styles.infoValue}>{item.brand}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="construct-outline" size={20} color="#AF52DE" />
              <Text style={styles.infoLabel}>Model</Text>
              <Text style={styles.infoValue}>{item.model}</Text>
            </View>
          </View>
          
          <View style={styles.descriptionContainer}>
            <Ionicons name="document-text-outline" size={20} color="#5856D6" />
            <Text style={styles.descriptionText}>{item.description}</Text>
          </View>
        </Animated.View>

        {/* Add Sub Item Button - Only show for item owners */}
        {user && item && item.createdBy && item.createdBy._id === user._id && (
          <Animated.View style={[
            styles.actionButtonContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
          ]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add Sub Item</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* Sub Items Section */}
        {sections.length > 0 && (
          <Animated.View style={[
            styles.subItemsSection,
            { opacity: fadeAnim }
          ]}>
            <Text style={styles.sectionTitle}>Sub Items by Category</Text>
            
            <FlatList
              data={sections || []}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `section-${item.title}-${index}`}
              renderItem={({ item: section, index }) => {
                console.log("Rendering section:", section.title, section.data.length);
                return (
                  <Animated.View
                    style={[
                      styles.categoryCard,
                      {
                        opacity: fadeAnim,
                        transform: [{
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0]
                          })
                        }]
                      }
                    ]}
                  >
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(section.title)}15` }]}>
                      <Ionicons name={getCategoryIcon(section.title)} size={20} color={getCategoryColor(section.title)} />
                    </View>
                    <Text style={styles.categoryCardTitle}>{section.title}</Text>
                    <Text style={styles.categoryCount}>{section.data.length} items</Text>
                  </View>
                  
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.subItemsScroll}
                  >
                    {section.data.map((subItem: any) => (
                      <Animated.View
                        key={subItem._id}
                        style={styles.subItemCard}
                      >
                        <TouchableOpacity
                          onPress={() => router.push(`/subItems/${subItem._id}` as any)}
                          activeOpacity={0.9}
                          style={styles.subItemContent}
                        >
                          {subItem.images && subItem.images.length > 0 ? (
                            <Image source={{ uri: subItem.images[0] }} style={styles.subItemImage} />
                          ) : (
                            <View style={[styles.subItemImage, styles.subItemImagePlaceholder]}>
                              <Ionicons name="image-outline" size={24} color="#cbd5e1" />
                            </View>
                          )}
                          <Text style={styles.subItemName} numberOfLines={2}>{subItem.name}</Text>
                          <View style={styles.subItemInfo}>
                            <Text style={styles.subItemQuantity}>Qty: {subItem.quantity}</Text>
                            <Text style={styles.subItemPrice}>₹{subItem.Price}</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Buy and Cart Buttons */}
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={styles.buyButton}
                            onPress={async () => {
                              console.log("🛒 Buy Now pressed for:", subItem.name);
                              try {
                                await addToCart(subItem._id, 1);
                                console.log("✅ Item added to cart for checkout");
                                setSelectedItemForCheckout(subItem);
                                setCheckoutModalVisible(true);
                              } catch (error) {
                                console.error("❌ Add to cart error:", error);
                                Alert.alert("Error", "Failed to prepare checkout");
                              }
                            }}
                          >
                            <Ionicons name="cash-outline" size={16} color="#fff" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cartButton}
                            onPress={async () => {
                              console.log("Cart button pressed for subItem:", subItem._id, subItem.name);
                              console.log("Calling addToCart function directly...");
                              try {
                                const result = await addToCart(subItem._id, 1);
                                console.log("Add to cart result:", result);
                                // Success/error messages are handled by the store function
                              } catch (error: any) {
                                console.error("Add to cart error:", error);
                                // Error messages are handled by the store function
                              }
                            }}
                          >
                            <Ionicons name="bag-add-outline" size={16} color="#007AFF" />
                          </TouchableOpacity>
                        </View>
                      </Animated.View>
                    ))}
                  </ScrollView>
                </Animated.View>
               );
             }}
           />
          </Animated.View>
        )}

        {/* Modal for Add Sub Item Form */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.modalView,
              { transform: [{ translateY: slideUpAnim }] }
            ]}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Sub Item</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {[
                  { label: "Name", key: "name", icon: "cube-outline" },
                  { label: "Description", key: "description", icon: "document-text-outline", multiline: true },
                  { label: "Quantity", key: "quantity", icon: "layers-outline", keyboardType: "numeric" },
                  { label: "Price", key: "Price", icon: "cash-outline", keyboardType: "numeric" },
                  { label: "Category", key: "category", icon: "pricetag-outline" },
                  { label: "Brand", key: "brand", icon: "business-outline" },
                  { label: "Model", key: "model", icon: "construct-outline" },
                ].map(({ label, key, icon, keyboardType, multiline }) => (
                  <View key={key} style={styles.inputContainer}>
                    <Ionicons name={icon as any} size={20} color="#007AFF" style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        multiline && { height: 100, textAlignVertical: 'top' }
                      ]}
                      placeholder={label + " *"}
                      placeholderTextColor="#999"
                      value={form[key as keyof typeof form] as string}
                      onChangeText={(text) => handleChange(key, text)}
                      multiline={multiline}
                      numberOfLines={multiline ? 4 : 1}
                      keyboardType={keyboardType as any}
                    />
                  </View>
                ))}

                {/* Images Section */}
                <View style={styles.imagesContainer}>
                  <View style={styles.inputLabelContainer}>
                    <Ionicons name="images" size={20} color="#007AFF" style={styles.inputIcon} />
                    <Text style={styles.inputLabel}>Sub Item Images (Max 3) *</Text>
                  </View>

                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                      style={styles.addImageButton}
                      onPress={pickImages}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle" size={24} color="#007AFF" />
                      <Text style={styles.addImageText}>
                        Add Images ({form.images.length}/3)
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>

                  {form.images.length > 0 && (
                    <Animated.View style={[
                      styles.imagesPreview,
                      { transform: [{ scale: imageScale }] }
                    ]}>
                      {form.images.map((image, index) => (
                        <View key={index} style={styles.imageWrapper}>
                          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => removeImage(index)}
                          >
                            <Ionicons name="close-circle" size={20} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </Animated.View>
                  )}
                </View>

                <View style={styles.modalButtons}>
                  <Animated.View style={{ transform: [{ scale: buttonScale }], flex: 1 }}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setModalVisible(false)}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  <Animated.View style={{ transform: [{ scale: buttonScale }], flex: 1 }}>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleAddSubItem}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                    >
                      <Text style={styles.submitButtonText}>Add Sub Item</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Checkout Modal for Buy Now */}
        <CheckoutModal
          visible={checkoutModalVisible}
          onClose={() => setCheckoutModalVisible(false)}
          singleItem={selectedItemForCheckout}
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Helper functions for category styling
const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('machine') || cat.includes('tool')) return 'construct-outline';
  if (cat.includes('electron')) return 'hardware-chip-outline';
  if (cat.includes('cloth') || cat.includes('fashion')) return 'shirt-outline';
  if (cat.includes('book') || cat.includes('station')) return 'book-outline';
  return 'cube-outline';
};

const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('machine') || cat.includes('tool')) return '#FF9500';
  if (cat.includes('electron')) return '#34C759';
  if (cat.includes('cloth') || cat.includes('fashion')) return '#FF2D55';
  if (cat.includes('book') || cat.includes('station')) return '#AF52DE';
  return '#007AFF';
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F8F9FA",
  },
  loadingAnimation: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 40,
  },
  errorAnimation: {
    marginBottom: 30,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF3B30',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerBackButton: {
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  carouselContainer: {
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
  },
  carouselImage: {
    width: width,
    height: height * 0.35,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderArrowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftArrowContainer: {
    left: 0,
    width: 80,
  },
  rightArrowContainer: {
    right: 0,
    width: 80,
  },
  sliderArrow: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 12,
    height: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  categoryBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  priceRange: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
  },
  descriptionContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  descriptionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  actionButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  subItemsSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginLeft: 20,
    marginBottom: 20,
  },
  categoryCard: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginLeft: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  subItemsScroll: {
    flexDirection: 'row',
  },
  subItemCard: {
    width: 180,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  subItemContent: {
    flex: 1,
  },
  subItemImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  subItemImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  subItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 18,
  },
  subItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subItemQuantity: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  subItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    maxHeight: '90%',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 8,
  },
  imagesContainer: {
    marginBottom: 24,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 10,
  },
  imagesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Action Buttons for Buy/Cart
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
});
