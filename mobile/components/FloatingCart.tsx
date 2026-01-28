import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import CheckoutModal from './CheckoutModal';

const { width, height } = Dimensions.get('window');

interface FloatingCartProps {
  visible?: boolean;
  onToggle?: () => void;
}

export default function FloatingCart({ visible = true, onToggle }: FloatingCartProps) {
  const {
    cart,
    getCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    checkout,
    user,
    token
  } = useAuthStore();

  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [buttonFadeAnim] = useState(new Animated.Value(1)); // Always visible
  const [modalFadeAnim] = useState(new Animated.Value(0)); // For modal overlay
  const [slideAnim] = useState(new Animated.Value(100));

  useEffect(() => {
    // Load cart when user is authenticated
    if (user && token) {
      getCart();
    }
  }, [user, token, getCart]);

  useEffect(() => {
    // Always show the cart button
    Animated.spring(buttonFadeAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const showCartModal = () => {
    setCartModalVisible(true);
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideCartModal = () => {
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCartModalVisible(false);
    });
  };

  const handleQuantityChange = async (subItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      Alert.alert(
        "Remove Item",
        "Remove this item from cart?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            onPress: () => removeFromCart(subItemId),
            style: "destructive"
          }
        ]
      );
      return;
    }

    try {
      await updateCartItem(subItemId, newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleCheckout = () => {
    // Close cart modal and open checkout modal
    hideCartModal();
    setTimeout(() => {
      setCheckoutModalVisible(true);
    }, 300); // Small delay for smooth transition
  };

  const handleClearCart = async () => {
    console.log("🗑️ handleClearCart called - clearing immediately");
    try {
      await clearCart();
      console.log("✅ clearCart completed, hiding modal");
      hideCartModal();
    } catch (error) {
      console.error("❌ Clear cart error:", error);
    }
  };

  if (!visible || !user || !token) return null;

  return (
    <>
      {/* Floating Cart Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            opacity: buttonFadeAnim,
            transform: [{
              scale: buttonFadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.cartButton}
          onPress={showCartModal}
          activeOpacity={0.8}
        >
          <Ionicons name="bag-handle-outline" size={24} color="#fff" />
          {cart?.itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cart.itemCount > 99 ? '99+' : cart.itemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Cart Modal */}
      <Modal
        visible={cartModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideCartModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: modalFadeAnim }
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={hideCartModal}
          />

          <Animated.View
            style={[
              styles.cartModal,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Header */}
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Shopping Cart</Text>
              <TouchableOpacity
                onPress={hideCartModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Cart Items */}
            {cart?.items?.length > 0 ? (
              <>
                <FlatList
                  data={cart.items}
                  keyExtractor={(item) => item._id || Math.random().toString()}
                  style={styles.cartList}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                      {/* Item Image */}
                      {item.subItemId?.images?.length > 0 ? (
                        <Image
                          source={{ uri: item.subItemId.images[0] }}
                          style={styles.itemImage}
                        />
                      ) : (
                        <View style={[styles.itemImage, styles.placeholderImage]}>
                          <Ionicons name="image-outline" size={20} color="#ccc" />
                        </View>
                      )}

                      {/* Item Details */}
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.subItemId?.name || 'Unknown Item'}
                        </Text>
                        <Text style={styles.itemPrice}>
                          ₹{item.price || 0} each
                        </Text>
                      </View>

                      {/* Quantity Controls */}
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleQuantityChange(item.subItemId._id, item.quantity - 1)}
                        >
                          <Ionicons name="remove" size={16} color="#007AFF" />
                        </TouchableOpacity>

                        <Text style={styles.quantityText}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleQuantityChange(item.subItemId._id, item.quantity + 1)}
                        >
                          <Ionicons name="add" size={16} color="#007AFF" />
                        </TouchableOpacity>
                      </View>

                      {/* Item Total */}
                      <View style={styles.itemTotal}>
                        <Text style={styles.itemTotalText}>
                          ₹{(item.price * item.quantity) || 0}
                        </Text>
                      </View>
                    </View>
                  )}
                />

                {/* Cart Footer */}
                <View style={styles.cartFooter}>
                  <View style={styles.cartSummary}>
                    <Text style={styles.summaryLabel}>Total Items:</Text>
                    <Text style={styles.summaryValue}>{cart.itemCount}</Text>
                  </View>

                  <View style={styles.cartSummary}>
                    <Text style={styles.summaryLabel}>Total Amount:</Text>
                    <Text style={styles.totalAmount}>₹{cart.totalAmount || 0}</Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={handleClearCart}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkoutButton}
                      onPress={handleCheckout}
                    >
                      <Ionicons name="card-outline" size={18} color="#fff" />
                      <Text style={styles.checkoutButtonText}>Checkout</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyCart}>
                <Ionicons name="bag-handle-outline" size={60} color="#E0E0E0" />
                <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                <Text style={styles.emptyCartText}>
                  Add some items to get started
                </Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Checkout Modal */}
      <CheckoutModal
        visible={checkoutModalVisible}
        onClose={() => setCheckoutModalVisible(false)}
        cartItems={cart?.items || []}
        totalAmount={cart?.totalAmount || 0}
        shopId={cart?.items?.[0]?.subItemId?.parentItemId?.shop_id?._id || ''}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 1000,
  },
  cartButton: {
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  cartModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    minHeight: height * 0.4,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  cartList: {
    maxHeight: height * 0.5,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  cartFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 6,
  },
  checkoutButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  checkoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 6,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
