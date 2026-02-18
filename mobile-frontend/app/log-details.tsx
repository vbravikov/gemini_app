import { TopTabs } from "@/components/ui/base/tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme } from "../constants/theme";
import { useMealLogs } from "../hooks/useMealLogs";
import { NutritionData } from "../utils/api";
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
      <PortionWeightCard
        weight={nutrition.portion_size_g}
        theme={theme}
        label="Weight"
      />

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Nutritional Overview
      </Text>
      <NutritionalOverviewCard nutrition={nutrition} theme={theme} />

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Macronutrients
      </Text>
      <MacronutrientsGrid nutrition={nutrition} theme={theme} />

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Ingredients
      </Text>
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
    </View>
  );
};

const LogDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { logs, deleteLog } = useMealLogs();

  const log = useMemo(() => logs.find((l) => l.id === id), [logs, id]);

  const scrollY = useSharedValue(0);

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
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT * 0.8],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }, { scale }], opacity };
  });

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
          <MealSummaryTab markdown={log.markdown} theme={theme} />
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
          <DetailsTab nutrition={log.nutrition} theme={theme} />
        ),
      },
    ];
  }, [log, theme]);

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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: theme.tint }}>Go Back</Text>
        </TouchableOpacity>
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
        <Animated.View style={[styles.heroContainer, headerStyle]}>
          <Image
            source={{ uri: log.imageUri }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={[
              theme.isDark ? "rgba(16, 34, 19, 0.3)" : "rgba(0, 0, 0, 0.2)",
              "transparent",
              theme.background,
            ]}
            style={styles.gradient}
            locations={[0, 0.4, 0.95]}
          />
          <View style={styles.heroBottomInfo}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              {log.nutrition.ingredients[0] || "Logged Meal"}
            </Text>
            <Text style={[styles.heroDate, { color: theme.textMuted }]}>
              {new Date(log.timestamp).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
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
            style={[styles.deleteButton, { borderColor: "#ef4444" }]}
            onPress={handleDelete}
          >
            <MaterialIcons
              name="delete"
              size={20}
              color="#ef4444"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.deleteButtonText, { color: "#ef4444" }]}>
              Delete Entry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.tint }]}
            onPress={() => router.back()}
          >
            <Text
              style={[
                styles.doneButtonText,
                { color: theme.isDark ? "#000" : "#fff" },
              ]}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 150 },
  heroContainer: {
    width: "100%",
    height: HEADER_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  gradient: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  heroBottomInfo: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 40,
  },
  heroTitle: { fontSize: 30, fontFamily: "bold", marginBottom: 4 },
  heroDate: { fontSize: 14, fontFamily: "medium" },
  tabsWrapper: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    minHeight: SCREEN_HEIGHT,
  },
  tabContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontFamily: "bold", marginBottom: 16 },
  ingredientsList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tabTitleContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  tabTitleText: { fontSize: 15, fontFamily: "medium" },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  bottomActionContent: {
    flexDirection: "row",
    gap: 16,
    padding: 24,
    paddingBottom: 40,
  },
  deleteButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
  },
  deleteButtonText: { fontSize: 16, fontFamily: "bold" },
  doneButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  doneButtonText: { fontSize: 16, fontFamily: "bold" },
});

export default LogDetails;
