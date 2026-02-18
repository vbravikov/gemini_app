import { TopTabs } from "@/components/ui/base/tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme } from "../constants/theme";
import { AnalysisResponse, analyzeImage, NutritionData } from "../utils/api";
import { useMealLogs } from "../hooks/useMealLogs";
import { MealSummaryTab } from "@/components/ui/meal-analysis/MealSummaryTab";
import {
  NutritionalOverviewCard,
  PortionWeightCard,
  MacronutrientsGrid,
} from "@/components/ui/meal-analysis/MealDetailsSections";
import { IngredientCard } from "@/components/ui/meal-analysis/IngredientItem";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.4;

const DetailsTab = ({
  nutrition,
  theme,
}: {
  nutrition: NutritionData;
  theme: any;
}) => {
  return (
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
          <Text style={[styles.adjustButton, { color: theme.tint }]}>
            Adjust
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ingredientsList}>
        {nutrition.ingredients.map((ingredient, index) => (
          <IngredientCard
            key={index}
            ingredient={ingredient}
            portionSizeG={nutrition.portion_size_g}
            ingredientsCount={nutrition.ingredients.length}
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
};

const MealInfo = () => {
  const params = useLocalSearchParams<{ photoUri: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { addLog } = useMealLogs();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollY = useSharedValue(0);

  const handleAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyzeImage(params.photoUri);
      setData(response);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [params.photoUri]);

  useEffect(() => {
    if (params.photoUri) {
      handleAnalysis();
    }
  }, [params.photoUri, handleAnalysis]);

  const onAddToLog = useCallback(async () => {
    if (data && params.photoUri) {
      await addLog(data, params.photoUri);
      router.replace("/logs");
    }
  }, [data, params.photoUri, addLog, router]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, HEADER_HEIGHT * 0.4],
      Extrapolate.CLAMP,
    );

    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT * 0.8],
      [1, 0],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

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
          style={styles.loadingContainer}
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
          style={styles.errorContainer}
          entering={FadeIn.delay(200)}
          exiting={FadeOut}
        >
          <Text style={[styles.errorText, { color: "#ef4444" }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.tint }]}
            onPress={handleAnalysis}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            backgroundColor: theme.background,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        entering={FadeIn.delay(200)}
      >
        {/* Hero Image Section */}
        <Animated.View style={[styles.heroContainer, headerStyle]}>
          <Image
            source={{ uri: params.photoUri }}
            style={styles.heroImage}
            contentFit="cover"
          />

          {/* Gradient Overlay */}
          <LinearGradient
            colors={[
              theme.isDark ? "rgba(16, 34, 19, 0.3)" : "rgba(0, 0, 0, 0.2)",
              "transparent",
              theme.isDark ? "#102213" : "#f6f8f6",
            ]}
            style={styles.gradient}
            locations={[0, 0.4, 0.95]}
          />

          {/* AI Detection Indicators */}
          {data && (
            <>
              {/* Floating detection dot 1 */}
              <Animated.View
                style={[styles.detectionDot, { top: "35%", left: "20%" }]}
                entering={FadeIn.delay(400)}
              >
                <View style={styles.pulsingDot} />
              </Animated.View>

              {/* Floating detection dot 2 with label */}
              <Animated.View
                style={[styles.detectionDot, { top: "45%", right: "30%" }]}
                entering={FadeIn.delay(600)}
              >
                <View style={styles.pulsingDot} />
                <View
                  style={[
                    styles.detectionLabel,
                    { backgroundColor: theme.card },
                  ]}
                >
                  <Text
                    style={[styles.detectionLabelText, { color: theme.text }]}
                  >
                    {data.nutrition_data?.ingredients[0] || "Detected"}
                  </Text>
                  <MaterialIcons
                    name="check-circle"
                    size={12}
                    color={theme.tint}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </Animated.View>

              {/* Bottom Info Card */}
              <View style={styles.heroBottomInfo}>
                <Text style={[styles.heroTitle, { color: theme.text }]}>
                  Lunch Detected
                </Text>
                <View style={styles.heroConfidence}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={16}
                    color={theme.tint}
                  />
                  <Text
                    style={[
                      styles.heroConfidenceText,
                      { color: theme.textMuted },
                    ]}
                  >
                    AI Confidence: High
                  </Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        <View
          style={[styles.tabsWrapper, { backgroundColor: theme.background }]}
        >
          <TopTabs
            tabs={tabs}
            activeColor={theme.tint}
            inactiveColor={theme.textMuted}
            underlineColor={theme.tint}
          />
        </View>
      </Animated.ScrollView>

      <BlurView
        intensity={80}
        tint={theme.isDark ? "dark" : "light"}
        style={styles.bottomActionBar}
        experimentalBlurMethod="dimezisBlurView"
      >
        <View style={styles.bottomActionContent}>
          <TouchableOpacity
            style={[
              styles.editButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.isDark ? "#334155" : "#cbd5e1",
              },
            ]}
          >
            <Text style={[styles.editButtonText, { color: theme.text }]}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logButton, { backgroundColor: theme.tint }]}
            onPress={onAddToLog}
          >
            <MaterialIcons
              name="check"
              size={20}
              color={theme.isDark ? "#000" : "#fff"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.logButtonText,
                { color: theme.isDark ? "#000" : "#fff" },
              ]}
            >
              Add to Log
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  heroContainer: {
    width: "100%",
    height: HEADER_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  detectionDot: {
    position: "absolute",
    zIndex: 40,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#13ec37",
    shadowColor: "#13ec37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  detectionLabel: {
    position: "absolute",
    left: 16,
    top: -6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detectionLabelText: {
    fontSize: 12,
    fontFamily: "bold",
  },
  heroBottomInfo: {
    position: "absolute",
    bottom: 34,
    left: 24,
    right: 24,
    zIndex: 40,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: "bold",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroConfidence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroConfidenceText: {
    fontSize: 14,
    fontFamily: "semibold",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabsWrapper: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    minHeight: SCREEN_HEIGHT,
  },
  tabContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "semibold",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
  tabTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabTitleText: {
    fontSize: 15,
    fontFamily: "medium",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "bold",
    marginTop: 0,
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
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomActionContent: {
    flexDirection: "row",
    gap: 16,
    padding: 24,
    paddingBottom: 40,
  },
  editButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: "bold",
  },
  logButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#13ec37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logButtonText: {
    fontSize: 16,
    fontFamily: "bold",
  },
});

export default MealInfo;
