import { TopTabs } from "@/components/ui/base/tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useTheme } from "../constants/theme";
import { AnalysisResponse, analyzeImage, NutritionData } from "../utils/api";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.4;

const SummaryTab = ({ markdown, theme }: { markdown: string; theme: any }) => {
  return (
    <View style={styles.tabContent}>
      {/* AI Analysis */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        AI Analysis
      </Text>
      <View
        style={[
          styles.markdownCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
          },
        ]}
      >
        <EnrichedMarkdownText markdown={markdown} />
      </View>
    </View>
  );
};

const DetailsTab = ({
  nutrition,
  theme,
}: {
  nutrition: NutritionData;
  theme: any;
}) => {
  // Calculate percentages for progress bars (assuming daily goals)
  const proteinPercent = Math.min((nutrition.protein_g / 140) * 100, 100);
  const carbsPercent = Math.min((nutrition.carbs_g / 250) * 100, 100);
  const fatsPercent = Math.min((nutrition.fats_g / 70) * 100, 100);

  return (
    <View style={styles.tabContent}>
      {/* Portion Size Card */}
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
        <Text
          style={[styles.detailValue, { color: theme.text, marginLeft: 12 }]}
        >
          {nutrition.portion_size_g}g
        </Text>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.textMuted, marginLeft: "auto" },
          ]}
        >
          Approx. Weight
        </Text>
      </View>

      {/* Energy Summary Card */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Nutritional Overview
      </Text>
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

      {/* Macronutrients Grid */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Macronutrients
      </Text>
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

      {/* Ingredients List */}
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
        {nutrition.ingredients.map((ingredient, index) => {
          // Mock calorie data - you'd get this from your API
          const emojiMap: { [key: string]: string } = {
            chicken: "🍗",
            avocado: "🥑",
            quinoa: "🍚",
            tomato: "🍅",
            rice: "🍚",
            broccoli: "🥦",
            salmon: "🐟",
            egg: "🥚",
          };

          const emoji = Object.keys(emojiMap).find((key) =>
            ingredient.toLowerCase().includes(key),
          )
            ? emojiMap[
                Object.keys(emojiMap).find((key) =>
                  ingredient.toLowerCase().includes(key),
                )!
              ]
            : "🍽️";

          const mockCalories = Math.floor(Math.random() * 200) + 50;

          return (
            <View
              key={index}
              style={[
                styles.ingredientCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
                },
              ]}
            >
              <View
                style={[
                  styles.ingredientIcon,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(19, 236, 55, 0.1)"
                      : "#f0fdf4",
                  },
                ]}
              >
                <Text style={styles.ingredientEmoji}>{emoji}</Text>
              </View>
              <View style={styles.ingredientInfo}>
                <Text style={[styles.ingredientName, { color: theme.text }]}>
                  {ingredient}
                </Text>
                <Text
                  style={[styles.ingredientMeta, { color: theme.textMuted }]}
                >
                  ~
                  {Math.round(
                    nutrition.portion_size_g / nutrition.ingredients.length,
                  )}
                  g
                </Text>
              </View>
              <View style={styles.ingredientCalories}>
                <Text
                  style={[styles.ingredientCalValue, { color: theme.text }]}
                >
                  {mockCalories}
                </Text>
                <Text
                  style={[
                    styles.ingredientCalLabel,
                    { color: theme.textMuted },
                  ]}
                >
                  kcal
                </Text>
              </View>
            </View>
          );
        })}
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

const MacroItem = ({ label, value, icon, color, theme }: any) => (
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
      <MaterialIcons name={icon} size={20} color={color} />
    </View>
    <Text style={[styles.macroValueText, { color: theme.text }]}>{value}</Text>
    <Text style={[styles.macroLabelText, { color: theme.textMuted }]}>
      {label}
    </Text>
  </View>
);

const MealInfo = () => {
  const params = useLocalSearchParams<{ photoUri: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (params.photoUri) {
      handleAnalysis();
    }
  }, [params.photoUri]);

  const handleAnalysis = async () => {
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
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [HEADER_HEIGHT, 0],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT * 0.5],
      [1, 0],
      Extrapolate.CLAMP,
    );

    return {
      height,
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
        contentComponent: <SummaryTab markdown={data.markdown} theme={theme} />,
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
        contentContainerStyle={styles.scrollContent}
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
                <Text style={styles.heroTitle}>Lunch Detected</Text>
                <View style={styles.heroConfidence}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={16}
                    color={theme.tint}
                  />
                  <Text style={styles.heroConfidenceText}>
                    AI Confidence: High
                  </Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {/* Tabs Content - This will become sticky */}
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

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <BlurView
          intensity={20}
          tint={theme.isDark ? "dark" : "light"}
          style={styles.backButtonBlur}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="rgba(255, 255, 255, 0.8)"
          />
        </BlurView>
      </TouchableOpacity>

      <BlurView
        intensity={80}
        tint={theme.isDark ? "dark" : "light"}
        style={styles.bottomActionBar}
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
            onPress={() => {
              /* Log meal logic */
            }}
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
    paddingBottom: 140,
  },
  heroContainer: {
    width: "100%",
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
  backButton: {
    position: "absolute",
    top: 56,
    left: 24,
    zIndex: 50,
    borderRadius: 50,
    overflow: "hidden",
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "700",
  },
  heroBottomInfo: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 40,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "rgba(0,0,0,0.9)",
    marginBottom: 4,
  },
  heroConfidence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroConfidenceText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.8)",
    fontWeight: "500",
  },
  tabsWrapper: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    overflow: "hidden",
    minHeight: SCREEN_HEIGHT * 0.6,
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
    fontWeight: "600",
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
    fontWeight: "500",
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  tabTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabTitleText: {
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 0,
    marginBottom: 16,
  },
  markdownCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  ingredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adjustButton: {
    fontSize: 14,
    fontWeight: "600",
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  ingredientIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  ingredientEmoji: {
    fontSize: 24,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  ingredientMeta: {
    fontSize: 12,
  },
  ingredientCalories: {
    alignItems: "flex-end",
  },
  ingredientCalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  ingredientCalLabel: {
    fontSize: 11,
  },
  addIngredientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  addIngredientText: {
    fontSize: 12,
    fontWeight: "600",
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
    fontWeight: "700",
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
    fontWeight: "700",
  },
});

export default MealInfo;
