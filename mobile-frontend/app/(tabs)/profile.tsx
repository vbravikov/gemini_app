import { useTheme } from "@/constants/theme";
import { useMealLogs } from "@/hooks/useMealLogs";
import {
  DIET_GOAL_OPTIONS,
  DietGoal,
  useDietPreferences,
} from "@/hooks/useDietPreferences";
import { useCustomDailyGoals, DIET_GOAL_PRESETS } from "@/hooks/useDailyGoals";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the number of consecutive days up to and including today that have
 *  at least one log entry. */
function calcStreak(logs: { timestamp: number }[]): number {
  if (logs.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const loggedDays = new Set(
    logs.map((l) => {
      const d = new Date(l.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );

  let streak = 0;
  const cursor = new Date(today);
  while (loggedDays.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title, theme }: { title: string; theme: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
      {title}
    </Text>
  );
}

function StatCard({
  icon,
  label,
  value,
  theme,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string | number;
  theme: any;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
        },
      ]}
    >
      <MaterialIcons name={icon} size={22} color={theme.tint} />
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

function GoalRow({
  label,
  value,
  unit,
  color,
  theme,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  theme: any;
}) {
  return (
    <View style={styles.goalRow}>
      <View style={[styles.goalDot, { backgroundColor: color }]} />
      <Text style={[styles.goalLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.goalValue, { color: theme.textMuted }]}>
        {value}
        {unit}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={18} color={theme.tint} style={{ width: 24 }} />
      <Text style={[styles.infoLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.textMuted }]}>{value}</Text>
    </View>
  );
}

function GoalTile({
  config,
  selected,
  onPress,
  theme,
}: {
  config: (typeof DIET_GOAL_OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.goalTile,
        {
          backgroundColor: selected
            ? theme.isDark
              ? "#0f2d1f"
              : "#f0fdf4"
            : theme.card,
          borderColor: selected
            ? theme.tint
            : theme.isDark
              ? "#1f3d29"
              : "#e5e7eb",
        },
      ]}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={config.icon as keyof typeof MaterialIcons.glyphMap}
        size={22}
        color={selected ? theme.tint : theme.textMuted}
      />
      <Text
        style={[
          styles.goalTileLabel,
          { color: selected ? theme.tint : theme.text },
        ]}
      >
        {config.label}
      </Text>
      <Text
        style={[styles.goalTileDescription, { color: theme.textMuted }]}
        numberOfLines={2}
      >
        {config.description}
      </Text>
    </TouchableOpacity>
  );
}



export default function ProfileScreen() {
  const theme = useTheme();
  const { logs } = useMealLogs();
  const { dietGoal, goalConfig, setDietGoal } = useDietPreferences();
  const { goals, isCustom, applyPreset, resetToDefault } = useCustomDailyGoals();

  const totalCalories = logs.reduce((s, l) => s + l.nutrition.calories_kcal, 0);
  const streak = calcStreak(logs);

  const handleGoalTilePress = (key: DietGoal) => {
    const next = dietGoal === key ? null : key;
    setDietGoal(next);
    if (next !== null) {
      // Only auto-apply the preset if the user hasn't manually customised their goals
      if (!isCustom) {
        applyPreset(DIET_GOAL_PRESETS[next]);
      }
    } else {
      // Diet goal cleared — revert goals to default (unless manually customised)
      if (!isCustom) {
        resetToDefault();
      }
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* ---- Avatar / Header ---- */}
      <Animated.View entering={FadeInDown.delay(0)} style={styles.avatarSection}>
        <BlurView
          intensity={40}
          tint={theme.isDark ? "dark" : "light"}
          style={[
            styles.avatarCircle,
            { borderColor: theme.isDark ? "#1f3d29" : "#d1fae5" },
          ]}
          experimentalBlurMethod="dimezisBlurView"
        >
          <Text style={[styles.avatarText, { color: theme.tint }]}>DG</Text>
        </BlurView>
        <Text style={[styles.userName, { color: theme.text }]}>Diet Glasses</Text>
        <Text style={[styles.userSubtitle, { color: theme.textMuted }]}>
          {logs.length === 0
            ? "No meals logged yet"
            : `${logs.length} meal${logs.length === 1 ? "" : "s"} tracked`}
        </Text>
      </Animated.View>

      {/* ---- Stats row ---- */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.statsRow}>
        <StatCard icon="restaurant" label="Meals" value={logs.length} theme={theme} />
        <StatCard
          icon="local-fire-department"
          label="kcal total"
          value={totalCalories.toLocaleString()}
          theme={theme}
        />
        <StatCard icon="emoji-events" label="Day streak" value={streak} theme={theme} />
      </Animated.View>

      {/* ---- Diet Goal ---- */}
      <Animated.View
        entering={FadeInDown.delay(150)}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
          },
        ]}
      >
        <SectionHeader title="MY DIET GOAL" theme={theme} />
        <View style={styles.goalTileGrid}>
          {DIET_GOAL_OPTIONS.map((option) => (
            <GoalTile
              key={option.key}
              config={option}
              selected={dietGoal === option.key}
              onPress={() => handleGoalTilePress(option.key)}
              theme={theme}
            />
          ))}
        </View>
      </Animated.View>

      {/* ---- Daily Goals ---- */}
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
          },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <SectionHeader title="DAILY GOALS" theme={theme} />
          <Link href={"../edit-goals" as any} asChild>
            <TouchableOpacity style={styles.editButton} hitSlop={8}>
              <Text style={[styles.editButtonText, { color: theme.tint }]}>
                Edit
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={16}
                color={theme.tint}
              />
            </TouchableOpacity>
          </Link>
        </View>
        {(isCustom || (dietGoal !== null && !isCustom)) && (
          <View
            style={[
              styles.customBadge,
              { backgroundColor: theme.isDark ? "#0f2d1f" : "#f0fdf4" },
            ]}
          >
            <MaterialIcons name={isCustom ? "tune" : "auto-awesome"} size={12} color={theme.tint} />
            <Text style={[styles.customBadgeText, { color: theme.tint }]}>
              {isCustom
                ? "Custom goals active"
                : `${goalConfig?.label ?? ""} preset`}
            </Text>
          </View>
        )}
        <GoalRow
          label="Calories"
          value={goals.calories_kcal}
          unit=" kcal"
          color={theme.tint}
          theme={theme}
        />
        <GoalRow
          label="Protein"
          value={goals.protein_g}
          unit="g"
          color="#3b82f6"
          theme={theme}
        />
        <GoalRow
          label="Carbs"
          value={goals.carbs_g}
          unit="g"
          color="#f97316"
          theme={theme}
        />
        <GoalRow
          label="Fats"
          value={goals.fats_g}
          unit="g"
          color="#eab308"
          theme={theme}
        />
      </Animated.View>

      {/* ---- App Info ---- */}
      <Animated.View
        entering={FadeInDown.delay(300)}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
          },
        ]}
      >
        <SectionHeader title="APP INFO" theme={theme} />
        <InfoRow
          icon="palette"
          label="Appearance"
          value={theme.isDark ? "Dark" : "Light"}
          theme={theme}
        />
        <InfoRow
          icon="science"
          label="Analysis mode"
          value={__DEV__ ? "Mock (dev)" : "Live API"}
          theme={theme}
        />
        <InfoRow
          icon="memory"
          label="Architecture"
          value="New Architecture"
          theme={theme}
        />
      </Animated.View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "bold",
  },
  userName: {
    fontSize: 24,
    fontFamily: "bold",
  },
  userSubtitle: {
    fontSize: 14,
    fontFamily: "medium",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "medium",
    textAlign: "center",
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    gap: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "semibold",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 2,
  },
  editButtonText: {
    fontSize: 13,
    fontFamily: "semibold",
  },
  customBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  customBadgeText: {
    fontSize: 11,
    fontFamily: "semibold",
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  goalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  goalLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "medium",
  },
  goalValue: {
    fontSize: 15,
    fontFamily: "semibold",
  },
  goalNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  goalNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "medium",
    lineHeight: 18,
  },
  goalTileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  goalTile: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  },
  goalTileLabel: {
    fontSize: 14,
    fontFamily: "semibold",
  },
  goalTileDescription: {
    fontSize: 11,
    fontFamily: "medium",
    lineHeight: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "medium",
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "medium",
  },
});
