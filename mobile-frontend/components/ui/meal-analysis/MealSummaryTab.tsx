import { NutritionData } from "@/utils/api";
import { DailyGoals } from "@/hooks/useDailyGoals";
import { DEFAULT_DAILY_GOALS } from "@/constants/nutrition";
import { useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// ---------------------------------------------------------------------------
// Confidence banner config (low / medium only — high needs no warning)
// ---------------------------------------------------------------------------

const CONFIDENCE_BANNER: Record<
  "low" | "medium",
  {
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    bg: string;
    bgDark: string;
    title: string;
    body: string;
  }
> = {
  medium: {
    icon: "info",
    color: "#d97706",
    bg: "#fef3c7",
    bgDark: "#2d1a00",
    title: "Moderate confidence",
    body: "Portion sizes and exact macros may be slightly off — treat these as estimates.",
  },
  low: {
    icon: "warning",
    color: "#dc2626",
    bg: "#fee2e2",
    bgDark: "#2d0a0a",
    title: "Low confidence",
    body: "The AI had difficulty identifying this meal. These nutrition values are rough estimates and may be significantly inaccurate.",
  },
};

// ---------------------------------------------------------------------------
// Verdict config
// ---------------------------------------------------------------------------

type Verdict = NonNullable<NutritionData["diet_verdict"]>;

const VERDICT_CONFIG: Record<
  Verdict,
  { label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; bg: string; bgDark: string }
> = {
  excellent: {
    label: "Excellent",
    icon: "check-circle",
    color: "#16a34a",
    bg: "#dcfce7",
    bgDark: "#052e16",
  },
  good: {
    label: "Good",
    icon: "thumb-up",
    color: "#0d9488",
    bg: "#ccfbf1",
    bgDark: "#042f2e",
  },
  moderate: {
    label: "Moderate",
    icon: "info",
    color: "#d97706",
    bg: "#fef3c7",
    bgDark: "#2d1a00",
  },
  limit: {
    label: "Limit",
    icon: "warning",
    color: "#dc2626",
    bg: "#fee2e2",
    bgDark: "#2d0a0a",
  },
};

// ---------------------------------------------------------------------------
// Macro row
// ---------------------------------------------------------------------------

const MacroRow = ({
  label,
  value,
  goal,
  unit,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}) => {
  const theme = useTheme();
  const pct = Math.min(value / goal, 1);
  const pctLabel = Math.round(pct * 100);
  return (
    <View style={macroStyles.row}>
      <View style={macroStyles.labelRow}>
        <Text style={[macroStyles.label, { color: theme.text }]}>{label}</Text>
        <Text style={[macroStyles.value, { color: theme.textMuted }]}>
          {value}
          {unit}{" "}
          <Text style={{ color: color, fontFamily: "semibold" }}>
            {pctLabel}%
          </Text>{" "}
          of daily goal
        </Text>
      </View>
      <View
        style={[
          macroStyles.track,
          { backgroundColor: theme.isDark ? "#1e293b" : "#f1f5f9" },
        ]}
      >
        <View
          style={[
            macroStyles.fill,
            { width: `${pct * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

const macroStyles = StyleSheet.create({
  row: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  label: { fontSize: 14, fontFamily: "semibold" },
  value: { fontSize: 12, fontFamily: "medium" },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MealSummaryTabProps {
  nutrition: NutritionData;
  goals?: DailyGoals;
}

export const MealSummaryTab = ({ nutrition, goals: goalsProp }: MealSummaryTabProps) => {
  const theme = useTheme();
  const goals = goalsProp ?? DEFAULT_DAILY_GOALS;
  const verdict = nutrition.diet_verdict ?? "moderate";
  const cfg = VERDICT_CONFIG[verdict];
  const bgColor = theme.isDark ? cfg.bgDark : cfg.bg;

  const confidence = nutrition.confidence ?? "high";
  const bannerCfg = confidence !== "high" ? CONFIDENCE_BANNER[confidence] : null;

  return (
    <View style={styles.container}>
      {/* ---- Confidence warning banner (medium / low only) ---- */}
      {bannerCfg && (
        <View
          style={[
            styles.confidenceBanner,
            { backgroundColor: theme.isDark ? bannerCfg.bgDark : bannerCfg.bg },
          ]}
        >
          <MaterialIcons name={bannerCfg.icon} size={20} color={bannerCfg.color} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: bannerCfg.color }]}>
              {bannerCfg.title}
            </Text>
            <Text style={[styles.bannerBody, { color: theme.isDark ? "#e2e8f0" : "#374151" }]}>
              {bannerCfg.body}
            </Text>
          </View>
        </View>
      )}
      {/* ---- Verdict card ---- */}
      <View style={[styles.verdictCard, { backgroundColor: bgColor }]}>
        <View style={styles.verdictHeader}>
          <MaterialIcons name={cfg.icon} size={28} color={cfg.color} />
          <Text style={[styles.verdictLabel, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
        {nutrition.summary_note ? (
          <Text style={[styles.summaryNote, { color: theme.isDark ? "#e2e8f0" : "#374151" }]}>
            {nutrition.summary_note}
          </Text>
        ) : null}
      </View>

      {/* ---- Macro snapshot ---- */}
      <View
        style={[
          styles.macroCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.textMuted }]}>
          % OF DAILY GOALS
        </Text>
        <View style={styles.macroList}>
          <MacroRow
            label="Calories"
            value={nutrition.calories_kcal}
            goal={goals.calories_kcal}
            unit=" kcal"
            color={theme.tint}
          />
          <MacroRow
            label="Protein"
            value={nutrition.protein_g}
            goal={goals.protein_g}
            unit="g"
            color="#3b82f6"
          />
          <MacroRow
            label="Carbs"
            value={nutrition.carbs_g}
            goal={goals.carbs_g}
            unit="g"
            color="#f97316"
          />
          <MacroRow
            label="Fats"
            value={nutrition.fats_g}
            goal={goals.fats_g}
            unit="g"
            color="#eab308"
          />
        </View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    gap: 16,
  },
  confidenceBanner: {
    borderRadius: 16,
    borderCurve: "continuous",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: "semibold",
    marginBottom: 3,
  },
  bannerBody: {
    fontSize: 13,
    fontFamily: "medium",
    lineHeight: 19,
  },
  verdictCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  verdictHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  verdictLabel: {
    fontSize: 22,
    fontFamily: "bold",
  },
  summaryNote: {
    fontSize: 15,
    fontFamily: "medium",
    lineHeight: 22,
  },
  macroCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "semibold",
    letterSpacing: 1.5,
  },
  macroList: {
    gap: 18,
  },
});
