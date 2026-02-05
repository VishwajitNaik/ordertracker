import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface Travel {
  _id: string;
  vehicleId?: {
    _id: string;
    vehicleType: string;
    vehicleNumber: string;
    vehicleImages: string[];
  };
  veichelType: string;
  from: string;
  to: string;
  date: string;
  gotime: string;
  arrivaltime: string;
  status?: string;
  createdBy?: {
    _id: string;
    username: string;
    phone?: string;
  };
  requestedUsers?: any[];
  capacity?: number;
  availableSpace?: number;
}

export default function TravelDetail() {
  const { travel: travelId } = useLocalSearchParams();
  const { user, token, currentTravel, fetchTravelById } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);

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

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  // Fetch travel data when screen is focused (including when returning from send-request page)
  useFocusEffect(
    useCallback(() => {
      const loadTravel = async () => {
        if (travelId) {
          setLoading(true);
          await fetchTravelById(travelId as string);
          setLoading(false);
        }
      };
      loadTravel();
    }, [travelId, fetchTravelById])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading travel details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentTravel) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={100} color="#E0E0E0" />
          <Text style={styles.errorTitle}>Travel Not Found</Text>
          <Text style={styles.errorMessage}>
            The travel details you're looking for are not available or have been removed.
          </Text>
          <TouchableOpacity
            style={styles.backButton1}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = user && currentTravel.createdBy && currentTravel.createdBy._id === user._id;
  console.log('🔵 isOwner:', isOwner);
  console.log('🔵 user:', user);
  console.log('🔵 currentTravel.createdBy:', currentTravel.createdBy);

  // Get all requests made by the current user
  const userRequests = user && currentTravel.requestedUsers
    ? currentTravel.requestedUsers.filter((req: any) => req.userId._id === user._id)
    : [];
  
  // Get IDs of products and orders already requested by the user
  const requestedProductIds = userRequests
    .filter((req: any) => req.productId)
    .map((req: any) => req.productId._id || req.productId);
  
  const requestedOrderIds = userRequests
    .filter((req: any) => req.orderId)
    .map((req: any) => req.orderId._id || req.orderId);
  
  const vehicleImages = currentTravel.vehicleId?.vehicleImages || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Travel Details</Text>
          <Text style={styles.headerSubtitle}>{currentTravel.veichelType}</Text>
        </View>
        <View style={styles.headerActions}>
          {userRequests.length > 0 && (
            <View style={styles.headerBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.headerBadgeText}>{userRequests.length} Request{userRequests.length > 1 ? 's' : ''}</Text>
            </View>
          )}
          {isOwner && (
            <View style={[styles.headerBadge, styles.ownerBadge]}>
              <Ionicons name="person" size={16} color="#fff" />
              <Text style={styles.headerBadgeText}>Your Travel</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        {vehicleImages.length > 0 ? (
          <View style={styles.imageSection}>
            <Image 
              source={{ uri: vehicleImages[imageIndex] }} 
              style={styles.vehicleImage} 
            />
            {vehicleImages.length > 1 && (
              <View style={styles.imagePagination}>
                {vehicleImages.map((_, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.imageDot,
                      index === imageIndex && styles.imageDotActive
                    ]}
                  />
                ))}
              </View>
            )}
            <View style={styles.vehicleTypeBadge}>
              <Ionicons name="car-sport" size={16} color="#fff" />
              <Text style={styles.vehicleTypeText}>{currentTravel.veichelType}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="car-outline" size={80} color="#E0E0E0" />
            <Text style={styles.noImageText}>No Vehicle Images</Text>
          </View>
        )}

        {/* Route Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <Ionicons name="map-outline" size={24} color={COLORS.primary} />
            <Text style={styles.routeTitle}>Travel Route</Text>
          </View>
          
          <View style={styles.routeVisualization}>
            <View style={styles.routePoint}>
              <View style={styles.routeDotStart}>
                <View style={styles.routeDotInner} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Departure</Text>
                <Text style={styles.routeValue}>{currentTravel.from}</Text>
              </View>
            </View>
            
            <View style={styles.routeLine}>
              <View style={styles.routeLineDots}>
                <View style={styles.routeLineDot} />
                <View style={styles.routeLineDot} />
                <View style={styles.routeLineDot} />
              </View>
              <Ionicons name="arrow-down" size={20} color={COLORS.primary} />
            </View>
            
            <View style={styles.routePoint}>
              <View style={styles.routeDotEnd}>
                <View style={styles.routeDotInner} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Destination</Text>
                <Text style={styles.routeValue}>{currentTravel.to}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule Card */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
            <Text style={styles.scheduleTitle}>Schedule Details</Text>
          </View>
          
          <View style={styles.scheduleGrid}>
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleIcon}>
                <Ionicons name="calendar" size={20} color="#fff" />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>{formatDate(currentTravel.date)}</Text>
              </View>
            </View>
            
            <View style={styles.scheduleItem}>
              <View style={[styles.scheduleIcon, styles.departureIcon]}>
                <Ionicons name="time" size={20} color="#fff" />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Departure</Text>
                <Text style={styles.scheduleValue}>{formatTime(currentTravel.gotime)}</Text>
              </View>
            </View>
            
            <View style={styles.scheduleItem}>
              <View style={[styles.scheduleIcon, styles.arrivalIcon]}>
                <Ionicons name="time" size={20} color="#fff" />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Arrival</Text>
                <Text style={styles.scheduleValue}>{formatTime(currentTravel.arrivaltime)}</Text>
              </View>
            </View>
            
            <View style={styles.scheduleItem}>
              <View style={[styles.scheduleIcon, styles.durationIcon]}>
                <Ionicons name="speedometer" size={20} color="#fff" />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Status</Text>
                <Text style={[styles.scheduleValue, styles.statusActive]}>
                  {currentTravel.status || 'Active'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Host Card */}
        {currentTravel.createdBy && (
          <View style={styles.hostCard}>
            <View style={styles.hostHeader}>
              <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
              <Text style={styles.hostTitle}>Travel Host</Text>
            </View>
            
            <View style={styles.hostInfo}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostAvatarText}>
                  {currentTravel.createdBy.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.hostDetails}>
                <Text style={styles.hostName}>{currentTravel.createdBy.username}</Text>
                {currentTravel.createdBy.phone && (
                  <View style={styles.hostContact}>
                    <Ionicons name="call-outline" size={14} color="#666" />
                    <Text style={styles.hostPhone}>{currentTravel.createdBy.phone}</Text>
                  </View>
                )}
              </View>
              {isOwner ? (
                <View style={styles.hostBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#FF9800" />
                  <Text style={styles.hostBadgeText}>You</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.contactButton}>
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Vehicle Info Card */}
        {currentTravel.vehicleId && (
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Ionicons name="car-outline" size={24} color={COLORS.primary} />
              <Text style={styles.vehicleTitle}>Vehicle Details</Text>
            </View>
            
            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleDetail}>
                <Text style={styles.vehicleLabel}>Vehicle Type</Text>
                <Text style={styles.vehicleValue}>{currentTravel.vehicleId.vehicleType}</Text>
              </View>
              
              <View style={styles.vehicleDetail}>
                <Text style={styles.vehicleLabel}>Vehicle Number</Text>
                <Text style={styles.vehicleValue}>{currentTravel.vehicleId.vehicleNumber}</Text>
              </View>
              
              <View style={styles.vehicleDetail}>
                <Text style={styles.vehicleLabel}>Images</Text>
                <Text style={styles.vehicleValue}>{vehicleImages.length}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Requests Section */}
        {currentTravel.requestedUsers && currentTravel.requestedUsers.length > 0 && (
          <View style={styles.requestsSection}>
            <View style={styles.requestsHeader}>
              <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
              <Text style={styles.requestsTitle}>
                Delivery Requests ({currentTravel.requestedUsers.length})
              </Text>
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsBadgeText}>{currentTravel.requestedUsers.length}</Text>
              </View>
            </View>
            
            {currentTravel.requestedUsers.map((request: any, index: number) => {
              console.log(`🔵 Request ${index}:`, request);
              console.log(`🔵 Request ${index} status:`, request.status);
              console.log(`🔵 Request ${index} type:`, request.requestType);
              console.log(`🔵 Request ${index} should show accept button:`, isOwner && request.status === 'pending');

              return (
              <View key={index} style={styles.requestCard}>
                <View style={styles.requestInfo}>
                  <View style={styles.requestUserInfo}>
                    <View style={styles.requestUserAvatar}>
                      <Text style={styles.requestUserAvatarText}>
                        {request.userId.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.requestUserName}>{request.userId.username}</Text>
                      <Text style={styles.requestProduct}>
                        {request.requestType === 'product'
                          ? request.productId?.Title || 'Product'
                          : request.orderId?.orderId || 'Order'}
                      </Text>
                      <Text style={styles.requestMeta}>
                        {request.fromUserId?.username} → {request.toUserId?.username}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.requestPriceContainer}>
                    <Text style={styles.requestPriceLabel}>Offer Price</Text>
                    <Text style={styles.requestPrice}>₹{request.price}</Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  {isOwner && request.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={async () => {
                        if (request.requestType === 'product' && request.productId) {
                          router.push({
                            pathname: `/proInfo/${request.productId._id}` as any,
                            params: {
                              travelId: travelId as string,
                              requestId: request._id,
                              mode: 'accept'
                            }
                          } as any);
                        } else if (request.requestType === 'order' && request.orderId) {
                          // Accept the order request by calling the backend API
                          try {
                            console.log('🔵 Accept button clicked for order request');
                            console.log('🔵 Request data:', request);
                            console.log('🔵 User:', user);
                            console.log('🔵 Token:', token ? 'present' : 'missing');

                            if (!token) {
                              Alert.alert('Error', 'Authentication required');
                              return;
                            }

                            const orderId = request.orderId._id || request.orderId;
                            console.log('🔵 Order ID:', orderId);
                            console.log('🔵 Travel ID:', travelId);

                            const requestBody = {
                              userId: user._id,
                              orderId: orderId,
                              vehicleType: currentTravel.vehicleId?.vehicleType || currentTravel.veichelType,
                              tentativeTime: currentTravel.arrivaltime,
                              price: request.price,
                            };
                            console.log('🔵 Request body:', requestBody);

                            const apiUrl = `http://localhost:3000/api/travels/${travelId}/accept-request`;
                            console.log('🔵 API URL:', apiUrl);

                            const res = await fetch(apiUrl, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                              },
                              body: JSON.stringify(requestBody),
                            });

                            console.log('🔵 Response status:', res.status);
                            const data = await res.json();
                            console.log('🔵 Response data:', data);

                            if (!res.ok) {
                              throw new Error(data.message || 'Failed to accept request');
                            }

                            Alert.alert('Success', 'Order request accepted successfully!');
                            // Refresh travel data
                            await fetchTravelById(travelId as string);
                          } catch (error: any) {
                            console.error('❌ Error accepting order request:', error);
                            Alert.alert('Error', error.message || 'Failed to accept request');
                          }
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => {
                      if (request.requestType === 'product' && request.productId) {
                        router.push(`/proInfo/${request.productId._id}` as any);
                      } else if (request.requestType === 'order' && request.orderId) {
                        router.push(`/orderInfo/${request.orderId._id}` as any);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewButtonText}>
                      {request.requestType === 'product' ? 'View Product' : 'View Order'}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              );
            })}
          </View>
        )}

        {/* Send Request Button */}
        {!isOwner && (
          <View style={styles.sendRequestContainer}>
            <TouchableOpacity
              style={styles.sendRequestButton}
              onPress={() => router.push(`/send-request/${travelId}` as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.sendRequestButtonText}>
                {userRequests.length > 0 ? 'Send Another Request' : 'Send Delivery Request'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State for No Requests */}
        {(!currentTravel.requestedUsers || currentTravel.requestedUsers.length === 0) && (
          <View style={styles.noRequestsContainer}>
            <Ionicons name="cube-outline" size={60} color="#E0E0E0" />
            <Text style={styles.noRequestsTitle}>No Delivery Requests Yet</Text>
            <Text style={styles.noRequestsText}>
              {isOwner 
                ? "Your travel hasn't received any delivery requests yet."
                : "Be the first to send a delivery request for this travel."
              }
            </Text>
          </View>
        )}

        {/* User's Requests Summary */}
        {userRequests.length > 0 && (
          <View style={styles.userRequestsSummary}>
            <View style={styles.userRequestsSummaryHeader}>
              <Ionicons name="list-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.userRequestsSummaryTitle}>Your Requests ({userRequests.length})</Text>
            </View>
            <Text style={styles.userRequestsSummaryText}>
              You can send more requests for different products or orders.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  ownerBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageSection: {
    height: 220,
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  imageDotActive: {
    backgroundColor: '#fff',
    width: 12,
  },
  vehicleTypeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  vehicleTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noImageContainer: {
    height: 160,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    marginTop: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  routeVisualization: {
    alignItems: 'center',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  routeDotStart: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeDotEnd: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  routeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeLine: {
    alignItems: 'center',
    marginVertical: 4,
    height: 40,
    justifyContent: 'space-between',
  },
  routeLineDots: {
    alignItems: 'center',
  },
  routeLineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginVertical: 2,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  scheduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  departureIcon: {
    backgroundColor: '#4CAF50',
  },
  arrivalIcon: {
    backgroundColor: '#FF9800',
  },
  durationIcon: {
    backgroundColor: '#2196F3',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  scheduleValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  statusActive: {
    color: '#4CAF50',
  },
  hostCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  hostTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hostAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  hostContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostPhone: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hostBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
    marginLeft: 4,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  vehicleInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vehicleDetail: {
    width: '48%',
    marginBottom: 12,
  },
  vehicleLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  vehicleValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  requestsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  requestsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
    flex: 1,
  },
  requestsBadge: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestUserAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  requestUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  requestProduct: {
    fontSize: 14,
    color: '#666',
  },
  requestMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  requestPriceContainer: {
    alignItems: 'flex-end',
  },
  requestPriceLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  requestPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  viewButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  noRequestsContainer: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  noRequestsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noRequestsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  userRequestsSummary: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  userRequestsSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userRequestsSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1565C0',
    marginLeft: 8,
  },
  userRequestsSummaryText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  sendRequestContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  sendRequestButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  sendRequestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  backButton1: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});