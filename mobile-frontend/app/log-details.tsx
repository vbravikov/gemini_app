import { MealDetailView } from "@/components/ui/meal-analysis/MealDetailView";
import { MealSummaryTab } from "@/components/ui/meal-analysis/MealSummaryTab";
import { IngredientCard } from "@/components/ui/meal-analysis/IngredientItem";
import {
  MacronutrientsGrid,
  NutritionalOverviewCard,
  PortionWeightCard,
} from "@/components/ui/meal-analysis/MealDetailsSections";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/constants/theme";
import { useMealLogs } from "@/hooks/useMealLogs";
import { NutritionData } from "@/utils/api";
import { useCustomDailyGoals } from "@/hooks/useDailyGoals";
import type { DailyGoals } from "@/hooks/useDailyGoals";

const DetailsTab = ({
  nutrition,
  goals,
}: {
  nutrition: NutritionData;
  goals: DailyGoals;
}) => {
  const theme = useTheme();
  return (
  <View style={styles.tabContent}>
    <PortionWeightCard
      weight={nutrition.portion_size_g}
      label="Weight"
    />

    <Text style={[styles.sectionTitle, { color: theme.text }]}>
      Nutritional Overview
    </Text>
    <NutritionalOverviewCard nutrition={nutrition} goals={goals} />

    <Text style={[styles.sectionTitle, { color: theme.text }]}>
      Macronutrients
    </Text>
    <MacronutrientsGrid nutrition={nutrition} />

    <Text style={[styles.sectionTitle, { color: theme.text }]}>
      Ingredients
    </Text>
    <View style={styles.ingredientsList}>
      {nutrition.ingredients.map((ingredient, index) => (
        <IngredientCard
          key={index}
          ingredient={ingredient}
        />
      ))}
    </View>
  </View>
  );
};

const LogDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { logs, deleteLog } = useMealLogs();
  const { goals } = useCustomDailyGoals();

  const log = useMemo(() => logs.find((l) => l.id === id), [logs, id]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Log",
      "Are you sure you want to permanently delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteLog(id!);
            router.back();
          },
        },
      ],
    );
  };

  const tabs = useMemo(() => {
    if (!log) return [];
    return [
      {
        id: "summary",
        title: "Summary",
        titleComponent: (isActive: boolean) => (
          <View style={styles.tabTitleContainer}>
            <MaterialIcons
              name="description"
              size={18}
              color={isActive ? theme.tint : theme.textMuted}
            />
            <Text
              style={[
                styles.tabTitleText,
                {
                  color: isActive ? theme.tint : theme.textMuted,
                  fontWeight: isActive ? "700" : "500",
                },
              ]}
            >
              Summary
            </Text>
          </View>
        ),
        contentComponent: (
          <MealSummaryTab nutrition={log.nutrition} goals={goals} />
        ),
      },
      {
        id: "details",
        title: "Details",
        titleComponent: (isActive: boolean) => (
          <View style={styles.tabTitleContainer}>
            <MaterialIcons
              name="analytics"
              size={18}
              color={isActive ? theme.tint : theme.textMuted}
            />
            <Text
              style={[
                styles.tabTitleText,
                {
                  color: isActive ? theme.tint : theme.textMuted,
                  fontWeight: isActive ? "700" : "500",
                },
              ]}
            >
              Details
            </Text>
          </View>
        ),
        contentComponent: (
          <DetailsTab nutrition={log.nutrition} goals={goals} />
        ),
      },
    ];
  }, [log, theme, goals]);

  if (!log) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: theme.text }}>Entry not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.tint }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate =
    new Date(log.timestamp).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) +
    " at " +
    new Date(log.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MealDetailView
        imageUri={log.imageUri}
        heroInfo={{
          title: log.nutrition.ingredients[0]?.name ?? log.nutrition.dish_name ?? "Logged Meal",
          subtitle: (
            <Text style={[styles.heroDate, { color: "rgba(255,255,255,0.8)" }]}>
              {formattedDate}
            </Text>
          ),
          bottomOffset: 24,
        }}
        tabs={tabs}
        actions={[
          {
            label: "Delete Entry",
            variant: "outlined",
            color: "#ef4444",
            row: true,
            icon: (
              <MaterialIcons
                name="delete"
                size={20}
                color="#ef4444"
                style={{ marginRight: 8 }}
              />
            ),
            onPress: handleDelete,
          },
          {
            label: "Done",
            variant: "filled",
            backgroundColor: theme.tint,
            color: theme.isDark ? "#000" : "#fff",
            onPress: () => router.back(),
          },
        ]}
        scrollPaddingBottom={150}
        actionBarBorderColor="rgba(0,0,0,0.05)"
        activeColor={theme.tint}
        inactiveColor={theme.textMuted}
        underlineColor={theme.tint}
        backgroundColor={theme.background}
        isDark={theme.isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroDate: {
    fontSize: 14,
    fontFamily: "medium",
  },
  tabTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabTitleText: {
    fontSize: 15,
    fontFamily: "medium",
  },
  tabContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "bold",
    marginBottom: 16,
  },
  ingredientsList: {
    gap: 12,
  },
});

export default LogDetails;
