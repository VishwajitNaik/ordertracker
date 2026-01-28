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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { launchImageLibrary } from 'react-native-image-picker';

export default function AddVehicle() {
  const addVehicle = useAuthStore((state) => state.addVehicle);
  const fetchVehicles = useAuthStore((state) => state.fetchVehicles);
  const vehicles = useAuthStore((state) => state.vehicles);

  // Vehicle Basic Info
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");

  // Capacity
  const [capacityKg, setCapacityKg] = useState("");
  const [seatCapacity, setSeatCapacity] = useState("");
  const [fuelType, setFuelType] = useState("");

  // Driver License
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [drivingLicenseFrontImage, setDrivingLicenseFrontImage] = useState<any>(null);
  const [drivingLicenseBackImage, setDrivingLicenseBackImage] = useState<any>(null);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");

  // Vehicle Documents
  const [rcNumber, setRcNumber] = useState("");
  const [rcImage, setRcImage] = useState<any>(null);
  const [rcExpiryDate, setRcExpiryDate] = useState("");

  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [insuranceImage, setInsuranceImage] = useState<any>(null);
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState("");

  const [pucNumber, setPucNumber] = useState("");
  const [pucImage, setPucImage] = useState<any>(null);
  const [pucExpiryDate, setPucExpiryDate] = useState("");

  // Vehicle Images
  const [vehicleImages, setVehicleImages] = useState<any[]>([]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const pickImage = (setImage: (image: any) => void) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          if (file.uri) {
            setImage(file);
          } else {
            try {
              setImage({
                uri: URL.createObjectURL(file),
                type: file.type,
                fileName: file.name,
              });
            } catch (error) {
              console.error('Error creating object URL:', error);
            }
          }
        }
      };
      input.click();
    } else {
      launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      }, (response) => {
        if (!response.didCancel && response.assets && response.assets[0]) {
          setImage(response.assets[0]);
        }
      });
    }
  };

  const pickMultipleImages = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e: any) => {
        const files = Array.from(e.target.files);
        const images = files.map((file: any) => {
          if (file.uri) {
            return file;
          } else {
            try {
              return {
                uri: URL.createObjectURL(file),
                type: file.type,
                fileName: file.name,
              };
            } catch (error) {
              console.error('Error creating object URL for multiple images:', error);
              return null;
            }
          }
        }).filter(img => img !== null);
        setVehicleImages(images);
      };
      input.click();
    } else {
      launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 5,
      }, (response) => {
        if (!response.didCancel && response.assets) {
          setVehicleImages(response.assets);
        }
      });
    }
  };

  const handleAddVehicle = async () => {
    if (!vehicleType || !vehicleNumber || !drivingLicenseNumber) {
      Alert.alert("Validation Error", "Please fill in all required fields: vehicleType, vehicleNumber, drivingLicenseNumber");
      return;
    }

    const vehicleData = {
      vehicleType,
      vehicleNumber,
      vehicleBrand,
      vehicleModel,
      vehicleYear: vehicleYear ? parseInt(vehicleYear) : undefined,
      vehicleColor,
      capacityKg: capacityKg ? parseInt(capacityKg) : undefined,
      seatCapacity: seatCapacity ? parseInt(seatCapacity) : undefined,
      fuelType,
      drivingLicenseNumber,
      drivingLicenseFrontImage,
      drivingLicenseBackImage,
      licenseExpiryDate,
      rcNumber,
      rcImage,
      rcExpiryDate,
      insuranceNumber,
      insuranceImage,
      insuranceExpiryDate,
      pucNumber,
      pucImage,
      pucExpiryDate,
      vehicleImages,
      verificationStatus: 'pending' as const,
      isActive: false,
    };

    try {
      await addVehicle(vehicleData);
      Alert.alert("Success", "Vehicle added successfully!");
      // Clear the form
      setVehicleType("");
      setVehicleNumber("");
      setVehicleBrand("");
      setVehicleModel("");
      setVehicleYear("");
      setVehicleColor("");
      setCapacityKg("");
      setSeatCapacity("");
      setFuelType("");
      setDrivingLicenseNumber("");
      setDrivingLicenseFrontImage(null);
      setDrivingLicenseBackImage(null);
      setLicenseExpiryDate("");
      setRcNumber("");
      setRcImage(null);
      setRcExpiryDate("");
      setInsuranceNumber("");
      setInsuranceImage(null);
      setInsuranceExpiryDate("");
      setPucNumber("");
      setPucImage(null);
      setPucExpiryDate("");
      setVehicleImages([]);
      // Refresh the list
      fetchVehicles();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add vehicle");
    }
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add Vehicle</Text>

        {/* Vehicle Basic Info */}
        <TextInput style={styles.input} placeholder="Vehicle Type (e.g., Bike, Car)" value={vehicleType} onChangeText={setVehicleType} />
        <TextInput style={styles.input} placeholder="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} />
        <TextInput style={styles.input} placeholder="Vehicle Brand" value={vehicleBrand} onChangeText={setVehicleBrand} />
        <TextInput style={styles.input} placeholder="Vehicle Model" value={vehicleModel} onChangeText={setVehicleModel} />
        <TextInput style={styles.input} placeholder="Vehicle Year" value={vehicleYear} onChangeText={setVehicleYear} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Vehicle Color" value={vehicleColor} onChangeText={setVehicleColor} />

        {/* Capacity */}
        <TextInput style={styles.input} placeholder="Capacity (kg)" value={capacityKg} onChangeText={setCapacityKg} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Seat Capacity" value={seatCapacity} onChangeText={setSeatCapacity} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Fuel Type" value={fuelType} onChangeText={setFuelType} />

        {/* Driver License */}
        <TextInput style={styles.input} placeholder="Driving License Number" value={drivingLicenseNumber} onChangeText={setDrivingLicenseNumber} />
        <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage(setDrivingLicenseFrontImage)}>
          <Text style={styles.imagePickerText}>{drivingLicenseFrontImage ? 'Change DL Front Image' : 'Select DL Front Image'}</Text>
        </TouchableOpacity>
        {drivingLicenseFrontImage && <Image source={{ uri: drivingLicenseFrontImage.uri }} style={styles.selectedImage} />}
        <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage(setDrivingLicenseBackImage)}>
          <Text style={styles.imagePickerText}>{drivingLicenseBackImage ? 'Change DL Back Image' : 'Select DL Back Image'}</Text>
        </TouchableOpacity>
        {drivingLicenseBackImage && <Image source={{ uri: drivingLicenseBackImage.uri }} style={styles.selectedImage} />}
        <TextInput style={styles.input} placeholder="License Expiry Date (YYYY-MM-DD)" value={licenseExpiryDate} onChangeText={setLicenseExpiryDate} />

        {/* Vehicle Documents */}
        <TextInput style={styles.input} placeholder="RC Number" value={rcNumber} onChangeText={setRcNumber} />
        <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage(setRcImage)}>
          <Text style={styles.imagePickerText}>{rcImage ? 'Change RC Image' : 'Select RC Image'}</Text>
        </TouchableOpacity>
        {rcImage && <Image source={{ uri: rcImage.uri }} style={styles.selectedImage} />}
        <TextInput style={styles.input} placeholder="RC Expiry Date (YYYY-MM-DD)" value={rcExpiryDate} onChangeText={setRcExpiryDate} />

        <TextInput style={styles.input} placeholder="Insurance Number" value={insuranceNumber} onChangeText={setInsuranceNumber} />
        <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage(setInsuranceImage)}>
          <Text style={styles.imagePickerText}>{insuranceImage ? 'Change Insurance Image' : 'Select Insurance Image'}</Text>
        </TouchableOpacity>
        {insuranceImage && <Image source={{ uri: insuranceImage.uri }} style={styles.selectedImage} />}
        <TextInput style={styles.input} placeholder="Insurance Expiry Date (YYYY-MM-DD)" value={insuranceExpiryDate} onChangeText={setInsuranceExpiryDate} />

        <TextInput style={styles.input} placeholder="PUC Number" value={pucNumber} onChangeText={setPucNumber} />
        <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage(setPucImage)}>
          <Text style={styles.imagePickerText}>{pucImage ? 'Change PUC Image' : 'Select PUC Image'}</Text>
        </TouchableOpacity>
        {pucImage && <Image source={{ uri: pucImage.uri }} style={styles.selectedImage} />}
        <TextInput style={styles.input} placeholder="PUC Expiry Date (YYYY-MM-DD)" value={pucExpiryDate} onChangeText={setPucExpiryDate} />

        {/* Vehicle Images */}
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickMultipleImages}>
          <Text style={styles.imagePickerText}>{vehicleImages.length > 0 ? `Change Vehicle Images (${vehicleImages.length})` : 'Select Vehicle Images'}</Text>
        </TouchableOpacity>
        {vehicleImages.map((img, index) => (
          <Image key={index} source={{ uri: img.uri }} style={styles.selectedImage} />
        ))}

        <TouchableOpacity style={styles.button} onPress={handleAddVehicle}>
          <Text style={styles.buttonText}>Add Vehicle</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Vehicle List</Text>
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vehicleItem}
              onPress={() => router.push(`/vehicle/${item._id}` as any)}
            >
              <Text style={styles.vehicleText}>Type: {item.vehicleType}</Text>
              <Text style={styles.vehicleText}>Number: {item.vehicleNumber}</Text>
              <Text style={styles.vehicleText}>Model: {item.vehicleModel}</Text>
              <Text style={styles.vehicleText}>Status: {item.verificationStatus}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No vehicles found</Text>}
          style={styles.list}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  imagePickerButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  imagePickerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: "center",
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
  vehicleItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  vehicleText: {
    fontSize: 16,
    marginBottom: 5,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
});
