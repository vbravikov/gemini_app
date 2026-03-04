import { CollapsibleHeader } from "@/components/ui/base/CollapsibleHeader";
import { useTheme } from "@/constants/theme";
import { MealLog, useMealLogs } from "@/hooks/useMealLogs";
import { useCustomDailyGoals } from "@/hooks/useDailyGoals";
import {
  FoodSearchSheet,
  FoodSearchSheetHandle,
} from "@/components/ui/meal-analysis/FoodSearchSheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<MealLog[]>);

const HEADER_EXPANDED_HEIGHT = 210;
const HEADER_COLLAPSED_HEIGHT = 150;
const GAP = 10;
const H_PAD = 20;

// ---------------------------------------------------------------------------
// Photo grid cell
// ---------------------------------------------------------------------------
const GridCell = ({
  log,
  theme,
  router,
  index,
  cellSize,
}: {
  log: MealLog;
  theme: ReturnType<typeof useTheme>;
  router: ReturnType<typeof useRouter>;
  index: number;
  cellSize: number;
}) => (
  <Animated.View
    entering={FadeIn.delay(index * 60)}
    style={[cellStyles.wrap, { width: cellSize, height: cellSize * 1.2 }]}
  >
    <Link href={{ pathname: "/log-details", params: { id: log.id } }} asChild>
      <Link.Trigger withAppleZoom>
        <TouchableOpacity activeOpacity={0.88} style={cellStyles.touch}>
          {/* Full-bleed photo */}
          <Image
            source={{ uri: log.imageUri }}
            style={cellStyles.photo}
            contentFit="cover"
          />

          {/* Gradient scrim at bottom */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.72)"]}
            style={cellStyles.scrim}
          />

          {/* Calorie badge — top right */}
          <View style={cellStyles.calBadge}>
            <Text style={cellStyles.calText}>
              {log.nutrition.calories_kcal}
            </Text>
            <Text style={cellStyles.calUnit}>kcal</Text>
          </View>

          {/* Name + time at bottom */}
          <View style={cellStyles.footer}>
            <Text style={cellStyles.dishName} numberOfLines={2}>
              {log.nutrition.dish_name ?? "Meal"}
            </Text>
            <Text style={cellStyles.time}>
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </TouchableOpacity>
      </Link.Trigger>
      <Link.Preview />
      <Link.Menu>
        <Link.MenuAction
          title="View"
          icon="eye"
          onPress={() =>
            router.push({ pathname: "/log-details", params: { id: log.id } })
          }
        />
        <Link.MenuAction
          title="Delete"
          icon="trash"
          destructive
          onPress={() => {
            /* deleteLog handled in parent */
          }}
        />
      </Link.Menu>
    </Link>
  </Animated.View>
);

