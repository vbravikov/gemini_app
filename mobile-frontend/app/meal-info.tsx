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
import { AnalysisResponse, analyzeImage, NutritionData } from "@/utils/api";
import { useMealLogs } from "@/hooks/useMealLogs";

const DetailsTab = ({
  nutrition,
  theme,
}: {
  nutrition: NutritionData;
  theme: any;
}) => (
  <View style={styles.tabContent}>
    <PortionWeightCard weight={nutrition.portion_size_g} theme={theme} />

    <Text style={[styles.sectionTitle, { color: theme.text }]}>
      Nutritional Overview
    </Text>
    <NutritionalOverviewCard
      nutrition={nutrition}
      theme={theme}
      showBadge={true}
    />

    <Text style={[styles.sectionTitle, { color: theme.text }]}>
      Macronutrients
    </Text>
    <MacronutrientsGrid nutrition={nutrition} theme={theme} />

    <Text style={[styles.sectionTitle, { color: theme.text }]}>
      Identified Ingredients
    </Text>
    <View style={styles.ingredientsHeader}>
      <TouchableOpacity style={{ marginLeft: "auto", marginBottom: 12 }}>
        <Text style={[styles.adjustButton, { color: theme.tint }]}>Adjust</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.ingredientsList}>
      {nutrition.ingredients.map((ingredient, index) => (
        <IngredientCard
          key={index}
          ingredient={ingredient}
          theme={theme}
        />
      ))}
    </View>
    <TouchableOpacity style={styles.addIngredientButton}>
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
  const { addLog } = useMealLogs();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyzeImage(params.photoUri, signal);
      setData(response);
    } catch (err: any) {
      if (err?.name === "AbortError") return; // screen unmounted — ignore
      console.error(err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [params.photoUri]);

  useEffect(() => {
    if (!params.photoUri) return;
    const controller = new AbortController();
    handleAnalysis(controller.signal);
    return () => controller.abort();
  }, [params.photoUri, handleAnalysis]);

  const onAddToLog = useCallback(async () => {
    if (data && params.photoUri) {
      await addLog(data, params.photoUri);
      router.replace("/logs");
    }
  }, [data, params.photoUri, addLog, router]);

  const tabs = useMemo(() => {
    if (!data) return [];
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
          <MealSummaryTab markdown={data.markdown} theme={theme} />
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
        contentComponent: data.nutrition_data ? (
          <DetailsTab nutrition={data.nutrition_data} theme={theme} />
        ) : null,
      },
    ];
  }, [data, theme]);

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
          subtitle: (
            <View style={styles.heroConfidence}>
              <MaterialIcons name="auto-awesome" size={16} color={theme.tint} />
              <Text style={[styles.heroConfidenceText, { color: "#fff" }]}>
                AI Confidence:{" "}
                {data?.nutrition_data?.confidence
                  ? data.nutrition_data.confidence.charAt(0).toUpperCase() +
                    data.nutrition_data.confidence.slice(1)
                  : "Unknown"}
              </Text>
            </View>
          ),
          bottomOffset: 34,
        }}
        tabs={tabs}
        actions={[
          {
            label: "Edit",
            variant: "outlined",
            backgroundColor: theme.card,
            color: theme.text,
            onPress: () => {},
          },
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
  heroConfidence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroConfidenceText: {
    fontSize: 14,
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
  ingredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adjustButton: {
    fontSize: 14,
    fontFamily: "semibold",
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
