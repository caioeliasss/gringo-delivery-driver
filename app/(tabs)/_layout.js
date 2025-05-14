// app/(tabs)/_layout.js
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { HapticTab } from "@/components/HapticTab";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  // const colorScheme = useColorScheme();
  const colorScheme = "light";

  // Gringo brand colors
  const colors = {
    primary: "#EB2E3E", // Main red
    secondary: "#FBBF24", // Yellow
    white: "#FFFFFF",
    dark: {
      background: "#252525",
      tint: "#FFFFFF",
    },
    light: {
      background: "#FFFFFF",
      tint: "#EB2E3E",
    },
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:
          colorScheme === "dark" ? colors.secondary : colors.primary,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {
            backgroundColor:
              colorScheme === "dark"
                ? colors.dark.background
                : colors.light.background,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          headerTitle: "Início",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerTitle: "Meu Perfil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.2.circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
