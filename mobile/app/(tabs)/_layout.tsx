import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, TouchableOpacity, Text, View } from "react-native";
import { useRouter } from "expo-router";
import COLORS from "@/constants/color";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: COLORS.primary,
          headerTitleStyle: { color: COLORS.textPrimary, fontWeight: "600" },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowDrawer(true)} style={{ marginRight: 10 }}>
              <Ionicons name="menu" size={24} color="black" />
            </TouchableOpacity>
          ),
          tabBarStyle: {
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: 5 + insets.bottom,
            paddingTop: 5,
            backgroundColor: COLORS.cardBackground,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: "Products",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Traverals"
          options={{
            title: "Traverals",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        
      </Tabs>
      <Modal
        visible={showDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDrawer(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setShowDrawer(false)}
        >
          <View style={{ width: 250, height: '100%', backgroundColor: 'white', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Drawer Menu</Text>
              <TouchableOpacity onPress={() => setShowDrawer(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { setShowDrawer(false); router.push('/index' as any); }} style={{ paddingVertical: 10 }}>
              <Text>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowDrawer(false); router.push('/products' as any); }} style={{ paddingVertical: 10 }}>
              <Text>Products</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowDrawer(false); router.push('/userProducts' as any); }} style={{ paddingVertical: 10 }}>
              <Text>Your Products</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowDrawer(false); router.push('/all-shops' as any); }} style={{ paddingVertical: 10 }}>
              <Text>All Shops</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowDrawer(false); router.push('/shop' as any); }} style={{ paddingVertical: 10 }}>
              <Text>Your Shops</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowDrawer(false); router.push('/profile' as any); }} style={{ paddingVertical: 10 }}>
              <Text>Profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
