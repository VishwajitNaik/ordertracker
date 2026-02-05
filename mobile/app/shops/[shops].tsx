import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  SectionList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { launchImageLibrary } from 'react-native-image-picker';

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

interface Shop {
  _id: string;
  name: string;
  shopType: string;
  location: Address;
  images: string[];
  openingTime: string;
  closingTime: string;
  status: string;
  owner: {
    _id: string;
    username: string;
    email: string;
  };
}

export default function Shops() {
  const params = useLocalSearchParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuthStore();
  const addItem = useAuthStore((state) => state.addItem);
  const fetchItems = useAuthStore((state) => state.fetchItems);
  const itemsFromStore = useAuthStore((state) => state.item); // assuming 'item' is where fetched items are stored
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  // Group items by category
  const groupedItems = itemsFromStore.reduce((acc: any, item: any) => {
    const category = item.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const sections = Object.keys(groupedItems).map(title => ({
    title,
    data: groupedItems[title],
  }));
  const [form, setForm] = useState({
    name: "",
    description: "",
    quantity: "",
    MinPrice: "",
    MaxPrice: "",
    category: "",
    images: [] as any[],
    brand: "",
    model: "",
  });

    // Fetch items when component mounts
  useEffect(() => {
    const loadItems = async () => {
      if (!shop) return; // Wait for shop to be loaded

      setLoading(true);
      try {
        // Fetch items specifically for this shop
        const res = await fetch(`http://localhost:3000/api/items/shop/${shop._id}`);
        if (res.ok) {
          const shopItems = await res.json();
          // Update the auth store with shop-specific items
          useAuthStore.setState({ item: shopItems });
        } else {
          console.error("Failed to fetch shop items");
          useAuthStore.setState({ item: [] });
        }
      } catch (err: any) {
        console.error("Error fetching shop items:", err);
        Alert.alert("Error", err.message || "Failed to fetch items");
        useAuthStore.setState({ item: [] });
      } finally {
        setLoading(false);
      }
    };

    if (shop) {
      loadItems();
    }
  }, [shop]);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        if (!params.shops) {
          console.log("No shop parameter found");
          return;
        }

        console.log("Fetching shop with parameter:", params.shops);
        const shopParam = Array.isArray(params.shops) ? params.shops[0] : params.shops;
        const decodedParam = decodeURIComponent(shopParam);
        console.log("Decoded parameter:", decodedParam);

        const res = await fetch(`http://localhost:3000/api/shops/${shopParam}`);
        console.log("Shop fetch response status:", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("Shop data received:", data);
          console.log("Shop ID:", data._id);
          setShop(data);
        } else {
          console.log("Shop fetch failed:", res.status, res.statusText);
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [params.shops]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      }
    });
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddItem = async () => {
    console.log("handleAddItem called");
    console.log("Current shop state:", shop);

    // Check if shop is loaded
    if (!shop) {
      console.log("Shop is null/undefined");
      Alert.alert("Error", "Shop information not available. Please wait for the page to load.");
      return;
    }

    if (!shop._id) {
      console.log("Shop has no _id:", shop);
      Alert.alert("Error", "Shop ID not found. Please try refreshing the page.");
      return;
    }

    console.log("Shop validation passed. Shop ID:", shop._id);

    // Check required text fields
    const requiredFields = [
      "name",
      "description",
      "quantity",
      "MinPrice",
      "MaxPrice",
      "category",
    ];

    for (const field of requiredFields) {
      const value = form[field as keyof typeof form];
      if (typeof value === 'string' && !value.trim()) {
        Alert.alert("Validation Error", `Please fill in the ${field} field.`);
        return;
      }
    }

    // Check if at least one image is selected
    if (!form.images || form.images.length === 0) {
      Alert.alert("Validation Error", "Please select at least one image.");
      return;
    }

    const itemData = {
      ...form,
      quantity: Number(form.quantity),
      MinPrice: Number(form.MinPrice),
      MaxPrice: Number(form.MaxPrice),
      shop_id: shop._id, // required shop association - now guaranteed to exist
    };

    console.log("Final itemData being passed to addItem:", itemData);
    console.log("Shop ID in itemData:", itemData.shop_id);
    console.log("Shop name:", shop.name);

    try {
      await addItem(itemData);
      Alert.alert("Success", "Item added successfully.");
      setModalVisible(false); // close modal on success
      // Reset form
      setForm({
        name: "",
        description: "",
        quantity: "",
        MinPrice: "",
        MaxPrice: "",
        category: "",
        images: [],
        brand: "",
        model: "",
      });
    } catch (error: any) {
      console.error("Add item error:", error);
      console.error("Error details:", error.message);
      Alert.alert("Error", error.message || "Failed to add item.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading shop...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.center}>
        <Text>Shop not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Shop info with Image Slider */}
        <View style={styles.header}>
          {shop.images && shop.images.length > 0 ? (
            <View style={styles.imageSliderContainer}>
              <Image source={{ uri: shop.images[currentImageIndex] }} style={styles.image} />

              {shop.images.length > 1 && (
                <>
                  {/* Left Arrow */}
                  <TouchableOpacity
                    style={[styles.sliderArrow, styles.leftArrow]}
                    onPress={() => setCurrentImageIndex(
                      currentImageIndex === 0 ? shop.images.length - 1 : currentImageIndex - 1
                    )}
                  >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  {/* Right Arrow */}
                  <TouchableOpacity
                    style={[styles.sliderArrow, styles.rightArrow]}
                    onPress={() => setCurrentImageIndex(
                      currentImageIndex === shop.images.length - 1 ? 0 : currentImageIndex + 1
                    )}
                  >
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                  </TouchableOpacity>

                  {/* Dots Indicator */}
                  <View style={styles.dotsContainer}>
                    {shop.images.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dot,
                          index === currentImageIndex && styles.activeDot
                        ]}
                        onPress={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={{ color: "#777" }}>No Images</Text>
            </View>
          )}
          <Text style={styles.title}>{shop.name}</Text>
          <Text style={styles.subtitle}>{shop.shopType}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            📍 Location: <Text style={styles.value}>{shop.location && shop.location.address ? `${shop.location.address}, ${shop.location.city}` : 'N/A'}</Text>
          </Text>
          <Text style={styles.label}>
            🕒 Opening Time: <Text style={styles.value}>{shop.openingTime}</Text>
          </Text>
          <Text style={styles.label}>
            🕔 Closing Time: <Text style={styles.value}>{shop.closingTime}</Text>
          </Text>
          <Text style={styles.label}>
            ✅ Status:{" "}
            <Text style={[styles.value, { color: shop.status === "Open" ? "green" : "red" }]}>{shop.status}</Text>
          </Text>
        </View>

        {/* Button to open modal - Only show for shop owners */}
        {user && shop && shop.owner._id === user._id && (
          <View style={styles.card}>
            <TouchableOpacity style={styles.smallButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.buttonText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modal for Add Item Form */}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={[styles.title, { fontSize: 20, marginBottom: 15, textAlign: "center" }]}>Add New Item</Text>

                {[
                  { label: "Name", key: "name" },
                  { label: "Description", key: "description", multiline: true },
                  { label: "Quantity", key: "quantity", keyboardType: "numeric" },
                  { label: "Min Price", key: "MinPrice", keyboardType: "numeric" },
                  { label: "Max Price", key: "MaxPrice", keyboardType: "numeric" },
                  { label: "Category", key: "category" },
                  { label: "Brand", key: "brand" },
                  { label: "Model", key: "model" },
                ].map(({ label, key, keyboardType, multiline }) => (
                  <TextInput
                    key={key}
                    style={[styles.input, multiline && { height: 80 }]}
                    placeholder={
                      key === 'brand' || key === 'model'
                        ? label
                        : label + " *"
                    }
                    value={form[key as keyof typeof form] as string}
                    onChangeText={(text) => handleChange(key, text)}
                    keyboardType={keyboardType as any}
                    multiline={multiline}
                    numberOfLines={multiline ? 4 : 1}
                  />
                ))}

                {/* Images Section */}
                <View style={styles.imagesContainer}>
                  <View style={styles.inputLabelContainer}>
                    <Ionicons name="images" size={18} color="#3b82f6" style={styles.inputIcon} />
                    <Text style={styles.inputLabel}>Item Images (Max 3) *</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={pickImages}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle" size={24} color="#3b82f6" />
                    <Text style={styles.addImageText}>
                      Add Images ({form.images.length}/3)
                    </Text>
                  </TouchableOpacity>

                  {form.images.length > 0 && (
                    <View style={styles.imagesPreview}>
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
                    </View>
                  )}
                </View>

                <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={handleAddItem}>
                  <Text style={styles.buttonText}>Add Item</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}>
                  <Text style={{ textAlign: "center", color: "#007AFF" }}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
<View style={{ flex: 1, width: '100%' }}>
  <SectionList
    sections={sections}
    keyExtractor={(item) => item._id}
    renderSectionHeader={({ section }) => (
      <>
        <Text style={styles.sectionHeader}>{section.title}</Text>
        <FlatList
          horizontal
          data={section.data}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }} // padding left and right
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/items/${item._id}` as any)}
              style={styles.itemCard}
            >
              {item.images && item.images.length > 0 ? (
                <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                  <Ionicons name="image-outline" size={24} color="#cbd5e1" />
                </View>
              )}
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemInfo}>Qty: {item.quantity}</Text>
              <Text style={styles.itemInfo}>₹{item.MinPrice} - ₹{item.MaxPrice}</Text>
            </TouchableOpacity>
          )}
        />
      </>
    )}
    renderItem={() => null}
  />
</View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
    cardsContainer: {
    paddingVertical: 10,
  },
    itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  itemInfo: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    marginBottom: 2,
  },
    itemCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 10,
  marginLeft: 0,
    backgroundColor: "#fff",
    padding: 15,
    elevation: 2,
    alignItems: "center",
  },
    sectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#eee",
  },
  itemImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.3,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  imageSliderContainer: {
    position: "relative",
  },
  sliderArrow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -12 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 5,
  },
  value: {
    fontWeight: "400",
    color: "#333",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
    textAlign: "center",
  },
  smallButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxHeight: "90%",
    padding: 20,
    elevation: 5,
  },
  imagesContainer: {
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
});
