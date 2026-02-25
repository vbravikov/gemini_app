import { TopTabs } from "@/components/ui/base/tabs";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
export const MEAL_HEADER_HEIGHT = SCREEN_HEIGHT * 0.4;

export interface ActionButton {
  label: string;
  onPress: () => void;
  /** Flex weight. Defaults to 1. */
  flex?: number;
  /** Filled (primary) or outlined (secondary). Defaults to "filled". */
  variant?: "filled" | "outlined";
  /** Override background color for filled buttons. */
  backgroundColor?: string;
  /** Override text/border color. */
  color?: string;
  /** Leading icon node. */
  icon?: React.ReactNode;
  /** Box shadow string (CSS syntax). */
  boxShadow?: string;
  /** Row flex direction (for icon + label). Defaults to true when icon is provided. */
  row?: boolean;
}

export interface HeroInfo {
  /** Main title shown over the hero image. */
  title: string;
  /** Optional subtitle (date, confidence, etc.). */
  subtitle?: React.ReactNode;
  /** Bottom offset for the hero info block. Defaults to 28. */
  bottomOffset?: number;
}

export interface Tab {
  id: string;
  title: string;
  titleComponent?: (isActive: boolean) => React.ReactNode;
  contentComponent: React.ReactNode | null;
}

interface MealDetailViewProps {
  imageUri: string;
  heroInfo: HeroInfo;
  tabs: Tab[];
  actions: [ActionButton, ActionButton];
  /** Extra bottom padding for the scroll content. Defaults to 180. */
  scrollPaddingBottom?: number;
  /** Inline backgroundColor override on contentContainerStyle. */
  contentBackgroundColor?: string;
  /** Bottom border color of the action bar. */
  actionBarBorderColor?: string;
  activeColor: string;
  inactiveColor: string;
  underlineColor: string;
  backgroundColor: string;
  isDark: boolean;
}

export const MealDetailView = ({
  imageUri,
  heroInfo,
  tabs,
  actions,
  scrollPaddingBottom = 180,
  contentBackgroundColor,
  actionBarBorderColor = "rgba(0,0,0,0.05)",
  activeColor,
  inactiveColor,
  underlineColor,
  backgroundColor,
  isDark,
}: MealDetailViewProps) => {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, MEAL_HEADER_HEIGHT],
      [0, MEAL_HEADER_HEIGHT * 0.4],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollY.value,
      [0, MEAL_HEADER_HEIGHT * 0.8],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }, { scale }], opacity };
  });

  const [leftAction, rightAction] = actions;

  return (
    <>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          { paddingBottom: scrollPaddingBottom },
          contentBackgroundColor
            ? { backgroundColor: contentBackgroundColor }
            : undefined,
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Parallax Hero */}
        <Animated.View style={[styles.heroContainer, heroAnimatedStyle]}>
          <Image
            source={{ uri: imageUri }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={[
              isDark ? "rgba(16, 34, 19, 0.3)" : "rgba(0, 0, 0, 0.2)",
              "transparent",
              backgroundColor,
            ]}
            style={StyleSheet.absoluteFill}
            locations={[0, 0.4, 0.95]}
          />
          {/* Second gradient: dark scrim at the bottom behind the title text */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.65)"]}
            style={StyleSheet.absoluteFill}
            locations={[0.45, 1]}
          />
          <View
            style={[
              styles.heroBottomInfo,
              { bottom: heroInfo.bottomOffset ?? 28 },
            ]}
          >
            <Text style={[styles.heroTitle, { color: "#fff" }]}>
              {heroInfo.title}
            </Text>
            {heroInfo.subtitle}
          </View>
        </Animated.View>

        {/* Tabs */}
        <View style={[styles.tabsWrapper, { backgroundColor }]}>
          <TopTabs
            tabs={tabs}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            underlineColor={underlineColor}
          />
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <BlurView
        intensity={30}
        tint={isDark ? "dark" : "light"}
        style={[styles.bottomActionBar, { borderTopColor: actionBarBorderColor }]}
        experimentalBlurMethod="dimezisBlurView"
      >
        <View style={styles.bottomActionContent}>
          <ActionBtn action={leftAction} />
          <ActionBtn action={rightAction} />
        </View>
      </BlurView>
    </>
  );
};

const ActionBtn = ({ action }: { action: ActionButton }) => {
  const isOutlined = action.variant === "outlined";
  const hasRow = action.row ?? !!action.icon;

  return (
    <TouchableOpacity
      onPress={action.onPress}
      style={[
        styles.actionButton,
        { flex: action.flex ?? 1 },
        hasRow && { flexDirection: "row" },
        isOutlined
          ? { borderWidth: 1, borderColor: action.color ?? "#ccc" }
          : { backgroundColor: action.backgroundColor },
        action.boxShadow ? { boxShadow: action.boxShadow } : undefined,
      ]}
    >
      {action.icon}
      <Text
        style={[
          styles.actionButtonText,
          { color: action.color ?? "#fff" },
        ]}
      >
        {action.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: "100%",
    height: MEAL_HEADER_HEIGHT,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroBottomInfo: {
    position: "absolute",
    left: 24,
    right: 24,
    zIndex: 40,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: "bold",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tabsWrapper: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    minHeight: SCREEN_HEIGHT,
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  bottomActionContent: {
    flexDirection: "row",
    gap: 16,
    padding: 24,
    paddingBottom: 40,
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "bold",
  },
});
