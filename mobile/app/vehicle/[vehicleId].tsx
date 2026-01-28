import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import COLORS from "@/constants/color";

interface Vehicle {
  _id: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  capacityKg?: number;
  seatCapacity?: number;
  fuelType?: string;
  drivingLicenseNumber: string;
  drivingLicenseFrontImage?: string;
  drivingLicenseBackImage?: string;
  licenseExpiryDate?: string;
  rcNumber?: string;
  rcImage?: string;
  rcExpiryDate?: string;
  insuranceNumber?: string;
  insuranceImage?: string;
  insuranceExpiryDate?: string;
  pucNumber?: string;
  pucImage?: string;
  pucExpiryDate?: string;
  vehicleImages?: string[];
  verificationStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  rejectionReason?: string;
  createdBy?: {
    _id: string;
    username: string;
  };
  verifiedByAdmin?: string;
  lastVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function VehicleDetail() {
  const { vehicleId } = useLocalSearchParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicleDetail();
  }, [vehicleId]);

  const fetchVehicleDetail = async () => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await fetch(`http://localhost:3000/api/veichels/${vehicleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch vehicle details");
      }

      const data = await response.json();
      setVehicle(data);
    } catch (error: any) {
      console.error("Error fetching vehicle:", error);
      Alert.alert("Error", error.message || "Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Vehicle not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vehicle Details</Text>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vehicle.verificationStatus) }]}>
        <Text style={styles.statusText}>{vehicle.verificationStatus.toUpperCase()}</Text>
      </View>

      {vehicle.rejectionReason && (
        <View style={styles.rejectionContainer}>
          <Text style={styles.rejectionTitle}>Rejection Reason:</Text>
          <Text style={styles.rejectionText}>{vehicle.rejectionReason}</Text>
        </View>
      )}

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Vehicle Type:</Text>
          <Text style={styles.value}>{vehicle.vehicleType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Vehicle Number:</Text>
          <Text style={styles.value}>{vehicle.vehicleNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Brand:</Text>
          <Text style={styles.value}>{vehicle.vehicleBrand || "Not specified"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Model:</Text>
          <Text style={styles.value}>{vehicle.vehicleModel || "Not specified"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Year:</Text>
          <Text style={styles.value}>{vehicle.vehicleYear || "Not specified"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Color:</Text>
          <Text style={styles.value}>{vehicle.vehicleColor || "Not specified"}</Text>
        </View>
      </View>

      {/* Capacity Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Capacity & Fuel</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Capacity (kg):</Text>
          <Text style={styles.value}>{vehicle.capacityKg || "Not specified"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Seat Capacity:</Text>
          <Text style={styles.value}>{vehicle.seatCapacity || "Not specified"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Fuel Type:</Text>
          <Text style={styles.value}>{vehicle.fuelType || "Not specified"}</Text>
        </View>
      </View>

      {/* Driver License */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver License</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>License Number:</Text>
          <Text style={styles.value}>{vehicle.drivingLicenseNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Expiry Date:</Text>
          <Text style={styles.value}>{formatDate(vehicle.licenseExpiryDate)}</Text>
        </View>
        {vehicle.drivingLicenseFrontImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageLabel}>License Front:</Text>
            <Image source={{ uri: vehicle.drivingLicenseFrontImage }} style={styles.documentImage} />
          </View>
        )}
        {vehicle.drivingLicenseBackImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageLabel}>License Back:</Text>
            <Image source={{ uri: vehicle.drivingLicenseBackImage }} style={styles.documentImage} />
          </View>
        )}
      </View>

      {/* Vehicle Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Documents</Text>

        {/* RC */}
        {vehicle.rcNumber && (
          <View style={styles.documentSection}>
            <Text style={styles.documentTitle}>Registration Certificate (RC)</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>RC Number:</Text>
              <Text style={styles.value}>{vehicle.rcNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Expiry Date:</Text>
              <Text style={styles.value}>{formatDate(vehicle.rcExpiryDate)}</Text>
            </View>
            {vehicle.rcImage && (
              <View style={styles.imageContainer}>
                <Text style={styles.imageLabel}>RC Image:</Text>
                <Image source={{ uri: vehicle.rcImage }} style={styles.documentImage} />
              </View>
            )}
          </View>
        )}

        {/* Insurance */}
        {vehicle.insuranceNumber && (
          <View style={styles.documentSection}>
            <Text style={styles.documentTitle}>Insurance</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Insurance Number:</Text>
              <Text style={styles.value}>{vehicle.insuranceNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Expiry Date:</Text>
              <Text style={styles.value}>{formatDate(vehicle.insuranceExpiryDate)}</Text>
            </View>
            {vehicle.insuranceImage && (
              <View style={styles.imageContainer}>
                <Text style={styles.imageLabel}>Insurance Image:</Text>
                <Image source={{ uri: vehicle.insuranceImage }} style={styles.documentImage} />
              </View>
            )}
          </View>
        )}

        {/* PUC */}
        {vehicle.pucNumber && (
          <View style={styles.documentSection}>
            <Text style={styles.documentTitle}>Pollution Certificate (PUC)</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>PUC Number:</Text>
              <Text style={styles.value}>{vehicle.pucNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Expiry Date:</Text>
              <Text style={styles.value}>{formatDate(vehicle.pucExpiryDate)}</Text>
            </View>
            {vehicle.pucImage && (
              <View style={styles.imageContainer}>
                <Text style={styles.imageLabel}>PUC Image:</Text>
                <Image source={{ uri: vehicle.pucImage }} style={styles.documentImage} />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Vehicle Images */}
      {vehicle.vehicleImages && vehicle.vehicleImages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Images</Text>
          <View style={styles.imagesGrid}>
            {vehicle.vehicleImages.map((imageUri, index) => (
              <Image key={index} source={{ uri: imageUri }} style={styles.vehicleImage} />
            ))}
          </View>
        </View>
      )}

      {/* Ownership & Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ownership & Verification</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Owner:</Text>
          <Text style={styles.value}>{vehicle.createdBy?.username || "Unknown"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Active Status:</Text>
          <Text style={styles.value}>{vehicle.isActive ? "Active" : "Inactive"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Created:</Text>
          <Text style={styles.value}>{formatDate(vehicle.createdAt)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Last Updated:</Text>
          <Text style={styles.value}>{formatDate(vehicle.updatedAt)}</Text>
        </View>
        {vehicle.lastVerifiedAt && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Last Verified:</Text>
            <Text style={styles.value}>{formatDate(vehicle.lastVerifiedAt)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    marginLeft: 20,
  },
  statusBadge: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 10,
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  rejectionContainer: {
    backgroundColor: "#ffebee",
    margin: 20,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F44336",
    marginBottom: 5,
  },
  rejectionText: {
    color: "#d32f2f",
    fontSize: 14,
  },
  section: {
    backgroundColor: "#fff",
    margin: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: "#666",
    flex: 1,
    textAlign: "right",
  },
  documentSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  imageContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  documentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  vehicleImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    margin: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
});
