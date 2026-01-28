import { Stack, useRouter, useSegments } from "expo-router";
import { StyleSheet, Text, View, SafeAreaView } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import FloatingCart from "../components/FloatingCart";
import Toast, { ToastManager } from "../components/Toast";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; key: number } | null>(null);

  console.log("segments", segments);

  const {checkAuth, user, token} = useAuthStore();

  // Register toast manager
  useEffect(() => {
    ToastManager.register((message, type = 'info', duration = 3000) => {
      const key = Date.now();
      setToast({ message, type, key });
      setTimeout(() => {
        setToast(null);
      }, duration);
    });

    return () => {
      ToastManager.unregister();
    };
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const inAuthScreen = segments[0] === "(auth)";
    const isSignedIn = user && token;

    if( !isSignedIn && !inAuthScreen ) {
      router.replace("/(auth)");
    } else if( isSignedIn && inAuthScreen ) {
      router.replace("/(tabs)");
    }
  }, [user, token, segments]);

  return (
  <SafeAreaProvider>
    <SafeScreen>
      <Stack screenOptions={{ headerShown: false }}>
         <Stack.Screen name="(drawer)" />
         <Stack.Screen name="(auth)" />
       </Stack>
    </SafeScreen>
    <FloatingCart />
    {toast && (
      <Toast
        key={toast.key}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(null)}
      />
    )}
    </SafeAreaProvider>
  )
}

