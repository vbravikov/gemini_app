import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { useTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons size={28} name="home-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
