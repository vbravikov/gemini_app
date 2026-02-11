import { useTheme } from "@/constants/theme";
import { useLoadedFonts } from "@/hooks/useLoadedFonts";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { ActivityIndicator, Platform, Text, View } from "react-native";
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
              title: "Meal Info",
              presentation: "modal",
              animation: "slide_from_bottom",
              headerTransparent: true,
              headerTintColor: "rgba(255, 255, 255, 0.8)",
              headerShown: Platform.select({
                android: false,
                default: true,
              }),
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
