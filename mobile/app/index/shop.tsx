import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { launchImageLibrary } from 'react-native-image-picker';

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Type definitions
interface Shop {
  _id: string;
  name: string;
  shopType: string;
  location: string;
  images: string[];
  openingTime: string;
  closingTime: string;
  status: string; // Change from literal union to string
}

interface FormData {
  name: string;
  shopType: string;
  location: string;
  images: any[];
  openingTime: string;
  closingTime: string;
  status: "open" | "closed";
}

export default function AddShop() {
  const addShop = useAuthStore((state) => state.addShop);
  const fetchShops = useAuthStore((state) => state.fetchShops);
  const shops = useAuthStore((state) => state.shops);
  const loading = useAuthStore((state) => state.isLoading);
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    shopType: "",
    location: "",
    images: [],
    openingTime: "",
    closingTime: "",
    status: "open",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchShops();
  }, []);

  const pickImages = () => {
    if (formData.images.length >= 3) {
      Alert.alert("Limit Reached", "You can only select up to 3 images");
      return;
    }

    launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 3 - formData.images.length,
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

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddShop = async () => {
    if (!formData.name || !formData.shopType || !formData.location || !formData.openingTime || !formData.closingTime) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create shop object with images array
      const shopData = {
        name: formData.name,
        shopType: formData.shopType,
        location: formData.location,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        status: formData.status,
        images: formData.images, // Pass images array directly
      };

      await addShop(shopData);

      // Reset form
      setFormData({
        name: "",
        shopType: "",
        location: "",
        images: [],
        openingTime: "",
        closingTime: "",
        status: "open",
      });

      Alert.alert("Success", "Shop added successfully!", [
        { text: "OK", onPress: () => {} }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to add shop. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ShopCard = ({ item }: { item: Shop }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/shops/${item._id}` as any)}
        activeOpacity={0.7}
        style={styles.cardTouchable}
      >
        <LinearGradient
          colors={item.status === "open"
            ? ["#f8fafc", "#e0f2fe"]
            : ["#f8fafc", "#fee2e2"]
          }
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Image Slider */}
          {item.images && item.images.length > 0 ? (
            <View style={styles.cardImageContainer}>
              <Image source={{ uri: item.images[currentImageIndex] }} style={styles.cardImage} />

              {item.images.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.cardArrow, styles.cardLeftArrow]}
                    onPress={() => setCurrentImageIndex(
                      currentImageIndex === 0 ? item.images.length - 1 : currentImageIndex - 1
                    )}
                  >
                    <Ionicons name="chevron-back" size={16} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardArrow, styles.cardRightArrow]}
                    onPress={() => setCurrentImageIndex(
                      currentImageIndex === item.images.length - 1 ? 0 : currentImageIndex + 1
                    )}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </TouchableOpacity>

                  <View style={styles.cardDots}>
                    {item.images.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.cardDot,
                          index === currentImageIndex && styles.cardDotActive
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons
                name={item.shopType.includes("food") ? "restaurant" : "storefront"}
                size={40}
                color="#cbd5e1"
              />
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={styles.shopInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.status === "open" ? "#10b981" : "#ef4444" }
              ]}>
                <Text style={styles.statusText}>
                  {item.status === "open" ? "Open" : "Closed"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardRow}>
              <Ionicons name="business" size={16} color="#64748b" />
              <Text style={styles.cardText} numberOfLines={1}>Type: {item.shopType}</Text>
            </View>
            <View style={styles.cardRow}>
              <Ionicons name="location" size={16} color="#64748b" />
              <Text style={styles.cardText} numberOfLines={2}>Location: {item.location}</Text>
            </View>
            <View style={styles.cardRow}>
              <Ionicons name="time" size={16} color="#64748b" />
              <Text style={styles.cardText}>Hours: {item.openingTime} - {item.closingTime}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Details →</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Header */}
          <LinearGradient
            colors={["#3b82f6", "#1d4ed8"]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add-circle" size={32} color="#fff" />
            <Text style={styles.headerTitle}>Add New Shop</Text>
            <Text style={styles.headerSubtitle}>Register your business</Text>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Shop Information</Text>
            
            {/* Shop Name */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <Ionicons name="storefront" size={18} color="#3b82f6" style={styles.inputIcon} />
                <Text style={styles.inputLabel}>Shop Name *</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Enter shop name"
                placeholderTextColor="#94a3b8"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>

            {/* Shop Type */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <Ionicons name="pricetags" size={18} color="#3b82f6" style={styles.inputIcon} />
                <Text style={styles.inputLabel}>Shop Type *</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="e.g., Restaurant, Grocery, Clothing"
                placeholderTextColor="#94a3b8"
                value={formData.shopType}
                onChangeText={(text) => handleInputChange("shopType", text)}
                returnKeyType="next"
              />
            </View>

            {/* Location */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <Ionicons name="location" size={18} color="#3b82f6" style={styles.inputIcon} />
                <Text style={styles.inputLabel}>Location *</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Full address"
                placeholderTextColor="#94a3b8"
                value={formData.location}
                onChangeText={(text) => handleInputChange("location", text)}
                returnKeyType="next"
              />
            </View>

            {/* Images */}
            <View style={styles.imagesContainer}>
              <View style={styles.inputLabelContainer}>
                <Ionicons name="images" size={18} color="#3b82f6" style={styles.inputIcon} />
                <Text style={styles.inputLabel}>Shop Images (Max 3)</Text>
              </View>

              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImages}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={24} color="#3b82f6" />
                <Text style={styles.addImageText}>
                  Add Images ({formData.images.length}/3)
                </Text>
              </TouchableOpacity>

              {formData.images.length > 0 && (
                <View style={styles.imagesPreview}>
                  {formData.images.map((image, index) => (
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
                </View>
              )}
            </View>

            {/* Timing Row */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="time" size={18} color="#3b82f6" style={styles.inputIcon} />
                  <Text style={styles.inputLabel}>Open *</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="09:00"
                  placeholderTextColor="#94a3b8"
                  value={formData.openingTime}
                  onChangeText={(text) => handleInputChange("openingTime", text)}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="time-outline" size={18} color="#3b82f6" style={styles.inputIcon} />
                  <Text style={styles.inputLabel}>Close *</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="18:00"
                  placeholderTextColor="#94a3b8"
                  value={formData.closingTime}
                  onChangeText={(text) => handleInputChange("closingTime", text)}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Status Picker */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <Ionicons name="settings" size={18} color="#3b82f6" style={styles.inputIcon} />
                <Text style={styles.inputLabel}>Status</Text>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value: "open" | "closed") => handleInputChange("status", value)}
                  style={styles.picker}
                  dropdownIconColor="#3b82f6"
                >
                  <Picker.Item 
                    label="🟢 Open" 
                    value="open" 
                    style={styles.pickerItem}
                  />
                  <Picker.Item 
                    label="🔴 Closed" 
                    value="closed" 
                    style={styles.pickerItem}
                  />
                </Picker>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleAddShop}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isSubmitting ? ["#94a3b8", "#64748b"] : ["#3b82f6", "#1d4ed8"]}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="add" size={22} color="#fff" />
                    <Text style={styles.submitButtonText}>
                      Add Shop
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Shops List */}
          <View style={styles.shopsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Shops</Text>
              <Text style={styles.shopCount}>({shops.length})</Text>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : shops.length > 0 ? (
              <FlatList<Shop>
                data={shops}
                keyExtractor={(item: Shop) => item._id}
                renderItem={({ item }) => <ShopCard item={item} />}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={60} color="#cbd5e1" />
                <Text style={styles.emptyStateTitle}>No shops yet</Text>
                <Text style={styles.emptyStateText}>
                  Add your first shop to get started
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 22 : 26,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#dbeafe",
    marginTop: 5,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
  },
  input: {
    height: isSmallDevice ? 46 : 50,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: isSmallDevice ? 15 : 16,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputWithIcon: {
    paddingLeft: 46,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  picker: {
    height: isSmallDevice ? 46 : 50,
    color: "#1e293b",
  },
  pickerItem: {
    fontSize: isSmallDevice ? 14 : 16,
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: isSmallDevice ? 50 : 56,
    paddingHorizontal: 20,
  },
  submitButtonText: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  shopsContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  shopCount: {
    fontSize: 14,
    color: "#64748b",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  cardTouchable: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  shopIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  shopInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
  },
  cardBody: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    alignItems: "flex-end",
  },
  viewButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3b82f6",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  loader: {
    marginVertical: 40,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    marginLeft: 8,
  },
  imagesPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  imageWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardArrow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -12 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLeftArrow: {
    left: 8,
  },
  cardRightArrow: {
    right: 8,
  },
  cardDots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 3,
  },
  cardDotActive: {
    backgroundColor: "#fff",
  },
});


// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   FlatList,
//   Animated,
//   Dimensions,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuthStore } from "@/store/authStore";
// import COLORS from "@/constants/color";
// import { Picker } from "@react-native-picker/picker";
// import { router } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import * as ImagePicker from "expo-image-picker";

// const { width } = Dimensions.get("window");

// // Separate ShopCard component to properly use hooks
// const ShopCard = ({ item, index, onPress } : any) => {
//   const cardAnim = useState(new Animated.Value(0))[0];

//   useEffect(() => {
//     Animated.spring(cardAnim, {
//       toValue: 1,
//       delay: index * 100,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   const cardStyle = {
//     opacity: cardAnim,
//     transform: [
//       { scale: cardAnim },
//       {
//         translateY: cardAnim.interpolate({
//           inputRange: [0, 1],
//           outputRange: [50, 0],
//         }),
//       },
//     ],
//   };

//   return (
//     <Animated.View style={cardStyle}>
//       <TouchableOpacity 
//         onPress={onPress}
//         activeOpacity={0.7}
//       >
//         <View style={styles.card}>
//           <View style={styles.cardHeader}>
//             <Text style={styles.cardTitle}>{item.name}</Text>
//             <View style={[
//               styles.statusBadge,
//               { backgroundColor: item.status === "open" ? "#4CAF50" : "#FF6B6B" }
//             ]}>
//               <Text style={styles.statusText}>{item.status}</Text>
//             </View>
//           </View>
          
//           <View style={styles.cardContent}>
//             <View style={styles.cardRow}>
//               <Ionicons name="business" size={16} color="#666" />
//               <Text style={styles.cardText}>Type: {item.shopType}</Text>
//             </View>
            
//             <View style={styles.cardRow}>
//               <Ionicons name="location" size={16} color="#666" />
//               <Text style={styles.cardText}>Location: {item.location}</Text>
//             </View>
            
//             <View style={styles.cardRow}>
//               <Ionicons name="time" size={16} color="#666" />
//               <Text style={styles.cardText}>
//                 Hours: {item.openingTime} - {item.closingTime}
//               </Text>
//             </View>
//           </View>
          
//           <View style={styles.cardFooter}>
//             <Text style={styles.viewDetailsText}>Tap to view details →</Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     </Animated.View>
//   );
// };

// // Cloudinary upload function
// const uploadToCloudinary = async (image: any) => {
//   const data = new FormData();
//   data.append("file", {
//     uri: image.uri,
//     type: image.type || "image/jpeg",
//     name: image.fileName || "upload.jpg",
//   } as any);
//   data.append("upload_preset", "TtackDilivary");
//   data.append("cloud_name", "dnwzb85nc");

//   try {
//     let res = await fetch(
//       "https://api.cloudinary.com/v1_1/dnwzb85nc/image/upload",
//       {
//         method: "POST",
//         body: data,
//       }
//     );

//     let json = await res.json();
//     console.log("Cloudinary response:", json);

//     return json.secure_url;
//   } catch (error) {
//     console.log("Cloudinary upload error:", error);
//     return null;
//   }
// };

// export default function AddShop() {
//   const addShop = useAuthStore((state) => state.addShop);
//   const fetchShops = useAuthStore((state) => state.fetchShops);
//   const shops = useAuthStore((state) => state.shops);
//   const router = useRouter();
  
//   const [name, setName] = useState("");
//   const [shopType, setShopType] = useState("");
//   const [location, setLocation] = useState("");
//   const [image, setImage] = useState("");
//   const [openingTime, setOpeningTime] = useState("");
//   const [closingTime, setClosingTime] = useState("");
//   const [status, setStatus] = useState("open");
//   const [isUploading, setIsUploading] = useState(false);

//   // Animation values
//   const fadeAnim = useState(new Animated.Value(0))[0];
//   const slideAnim = useState(new Animated.Value(30))[0];
//   const cardScale = useState(new Animated.Value(0.9))[0];
//   const buttonScale = useState(new Animated.Value(1))[0];
//   const formOpacity = useState(new Animated.Value(0))[0];
//   const formTranslateY = useState(new Animated.Value(20))[0];

//   useEffect(() => {
//     fetchShops();
    
//     // Start animations
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.timing(cardScale, {
//         toValue: 1,
//         duration: 500,
//         useNativeDriver: true,
//       }),
//       Animated.timing(formOpacity, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.timing(formTranslateY, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   const handleAddShop = () => {
//     if (!name || !shopType || !location || !openingTime || !closingTime) {
//       Alert.alert("Validation Error", "Please fill in all required fields");
//       return;
//     }

//     const shopData = {
//       name,
//       shopType,
//       location,
//       image,
//       openingTime,
//       closingTime,
//       status,
//     };

//     addShop(shopData);
    
//     // Reset form with animation
//     Animated.sequence([
//       Animated.timing(buttonScale, {
//         toValue: 0.9,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//       Animated.timing(buttonScale, {
//         toValue: 1,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Reset form fields
//     setName("");
//     setShopType("");
//     setLocation("");
//     setImage("");
//     setOpeningTime("");
//     setClosingTime("");
//     setStatus("open");
//   };

//   const handlePressIn = () => {
//     Animated.spring(buttonScale, {
//       toValue: 0.95,
//       useNativeDriver: true,
//     }).start();
//   };

//   const handlePressOut = () => {
//     Animated.spring(buttonScale, {
//       toValue: 1,
//       useNativeDriver: true,
//     }).start();
//   };

//   const pickAndUpload = async () => {
//     // Request permissions
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission needed", "Camera roll permissions are required to select images.");
//       return;
//     }

//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       const selectedImage = result.assets[0];
//       setIsUploading(true);
//       const uploadedUrl = await uploadToCloudinary(selectedImage);
//       setIsUploading(false);
//       if (uploadedUrl) {
//         setImage(uploadedUrl);
//         Alert.alert("Success", "Image uploaded successfully!");
//       } else {
//         Alert.alert("Error", "Failed to upload image.");
//       }
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       style={{ flex: 1 }}
//     >
//       <ScrollView
//         contentContainerStyle={styles.container}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Header Section */}
//         <Animated.View 
//           style={[
//             styles.header,
//             {
//               opacity: fadeAnim,
//               transform: [{ translateY: slideAnim }]
//             }
//           ]}
//         >
//           <Text style={styles.heading}>Add New Shop</Text>
//           <Text style={styles.subHeading}>Fill in your shop details below</Text>
//         </Animated.View>

//         {/* Form Section */}
//         <Animated.View 
//           style={[
//             styles.formContainer,
//             {
//               opacity: formOpacity,
//               transform: [{ translateY: formTranslateY }]
//             }
//           ]}
//         >
//           <View style={styles.inputContainer}>
//             <Ionicons name="storefront" size={20} color="#666" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="Shop Name *"
//               placeholderTextColor="#999"
//               value={name}
//               onChangeText={setName}
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <Ionicons name="pricetags" size={20} color="#666" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="Shop Type *"
//               placeholderTextColor="#999"
//               value={shopType}
//               onChangeText={setShopType}
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <Ionicons name="location" size={20} color="#666" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="Location *"
//               placeholderTextColor="#999"
//               value={location}
//               onChangeText={setLocation}
//             />
//           </View>

//           <View style={styles.imageSection}>
//             <TouchableOpacity
//               style={[styles.button, isUploading && { opacity: 0.6 }]}
//               onPress={pickAndUpload}
//               disabled={isUploading}
//             >
//               <View style={styles.buttonContent}>
//                 <Ionicons name="camera" size={22} color="#fff" />
//                 <Text style={styles.buttonText}>
//                   {isUploading ? "Uploading..." : "Pick & Upload Image"}
//                 </Text>
//               </View>
//             </TouchableOpacity>

//             {image ? (
//               <View style={styles.imagePreview}>
//                 <Text style={styles.imageUrlText}>Image URL: {image}</Text>
//               </View>
//             ) : null}
//           </View>

//           <View style={styles.timeContainer}>
//             <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
//               <Ionicons name="sunny" size={20} color="#666" style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Opening Time *"
//                 placeholderTextColor="#999"
//                 value={openingTime}
//                 onChangeText={setOpeningTime}
//               />
//             </View>

//             <View style={[styles.inputContainer, { flex: 1 }]}>
//               <Ionicons name="moon" size={20} color="#666" style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Closing Time *"
//                 placeholderTextColor="#999"
//                 value={closingTime}
//                 onChangeText={setClosingTime}
//               />
//             </View>
//           </View>

//           <View style={styles.pickerContainer}>
//             <Ionicons name="stats-chart" size={20} color="#666" style={styles.pickerIcon} />
//             <Picker
//               selectedValue={status}
//               onValueChange={(itemValue) => setStatus(itemValue)}
//               mode="dropdown"
//               style={styles.picker}
//             >
//               <Picker.Item label="🟢 Open" value="open" />
//               <Picker.Item label="🔴 Closed" value="closed" />
//             </Picker>
//           </View>

//           <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
//             <TouchableOpacity 
//               style={styles.button}
//               onPress={handleAddShop}
//               onPressIn={handlePressIn}
//               onPressOut={handlePressOut}
//               activeOpacity={0.9}
//             >
//               <View style={styles.buttonContent}>
//                 <Ionicons name="add-circle" size={22} color="#fff" />
//                 <Text style={styles.buttonText}>Add Shop</Text>
//               </View>
//             </TouchableOpacity>
//           </Animated.View>
//         </Animated.View>

//         {/* Shops List Section */}
//         <Animated.View 
//           style={[
//             styles.listContainer,
//             {
//               opacity: fadeAnim,
//               transform: [{ scale: cardScale }]
//             }
//           ]}
//         >
//           <Text style={styles.listHeading}>Your Shops</Text>
          
//           <FlatList
//             data={shops}
//             keyExtractor={(item) => item._id}
//             renderItem={({ item, index }) => (
//               <ShopCard 
//                 item={item} 
//                 index={index}
//                 onPress={() => router.push(`/shops/${item.name}` as any)}
//               />
//             )}
//             ListEmptyComponent={
//               <View style={styles.emptyState}>
//                 <Ionicons name="storefront-outline" size={60} color="#ccc" />
//                 <Text style={styles.emptyStateText}>No shops yet</Text>
//                 <Text style={styles.emptyStateSubText}>
//                   Add your first shop to get started!
//                 </Text>
//               </View>
//             }
//             scrollEnabled={false}
//             contentContainerStyle={styles.listContent}
//           />
//         </Animated.View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     paddingVertical: 20,
//     paddingHorizontal: 20,
//     backgroundColor: "#f8f9fa",
//     flexGrow: 1,
//   },
//   header: {
//     alignItems: "center",
//     marginBottom: 30,
//   },
//   heading: {
//     fontSize: 32,
//     fontWeight: "bold",
//     marginBottom: 8,
//     textAlign: "center",
//     color: COLORS.primary,
//   },
//   subHeading: {
//     fontSize: 16,
//     color: "#666",
//     textAlign: "center",
//   },
//   formContainer: {
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 25,
//     marginBottom: 30,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.1,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#e1e5e9",
//     borderRadius: 15,
//     marginBottom: 15,
//     backgroundColor: "#fafbfc",
//   },
//   inputIcon: {
//     paddingHorizontal: 15,
//   },
//   input: {
//     flex: 1,
//     height: 55,
//     fontSize: 16,
//     color: "#333",
//     paddingRight: 15,
//   },
//   timeContainer: {
//     flexDirection: "row",
//     marginBottom: 15,
//   },
//   pickerContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#e1e5e9",
//     borderRadius: 15,
//     marginBottom: 20,
//     backgroundColor: "#fafbfc",
//     overflow: "hidden",
//   },
//   pickerIcon: {
//     paddingHorizontal: 15,
//   },
//   picker: {
//     flex: 1,
//     height: 55,
//   },
//   button: {
//     borderRadius: 15,
//     backgroundColor: COLORS.primary,
//     shadowColor: COLORS.primary,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   buttonContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 18,
//     marginLeft: 8,
//   },
//   listContainer: {
//     marginBottom: 30,
//   },
//   listHeading: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 20,
//     color: COLORS.primary,
//     textAlign: "center",
//   },
//   listContent: {
//     paddingBottom: 50,
//   },
//   card: {
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 20,
//     marginVertical: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.1,
//     shadowRadius: 15,
//     elevation: 5,
//     borderWidth: 1,
//     borderColor: "#f0f0f0",
//   },
//   cardHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 15,
//   },
//   cardTitle: {
//     fontWeight: "bold",
//     fontSize: 20,
//     color: "#2c3e50",
//     flex: 1,
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   statusText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 12,
//   },
//   cardContent: {
//     marginBottom: 15,
//   },
//   cardRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   cardText: {
//     color: "#555",
//     fontSize: 14,
//     marginLeft: 8,
//     flex: 1,
//   },
//   cardFooter: {
//     borderTopWidth: 1,
//     borderTopColor: "#eee",
//     paddingTop: 12,
//     alignItems: "flex-end",
//   },
//   viewDetailsText: {
//     color: COLORS.primary,
//     fontWeight: "600",
//     fontSize: 12,
//   },
//   emptyState: {
//     alignItems: "center",
//     padding: 40,
//   },
//   emptyStateText: {
//     fontSize: 18,
//     color: "#666",
//     marginTop: 10,
//     fontWeight: "600",
//   },
//   emptyStateSubText: {
//     fontSize: 14,
//     color: "#999",
//     marginTop: 5,
//     textAlign: "center",
//   },
//   imageSection: {
//     marginBottom: 15,
//   },
//   imagePreview: {
//     marginTop: 10,
//     padding: 10,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 10,
//   },
//   imageUrlText: {
//     fontSize: 12,
//     color: "#666",
//     textAlign: "center",
//   },
// });
