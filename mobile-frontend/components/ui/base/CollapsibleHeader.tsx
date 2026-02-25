/**
 * CollapsibleHeader
 *
 * A reusable sticky header that animates between an expanded and collapsed
 * height as the user scrolls. Wrap your screen's list/scroll-view in this
 * component and pass the same `scrollY` shared-value to both the header and
 * your `Animated.FlatList` / `Animated.ScrollView`.
 *
 * Usage:
 *   const scrollY = useSharedValue(0);
 *
 *   <CollapsibleHeader
 *     scrollY={scrollY}
 *     expandedHeight={200}
 *     collapsedHeight={120}
 *     title="Journal"
 *     accessory={<TouchableOpacity>...</TouchableOpacity>}
 *   >
 *     // Optional extra content (e.g. a date strip) rendered below the title row
 *     <DateStrip ... />
 *   </CollapsibleHeader>
 *
 *   <AnimatedFlatList
 *     onScroll={useAnimatedScrollHandler({ onScroll: e => { scrollY.value = e.contentOffset.y } })}
 *     contentContainerStyle={{ paddingTop: expandedHeight }}
 *     ...
 *   />
 */

import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

export interface CollapsibleHeaderProps {
  /** Shared scroll-Y value from the sibling list. */
  scrollY: SharedValue<number>;
  /** Full height when scroll is at the top. */
  expandedHeight: number;
  /** Minimum height when collapsed. */
  collapsedHeight: number;
  /**
   * Large title shown in expanded state (fades + slides out on scroll).
   * Pass a string for simple text, or a React node for custom rendering.
   */
  title: string | React.ReactNode;
  /**
   * Compact title shown in the collapsed state (fades in as the large title
   * fades out). Typically a short string like today's date or the screen name.
   */
  collapsedTitle?: string;
  /** Optional node placed at the right of the title row (e.g. icon button). */
  accessory?: React.ReactNode;
  /** Extra content rendered below the title row (e.g. a date strip). */
  children?: React.ReactNode;
  /** Blur tint — mirrors expo-blur `tint`. Defaults to "light". */
  tint?: "light" | "dark" | "default";
  /** Background color used for the bottom fade gradient. */
  backgroundColor: string;
  /** Text color for the default title string rendering. */
  titleColor: string;
  /** paddingTop to push content below the status bar. Defaults to 56. */
  statusBarHeight?: number;
}

export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  scrollY,
  expandedHeight,
  collapsedHeight,
  title,
  collapsedTitle,
  accessory,
  children,
  tint = "light",
  backgroundColor,
  titleColor,
  statusBarHeight = 56,
}) => {
  // Container height interpolation
  const headerContainerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, 100],
      [expandedHeight, collapsedHeight],
      Extrapolation.CLAMP,
    ),
  }));

  // Title row fades + slides up on scroll
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 60],
          [0, -20],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // Collapsed title fades in as the large title disappears
  const collapsedTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [40, 90], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [40, 90],
          [10, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // Children (e.g. date strip) slide up as the header collapses
  const childrenAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -60],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.container, headerContainerStyle]}>
      {/* Frosted glass background */}
      <BlurView
        intensity={50}
        tint={tint}
        style={StyleSheet.absoluteFill}
        experimentalBlurMethod="dimezisBlurView"
      />

      {/* Collapsed title — fades in as the large title disappears */}
      {collapsedTitle && (
        <Animated.View
          style={[
            styles.collapsedTitleContainer,
            { paddingTop: statusBarHeight },
            collapsedTitleStyle,
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.collapsedTitleText, { color: titleColor }]}>
            {collapsedTitle}
          </Text>
        </Animated.View>
      )}

      {/* Title row */}
      <Animated.View
        style={[
          styles.titleRow,
          { paddingTop: statusBarHeight },
          titleAnimatedStyle,
        ]}
      >
        {typeof title === "string" ? (
          <Text style={[styles.titleText, { color: titleColor }]}>{title}</Text>
        ) : (
          title
        )}
        {accessory && <View style={styles.accessory}>{accessory}</View>}
      </Animated.View>

      {/* Extra content (date strip, etc.) */}
      {children && (
        <Animated.View style={childrenAnimatedStyle}>{children}</Animated.View>
      )}

      {/* Bottom fade so content appears to slide under the header */}
      {/* <LinearGradient
        colors={["rgba(0,0,0,0)", backgroundColor]}
        style={ {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  }}
      /> */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 11,
  },
  titleText: {
    fontSize: 32,
    fontFamily: "bold",
  },
  accessory: {
    justifyContent: "center",
    alignItems: "center",
  },

  collapsedTitleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
    zIndex: 12,
  },
  collapsedTitleText: {
    fontSize: 17,
    fontFamily: "semibold",
  },
});
