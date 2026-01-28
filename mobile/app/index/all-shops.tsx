import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

interface Shop {
  _id: string;
  name: string;
  shopType: string;
  location: string;
  images: string[];
  openingTime: string;
  closingTime: string;
  status: string;
  owner?: {
    username: string;
    email: string;
  };
}

export default function AllShops() {
  const router = useRouter();
  const { allShops, allShopsPagination, fetchAllShops } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadShops(1);
  }, []);

  const loadShops = async (page: number) => {
    setLoading(true);
    try {
      await fetchAllShops(page, 20);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (allShopsPagination?.hasNextPage) {
      loadShops(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (allShopsPagination?.hasPrevPage) {
      loadShops(currentPage - 1);
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
            {item.owner && (
              <Text style={styles.ownerText}>by {item.owner.username}</Text>
            )}
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
          <Ionicons name="storefront" size={32} color="#fff" />
          <Text style={styles.headerTitle}>All Shops</Text>
          <Text style={styles.headerSubtitle}>Discover all available shops</Text>
        </View>
      </LinearGradient>

      <View style={styles.container}>
        {/* Stats */}
        {allShopsPagination && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Showing {allShops.length} of {allShopsPagination.totalShops} shops
            </Text>
            <Text style={styles.pageText}>
              Page {allShopsPagination.currentPage} of {allShopsPagination.totalPages}
            </Text>
          </View>
        )}

        {/* Shops Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading shops...</Text>
          </View>
        ) : allShops.length > 0 ? (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              <View style={styles.gridContainer}>
                {allShops.map((shop) => (
                  <View key={shop._id} style={styles.gridItem}>
                    <ShopCard item={shop} />
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Pagination */}
            {allShopsPagination && allShopsPagination.totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    !allShopsPagination.hasPrevPage && styles.paginationButtonDisabled
                  ]}
                  onPress={handlePrevPage}
                  disabled={!allShopsPagination.hasPrevPage}
                >
                  <Ionicons name="chevron-back" size={20} color="#fff" />
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </TouchableOpacity>

                <View style={styles.pageIndicator}>
                  <Text style={styles.pageIndicatorText}>
                    {allShopsPagination.currentPage} / {allShopsPagination.totalPages}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    !allShopsPagination.hasNextPage && styles.paginationButtonDisabled
                  ]}
                  onPress={handleNextPage}
                  disabled={!allShopsPagination.hasNextPage}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No shops found</Text>
            <Text style={styles.emptyStateText}>
              There are no shops available at the moment.
            </Text>
          </View>
        )}
      </View>
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
  },
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#e0f2fe",
    marginTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  pageText: {
    fontSize: 14,
    color: COLORS.primary,
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
  scrollContainer: {
    padding: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 50) / 2, // 2 columns with padding
    marginBottom: 20,
  },
  cardTouchable: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    minHeight: 280,
  },
  cardImageContainer: {
    position: 'relative',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  cardImagePlaceholder: {
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardArrow: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLeftArrow: {
    left: 8,
  },
  cardRightArrow: {
    right: 8,
  },
  cardDots: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -25 }],
    flexDirection: 'row',
  },
  cardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 2,
  },
  cardDotActive: {
    backgroundColor: '#fff',
  },
  cardHeader: {
    marginBottom: 8,
  },
  shopInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  ownerText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  cardBody: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  viewButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  pageIndicator: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});