const cellStyles = StyleSheet.create({
  wrap: {
    borderRadius: 22,
    overflow: "hidden",
  },
  touch: {
    flex: 1,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  calBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  calText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "bold",
    lineHeight: 15,
  },
  calUnit: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontFamily: "medium",
    lineHeight: 10,
  },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    gap: 2,
  },
  dishName: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "bold",
    lineHeight: 17,
  },
  time: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontFamily: "medium",
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function LogsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width: SCREEN_W } = useWindowDimensions();
  const CELL_SIZE = (SCREEN_W - H_PAD * 2 - GAP) / 2;

  const { getLogsForDate, getDailyTotals } = useMealLogs();
  const { goals } = useCustomDailyGoals();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const foodSearchSheetRef = useRef<FoodSearchSheetHandle>(null);

  const scrollY = useSharedValue(0);

  const dayLogs = useMemo(
    () => getLogsForDate(selectedDate),
    [selectedDate, getLogsForDate],
  );
  const totals = useMemo(
    () => getDailyTotals(selectedDate),
    [selectedDate, getDailyTotals],
  );

  const calorieProgress = Math.min(totals.calories / goals.calories_kcal, 1);

  const dateStrip = useMemo(() => {
    return Array.from({ length: 14 })
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
      })
      .reverse();
  }, []);

  // Pair logs into rows of 2 for the grid
  const gridRows = useMemo(() => {
    const rows: MealLog[][] = [];
    for (let i = 0; i < dayLogs.length; i += 2) {
      rows.push(dayLogs.slice(i, i + 2));
    }
    return rows;
  }, [dayLogs]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const renderItem = useCallback(
    ({ item: row, index: rowIdx }: { item: MealLog[]; index: number }) => (
      <View style={gridStyles.row}>
        {row.map((log, colIdx) => (
          <GridCell
            key={log.id}
            log={log}
            theme={theme}
            router={router}
            index={rowIdx * 2 + colIdx}
            cellSize={CELL_SIZE}
          />
        ))}
        {/* Spacer when odd number of items */}
        {row.length === 1 && <View style={{ width: CELL_SIZE }} />}
      </View>
    ),
    [theme, router, CELL_SIZE],
  );

  const listHeader = useMemo(
    () => (
      <View style={gridStyles.listHeader}>
        {/* Stats strip */}
        <View style={gridStyles.statsStrip}>
          <StatChip
            value={`${totals.calories}`}
            unit="kcal"
            label="Calories"
            color={theme.tint}
            theme={theme}
          />
          <View
            style={[
              gridStyles.divider,
              {
                backgroundColor: theme.isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.07)",
              },
            ]}
          />
          <StatChip
            value={`${totals.protein}`}
            unit="g"
            label="Protein"
            color="#3b82f6"
            theme={theme}
          />
          <View
            style={[
              gridStyles.divider,
              {
                backgroundColor: theme.isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.07)",
              },
            ]}
          />
          <StatChip
            value={`${totals.carbs}`}
            unit="g"
            label="Carbs"
            color="#f97316"
            theme={theme}
          />
          <View
            style={[
              gridStyles.divider,
              {
                backgroundColor: theme.isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.07)",
              },
            ]}
          />
          <StatChip
            value={`${totals.fats}`}
            unit="g"
            label="Fats"
            color="#eab308"
            theme={theme}
          />
        </View>

        {/* Progress bar */}
        <View
          style={[
            gridStyles.progressTrack,
            { backgroundColor: theme.isDark ? "#334155" : "#f1f5f9" },
          ]}
        >
          <View
            style={[
              gridStyles.progressFill,
              {
                backgroundColor: theme.tint,
                width: `${calorieProgress * 100}%`,
              },
            ]}
          />
        </View>

        {/* Section row */}
        <View style={gridStyles.sectionRow}>
          <Text style={[gridStyles.sectionTitle, { color: theme.text }]}>
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today"
              : selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
            {dayLogs.length > 0 && (
              <Text
                style={{
                  color: theme.textMuted,
                  fontFamily: "medium",
                  fontSize: 15,
                }}
              >
                {" · "}
                {dayLogs.length} meal{dayLogs.length !== 1 ? "s" : ""}
              </Text>
            )}
          </Text>
          <TouchableOpacity
            onPress={() => foodSearchSheetRef.current?.present()}
            style={[gridStyles.addBtn, { backgroundColor: theme.tint }]}
          >
            <MaterialIcons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      theme,
      totals,
      calorieProgress,
      selectedDate,
      dayLogs.length,
    ],
  );

  const listEmpty = useMemo(
    () => (
      <View style={gridStyles.emptyState}>
        <MaterialIcons
          name="photo-library"
          size={48}
          color={theme.tint}
          style={{ opacity: 0.4 }}
        />
        <Text style={[gridStyles.emptyText, { color: theme.textMuted }]}>
          {selectedDate.toDateString() === new Date().toDateString()
            ? "No meals yet — scan one above"
            : "No entries for this date"}
        </Text>
      </View>
    ),
    [theme, selectedDate],
  );

  return (
    <View style={[gridStyles.container, { backgroundColor: theme.background }]}>
      <CollapsibleHeader
        scrollY={scrollY}
        expandedHeight={HEADER_EXPANDED_HEIGHT}
        collapsedHeight={HEADER_COLLAPSED_HEIGHT}
        title="Journal"
        titleColor={theme.text}
        backgroundColor={theme.background}
        tint={theme.isDark ? "dark" : "light"}
        statusBarHeight={StatusBar.currentHeight ?? 56}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={gridStyles.dateStrip}
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
                  gridStyles.dateItem,
                  isSelected && {
                    backgroundColor: theme.tint,
                    borderColor: theme.tint,
                  },
                  !isSelected &&
                    isToday && {
                      borderColor: theme.tint,
                      borderWidth: 2,
                    },
                ]}
              >
                <Text
                  style={[
                    gridStyles.dateDay,
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
                    gridStyles.dateNumber,
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
      </CollapsibleHeader>

      <AnimatedFlatList
        data={gridRows}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[
          gridStyles.scrollContent,
          { paddingTop: HEADER_EXPANDED_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />

      <FoodSearchSheet ref={foodSearchSheetRef} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stat chip
// ---------------------------------------------------------------------------
const StatChip = ({
  value,
  unit,
  label,
  color,
  theme,
}: {
  value: string;
  unit: string;
  label: string;
  color: string;
  theme: ReturnType<typeof useTheme>;
}) => (
  <View style={chipStyles.chip}>
    <Text style={[chipStyles.value, { color: theme.text }]} selectable>
      {value}
      <Text style={[chipStyles.unit, { color: color }]} selectable={false}>
        {unit}
      </Text>
    </Text>
    <Text style={[chipStyles.label, { color: theme.textMuted }]}>{label}</Text>
  </View>
);

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  value: {
    fontSize: 17,
    fontFamily: "bold",
  },
  unit: {
    fontSize: 11,
    fontFamily: "semibold",
  },
  label: {
    fontSize: 10,
    fontFamily: "medium",
    letterSpacing: 0.3,
  },
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const gridStyles = StyleSheet.create({
  container: { flex: 1 },
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
  scrollContent: {
    paddingBottom: 120,
  },
  listHeader: {
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    gap: 14,
    marginBottom: 4,
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  divider: {
    width: 1,
    height: 28,
    marginHorizontal: 4,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    marginHorizontal: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "bold",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    paddingHorizontal: H_PAD,
    marginBottom: GAP,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "medium",
    textAlign: "center",
    lineHeight: 22,
  },
});
