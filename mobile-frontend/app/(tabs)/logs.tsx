import { useTheme } from "@/constants/theme";
import { useMealLogs } from "@/hooks/useMealLogs";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const HEADER_EXPANDED_HEIGHT = 210;
const HEADER_COLLAPSED_HEIGHT = 150; // Increased to accommodate 80px buttons + padding

export default function LogsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { getLogsForDate, getDailyTotals, deleteLog } = useMealLogs();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const scrollY = useSharedValue(0);

  const dayLogs = useMemo(
    () => getLogsForDate(selectedDate),
    [selectedDate, getLogsForDate],
  );
  const totals = useMemo(
    () => getDailyTotals(selectedDate),
    [selectedDate, getDailyTotals],
  );

  const CALORIE_GOAL = 2000;
  const calorieProgress = Math.min(totals.calories / CALORIE_GOAL, 1);

  const dateStrip = useMemo(() => {
    return Array.from({ length: 14 })
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
      })
      .reverse();
  }, []);

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Delete Log",
      "Are you sure you want to remove this meal from your history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => await deleteLog(id),
        },
      ],
    );
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 60],
      [1, 0],
      Extrapolate.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 60],
      [0, -20],
      Extrapolate.CLAMP,
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const headerContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
      Extrapolate.CLAMP,
    );
    return {
      height,
    };
  });

  const dateStripAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -60], // Move date strip up more to utilize space freed by Journal text
      Extrapolate.CLAMP,
    );
    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Animated Sticky Header */}
      <Animated.View style={[styles.headerContainer, headerContainerStyle]}>
        <BlurView
          intensity={50}
          tint={theme.isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
          experimentalBlurMethod="dimezisBlurView"
        />

        <Animated.View style={[styles.headerTop, titleAnimatedStyle]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Journal
          </Text>
          <TouchableOpacity style={styles.calendarButton}>
            <MaterialIcons name="event" size={24} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[styles.dateStripWrapper, dateStripAnimatedStyle]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
            ref={(ref) => ref?.scrollToEnd({ animated: false })}
          >
            {dateStrip.map((date, i) => {
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedDate(date)}
                  style={[
                    styles.dateItem,
                    isSelected && {
                      backgroundColor: theme.tint,
                      borderColor: theme.tint,
                    },
                    !isSelected &&
                      isToday && { borderColor: theme.tint, borderWidth: 2 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateDay,
                      {
                        color: isSelected
                          ? theme.isDark
                            ? "#000"
                            : "#fff"
                          : theme.textMuted,
                      },
                    ]}
                  >
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                  <Text
                    style={[
                      styles.dateNumber,
                      {
                        color: isSelected
                          ? theme.isDark
                            ? "#000"
                            : "#fff"
                          : theme.text,
                      },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
        <LinearGradient
          colors={[
            theme.isDark ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)",
            theme.background,
          ]}
          style={styles.headerBottomGradient}
        />
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_EXPANDED_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[
            styles.dashboardCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
            },
          ]}
        >
          <View style={styles.dashboardMain}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dashboardLabel, { color: theme.textMuted }]}>
                DAILY BUDGET
              </Text>
              <Text style={[styles.dashboardValue, { color: theme.text }]}>
                {totals.calories}{" "}
                <Text style={styles.dashboardUnit}>/ {CALORIE_GOAL} kcal</Text>
              </Text>
              <View
                style={[
                  styles.progressBarBase,
                  {
                    backgroundColor: theme.isDark ? "#334155" : "#f1f5f9",
                    marginTop: 12,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: theme.tint,
                      width: `${calorieProgress * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.macroRow}>
            <MacroSummary
              label="Protein"
              value={totals.protein}
              goal={140}
              color="#3b82f6"
              theme={theme}
            />
            <MacroSummary
              label="Carbs"
              value={totals.carbs}
              goal={250}
              color="#f97316"
              theme={theme}
            />
            <MacroSummary
              label="Fats"
              value={totals.fats}
              goal={70}
              color="#eab308"
              theme={theme}
            />
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today's Entries"
              : "Entries for " +
                selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
          </Text>
          <TouchableOpacity onPress={() => router.push("/")}>
            <Text style={[styles.addText, { color: theme.tint }]}>
              + Add New
            </Text>
          </TouchableOpacity>
        </View>

        {dayLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="auto-awesome"
              size={48}
              color={theme.tint}
              style={{ opacity: 0.5 }}
            />
            <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
              {selectedDate.toDateString() === new Date().toDateString()
                ? "Snap a photo of your meal to start tracking!"
                : "No entries for this date."}
            </Text>
          </View>
        ) : (
          dayLogs.map((log, index) => (
            <Animated.View
              key={log.id}
              entering={FadeInDown.delay(200 + index * 100)}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/log-details",
                    params: { id: log.id },
                  })
                }
                onLongPress={() => confirmDelete(log.id)}
                style={[
                  styles.logCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
                  },
                ]}
              >
                <Image
                  source={{ uri: log.imageUri }}
                  style={styles.logImage}
                  contentFit="cover"
                />
                <View style={styles.logInfo}>
                  <Text style={[styles.logTime, { color: theme.textMuted }]}>
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text
                    style={[styles.logTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {log.nutrition.ingredients[0] || "Analyzed Meal"}
                  </Text>
                  <Text style={[styles.logMacros, { color: theme.textMuted }]}>
                    {log.nutrition.calories_kcal} kcal •{" "}
                    {log.nutrition.protein_g}g protein
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
}

const MacroSummary = ({ label, value, goal, color, theme }: any) => {
  const progress = Math.min(value / goal, 1);
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroLabel, { color: theme.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.macroValue, { color: theme.text }]}>{value}g</Text>
      <View
        style={[
          styles.macroBarBase,
          { backgroundColor: theme.isDark ? "#334155" : "#f1f5f9" },
        ]}
      >
        <View
          style={[
            styles.macroBarFill,
            { backgroundColor: color, width: `${progress * 100}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 11,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "bold",
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  dateStripWrapper: {
    zIndex: 12,
  },
  dateStrip: {
    paddingHorizontal: 15,
    gap: 10,
    paddingBottom: 20,
  },
  dateItem: {
    width: 60,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  dateDay: {
    fontSize: 12,
    fontFamily: "medium",
  },
  dateNumber: {
    fontSize: 18,
    fontFamily: "bold",
  },
  headerBottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  dashboardCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  dashboardMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 28,
  },
  dashboardLabel: {
    fontSize: 11,
    fontFamily: "semibold",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  dashboardValue: {
    fontSize: 36,
    fontFamily: "bold",
  },
  dashboardUnit: {
    fontSize: 14,
    fontFamily: "medium",
    opacity: 0.4,
  },
  progressBarBase: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 24,
    gap: 12,
  },
  macroItem: {
    flex: 1,
    gap: 4,
  },
  macroLabel: {
    fontSize: 10,
    fontFamily: "semibold",
    letterSpacing: 0.5,
  },
  macroValue: {
    fontSize: 15,
    fontFamily: "bold",
  },
  macroBarBase: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  macroBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "bold",
  },
  addText: {
    fontFamily: "semibold",
    fontSize: 14,
  },
  logCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 14,
    gap: 16,
  },
  logImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  logInfo: {
    flex: 1,
    gap: 2,
  },
  logTime: {
    fontSize: 11,
    fontFamily: "semibold",
    opacity: 0.6,
  },
  logTitle: {
    fontSize: 17,
    fontFamily: "bold",
  },
  logMacros: {
    fontSize: 13,
    fontFamily: "medium",
    opacity: 0.7,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: "medium",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.8,
  },
});
