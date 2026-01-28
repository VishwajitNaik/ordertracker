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
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface Address {
  _id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface DailyRoute {
  _id: string;
  from: Address;
  to: Address;
  days: string[];
  goTime: string;
  arrivalTime: string;
  isActive: boolean;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DailyRoutes() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [routes, setRoutes] = useState<DailyRoute[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [selectedFromId, setSelectedFromId] = useState('');
  const [selectedToId, setSelectedToId] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [goTime, setGoTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [saving, setSaving] = useState(false);

  // Dropdown states
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [filteredFromAddresses, setFilteredFromAddresses] = useState<Address[]>([]);
  const [filteredToAddresses, setFilteredToAddresses] = useState<Address[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user || !token) return;

    try {
      // Fetch addresses
      const addressesResponse = await fetch(`http://localhost:3000/api/userdetails/addresses/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (addressesResponse.ok) {
        const addressesData = await addressesResponse.json();
        setAddresses(addressesData);
      }

      // Fetch daily routes
      const routesResponse = await fetch(`http://localhost:3000/api/userdetails/daily-routes/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (routesResponse.ok) {
        const routesData = await routesResponse.json();
        setRoutes(routesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFromChange = (text: string) => {
    setFromAddress(text);

    if (text.trim() === '') {
      setFilteredFromAddresses([]);
      setShowFromDropdown(false);
      return;
    }

    const filtered = addresses.filter(addr =>
      addr.address.toLowerCase().includes(text.toLowerCase()) ||
      addr.city.toLowerCase().includes(text.toLowerCase()) ||
      addr.label.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredFromAddresses(filtered);
    setShowFromDropdown(filtered.length > 0);
  };

  const handleToChange = (text: string) => {
    setToAddress(text);

    if (text.trim() === '') {
      setFilteredToAddresses([]);
      setShowToDropdown(false);
      return;
    }

    const filtered = addresses.filter(addr =>
      addr.address.toLowerCase().includes(text.toLowerCase()) ||
      addr.city.toLowerCase().includes(text.toLowerCase()) ||
      addr.label.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredToAddresses(filtered);
    setShowToDropdown(filtered.length > 0);
  };

  const selectFromAddress = (address: Address) => {
    setFromAddress(`${address.address}, ${address.city}, ${address.state}`);
    setSelectedFromId(address._id);
    setShowFromDropdown(false);
  };

  const selectToAddress = (address: Address) => {
    setToAddress(`${address.address}, ${address.city}, ${address.state}`);
    setSelectedToId(address._id);
    setShowToDropdown(false);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSaveRoute = async () => {
    if (!selectedFromId || !selectedToId || selectedDays.length === 0 || !goTime || !arrivalTime) {
      Alert.alert('Error', 'Please fill all required fields and select at least one day');
      return;
    }

    setSaving(true);
    try {
      const routeData = {
        from: selectedFromId,
        to: selectedToId,
        days: selectedDays,
        goTime,
        arrivalTime,
      };

      const response = await fetch('http://localhost:3000/api/userdetails/daily-routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(routeData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Daily route schedule created successfully');
        // Clear form
        setFromAddress('');
        setToAddress('');
        setSelectedFromId('');
        setSelectedToId('');
        setSelectedDays([]);
        setGoTime('');
        setArrivalTime('');
        // Refresh routes
        fetchData();
      } else {
        Alert.alert('Error', data.message || 'Failed to create route');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create route');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this daily route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://localhost:3000/api/userdetails/daily-routes/${routeId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                Alert.alert('Success', 'Route deleted successfully');
                fetchData();
              } else {
                const data = await response.json();
                Alert.alert('Error', data.message || 'Failed to delete route');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete route');
            }
          },
        },
      ]
    );
  };

  const renderRouteCard = ({ item }: { item: DailyRoute }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeTitle}>Daily Route</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteRoute(item._id)}
        >
          <Ionicons name="trash" size={16} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.primary} />
          <Text style={styles.addressText} numberOfLines={1}>
            From: {item.from.address}, {item.from.city}
          </Text>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color="#e74c3c" />
          <Text style={styles.addressText} numberOfLines={1}>
            To: {item.to.address}, {item.to.city}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.timeText}>
            {item.goTime} - {item.arrivalTime}
          </Text>
        </View>

        <View style={styles.daysContainer}>
          <Text style={styles.daysLabel}>Days:</Text>
          <View style={styles.daysRow}>
            {item.days.map((day, index) => (
              <Text key={index} style={styles.dayBadge}>
                {day.slice(0, 3)}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.mainContainer}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Daily Route Scheduling</Text>
        </View>

        {/* Create Route Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Create New Route</Text>

          {/* From Address */}
          <Text style={styles.label}>From Address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Select from address"
              value={fromAddress}
              onChangeText={handleFromChange}
              onFocus={() => {
                setShowFromDropdown(true);
                setShowToDropdown(false); // Close other dropdown
                if (addresses.length > 0) {
                  setFilteredFromAddresses(addresses.slice(0, 5));
                }
              }}
              onBlur={() => {
                // Delay hiding to allow selection
                setTimeout(() => {
                  if (!showToDropdown) setShowFromDropdown(false);
                }, 150);
              }}
            />

            {showFromDropdown && filteredFromAddresses.length > 0 && (
              <View style={styles.fromDropdown}>
                <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                  {filteredFromAddresses.map((address) => (
                    <TouchableOpacity
                      key={address._id}
                      style={styles.dropdownItem}
                      onPress={() => selectFromAddress(address)}
                    >
                      <Text style={styles.addressLabel}>{address.label}</Text>
                      <Text style={styles.dropdownAddressText} numberOfLines={2}>
                        {address.address}
                      </Text>
                      <Text style={styles.addressSubText}>
                        {address.city}, {address.state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* To Address */}
          <Text style={styles.label}>To Address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Select to address"
              value={toAddress}
              onChangeText={handleToChange}
              onFocus={() => {
                setShowToDropdown(true);
                setShowFromDropdown(false); // Close other dropdown
                if (addresses.length > 0) {
                  setFilteredToAddresses(addresses.slice(0, 5));
                }
              }}
              onBlur={() => {
                // Delay hiding to allow selection
                setTimeout(() => {
                  if (!showFromDropdown) setShowToDropdown(false);
                }, 150);
              }}
            />

            {showToDropdown && filteredToAddresses.length > 0 && (
              <View style={styles.toDropdown}>
                <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                  {filteredToAddresses.map((address) => (
                    <TouchableOpacity
                      key={address._id}
                      style={styles.dropdownItem}
                      onPress={() => selectToAddress(address)}
                    >
                      <Text style={styles.addressLabel}>{address.label}</Text>
                      <Text style={styles.dropdownAddressText} numberOfLines={2}>
                        {address.address}
                      </Text>
                      <Text style={styles.addressSubText}>
                        {address.city}, {address.state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Days Selection */}
          <Text style={styles.label}>Select Days</Text>
          <View style={styles.daysGrid}>
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day) && styles.dayButtonSelected
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[
                  styles.dayButtonText,
                  selectedDays.includes(day) && styles.dayButtonTextSelected
                ]}>
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Time Inputs */}
          <View style={styles.timeInputsRow}>
            <View style={styles.timeInputContainer}>
              <Text style={styles.label}>Go Time</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={goTime}
                onChangeText={setGoTime}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.timeInputContainer}>
              <Text style={styles.label}>Arrival Time</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={arrivalTime}
                onChangeText={setArrivalTime}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveRoute}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Creating...' : 'Create Route Schedule'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Existing Routes */}
        <View style={styles.routesSection}>
          <Text style={styles.sectionTitle}>Your Daily Routes</Text>

          {routes.length > 0 ? (
            <FlatList
              data={routes}
              keyExtractor={(item) => item._id}
              renderItem={renderRouteCard}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No routes scheduled yet</Text>
              <Text style={styles.emptyStateSubText}>Create your first daily route above</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  inlineDropdown: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
    maxHeight: 200,
  },
  fromDropdown: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
    maxHeight: 200,
  },
  toDropdown: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  dropdownAddressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  addressSubText: {
    fontSize: 12,
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9f9',
    minWidth: 60,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  timeInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routesSection: {
    marginBottom: 20,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  deleteButton: {
    padding: 5,
  },
  routeDetails: {
    marginLeft: 5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  daysContainer: {
    marginTop: 5,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayBadge: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 5,
    marginBottom: 3,
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

});
