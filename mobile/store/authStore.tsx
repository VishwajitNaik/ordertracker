// store/authStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import { useSocketStore } from "./socketStore";
import { ToastManager } from "@/components/Toast";

// Web-compatible storage
const storage = Platform.OS === 'web' ? {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
} : AsyncStorage;

interface Address {
  _id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Product {
  _id: string;
  Title: string;
  from: string;
  to: string;
  fromAddress?: Address;
  toAddress?: Address;
  description: string;
  price?: number;
  weight: string;
  image: string;
  veichelType: string;
  video?: string;
  status?: string;
  createdBy?: {
    _id: string;
    username: string;
    profileImage: string;
  };
  acceptedUsers?: {
    userId: {
      _id: string;
      username: string;
      profileImage: string;
    };
    vehicleType: string;
    tentativeTime: string;
    price: number;
    status: string;
  }[];
}

interface Shop {
  _id: string;
  name: string;
  shopType: string;
  location: string;
  images: string[];
  openingTime: string;
  closingTime: string;
  status: string;
}

interface Item {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  MinPrice: number;
  MaxPrice: number;
  category: string;
  images: string[];
  brand: string;
  model: string;
  shop_id?: string;
}

interface SubItem {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  Price: number;
  category: string;
  images: string[];
  brand: string;
  model: string;
  parentItemId: string;
}

interface Travel{
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
  };
  requestedUsers?: {
    userId: {
      _id: string;
      username: string;
    };
    productId: {
      _id: string;
      Title: string;
    };
    price: number;
    status: string;
  }[];
}

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

