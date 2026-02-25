import { MealDetailView } from "@/components/ui/meal-analysis/MealDetailView";
import { MealSummaryTab } from "@/components/ui/meal-analysis/MealSummaryTab";
import { IngredientCard } from "@/components/ui/meal-analysis/IngredientItem";
import {
  MacronutrientsGrid,
  NutritionalOverviewCard,
  PortionWeightCard,
} from "@/components/ui/meal-analysis/MealDetailsSections";
import {
  AddIngredientSheet,
  IngredientEditSheet,
  MacroEditSheet,
  WeightEditSheet,
} from "@/components/ui/meal-analysis/IngredientSheets";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme } from "@/constants/theme";
import {
  AnalysisResponse,
  analyzeImage,
  Ingredient,
  NutritionData,
} from "@/utils/api";
import { useMealLogs } from "@/hooks/useMealLogs";
import { useDietPreferences } from "@/hooks/useDietPreferences";
import { useCustomDailyGoals } from "@/hooks/useDailyGoals";
import type { DailyGoals } from "@/hooks/useDailyGoals";

// ---------------------------------------------------------------------------
// Confidence config
// ---------------------------------------------------------------------------

const CONFIDENCE_CONFIG = {
  high: {
    label: "High confidence",
    icon: "verified" as const,
    color: "#16a34a",
    pillBg: "rgba(22,163,74,0.18)",
    bannerBg: null, // no banner for high confidence
    bannerBgDark: null,
    bannerText: null,
  },
  medium: {
    label: "Medium confidence",
    icon: "info" as const,
    color: "#d97706",
    pillBg: "rgba(217,119,6,0.18)",
    bannerBg: "#fef3c7",
    bannerBgDark: "#2d1a00",
    bannerText:
      "The AI is moderately confident in these values. Portion sizes and exact macros may be slightly off — treat them as estimates.",
  },
  low: {
    label: "Low confidence",
    icon: "warning" as const,
    color: "#dc2626",
    pillBg: "rgba(220,38,38,0.18)",
    bannerBg: "#fee2e2",
    bannerBgDark: "#2d0a0a",
    bannerText:
      "The AI had difficulty identifying this meal clearly. The nutrition values shown are rough estimates and may be significantly inaccurate.",
  },
} as const;

const DetailsTab = ({
  nutrition,
  theme,
  goals,
  onEditIngredient,
  onAddIngredient,
  onEditMacros,
  onEditWeight,
}: {
  nutrition: NutritionData;
  theme: any;
  goals: DailyGoals;
  onEditIngredient: (ingredient: Ingredient) => void;
  onAddIngredient: () => void;
  onEditMacros: () => void;
  onEditWeight: () => void;
}) => (
  <View style={styles.tabContent}>
    <PortionWeightCard
      weight={nutrition.portion_size_g}
      theme={theme}
      onPress={onEditWeight}
    />

    <Text style={[styles.sectionTitle, { color: theme.text }]}>
      Nutritional Overview
    </Text>
    <NutritionalOverviewCard
      nutrition={nutrition}
      theme={theme}
      showBadge={true}
      goals={goals}
    />

    <Text style={[styles.sectionTitle, { color: theme.text }]}>
      Macronutrients
    </Text>
    <MacronutrientsGrid
      nutrition={nutrition}
      theme={theme}
      onPress={onEditMacros}
    />

    <Text style={[styles.sectionTitle, { color: theme.text }]}>
      Identified Ingredients
    </Text>
    <View style={styles.ingredientsList}>
      {nutrition.ingredients.map((ingredient, index) => (
        <IngredientCard
          key={index}
          ingredient={ingredient}
          theme={theme}
          onEdit={onEditIngredient}
        />
      ))}
    </View>
    <TouchableOpacity
      style={styles.addIngredientButton}
      onPress={onAddIngredient}
    >
      <MaterialIcons
        name="add"
        size={14}
        color={theme.textMuted}
        style={{ marginRight: 4 }}
      />
      <Text style={[styles.addIngredientText, { color: theme.textMuted }]}>
        Add Missing Ingredient
      </Text>
    </TouchableOpacity>
  </View>
);

