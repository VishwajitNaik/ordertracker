import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function SubItemDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [subItem, setSubItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch the selected sub-item by ID on mount
  useEffect(() => {
    const fetchSingleSubItem = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/subitems/${params.subItemId}`);
        if (res.ok) {
          const fetchedSubItem = await res.json();
          setSubItem(fetchedSubItem);
        }
      } catch (err) {
        console.error("Error loading sub-item:", err);
      } finally {
        setLoading(false);
      }
    };
    if (params.subItemId) fetchSingleSubItem();
  }, [params.subItemId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#007AFF" size="large" />
        <Text>Loading sub-item...</Text>
      </View>
    );
  }

  if (!subItem) {
    return (
      <View style={styles.center}>
        <Text>Sub-item not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Sub-Item Image Carousel */}
        <View style={styles.header}>
          {subItem.images && subItem.images.length > 0 ? (
            <View style={styles.imageSliderContainer}>
              <Image source={{ uri: subItem.images[currentImageIndex] }} style={styles.carouselImage} />

              {subItem.images.length > 1 && (
                <>
                  {/* Left Arrow */}
                  <TouchableOpacity
                    style={[styles.sliderArrow, styles.leftArrow]}
                    onPress={() => setCurrentImageIndex(
                      currentImageIndex === 0 ? subItem.images.length - 1 : currentImageIndex - 1
                    )}
                  >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  {/* Right Arrow */}
                  <TouchableOpacity
                    style={[styles.sliderArrow, styles.rightArrow]}
                    onPress={() => setCurrentImageIndex(
                      currentImageIndex === subItem.images.length - 1 ? 0 : currentImageIndex + 1
                    )}
                  >
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                  </TouchableOpacity>

                  {/* Dots Indicator */}
                  <View style={styles.dotsContainer}>
                    {subItem.images.map((_: string, index: number) => (
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
            <View style={[styles.carouselImage, styles.placeholder]}>
              <Text style={{ color: "#777" }}>No Images</Text>
            </View>
          )}
          <Text style={styles.title}>{subItem.name}</Text>
          <Text style={styles.subtitle}>{subItem.category}</Text>
        </View>

        {/* Sub-Item Details */}
        <View style={styles.card}>
          <Text style={styles.info}>Quantity: {subItem.quantity}</Text>
          <Text style={styles.info}>Price: ₹{subItem.Price}</Text>
          <Text style={styles.info}>Description: {subItem.description}</Text>
          <Text style={styles.info}>Brand: {subItem.brand}</Text>
          <Text style={styles.info}>Model: {subItem.model}</Text>
        </View>

        {/* Back Button */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.smallButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>← Back to Item</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    width: "100%",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  info: {
    fontSize: 16,
    color: "#444",
    marginBottom: 6,
    textAlign: "center",
  },
  smallButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  carouselImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.3,
    marginBottom: 20,
    resizeMode: 'cover',
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
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  placeholder: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
