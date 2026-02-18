import { useTheme } from "@/constants/theme";
import { useLoadedFonts } from "@/hooks/useLoadedFonts";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colors = useTheme();
  const [loaded, error] = useLoadedFonts();

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ActivityIndicator
          style={{ flex: 1, justifyContent: "center" }}
          size="large"
          color={colors.tint}
        />
      </View>
    );
  }

  if (error) {
    console.error("Error loading fonts:", error);
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.text }}>Failed to load fonts.</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colors.isDark ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: colors.isDark
                ? DarkTheme.colors.background
                : DefaultTheme.colors.background,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="meal-info"
            options={{
              title: "Analysis Results",
              presentation: "modal",
              animation: "slide_from_bottom",
              headerTransparent: true,
              headerTintColor: colors.isDark ? "#fff" : "rgba(0, 0, 0, 0.8)",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="log-details"
            options={{
              title: "Log Entry",
              presentation: "modal",
              animation: "slide_from_bottom",
              headerTransparent: true,
              headerTintColor: colors.isDark ? "#fff" : "rgba(0, 0, 0, 0.8)",
              headerShown: true,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