const MealInfo = () => {
  const params = useLocalSearchParams<{ photoUri: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { addLog, getLogsForDate } = useMealLogs();
  const { goalConfig } = useDietPreferences();
  const { goals } = useCustomDailyGoals();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ingredient editing state — lifted so both sheets and DetailsTab share it
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null,
  );
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showMacroSheet, setShowMacroSheet] = useState(false);
  const [showWeightSheet, setShowWeightSheet] = useState(false);
  const [macroOverride, setMacroOverride] = useState<Pick<
    NutritionData,
    "protein_g" | "carbs_g" | "fats_g"
  > | null>(null);
  const [weightOverride, setWeightOverride] = useState<number | null>(null);

  const handleAnalysis = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const todaysMeals = getLogsForDate(new Date()).map(
          (l) => l.nutrition.dish_name,
        );
        const context = {
          dietGoalHint: goalConfig?.promptHint,
          todaysMeals,
        };
        const response = await analyzeImage(
          params.photoUri,
          signal,
          undefined,
          context,
        );
        setData(response);
        setIngredients(response?.nutrition_data?.ingredients ?? []);
      } catch (err: any) {
        if (err?.name === "AbortError") return; // screen unmounted — ignore
        console.error(err);
        setError("Failed to analyze image. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [params.photoUri, goalConfig, getLogsForDate],
  );

  useEffect(() => {
    if (!params.photoUri) return;
    const controller = new AbortController();
    handleAnalysis(controller.signal);
    return () => controller.abort();
  }, [params.photoUri, handleAnalysis]);

  // Derived nutrition — recalculate calories & weight from live ingredient list
  const derivedNutrition = useMemo((): NutritionData | null => {
    if (!data?.nutrition_data) return null;
    const totalCals = ingredients.reduce((s, i) => s + i.calories_kcal, 0);
    const totalWeight = ingredients.reduce((s, i) => s + i.weight_g, 0);
    return {
      ...data.nutrition_data,
      ingredients,
      calories_kcal: Math.round(totalCals),
      portion_size_g: weightOverride ?? Math.round(totalWeight),
      protein_g: macroOverride?.protein_g ?? data.nutrition_data.protein_g,
      carbs_g: macroOverride?.carbs_g ?? data.nutrition_data.carbs_g,
      fats_g: macroOverride?.fats_g ?? data.nutrition_data.fats_g,
    };
  }, [data, ingredients, macroOverride, weightOverride]);

  const handleSaveMacros = useCallback(
    (macros: Pick<NutritionData, "protein_g" | "carbs_g" | "fats_g">) => {
      setMacroOverride(macros);
      setShowMacroSheet(false);
    },
    [],
  );

  const handleSaveWeight = useCallback((w: number) => {
    setWeightOverride(w);
    setShowWeightSheet(false);
  }, []);

  const handleSaveIngredient = useCallback(
    (updated: Ingredient) => {
      setIngredients((prev) =>
        prev.map((ing) => (ing === editingIngredient ? updated : ing)),
      );
      setEditingIngredient(null);
    },
    [editingIngredient],
  );

  const handleDeleteIngredient = useCallback((ingredient: Ingredient) => {
    setIngredients((prev) => prev.filter((ing) => ing !== ingredient));
    setEditingIngredient(null);
  }, []);

  const handleAddIngredient = useCallback((ingredient: Ingredient) => {
    setIngredients((prev) => [...prev, ingredient]);
    setShowAddSheet(false);
  }, []);

  const onAddToLog = useCallback(async () => {
    if (data && params.photoUri && derivedNutrition) {
      const updatedData: AnalysisResponse = {
        ...data,
        nutrition_data: derivedNutrition,
      };
      await addLog(updatedData, params.photoUri);
      router.replace("/logs");
    }
  }, [data, derivedNutrition, params.photoUri, addLog, router]);

  const tabs = useMemo(() => {
    if (!derivedNutrition) return [];
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
          <MealSummaryTab
            nutrition={derivedNutrition}
            theme={theme}
            goals={goals}
          />
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
          <DetailsTab
            nutrition={derivedNutrition}
            theme={theme}
            goals={goals}
            onEditIngredient={setEditingIngredient}
            onAddIngredient={() => setShowAddSheet(true)}
            onEditMacros={() => setShowMacroSheet(true)}
            onEditWeight={() => setShowWeightSheet(true)}
          />
        ),
      },
    ];
  }, [derivedNutrition, theme, goals]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Animated.View
          style={styles.centered}
          entering={FadeIn.delay(200)}
          exiting={FadeOut}
        >
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Analyzing your meal...
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Animated.View
          style={styles.centered}
          entering={FadeIn.delay(200)}
          exiting={FadeOut}
        >
          <Text style={[styles.errorText, { color: "#ef4444" }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.tint }]}
            onPress={() => handleAnalysis()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MealDetailView
        imageUri={params.photoUri}
        heroInfo={{
          title: data?.nutrition_data?.dish_name ?? "Meal Detected",
          subtitle: (() => {
            const confidence = data?.nutrition_data?.confidence ?? "medium";
            const cfg =
              CONFIDENCE_CONFIG[confidence as keyof typeof CONFIDENCE_CONFIG] ??
              CONFIDENCE_CONFIG.medium;
            return (
              <View
                style={[styles.confidencePill, { backgroundColor: cfg.pillBg }]}
              >
                <MaterialIcons name={cfg.icon} size={14} color={cfg.color} />
                <Text style={[styles.confidencePillText, { color: cfg.color }]}>
                  {cfg.label}
                </Text>
              </View>
            );
          })(),
          bottomOffset: 34,
        }}
        tabs={tabs}
        actions={[
          {
            label: "Add to Log",
            variant: "filled",
            backgroundColor: theme.tint,
            color: theme.isDark ? "#000" : "#fff",
            icon: (
              <MaterialIcons
                name="check"
                size={20}
                color={theme.isDark ? "#000" : "#fff"}
                style={{ marginRight: 8 }}
              />
            ),
            row: true,
            flex: 2,
            boxShadow: "0 4px 12px rgba(19,236,55,0.25)",
            onPress: onAddToLog,
          },
        ]}
        scrollPaddingBottom={200}
        contentBackgroundColor={theme.background}
        actionBarBorderColor="rgba(255,255,255,0.1)"
        activeColor={theme.tint}
        inactiveColor={theme.textMuted}
        underlineColor={theme.tint}
        backgroundColor={theme.background}
        isDark={theme.isDark}
      />

      {/* Ingredient edit sheet */}
      <IngredientEditSheet
        visible={editingIngredient !== null}
        ingredient={editingIngredient}
        theme={theme}
        onClose={() => setEditingIngredient(null)}
        onSave={handleSaveIngredient}
        onDelete={handleDeleteIngredient}
      />

      {/* Add ingredient sheet */}
      <AddIngredientSheet
        visible={showAddSheet}
        theme={theme}
        onClose={() => setShowAddSheet(false)}
        onAdd={handleAddIngredient}
      />

      {/* Macro edit sheet */}
      {derivedNutrition && (
        <MacroEditSheet
          visible={showMacroSheet}
          nutrition={derivedNutrition}
          theme={theme}
          onClose={() => setShowMacroSheet(false)}
          onSave={handleSaveMacros}
        />
      )}

      {/* Weight edit sheet */}
      {derivedNutrition && (
        <WeightEditSheet
          visible={showWeightSheet}
          weight={derivedNutrition.portion_size_g}
          theme={theme}
          onClose={() => setShowWeightSheet(false)}
          onSave={handleSaveWeight}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "semibold",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "medium",
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontFamily: "bold",
    fontSize: 15,
  },
  confidencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  confidencePillText: {
    fontSize: 13,
    fontFamily: "semibold",
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
  addIngredientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  addIngredientText: {
    fontSize: 12,
    fontFamily: "semibold",
  },
});

export default MealInfo;
