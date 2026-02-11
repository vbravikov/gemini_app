import { useColorScheme } from "react-native";

/**
 * A clean, modern palette for a health & diet app.
 * Replaces harsh neon green with sophisticated Emerald and Sage tones.
 */
const palette = {
  // Primary Greens (Clean & Professional)
  primary: "#10B981",      // Emerald 500
  primaryDark: "#059669",  // Emerald 600
  primaryLight: "#D1FAE5", // Emerald 100
  
  // Neutral Backgrounds
  backgroundLight: "#F9FAFB", // Slate 50
  backgroundDark: "#0F172A",  // Slate 900
  
  // Card Surfaces
  cardLight: "#FFFFFF",
  cardDark: "#1E293B",        // Slate 800
  
  // Text Colors
  textMainLight: "#111827",   // Slate 900
  textMainDark: "#F8FAFC",    // Slate 50
  textMutedLight: "#64748B",  // Slate 500
  textMutedDark: "#94A3B8",   // Slate 400
  
  // Accents
  accentBlue: "#3B82F6",
  accentOrange: "#F59E0B",
  accentYellow: "#EAB308",
};

export const Colors = {
  light: {
    text: palette.textMainLight,
    textMuted: palette.textMutedLight,
    background: palette.backgroundLight,
    card: palette.cardLight,
    tint: palette.primary,
    primaryDark: palette.primaryDark,
    primaryLight: palette.primaryLight,
    icon: palette.textMutedLight,
    tabIconDefault: palette.textMutedLight,
    tabIconSelected: palette.primary,
    border: "#E2E8F0",
    isDark: false,
  },
  dark: {
    text: palette.textMainDark,
    textMuted: palette.textMutedDark,
    background: palette.backgroundDark,
    card: palette.cardDark,
    tint: palette.primary,
    primaryDark: palette.primaryDark,
    primaryLight: "#064E3B", // Deep Forest
    icon: palette.textMutedDark,
    tabIconDefault: palette.textMutedDark,
    tabIconSelected: palette.primary,
    border: "#334155",
    isDark: true,
  },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function useTheme() {
  const colorScheme = useColorScheme() ?? "light";
  return Colors[colorScheme];
}
