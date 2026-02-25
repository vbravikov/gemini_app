import { DEFAULT_DAILY_GOALS } from "@/constants/nutrition";
import { useTheme } from "@/constants/theme";
import { CollapsibleHeader } from "@/components/ui/base/CollapsibleHeader";
import { MealLog, useMealLogs } from "@/hooks/useMealLogs";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<MealLog>);

const HEADER_EXPANDED_HEIGHT = 140;
const HEADER_COLLAPSED_HEIGHT = 90;
const MAX_RECENT = 3;

// ---------------------------------------------------------------------------
// Circular calorie ring
// ---------------------------------------------------------------------------
const RING_SIZE = 160;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const CalorieRing = ({
  progress,
  calories,
  goal,
  tint,
  textColor,
  mutedColor,
}: {
  progress: number;
  calories: number;
  goal: number;
  tint: string;
  textColor: string;
  mutedColor: string;
}) => {
  const strokeDash = RING_CIRCUMFERENCE * Math.min(progress, 1);
  return (
    <View style={ringStyles.wrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={ringStyles.svg}>
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={mutedColor}
          strokeWidth={RING_STROKE}
          fill="none"
          opacity={0.18}
        />
        {/* Progress */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={tint}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={`${strokeDash} ${RING_CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      {/* Centre text */}
      <View style={ringStyles.centre}>
        <Text style={[ringStyles.calorieValue, { color: textColor }]}>
          {calories}
        </Text>
        <Text style={[ringStyles.calorieLabel, { color: mutedColor }]}>
          of {goal} kcal
        </Text>
      </View>
    </View>
  );
};

const ringStyles = StyleSheet.create({
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  svg: {
    position: "absolute",
  },
  centre: {
    alignItems: "center",
    gap: 2,
  },
  calorieValue: {
    fontSize: 30,
    fontFamily: "bold",
  },
  calorieLabel: {
    fontSize: 11,
    fontFamily: "medium",
  },
});

// ---------------------------------------------------------------------------
// Macro pill
// ---------------------------------------------------------------------------
const MacroPill = ({
  label,
  value,
  goal,
  color,
  textColor,
  mutedColor,
  cardColor,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  textColor: string;
  mutedColor: string;
  cardColor: string;
}) => {
  const pct = Math.min(value / goal, 1);
  return (
    <View style={[pillStyles.pill, { backgroundColor: cardColor }]}>
      <View style={[pillStyles.dot, { backgroundColor: color }]} />
      <View style={pillStyles.info}>
        <Text style={[pillStyles.label, { color: mutedColor }]}>{label}</Text>
        <Text style={[pillStyles.value, { color: textColor }]}>{value}g</Text>
      </View>
      <View
        style={[pillStyles.barTrack, { backgroundColor: color, opacity: 0.15 }]}
      >
        <View
          style={[
            pillStyles.barFill,
            { backgroundColor: color, width: `${pct * 100}%` },
          ]}
        />
      </View>
    </View>
  );
};

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  info: {
    gap: 1,
  },
  label: {
    fontSize: 10,
    fontFamily: "semibold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 17,
    fontFamily: "bold",
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 2,
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
});

// ---------------------------------------------------------------------------
// 7-day bar chart
// ---------------------------------------------------------------------------
const WeekChart = ({
  logs,
  goal,
  tint,
  textColor,
  mutedColor,
  cardColor,
}: {
  logs: MealLog[];
  goal: number;
  tint: string;
  textColor: string;
  mutedColor: string;
  cardColor: string;
}) => {
  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayLogs = logs.filter((l) => {
        const ld = new Date(l.timestamp);
        return (
          ld.getDate() === d.getDate() &&
          ld.getMonth() === d.getMonth() &&
          ld.getFullYear() === d.getFullYear()
        );
      });
      const cals = dayLogs.reduce((s, l) => s + l.nutrition.calories_kcal, 0);
      return {
        label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        cals,
        isToday: i === 6,
      };
    });
  }, [logs]);

  const max = Math.max(...days.map((d) => d.cals), goal * 0.5);

  return (
    <View style={[chartStyles.card, { backgroundColor: cardColor }]}>
      <Text style={[chartStyles.title, { color: mutedColor }]}>
        7-DAY CALORIES
      </Text>
      <View style={chartStyles.bars}>
        {days.map((day, i) => {
          const barH = day.cals > 0 ? Math.max((day.cals / max) * 80, 6) : 4;
          return (
            <View key={i} style={chartStyles.barCol}>
              {day.cals > 0 && (
                <Text style={[chartStyles.barVal, { color: mutedColor }]}>
                  {day.cals >= 1000
                    ? `${(day.cals / 1000).toFixed(1)}k`
                    : day.cals}
                </Text>
              )}
              <View style={chartStyles.barBase}>
                <View
                  style={[
                    chartStyles.barFill,
                    {
                      height: barH,
                      backgroundColor: day.isToday ? tint : tint,
                      opacity: day.isToday ? 1 : 0.35,
                      borderRadius: 4,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  chartStyles.dayLabel,
                  {
                    color: day.isToday ? textColor : mutedColor,
                    fontFamily: day.isToday ? "bold" : "medium",
                  },
                ]}
              >
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
      {/* Goal line label */}
      <Text style={[chartStyles.goalLabel, { color: mutedColor }]}>
        Goal: {goal} kcal/day
      </Text>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 11,
    fontFamily: "semibold",
    letterSpacing: 1.5,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 110,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    height: "100%",
  },
  barBase: {
    width: "100%",
    justifyContent: "flex-end",
    flex: 1,
  },
  barFill: {
    width: "100%",
  },
  barVal: {
    fontSize: 9,
    fontFamily: "semibold",
    textAlign: "center",
  },
  dayLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  goalLabel: {
    fontSize: 11,
    fontFamily: "medium",
    opacity: 0.6,
    textAlign: "right",
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { logs, getDailyTotals } = useMealLogs();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const today = useMemo(() => new Date(), []);
  const totals = useMemo(() => getDailyTotals(today), [today, getDailyTotals]);
  const recentLogs = useMemo(() => logs.slice(0, MAX_RECENT), [logs]);

  const calorieProgress = totals.calories / DEFAULT_DAILY_GOALS.calories_kcal;
  const caloriesRemaining = Math.max(
    DEFAULT_DAILY_GOALS.calories_kcal - totals.calories,
    0,
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const collapsedDateLabel = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const headerTitle = (
    <View>
      <Text style={[styles.greeting, { color: theme.textMuted }]}>
        {greeting}
      </Text>
      <Text style={[styles.dateLabel, { color: theme.text }]}>{dateLabel}</Text>
    </View>
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeaderContent}>
        {/* ---- Calorie ring + macro pills ---- */}
        <Animated.View entering={FadeInDown.delay(60)} style={styles.ringRow}>
          <CalorieRing
            progress={calorieProgress}
            calories={totals.calories}
            goal={DEFAULT_DAILY_GOALS.calories_kcal}
            tint={theme.tint}
            textColor={theme.text}
            mutedColor={theme.textMuted}
          />
          <View style={styles.pills}>
            <MacroPill
              label="Protein"
              value={totals.protein}
              goal={DEFAULT_DAILY_GOALS.protein_g}
              color="#3b82f6"
              textColor={theme.text}
              mutedColor={theme.textMuted}
              cardColor={theme.card}
            />
            <MacroPill
              label="Carbs"
              value={totals.carbs}
              goal={DEFAULT_DAILY_GOALS.carbs_g}
              color="#f97316"
              textColor={theme.text}
              mutedColor={theme.textMuted}
              cardColor={theme.card}
            />
            <MacroPill
              label="Fats"
              value={totals.fats}
              goal={DEFAULT_DAILY_GOALS.fats_g}
              color="#eab308"
              textColor={theme.text}
              mutedColor={theme.textMuted}
              cardColor={theme.card}
            />
          </View>
        </Animated.View>

        {/* Remaining callout */}
        <Animated.View entering={FadeInDown.delay(120)}>
          <Text style={[styles.remainingCallout, { color: theme.textMuted }]}>
            {caloriesRemaining > 0
              ? `${caloriesRemaining} kcal remaining today`
              : "Daily goal reached"}
          </Text>
        </Animated.View>

        {/* ---- 7-day bar chart ---- */}
        <Animated.View entering={FadeInDown.delay(180)}>
          <WeekChart
            logs={logs}
            goal={DEFAULT_DAILY_GOALS.calories_kcal}
            tint={theme.tint}
            textColor={theme.text}
            mutedColor={theme.textMuted}
            cardColor={theme.card}
          />
        </Animated.View>

        {/* ---- Scan CTA ---- */}
        <Animated.View entering={FadeInDown.delay(240)}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/camera")}
            style={[styles.scanRow, { backgroundColor: theme.card }]}
          >
            <View
              style={[styles.scanIcon, { backgroundColor: theme.tint + "22" }]}
            >
              <MaterialIcons name="camera-alt" size={22} color={theme.tint} />
            </View>
            <Text style={[styles.scanLabel, { color: theme.text }]}>
              Scan a meal
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* ---- Recent meals header ---- */}
        {recentLogs.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={styles.sectionHeader}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Meals
            </Text>
            <TouchableOpacity onPress={() => router.push("/logs")}>
              <Text style={[styles.seeAll, { color: theme.tint }]}>
                See all
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    ),
    [
      theme,
      totals,
      calorieProgress,
      caloriesRemaining,
      recentLogs.length,
      logs,
      router,
    ],
  );

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/camera")}
          style={[styles.emptyCard, { backgroundColor: theme.card }]}
        >
          <MaterialIcons name="camera-alt" size={28} color={theme.tint} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Log your first meal
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Tap to open the camera and scan any dish
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [theme, router],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CollapsibleHeader
        scrollY={scrollY}
        expandedHeight={HEADER_EXPANDED_HEIGHT}
        collapsedHeight={HEADER_COLLAPSED_HEIGHT}
        title={headerTitle}
        collapsedTitle={collapsedDateLabel}
        titleColor={theme.text}
        backgroundColor={theme.background}
        tint={theme.isDark ? "dark" : "light"}
        statusBarHeight={StatusBar.currentHeight ?? 56}
      />

      <AnimatedFlatList
        data={recentLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RecentMealRow
            log={item}
            index={index}
            theme={theme}
            router={router}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_EXPANDED_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Recent meal row
// ---------------------------------------------------------------------------
const RecentMealRow = ({
  log,
  index,
  theme,
  router,
}: {
  log: MealLog;
  index: number;
  theme: ReturnType<typeof useTheme>;
  router: ReturnType<typeof useRouter>;
}) => (
  <Animated.View
    entering={FadeInDown.delay(320 + index * 80)}
    style={styles.mealRowWrapper}
  >
    <Link href={{ pathname: "/log-details", params: { id: log.id } }} asChild>
      <Link.Trigger>
        <TouchableOpacity activeOpacity={0.7}>
          <View
            style={[
              styles.mealRow,
              {
                backgroundColor: theme.card,
                borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
              },
            ]}
          >
            <Image
              source={{ uri: log.imageUri }}
              style={styles.mealThumb}
              contentFit="cover"
            />
            <View style={styles.mealInfo}>
              <Text style={[styles.mealTime, { color: theme.textMuted }]}>
                {new Date(log.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text
                style={[styles.mealTitle, { color: theme.text }]}
                numberOfLines={1}
              >
                {log.nutrition.dish_name ?? "Analyzed Meal"}
              </Text>
              <Text style={[styles.mealMacros, { color: theme.textMuted }]}>
                {log.nutrition.calories_kcal} kcal · {log.nutrition.protein_g}g
                protein
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={theme.textMuted}
            />
          </View>
        </TouchableOpacity>
      </Link.Trigger>
      <Link.Preview />
    </Link>
  </Animated.View>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  listHeaderContent: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "medium",
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: 26,
    fontFamily: "bold",
  },
  // Ring + pills row
  ringRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pills: {
    flex: 1,
    gap: 8,
  },
  remainingCallout: {
    fontSize: 13,
    fontFamily: "medium",
    textAlign: "center",
    marginTop: -4,
  },
  // Scan CTA
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  scanIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scanLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "semibold",
  },
  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "bold",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "semibold",
  },
  // Empty state
  emptyWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "bold",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "medium",
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.7,
  },
  // Recent meal rows
  mealRowWrapper: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  mealRow: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 14,
  },
  mealThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  mealInfo: {
    flex: 1,
    gap: 2,
  },
  mealTime: {
    fontSize: 11,
    fontFamily: "semibold",
    opacity: 0.6,
  },
  mealTitle: {
    fontSize: 16,
    fontFamily: "bold",
  },
  mealMacros: {
    fontSize: 12,
    fontFamily: "medium",
    opacity: 0.7,
  },
});
