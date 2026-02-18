import React from "react";
import { StyleSheet, Text, View, ScrollView, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { NutritionData } from "../../../utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CardProps {
  theme: any;
}

interface PortionWeightCardProps extends CardProps {
  weight: number;
  label?: string;
}

export const PortionWeightCard = ({
  weight,
  theme,
  label = "Approx. Weight",
}: PortionWeightCardProps) => (
  <View
    style={[
      styles.detailCard,
      {
        backgroundColor: theme.card,
        borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
      },
    ]}
  >
    <MaterialIcons name="scale" size={24} color={theme.tint} />
    <Text style={[styles.detailValue, { color: theme.text, marginLeft: 12 }]}>
      {weight}g
    </Text>
    <Text
      style={[
        styles.detailLabel,
        { color: theme.textMuted, marginLeft: "auto" },
      ]}
    >
      {label}
    </Text>
  </View>
);

interface NutritionalOverviewCardProps extends CardProps {
  nutrition: NutritionData;
  showBadge?: boolean;
}

export const NutritionalOverviewCard = ({
  nutrition,
  theme,
  showBadge = false,
}: NutritionalOverviewCardProps) => {
  const proteinPercent = Math.min((nutrition.protein_g / 140) * 100, 100);
  const carbsPercent = Math.min((nutrition.carbs_g / 250) * 100, 100);
  const fatsPercent = Math.min((nutrition.fats_g / 70) * 100, 100);

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
        },
      ]}
    >
      <View style={styles.summaryHeader}>
        <View>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
            TOTAL ENERGY
          </Text>
          <View style={styles.calorieRow}>
            <Text style={[styles.calorieValue, { color: theme.text }]}>
              {nutrition.calories_kcal}
            </Text>
            <Text style={[styles.calorieUnit, { color: theme.textMuted }]}>
              kcal
            </Text>
          </View>
        </View>
        {showBadge && (
          <View
            style={[
              styles.goalBadge,
              {
                backgroundColor: theme.isDark ? "#0f3d1f" : "#dcfce7",
                borderColor: theme.isDark ? "#166534" : "#86efac",
              },
            ]}
          >
            <Text
              style={[
                styles.goalBadgeText,
                { color: theme.isDark ? "#4ade80" : "#166534" },
              ]}
            >
              Within Goal
            </Text>
          </View>
        )}
      </View>

      {/* Macro Progress Bars */}
      <View style={styles.macroProgressSection}>
        {/* Protein */}
        <View style={styles.macroProgressItem}>
          <View style={styles.macroProgressHeader}>
            <Text style={[styles.macroProgressLabel, { color: theme.text }]}>
              Protein
            </Text>
            <Text style={[styles.macroProgressValue, { color: theme.text }]}>
              {nutrition.protein_g}g{" "}
              <Text style={{ color: theme.textMuted, fontWeight: "400" }}>
                / 140g
              </Text>
            </Text>
          </View>
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: theme.isDark ? "#334155" : "#f1f5f9" },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: theme.tint, width: `${proteinPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* Carbs */}
        <View style={styles.macroProgressItem}>
          <View style={styles.macroProgressHeader}>
            <Text style={[styles.macroProgressLabel, { color: theme.text }]}>
              Carbs
            </Text>
            <Text style={[styles.macroProgressValue, { color: theme.text }]}>
              {nutrition.carbs_g}g{" "}
              <Text style={{ color: theme.textMuted, fontWeight: "400" }}>
                / 250g
              </Text>
            </Text>
          </View>
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: theme.isDark ? "#334155" : "#f1f5f9" },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: "#60a5fa", width: `${carbsPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* Fat */}
        <View style={styles.macroProgressItem}>
          <View style={styles.macroProgressHeader}>
            <Text style={[styles.macroProgressLabel, { color: theme.text }]}>
              Fat
            </Text>
            <Text style={[styles.macroProgressValue, { color: theme.text }]}>
              {nutrition.fats_g}g{" "}
              <Text style={{ color: theme.textMuted, fontWeight: "400" }}>
                / 70g
              </Text>
            </Text>
          </View>
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: theme.isDark ? "#334155" : "#f1f5f9" },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: "#fb923c", width: `${fatsPercent}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Micronutrients */}
      <View style={styles.micronutrientSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.micronutrientScroll}
        >
          <View
            style={[
              styles.microChip,
              {
                backgroundColor: theme.isDark ? "#1e293b" : "#f8fafc",
                borderColor: theme.isDark ? "#334155" : "#e2e8f0",
              },
            ]}
          >
            <View style={[styles.microDot, { backgroundColor: "#22c55e" }]} />
            <Text style={[styles.microText, { color: theme.text }]}>
              Fiber 8g
            </Text>
          </View>
          <View
            style={[
              styles.microChip,
              {
                backgroundColor: theme.isDark ? "#1e293b" : "#f8fafc",
                borderColor: theme.isDark ? "#334155" : "#e2e8f0",
              },
            ]}
          >
            <View style={[styles.microDot, { backgroundColor: "#eab308" }]} />
            <Text style={[styles.microText, { color: theme.text }]}>
              Iron 15%
            </Text>
          </View>
          <View
            style={[
              styles.microChip,
              {
                backgroundColor: theme.isDark ? "#1e293b" : "#f8fafc",
                borderColor: theme.isDark ? "#334155" : "#e2e8f0",
              },
            ]}
          >
            <View style={[styles.microDot, { backgroundColor: "#f87171" }]} />
            <Text style={[styles.microText, { color: theme.text }]}>
              Sodium 420mg
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

interface MacroItemProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  theme: any;
}

const MacroItem = ({ label, value, icon, color, theme }: MacroItemProps) => (
  <View
    style={[
      styles.macroItem,
      {
        backgroundColor: theme.card,
        borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
      },
    ]}
  >
    <View style={[styles.macroIconCircle, { backgroundColor: `${color}20` }]}>
      <MaterialIcons name={icon as any} size={20} color={color} />
    </View>
    <Text style={[styles.macroValueText, { color: theme.text }]}>{value}</Text>
    <Text style={[styles.macroLabelText, { color: theme.textMuted }]}>
      {label}
    </Text>
  </View>
);

export const MacronutrientsGrid = ({
  nutrition,
  theme,
}: {
  nutrition: NutritionData;
  theme: any;
}) => (
  <View style={styles.macroGrid}>
    <MacroItem
      label="Protein"
      value={`${nutrition.protein_g}g`}
      icon="fitness-center"
      color="#3b82f6"
      theme={theme}
    />
    <MacroItem
      label="Carbs"
      value={`${nutrition.carbs_g}g`}
      icon="rice-bowl"
      color="#f97316"
      theme={theme}
    />
    <MacroItem
      label="Fats"
      value={`${nutrition.fats_g}g`}
      icon="water-drop"
      color="#eab308"
      theme={theme}
    />
    <MacroItem
      label="Calories"
      value={`${nutrition.calories_kcal}`}
      icon="local-fire-department"
      color={theme.tint}
      theme={theme}
    />
  </View>
);

const styles = StyleSheet.create({
  detailCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  calorieValue: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  calorieUnit: {
    fontSize: 18,
    fontWeight: "600",
  },
  goalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  macroProgressSection: {
    gap: 16,
  },
  macroProgressItem: {
    gap: 6,
  },
  macroProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  macroProgressLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  macroProgressValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 50,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 50,
  },
  micronutrientSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  micronutrientScroll: {
    gap: 8,
  },
  microChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
  },
  microDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  microText: {
    fontSize: 12,
    fontWeight: "600",
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  macroItem: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  macroIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  macroValueText: {
    fontSize: 16,
    fontWeight: "700",
  },
  macroLabelText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
});
