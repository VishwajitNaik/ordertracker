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
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';

interface Address {
  _id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}


const AddTravel = () => {
  const addTravel = useAuthStore((state) => state.addTravel);
  const fetchTravel = useAuthStore((state) => state.fetchTravel);
  const fetchVehicles = useAuthStore((state) => state.fetchVehicles);
  const startTravel = useAuthStore((state) => state.startTravel);
  const endTravel = useAuthStore((state) => state.endTravel);
  const acceptTravelRequest = useAuthStore((state) => state.acceptTravelRequest);
  const travel = useAuthStore((state) => state.travel);
  const vehicles = useAuthStore((state) => state.vehicles);
  const user = useAuthStore((state) => state.user);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [veichelType, setVeichelType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(new Date());
  const [gotime, setGotime] = useState(new Date());
  const [arrivaltime, setArrivaltime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGoTimePicker, setShowGoTimePicker] = useState(false);
  const [showArrivalTimePicker, setShowArrivalTimePicker] = useState(false);

  // Address dropdown state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [filteredFromAddresses, setFilteredFromAddresses] = useState<Address[]>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<Address[]>([]);

  // Initialize with current date/time
  useEffect(() => {
    const now = new Date();
    setDate(now);
    setGotime(now);
    setArrivaltime(now);

    fetchTravel();
    fetchVehicles();
    fetchUserAddresses();
  }, []);

  const fetchUserAddresses = async () => {
    if (!user) return;

    try {
      const token = useAuthStore.getState().token;
      if (!token) return;

      const response = await fetch(`http://localhost:3000/api/userdetails/addresses/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const handleFromChange = (text: string) => {
    setFrom(text);

    if (text.trim() === '') {
      setFilteredFromAddresses([]);
      setShowFromDropdown(false);
      return;
    }

    // Filter addresses based on input
    const filtered = addresses.filter(addr =>
      addr.address.toLowerCase().includes(text.toLowerCase()) ||
      addr.city.toLowerCase().includes(text.toLowerCase()) ||
      addr.state.toLowerCase().includes(text.toLowerCase()) ||
      addr.label.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredFromAddresses(filtered);
    setShowFromDropdown(filtered.length > 0);
  };

  const handleToChange = (text: string) => {
    setTo(text);

    if (text.trim() === '') {
      setFilteredAddresses([]);
      setShowToDropdown(false);
      return;
    }

    // Filter addresses based on input
    const filtered = addresses.filter(addr =>
      addr.address.toLowerCase().includes(text.toLowerCase()) ||
      addr.city.toLowerCase().includes(text.toLowerCase()) ||
      addr.state.toLowerCase().includes(text.toLowerCase()) ||
      addr.label.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredAddresses(filtered);
    setShowToDropdown(filtered.length > 0);
  };

  const selectFromAddress = (address: Address) => {
    setFrom(`${address.address}, ${address.city}, ${address.state}`);
    setShowFromDropdown(false);
  };

  const selectAddress = (address: Address) => {
    setTo(`${address.address}, ${address.city}, ${address.state}`);
    setShowToDropdown(false);
  };

  const handleAddTravel = async () => {
    if (!veichelType || !from || !to) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    const travelData: any = {
      veichelType,
      from,
      to,
      date: date.toISOString().split('T')[0],
      gotime: gotime.toTimeString().slice(0, 5),
      arrivaltime: arrivaltime.toTimeString().slice(0, 5),
    };

    if (selectedVehicleId) {
      travelData.vehicleId = selectedVehicleId;
    }

    try {
      await addTravel(travelData);
      Alert.alert("Success", "Travel added successfully!");
      // Clear the form
      setSelectedVehicleId("");
      setVeichelType("");
      setFrom("");
      setTo("");
      setDate(new Date());
      setGotime(new Date());
      setArrivaltime(new Date());
      // Refresh the list
      fetchTravel();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add travel");
    }
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.mainContainer}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Add Travel</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Your Vehicle:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedVehicleId}
                onValueChange={(itemValue) => {
                  setSelectedVehicleId(itemValue);
                  if (itemValue) {
                    const selectedVehicle = vehicles.find(v => v._id === itemValue);
                    setVeichelType(selectedVehicle ? `${selectedVehicle.vehicleType} - ${selectedVehicle.vehicleNumber}` : "");
                  } else {
                    setVeichelType("");
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

          {veichelType ? (
            <View style={styles.selectedVehicleInfo}>
              <Text style={styles.selectedVehicleText}>Selected: {veichelType}</Text>
            </View>
          ) : null}
          {/* From Address with Dropdown */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="From (start typing to see your addresses)"
              value={from}
              onChangeText={handleFromChange}
              onFocus={() => {
                if (addresses.length > 0 && from.trim() === '') {
                  setFilteredFromAddresses(addresses.slice(0, 5)); // Show first 5 addresses when focused
                  setShowFromDropdown(true);
                }
              }}
              onBlur={() => {
                // Delay hiding dropdown to allow selection
                setTimeout(() => setShowFromDropdown(false), 200);
              }}
            />
          </View>

          {/* To Address Input - Dropdown will be positioned outside ScrollView */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="To (start typing to see your addresses)"
              value={to}
              onChangeText={handleToChange}
              onFocus={() => {
                if (addresses.length > 0 && to.trim() === '') {
                  setFilteredAddresses(addresses.slice(0, 5)); // Show first 5 addresses when focused
                  setShowToDropdown(true);
                }
              }}
              onBlur={() => {
                // Delay hiding dropdown to allow selection
                setTimeout(() => setShowToDropdown(false), 200);
              }}
            />
          </View>
        {/* Date Picker */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTimeLabel}>Travel Date:</Text>
          {Platform.OS === 'web' ? (
            <View style={styles.dateTimePicker}>
              <TouchableOpacity
                style={[styles.adjustButton, { left: 5 }]}
                onPress={() => {
                  const currentDate = new Date(date);
                  currentDate.setDate(currentDate.getDate() - 1);
                  setDate(currentDate);
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#333" />
              </TouchableOpacity>

              <Text style={styles.dateTimeText}>
                {date.toDateString()}
              </Text>

              <TouchableOpacity
                style={[styles.adjustButton, { right: 5 }]}
                onPress={() => {
                  const currentDate = new Date(date);
                  currentDate.setDate(currentDate.getDate() + 1);
                  setDate(currentDate);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateTimeButtonText}>
                  {date.toDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )}
            </>
          )}
        </View>

        {/* Time Pickers Row */}
        <View style={styles.timePickersRow}>
          {/* Go Time Picker */}
          <View style={styles.timePickerContainer}>
            <Text style={styles.dateTimeLabel}>Go Time:</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.timePicker}>
                <View style={styles.timeSection}>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => {
                      const currentTime = new Date(gotime);
                      currentTime.setHours(currentTime.getHours() - 1);
                      setGotime(currentTime);
                    }}
                  >
                    <Ionicons name="chevron-up" size={16} color="#666" />
                  </TouchableOpacity>

                  <Text style={styles.timeText}>
                    {gotime.getHours().toString().padStart(2, '0')}
                  </Text>

                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => {
                      const currentTime = new Date(gotime);
                      currentTime.setHours(currentTime.getHours() + 1);
                      setGotime(currentTime);
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                <View style={styles.timeSection}>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => {
                      const currentTime = new Date(gotime);
                      currentTime.setMinutes(currentTime.getMinutes() - 1);
                      setGotime(currentTime);
                    }}
                  >
                    <Ionicons name="chevron-up" size={16} color="#666" />
                  </TouchableOpacity>

                  <Text style={styles.timeText}>
                    {gotime.getMinutes().toString().padStart(2, '0')}
                  </Text>

                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => {
                      const currentTime = new Date(gotime);
                      currentTime.setMinutes(currentTime.getMinutes() + 1);
                      setGotime(currentTime);
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowGoTimePicker(true)}>
                  <Text style={styles.dateTimeButtonText}>
                    {gotime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
                {showGoTimePicker && (
                  <DateTimePicker
                    value={gotime}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowGoTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        setGotime(selectedTime);
                      }
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* Arrival Time Picker */}
          <View style={styles.timePickerContainer}>
            <Text style={styles.dateTimeLabel}>Arrival Time:</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.timePicker}>
                <View style={styles.timeSection}>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => {
                      const currentTime = new Date(arrivaltime);
                      currentTime.setHours(currentTime.getHours() - 1);
                      setArrivaltime(currentTime);
                    }}
                  >
                    <Ionicons name="chevron-up" size={16} color="#666" />
                  </TouchableOpacity>

                  <Text style={styles.timeText}>
                    {arrivaltime.getHours().toString().padStart(2, '0')}
                  </Text>

                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => {
                      const currentTime = new Date(arrivaltime);
                      currentTime.setHours(currentTime.getHours() + 1);
                      setArrivaltime(currentTime);
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                <View style={styles.timeSection}>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => {
                      const currentTime = new Date(arrivaltime);
                      currentTime.setMinutes(currentTime.getMinutes() - 1);
                      setArrivaltime(currentTime);
                    }}
                  >
                    <Ionicons name="chevron-up" size={16} color="#666" />
                  </TouchableOpacity>

                  <Text style={styles.timeText}>
                    {arrivaltime.getMinutes().toString().padStart(2, '0')}
                  </Text>

                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => {
                      const currentTime = new Date(arrivaltime);
                      currentTime.setMinutes(currentTime.getMinutes() + 1);
                      setArrivaltime(currentTime);
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowArrivalTimePicker(true)}>
                  <Text style={styles.dateTimeButtonText}>
                    {arrivaltime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
                {showArrivalTimePicker && (
                  <DateTimePicker
                    value={arrivaltime}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowArrivalTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        setArrivaltime(selectedTime);
                      }
                    }}
                  />
                )}
              </>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAddTravel}>
          <Text style={styles.buttonText}>Add Travel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Travel List</Text>
        <FlatList
          data={travel}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isOwner = user && item.createdBy && item.createdBy._id === user._id;
            return (
              <View style={styles.travelItem}>
                <Text style={styles.travelText}>Vehicle: {item.veichelType}</Text>
                <Text style={styles.travelText}>From: {item.from}</Text>
                <Text style={styles.travelText}>To: {item.to}</Text>
                <Text style={styles.travelText}>Date: {item.date}</Text>
                <Text style={styles.travelText}>Go Time: {item.gotime}</Text>
                <Text style={styles.travelText}>Arrival Time: {item.arrivaltime}</Text>
                <Text style={[styles.statusText, item.status === 'scheduled' ? styles.statusscheduled : item.status === 'started' ? styles.statusstarted : styles.statuscompleted]}>
                  Status: {item.status === 'scheduled' ? 'Scheduled ⏳' : item.status === 'started' ? 'Travel Started 🚕' : 'Reached Destination ✅'}
                </Text>
                {isOwner && item.status === 'scheduled' && (
                  <TouchableOpacity style={styles.startButton} onPress={() => startTravel(item._id)}>
                    <Text style={styles.startButtonText}>Start Travel</Text>
                  </TouchableOpacity>
                )}
                {isOwner && item.status === 'started' && (
                  <TouchableOpacity style={styles.endButton} onPress={() => endTravel(item._id)}>
                    <Text style={styles.endButtonText}>End Travel</Text>
                  </TouchableOpacity>
                )}
                {isOwner && item.requestedUsers && item.requestedUsers.length > 0 && (
                  <View style={styles.requestsContainer}>
                    <Text style={styles.requestsTitle}>Requests:</Text>
                    {item.requestedUsers.map((req, index) => (
                      <View key={index} style={styles.requestItem}>
                        <Text style={styles.requestText}>
                          {req.userId.username} - Product: {req.productId?.Title || 'Unknown'} - ₹{req.price} - {req.status}
                        </Text>
                        {req.status === 'pending' && (
                          <TouchableOpacity
                            style={styles.acceptRequestButton}
                            onPress={() => acceptTravelRequest(item._id, req.userId._id, req.productId?._id)}
                          >
                            <Text style={styles.acceptRequestButtonText}>Accept</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No travels found</Text>}
          style={styles.list}
        />


      </ScrollView>

      {/* Address Dropdown - Positioned outside ScrollView to avoid clipping */}
      {showFromDropdown && filteredFromAddresses.length > 0 && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            onPress={() => setShowFromDropdown(false)}
            activeOpacity={1}
          >
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {filteredFromAddresses.map((address) => (
                  <TouchableOpacity
                    key={address._id}
                    style={styles.dropdownItem}
                    onPress={() => selectFromAddress(address)}
                  >
                    <View style={styles.addressItemHeader}>
                      <Text style={styles.addressLabel}>{address.label}</Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressText} numberOfLines={2}>
                      {address.address}
                    </Text>
                    <Text style={styles.addressSubText}>
                      {address.city}, {address.state} {address.zipCode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {showToDropdown && filteredAddresses.length > 0 && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            onPress={() => setShowToDropdown(false)}
            activeOpacity={1}
          >
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {filteredAddresses.map((address) => (
                  <TouchableOpacity
                    key={address._id}
                    style={styles.dropdownItem}
                    onPress={() => selectAddress(address)}
                  >
                    <View style={styles.addressItemHeader}>
                      <Text style={styles.addressLabel}>{address.label}</Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressText} numberOfLines={2}>
                      {address.address}
                    </Text>
                    <Text style={styles.addressSubText}>
                      {address.city}, {address.state} {address.zipCode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </View>
      )}
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
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: COLORS.primary,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  list: {
    marginTop: 20,
  },
  travelItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  travelText: {
    fontSize: 16,
    marginBottom: 5,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#333",
  },
  selectedVehicleInfo: {
    backgroundColor: "#e8f5e8",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  selectedVehicleText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  dateTimeButton: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: "#333",
  },
  dateTimeContainer: {
    marginBottom: 15,
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  dateTimePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 50,
    position: "relative",
    height: 50,
  },
  adjustButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  dateTimeDisplay: {
    flex: 1,
    alignItems: "center",
  },
  dateTimeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  dateTimeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    paddingVertical: 8,
  },
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  timeSection: {
    alignItems: "center",
    width: 45,
  },
  adjustButtonSmall: {
    padding: 5,
    marginVertical: 2,
  },
  timeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
    minWidth: 30,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 10,
  },
  timeInput: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
    width: 35,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 2,
    backgroundColor: "#f9f9f9",
  },
  timePickersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  timePickerContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  statusscheduled: {
    color: '#FF9800',
  },
  statusstarted: {
    color: '#2196F3',
  },
  statuscompleted: {
    color: '#4CAF50',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  requestsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 6,
  },
  requestText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  acceptRequestButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  acceptRequestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    zIndex: 10000,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  defaultBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  addressSubText: {
    fontSize: 12,
    color: '#666',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  dropdownBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

});

export default AddTravel;