interface AuthStore {
  user: any;
  token: string | null;
  isLoading: boolean;
  products: Product[];
  orders: any[];
  shops: Shop[];
  allShops: Shop[];
  allShopsPagination: any;
  userDashboard: any;
  addShop: (shop: Omit<Shop, "_id">) => Promise<void>;
  item: Item[];
  subItems: SubItem[];
  addItem: (item: Omit<Item, "_id">) => Promise<void>;
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, "_id">) => Promise<void>;
  addSubItem: (subItem: Omit<SubItem, "_id">) => Promise<void>;
  travel: Travel[];
  addTravel: (travel: Omit<Travel, "_id">) => Promise<void>;
  fetchSubItems: (parentId: string) => Promise<void>;
  register: (username: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchShops: () => Promise<void>;
  fetchAllShops: (page?: number, limit?: number) => Promise<void>;
  fetchUserDashboard: (userId: string) => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchTravel: () => Promise<void>;
  fetchAllUserSideTravels: () => Promise<void>;
  fetchVehicles: () => Promise<void>;
  startTravel: (travelId: string) => Promise<void>;
  endTravel: (travelId: string) => Promise<void>;
  sendTravelRequest: (travelId: string, productId: string, price: number) => Promise<void>;
  acceptTravelRequest: (travelId: string, userId: string, productId: string) => Promise<void>;
  addProduct: (productData: { Title: string; from: string; to: string; description: string; price: number; weight: string; veichelType: string; image: any; video?: any }) => Promise<void>;
  acceptProduct: (productId: string, acceptData: { tentativeDeliveryTime: string; acceptedVehicleType: string; price: number }) => Promise<void>;
  acceptOrder: (orderId: string, acceptData: { tentativeDeliveryTime: string; acceptedVehicleType: string; price: number }) => Promise<void>;
  updateOrderBid: (orderId: string, userId: string, newPrice: number) => Promise<void>;
  confirmOrderBid: (orderId: string, userId: string) => Promise<void>;
  updateDeliveryStatus: (orderId: string, userId: string, status: string) => Promise<void>;
  updateProduct: (productId: string, updatedFields: Partial<Omit<Product, "_id">>) => Promise<void>;
  updateBid: (productId: string, userId: string, newPrice: number) => Promise<void>;
  confirmBid: (productId: string, userId: string) => Promise<void>;
  // Cart functionality
  cart: any;
  getCart: () => Promise<void>;
  addToCart: (subItemId: string, quantity?: number) => Promise<void>;
  updateCartItem: (subItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (subItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  products: [],
  orders: [],
  shops: [],
  allShops: [],
  allShopsPagination: null,
  userDashboard: null,
  item: [],
  subItems: [],
  vehicles: [],
  travel:[],
  cart: { items: [], totalAmount: 0, itemCount: 0 },

  addTravel: async (travel) => {
    try {
      const token = get().token;  
      if (!token) throw new Error("No token found");
      const res = await fetch("http://localhost:3000/api/travels/addtravel", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(travel),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong!");
      return data;
    }
    catch (error: any) {  
      console.error("Error adding travel:", error);
      throw error;
    } 
  },

  fetchTravel: async () => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");
      const res = await fetch("http://localhost:3000/api/travels", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch travels");
      set({ travel: data });
    } catch (error: any) {
      console.error("Error fetching travels:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch travels");
    }
  },

  fetchAllUserSideTravels: async () => {
    try {
      const res = await fetch("http://localhost:3000/api/travels/getAllUserSide");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch user side travels");
      set({ travel: data });
    } catch (error: any) {
      console.error("Error fetching user side travels:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch user side travels");
    }
  },

  startTravel: async (travelId) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");
      const res = await fetch(`http://localhost:3000/api/travels/${travelId}/start`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start travel");
      Alert.alert("Success", "Travel started successfully!");
      // Refresh travels
      get().fetchTravel();
    } catch (error: any) {
      console.error("Error starting travel:", error.message);
      Alert.alert("Error", error.message || "Failed to start travel");
    }
  },

  endTravel: async (travelId) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");
      const res = await fetch(`http://localhost:3000/api/travels/${travelId}/end`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to end travel");
      Alert.alert("Success", "Travel completed successfully!");
      // Refresh travels
      get().fetchTravel();
    } catch (error: any) {
      console.error("Error ending travel:", error.message);
      Alert.alert("Error", error.message || "Failed to end travel");
    }
  },

  sendTravelRequest: async (travelId, productId, price) => {
   try {
     const token = get().token;
     if (!token) throw new Error("No token found");
     const res = await fetch(`http://localhost:3000/api/travels/${travelId}/request`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify({ productId, price }),
     });
     const data = await res.json();
     if (!res.ok) throw new Error(data.message || "Failed to send request");
     Alert.alert("Success", "Request sent successfully!");
     // Refresh travel data
     get().fetchAllUserSideTravels();
   } catch (error: any) {
     console.error("Error sending request:", error.message);
     Alert.alert("Error", error.message || "Failed to send request");
   }
 },

  acceptTravelRequest: async (travelId, userId, productId) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");
      const res = await fetch(`http://localhost:3000/api/travels/${travelId}/accept-request`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to accept request");
      Alert.alert("Success", "Request accepted successfully!");
      // Refresh travels
      get().fetchTravel();
    } catch (error: any) {
      console.error("Error accepting request:", error.message);
      Alert.alert("Error", error.message || "Failed to accept request");
    }
  },


  addVehicle: async (vehicleData) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      // Check if any images are provided
      const hasImages = vehicleData.drivingLicenseFrontImage ||
                       vehicleData.drivingLicenseBackImage ||
                       vehicleData.rcImage ||
                       vehicleData.insuranceImage ||
                       vehicleData.pucImage ||
                       (vehicleData.vehicleImages && vehicleData.vehicleImages.length > 0);

      let headers: any = {
        Authorization: `Bearer ${token}`,
      };
      let body: any;

      if (hasImages) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('vehicleType', vehicleData.vehicleType);
        formData.append('vehicleNumber', vehicleData.vehicleNumber);
        formData.append('drivingLicenseNumber', vehicleData.drivingLicenseNumber);

        // Optional fields
        if (vehicleData.vehicleBrand) formData.append('vehicleBrand', vehicleData.vehicleBrand);
        if (vehicleData.vehicleModel) formData.append('vehicleModel', vehicleData.vehicleModel);
        if (vehicleData.vehicleYear) formData.append('vehicleYear', vehicleData.vehicleYear?.toString());
        if (vehicleData.vehicleColor) formData.append('vehicleColor', vehicleData.vehicleColor);
        if (vehicleData.capacityKg) formData.append('capacityKg', vehicleData.capacityKg?.toString());
        if (vehicleData.seatCapacity) formData.append('seatCapacity', vehicleData.seatCapacity?.toString());
        if (vehicleData.fuelType) formData.append('fuelType', vehicleData.fuelType);
        if (vehicleData.licenseExpiryDate) formData.append('licenseExpiryDate', vehicleData.licenseExpiryDate);
        if (vehicleData.rcNumber) formData.append('rcNumber', vehicleData.rcNumber);
        if (vehicleData.rcExpiryDate) formData.append('rcExpiryDate', vehicleData.rcExpiryDate);
        if (vehicleData.insuranceNumber) formData.append('insuranceNumber', vehicleData.insuranceNumber);
        if (vehicleData.insuranceExpiryDate) formData.append('insuranceExpiryDate', vehicleData.insuranceExpiryDate);
        if (vehicleData.pucNumber) formData.append('pucNumber', vehicleData.pucNumber);
        if (vehicleData.pucExpiryDate) formData.append('pucExpiryDate', vehicleData.pucExpiryDate);

        // Handle file uploads with proper MIME type handling
        const appendImageFile = async (fieldName: string, imageData: any, defaultName: string) => {
          if (!imageData) return;

          if (Platform.OS === 'web') {
            // For web, handle different image data formats
            if (typeof imageData === 'string' && imageData.startsWith('blob:')) {
              // Blob URL - fetch and create proper file
              try {
                const response = await fetch(imageData);
                const blob = await response.blob();
                // Create a new File with explicit MIME type
                const mimeType = blob.type || 'image/jpeg';
                const file = new File([blob], defaultName, { type: mimeType });
                formData.append(fieldName, file);
              } catch (error) {
                console.error(`Error processing ${fieldName}:`, error);
              }
            } else if (imageData.uri && imageData.type) {
              // File object with type info
              const response = await fetch(imageData.uri);
              const blob = await response.blob();
              const file = new File([blob], imageData.fileName || defaultName, { type: imageData.type });
              formData.append(fieldName, file);
            }
          } else {
            // Mobile - react-native-image-picker returns proper objects
            if (imageData.uri) {
              formData.append(fieldName, {
                uri: imageData.uri,
                type: imageData.type || 'image/jpeg',
                name: imageData.fileName || defaultName,
              } as any);
            }
          }
        };

        await appendImageFile('drivingLicenseFrontImage', vehicleData.drivingLicenseFrontImage, 'driving-license-front.jpg');
        await appendImageFile('drivingLicenseBackImage', vehicleData.drivingLicenseBackImage, 'driving-license-back.jpg');
        await appendImageFile('rcImage', vehicleData.rcImage, 'rc.jpg');
        await appendImageFile('insuranceImage', vehicleData.insuranceImage, 'insurance.jpg');
        await appendImageFile('pucImage', vehicleData.pucImage, 'puc.jpg');

        // Handle vehicle images array
        if (vehicleData.vehicleImages && vehicleData.vehicleImages.length > 0) {
          for (let i = 0; i < vehicleData.vehicleImages.length; i++) {
            const imageData = vehicleData.vehicleImages[i];
            await appendImageFile('vehicleImages', imageData, `vehicle-image-${i + 1}.jpg`);
          }
        }

        body = formData;
        // Don't set Content-Type for FormData
      } else {
        // Use JSON for text-only data
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          vehicleType: vehicleData.vehicleType,
          vehicleNumber: vehicleData.vehicleNumber,
          vehicleBrand: vehicleData.vehicleBrand,
          vehicleModel: vehicleData.vehicleModel,
          vehicleYear: vehicleData.vehicleYear,
          vehicleColor: vehicleData.vehicleColor,
          capacityKg: vehicleData.capacityKg,
          seatCapacity: vehicleData.seatCapacity,
          fuelType: vehicleData.fuelType,
          drivingLicenseNumber: vehicleData.drivingLicenseNumber,
          licenseExpiryDate: vehicleData.licenseExpiryDate,
          rcNumber: vehicleData.rcNumber,
          rcExpiryDate: vehicleData.rcExpiryDate,
          insuranceNumber: vehicleData.insuranceNumber,
          insuranceExpiryDate: vehicleData.insuranceExpiryDate,
          pucNumber: vehicleData.pucNumber,
          pucExpiryDate: vehicleData.pucExpiryDate,
        });
      }

      const res = await fetch("http://localhost:3000/api/veichels/addveichel", {
        method: "POST",
        headers,
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add vehicle");

      Alert.alert("Success", "Vehicle added successfully!");
      // Refresh vehicles after adding
      get().fetchVehicles();
    } catch (error: any) {
      console.error("Error adding vehicle:", error.message);
      Alert.alert("Error", error.message || "Failed to add vehicle");
    }
  },

  fetchVehicles: async () => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");
      const res = await fetch("http://localhost:3000/api/veichels", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch vehicles");
      set({ vehicles: data });
    } catch (error: any) {
      console.error("Error fetching vehicles:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch vehicles");
    }
  },

  addSubItem: async (subItem) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const formData = new FormData();
      formData.append('name', subItem.name);
      formData.append('description', subItem.description);
      formData.append('quantity', subItem.quantity.toString());
      formData.append('Price', subItem.Price.toString());
      formData.append('category', subItem.category);
      formData.append('brand', subItem.brand);
      formData.append('model', subItem.model);
      formData.append('parentItemId', subItem.parentItemId);

      // Handle images array - use the same approach as item upload
      if (subItem.images && subItem.images.length > 0) {
        console.log('Processing sub-item images for upload:', subItem.images.length);

        const appendImageFile = async (imageData: any, index: number) => {
          if (!imageData) return;

          const defaultName = `subitem-image-${index + 1}.jpg`;

          if (Platform.OS === 'web') {
            // For web, handle different image data formats
            if (typeof imageData === 'string' && imageData.startsWith('blob:')) {
              // Blob URL - fetch and create proper file
              try {
                const response = await fetch(imageData);
                const blob = await response.blob();
                const mimeType = blob.type || 'image/jpeg';
                const file = new File([blob], defaultName, { type: mimeType });
                formData.append('images', file);
                console.log(`Appended web blob image ${index + 1}`);
              } catch (error) {
                console.error(`Error processing image ${index + 1}:`, error);
              }
            } else if (imageData.uri && imageData.type) {
              // File object with type info
              const response = await fetch(imageData.uri);
              const blob = await response.blob();
              const file = new File([blob], imageData.fileName || defaultName, { type: imageData.type });
              formData.append('images', file);
              console.log(`Appended web file image ${index + 1}`);
            }
          } else {
            // Mobile - react-native-image-picker returns proper objects
            if (imageData.uri) {
              formData.append('images', {
                uri: imageData.uri,
                type: imageData.type || 'image/jpeg',
                name: imageData.fileName || defaultName,
              } as any);
              console.log(`Appended mobile image ${index + 1}: ${imageData.fileName || defaultName}`);
            }
          }
        };

        // Process each image
        for (let i = 0; i < subItem.images.length; i++) {
          await appendImageFile(subItem.images[i], i);
        }
      } else {
        console.log('No images to upload for sub-item');
      }

      console.log('Sending sub-item FormData to server...');

      const res = await fetch("http://localhost:3000/api/subitems/addsubitem", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      const data = await res.json();
      console.log('Server response for sub-item:', data);

      if (!res.ok) throw new Error(data.message || "Failed to add sub-item");

      Alert.alert("Success", "Sub-item added successfully!");
      return data;
    } catch (error: any) {
      console.error("Error adding sub-item:", error);
      throw error;
    }
  },

  fetchSubItems: async (parentId) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");
      const res = await fetch(`http://localhost:3000/api/subitems/byParent/${parentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch sub-items");
      set({ subItems: data });
    } catch (error: any) {
      console.error("Error fetching sub-items:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch sub-items");
    }
  },

  addItem: async (item) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const formData = new FormData();
      formData.append('name', item.name);
      formData.append('description', item.description);
      formData.append('quantity', item.quantity.toString());
      formData.append('MinPrice', item.MinPrice.toString());
      formData.append('MaxPrice', item.MaxPrice.toString());
      formData.append('category', item.category);
      formData.append('brand', item.brand);
      formData.append('model', item.model);

      // Add shop_id if it exists
      if (item.shop_id) {
        formData.append('shop_id', item.shop_id);
        console.log('Added shop_id to FormData:', item.shop_id);
      }

      // Handle images array - use the same approach as shop upload
      if (item.images && item.images.length > 0) {
        console.log('Processing item images for upload:', item.images.length);

        const appendImageFile = async (imageData: any, index: number) => {
          if (!imageData) return;

          const defaultName = `item-image-${index + 1}.jpg`;

          if (Platform.OS === 'web') {
            // For web, handle different image data formats
            if (typeof imageData === 'string' && imageData.startsWith('blob:')) {
              // Blob URL - fetch and create proper file
              try {
                const response = await fetch(imageData);
                const blob = await response.blob();
                const mimeType = blob.type || 'image/jpeg';
                const file = new File([blob], defaultName, { type: mimeType });
                formData.append('images', file);
                console.log(`Appended web blob image ${index + 1}`);
              } catch (error) {
                console.error(`Error processing image ${index + 1}:`, error);
              }
            } else if (imageData.uri && imageData.type) {
              // File object with type info
              const response = await fetch(imageData.uri);
              const blob = await response.blob();
              const file = new File([blob], imageData.fileName || defaultName, { type: imageData.type });
              formData.append('images', file);
              console.log(`Appended web file image ${index + 1}`);
            }
          } else {
            // Mobile - react-native-image-picker returns proper objects
            if (imageData.uri) {
              formData.append('images', {
                uri: imageData.uri,
                type: imageData.type || 'image/jpeg',
                name: imageData.fileName || defaultName,
              } as any);
              console.log(`Appended mobile image ${index + 1}: ${imageData.fileName || defaultName}`);
            }
          }
        };

        // Process each image
        for (let i = 0; i < item.images.length; i++) {
          await appendImageFile(item.images[i], i);
        }
      } else {
        console.log('No images to upload for item');
      }

      console.log('Sending item FormData to server...');

      const res = await fetch("http://localhost:3000/api/items/additem", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      const data = await res.json();
      console.log('Server response for item:', data);

      if (!res.ok) throw new Error(data.message || "Failed to add item");

      Alert.alert("Success", "Item added successfully!");
      // Refresh items after adding
      get().fetchItems();

      return data;
    } catch (error: any) {
      console.error("Error adding item:", error);
      throw error;
    }
  },




  register: async (username, email, phone, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong!");

      await storage.setItem("user", JSON.stringify(data.user));
      await storage.setItem("token", data.token);

      set({ user: data.user, token: data.token, isLoading: false });

      // Connect socket for real-time messaging
      useSocketStore.getState().connect(data.user._id);

      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      return { success: false, error: error.message || "Unknown error" };
    }
  },

  login: async (identifier, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong!");

      await storage.setItem("user", JSON.stringify(data.user));
      await storage.setItem("token", data.token);

      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      return { success: false, error: error.message || "Unknown error" };
    }
  },

  checkAuth: async () => {
    try {
      const token = await storage.getItem("token");
      const userJson = await storage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      if (token && user) {
        set({ user, token });

        // Connect socket for real-time messaging
        useSocketStore.getState().connect(user._id);

        return { success: true };
      }
      return { success: false, error: "No token or user found" };
    } catch (error: any) {
      return { success: false, error: error.message || "Unknown error" };
    }
  },

  logout: async () => {
    await storage.removeItem("user");
    await storage.removeItem("token");
    set({ user: null, token: null, products: [] });
  },

  fetchProducts: async () => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch("http://localhost:3000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch products");

      set({ products: data });
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch products");
    }
  },

  fetchOrders: async () => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch("http://localhost:3000/api/checkout/available-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");

      set({ orders: data });
    } catch (error: any) {
      console.error("Error fetching orders:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch orders");
    }
  },

  addProduct: async (productData) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const formData = new FormData();
      formData.append('Title', productData.Title);
      formData.append('from', productData.from);
      formData.append('to', productData.to);
      formData.append('description', productData.description);
      formData.append('price', productData.price.toString());
      formData.append('weight', productData.weight);
      formData.append('veichelType', productData.veichelType);

      if (productData.image) {
        if (Platform.OS === 'web') {
          // For web, convert blob URL to actual file
          const response = await fetch(productData.image.uri);
          const blob = await response.blob();
          formData.append('image', blob, productData.image.fileName);
        } else {
          formData.append('image', productData.image as any);
        }
      }

      if (productData.video) {
        if (Platform.OS === 'web') {
          const response = await fetch(productData.video.uri);
          const blob = await response.blob();
          formData.append('video', blob, productData.video.fileName);
        } else {
          formData.append('video', productData.video as any);
        }
      }

      const res = await fetch("http://localhost:3000/api/products/product", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type, let fetch set it for FormData
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add product");

      Alert.alert("Success", "Product added successfully!");
      // Refresh products after adding
      get().fetchProducts();
    } catch (error: any) {
      console.error("Error adding product:", error.message);
      Alert.alert("Error", error.message || "Failed to add product");
    }
  },

updateProduct: async (productId, updatedFields) => {
  try {
    const token = get().token;
    if (!token) throw new Error("No token found");

    const res = await fetch(`http://localhost:3000/api/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedFields), // e.g. { acceptedUsers: [ ... ] }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update product");

    Alert.alert("Success", "Product updated successfully!");
    // Refresh products list after updating
    get().fetchProducts();

  } catch (error: any) {
    console.error("Error updating product:", error.message);
    Alert.alert("Error", error.message || "Failed to update product");
  }
},


  fetchShops: async () => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");
      const res = await fetch("http://localhost:3000/api/shops", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch shops");
      set({ shops: data });
    } catch (error: any) {
      console.error("Error fetching shops:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch shops");
    }
  },

  fetchAllShops: async (page = 1, limit = 20) => {
    try {
      const res = await fetch(`http://localhost:3000/api/shops/all?page=${page}&limit=${limit}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch all shops");
      set({
        allShops: data.shops,
        allShopsPagination: data.pagination
      });
    } catch (error: any) {
      console.error("Error fetching all shops:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch all shops");
    }
  },

  fetchUserDashboard: async (userId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/products/user-dashboard/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch user dashboard");
      set({ userDashboard: data });
    } catch (error: any) {
      console.error("Error fetching user dashboard:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch user dashboard");
    }
  },

  fetchItems: async () => {
    try {
      const token = get().token;    
      if (!token) throw new Error("No token found");
      const res = await fetch("http://localhost:3000/api/items", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch items");
      set({ item: data });
    } catch (error: any) {
      console.error("Error fetching items:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch items");
    }
  },

  acceptProduct: async (productId, acceptData) => {
    try {
      const token = get().token;
      const user = get().user;
      if (!token) throw new Error("No token found");
      if (!user) throw new Error("No user found");

      const res = await fetch(`http://localhost:3000/api/products/products/${productId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          vehicleType: acceptData.acceptedVehicleType,
          tentativeTime: acceptData.tentativeDeliveryTime,
          price: acceptData.price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to accept product");

      Alert.alert("Success", "Product accepted successfully!");
      // Refresh products after accepting
      get().fetchProducts();
    } catch (error: any) {
      console.error("Error accepting product:", error.message);
      Alert.alert("Error", error.message || "Failed to accept product");
    }
  },

  acceptOrder: async (orderId, acceptData) => {
    try {
      const token = get().token;
      const user = get().user;
      if (!token) throw new Error("No token found");
      if (!user) throw new Error("No user found");

      const res = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          vehicleType: acceptData.acceptedVehicleType,
          tentativeTime: acceptData.tentativeDeliveryTime,
          price: acceptData.price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to accept order");

      Alert.alert("Success", "Order accepted successfully!");
      // Refresh orders after accepting
      get().fetchOrders();
    } catch (error: any) {
      console.error("Error accepting order:", error.message);
      Alert.alert("Error", error.message || "Failed to accept order");
    }
  },

  updateOrderBid: async (orderId, userId, newPrice) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/update-bid`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          newPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update bid");

      Alert.alert("Success", "Bid updated successfully!");
    } catch (error: any) {
      console.error("Error updating bid:", error.message);
      Alert.alert("Error", error.message || "Failed to update bid");
    }
  },

  confirmOrderBid: async (orderId, userId) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/confirm-bid`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm bid");

      Alert.alert("Success", "Bid confirmed successfully!");
    } catch (error: any) {
      console.error("Error confirming bid:", error.message);
      Alert.alert("Error", error.message || "Failed to confirm bid");
    }
  },

  updateDeliveryStatus: async (orderId, userId, status) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:3000/api/checkout/orders/${orderId}/update-delivery-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update delivery status");

      Alert.alert("Success", `Delivery status updated to ${status}!`);
    } catch (error: any) {
      console.error("Error updating delivery status:", error.message);
      Alert.alert("Error", error.message || "Failed to update delivery status");
    }
  },

  addShop: async (shop) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const formData = new FormData();
      formData.append('name', shop.name);
      formData.append('shopType', shop.shopType);
      formData.append('location', shop.location);
      formData.append('openingTime', shop.openingTime);
      formData.append('closingTime', shop.closingTime);
      formData.append('status', shop.status);

      // Handle images array - use the same approach as vehicle upload
      if (shop.images && shop.images.length > 0) {
        console.log('Processing shop images for upload:', shop.images.length);

        const appendImageFile = async (imageData: any, index: number) => {
          if (!imageData) return;

          const defaultName = `shop-image-${index + 1}.jpg`;

          if (Platform.OS === 'web') {
            // For web, handle different image data formats
            if (typeof imageData === 'string' && imageData.startsWith('blob:')) {
              // Blob URL - fetch and create proper file
              try {
                const response = await fetch(imageData);
                const blob = await response.blob();
                const mimeType = blob.type || 'image/jpeg';
                const file = new File([blob], defaultName, { type: mimeType });
                formData.append('images', file);
                console.log(`Appended web blob image ${index + 1}`);
              } catch (error) {
                console.error(`Error processing image ${index + 1}:`, error);
              }
            } else if (imageData.uri && imageData.type) {
              // File object with type info
              const response = await fetch(imageData.uri);
              const blob = await response.blob();
              const file = new File([blob], imageData.fileName || defaultName, { type: imageData.type });
              formData.append('images', file);
              console.log(`Appended web file image ${index + 1}`);
            }
          } else {
            // Mobile - react-native-image-picker returns proper objects
            if (imageData.uri) {
              formData.append('images', {
                uri: imageData.uri,
                type: imageData.type || 'image/jpeg',
                name: imageData.fileName || defaultName,
              } as any);
              console.log(`Appended mobile image ${index + 1}: ${imageData.fileName || defaultName}`);
            }
          }
        };

        // Process each image
        for (let i = 0; i < shop.images.length; i++) {
          await appendImageFile(shop.images[i], i);
        }
      } else {
        console.log('No images to upload');
      }

      console.log('Sending FormData to server...');

      const res = await fetch("http://localhost:3000/api/shops/shop", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      const data = await res.json();
      console.log('Server response:', data);

      if (!res.ok) throw new Error(data.message || "Failed to add shop");

      Alert.alert("Success", "Shop added successfully!");
      // Refresh shops after adding
      get().fetchShops();
    } catch (error: any) {
      console.error("Error adding shop:", error.message);
      Alert.alert("Error", error.message || "Failed to add shop");
    }
  },

  updateBid: async (productId, userId, newPrice) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:3000/api/products/products/${productId}/update-bid`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          newPrice
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update bid");

      Alert.alert("Success", "Bid updated successfully!");
      // Refresh products after updating bid
      get().fetchProducts();
    } catch (error: any) {
      console.error("Error updating bid:", error.message);
      Alert.alert("Error", error.message || "Failed to update bid");
    }
  },

  confirmBid: async (productId, userId) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:3000/api/products/products/${productId}/confirm-bid`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm bid");

      Alert.alert("Success", "Bid confirmed successfully! Product is now in-transit.");
      // Refresh products after confirming bid
      get().fetchProducts();
    } catch (error: any) {
      console.error("Error confirming bid:", error.message);
      Alert.alert("Error", error.message || "Failed to confirm bid");
    }
  },

  // Cart functionality
  getCart: async () => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch("http://localhost:3000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch cart");

      set({ cart: data });
    } catch (error: any) {
      console.error("Error fetching cart:", error.message);
      ToastManager.show(error.message || "Failed to fetch cart", "error");
    }
  },

  addToCart: async (subItemId, quantity = 1) => {
    try {
      const token = get().token;
      console.log("addToCart called with:", { subItemId, quantity, hasToken: !!token });

      if (!token) {
        console.error("No token found in addToCart");
        throw new Error("No token found");
      }

      console.log("Making request to: http://localhost:3000/api/cart/add");
      const res = await fetch("http://localhost:3000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subItemId, quantity }),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (!res.ok) {
        console.error("Request failed with status:", res.status);
        throw new Error(data.message || "Failed to add to cart");
      }

      console.log("Setting cart data:", data.cart);
      set({ cart: data.cart });
      ToastManager.show("Item added to cart!", "success");
      return data.cart;
    } catch (error: any) {
      console.error("Error adding to cart:", error.message);
      ToastManager.show(error.message || "Failed to add to cart", "error");
    }
  },

  updateCartItem: async (subItemId, quantity) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch("http://localhost:3000/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subItemId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update cart");

      set({ cart: data.cart });
    } catch (error: any) {
      console.error("Error updating cart:", error.message);
      ToastManager.show(error.message || "Failed to update cart", "error");
    }
  },

  removeFromCart: async (subItemId) => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:3000/api/cart/remove/${subItemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove from cart");

      set({ cart: data.cart });
      ToastManager.show("Item removed from cart!", "success");
    } catch (error: any) {
      console.error("Error removing from cart:", error.message);
      ToastManager.show(error.message || "Failed to remove from cart", "error");
    }
  },

  clearCart: async () => {
    console.log("🔄 clearCart function started");
    debugger; // Add debugger breakpoint
    try {
      const token = get().token;
      console.log("🔑 Token exists:", !!token, "Token value:", token ? token.substring(0, 20) + "..." : "null");
      if (!token) throw new Error("No token found");

      console.log("📡 Making DELETE request to http://localhost:3000/api/cart/clear");
      const res = await fetch("http://localhost:3000/api/cart/clear", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📊 Response status:", res.status, "OK:", res.ok);
      const data = await res.json();
      console.log("📦 Response data:", data);
      if (!res.ok) {
        console.error("❌ Request failed with status:", res.status);
        throw new Error(data.message || "Failed to clear cart");
      }

      console.log("💾 Setting cart state to empty");
      const emptyCart = { items: [], totalAmount: 0, itemCount: 0 };
      set({ cart: emptyCart });
      console.log("✅ Cart state updated:", emptyCart);

      // Also refresh cart from server to ensure consistency
      console.log("🔄 Refreshing cart from server");
      await get().getCart();
      console.log("📋 Cart refreshed from server");

      ToastManager.show("Cart cleared!", "success");
      console.log("🎉 Clear cart completed successfully");
    } catch (error: any) {
      console.error("💥 Error in clearCart:", error.message, error.stack);
      ToastManager.show(error.message || "Failed to clear cart", "error");
    }
  },

  checkout: async () => {
    try {
      const token = get().token;
      if (!token) throw new Error("No token found");

      const res = await fetch("http://localhost:3000/api/cart/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Checkout failed");

      set({ cart: { items: [], totalAmount: 0, itemCount: 0 } });
      Alert.alert("Success", data.message);
    } catch (error: any) {
      console.error("Error during checkout:", error.message);
      Alert.alert("Error", error.message || "Checkout failed");
    }
  },


}));
