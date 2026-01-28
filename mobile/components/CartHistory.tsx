import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';

const { width } = Dimensions.get('window');

interface CartHistoryItem {
  _id: string;
  action: 'add' | 'remove' | 'update' | 'checkout' | 'clear';
  subItemId: {
    _id: string;
    name: string;
    images: string[];
  };
  subItemDetails: {
    name: string;
    price: number;
    category: string;
    brand: string;
    images: string[];
  };
  quantity: number;
  previousQuantity: number;
  totalAmount: number;
  timestamp: string;
}

interface HistoryGroup {
  [date: string]: CartHistoryItem[];
}

export default function CartHistory() {
  const [history, setHistory] = useState<HistoryGroup>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const { token } = useAuthStore();

  useEffect(() => {
    fetchHistory();
  }, [selectedAction]);

  const fetchHistory = async (loadMore = false) => {
    try {
      if (loadMore && !hasMore) return;

      const currentPage = loadMore ? page + 1 : 1;
      const actionParam = selectedAction !== 'all' ? `&action=${selectedAction}` : '';

      const response = await fetch(
        `http://localhost:3000/api/cart-history?page=${currentPage}&limit=20${actionParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();

      if (loadMore) {
        setHistory(prev => ({
          ...prev,
          ...data.history
        }));
        setPage(currentPage);
      } else {
        setHistory(data.history || {});
        setPage(1);
      }

      setHasMore(currentPage < data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching cart history:', error);
      Alert.alert('Error', 'Failed to load cart history');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add': return 'add-circle';
      case 'remove': return 'remove-circle';
      case 'update': return 'refresh-circle';
      case 'checkout': return 'card';
      case 'clear': return 'trash';
      default: return 'ellipse';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add': return '#34C759';
      case 'remove': return '#FF3B30';
      case 'update': return '#FF9500';
      case 'checkout': return '#007AFF';
      case 'clear': return '#8E8E93';
      default: return '#666';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'add': return 'Added to cart';
      case 'remove': return 'Removed from cart';
      case 'update': return 'Updated quantity';
      case 'checkout': return 'Purchased';
      case 'clear': return 'Cart cleared';
      default: return action;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = ({ item }: { item: CartHistoryItem }) => (
    <View style={styles.historyItem}>
      {/* Action Icon */}
      <View style={[styles.actionIcon, { backgroundColor: `${getActionColor(item.action)}20` }]}>
        <Ionicons
          name={getActionIcon(item.action) as any}
          size={20}
          color={getActionColor(item.action)}
        />
      </View>

      {/* Item Details */}
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.subItemDetails?.name || item.subItemId?.name || 'Unknown Item'}
          </Text>
          <Text style={styles.actionText}>
            {getActionText(item.action)}
          </Text>
        </View>

        <View style={styles.itemMeta}>
          <Text style={styles.itemPrice}>
            ₹{item.subItemDetails?.price || 0}
          </Text>
          <Text style={styles.itemCategory}>
            {item.subItemDetails?.category || 'N/A'}
          </Text>
        </View>

        {item.quantity > 0 && (
          <View style={styles.quantityInfo}>
            <Text style={styles.quantityText}>
              Quantity: {item.quantity}
            </Text>
            {item.previousQuantity > 0 && item.previousQuantity !== item.quantity && (
              <Text style={styles.previousQuantityText}>
                (was {item.previousQuantity})
              </Text>
            )}
          </View>
        )}

        <Text style={styles.timestamp}>
          {formatTime(item.timestamp)}
        </Text>
      </View>

      {/* Item Image */}
      {(item.subItemDetails?.images?.length > 0 || item.subItemId?.images?.length > 0) && (
        <Image
          source={{
            uri: item.subItemDetails?.images?.[0] || item.subItemId?.images?.[0]
          }}
          style={styles.itemImage}
        />
      )}
    </View>
  );

  const renderDateSection = ({ item: date }: { item: string }) => (
    <View key={date}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{formatDate(date + 'T00:00:00')}</Text>
        <Text style={styles.dateCount}>
          {history[date].length} action{history[date].length !== 1 ? 's' : ''}
        </Text>
      </View>

      {history[date].map((historyItem) => (
        <View key={historyItem._id}>
          {renderHistoryItem({ item: historyItem })}
        </View>
      ))}
    </View>
  );

  const actionFilters = [
    { label: 'All', value: 'all' },
    { label: 'Added', value: 'add' },
    { label: 'Removed', value: 'remove' },
    { label: 'Updated', value: 'update' },
    { label: 'Purchased', value: 'checkout' },
  ];

  const dates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading cart history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cart History</Text>
        <Text style={styles.subtitle}>Track your cart activities</Text>
      </View>

      {/* Action Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {actionFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              selectedAction === filter.value && styles.filterButtonActive
            ]}
            onPress={() => setSelectedAction(filter.value)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedAction === filter.value && styles.filterButtonTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* History List */}
      {dates.length > 0 ? (
        <FlatList
          data={dates}
          keyExtractor={(date) => date}
          renderItem={renderDateSection}
          showsVerticalScrollIndicator={false}
          onEndReached={() => fetchHistory(true)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.historyList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={80} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptyText}>
            Your cart activities will appear here
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  historyList: {
    padding: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dateCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  quantityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 12,
    color: '#666',
  },
  previousQuantityText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 12,
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
