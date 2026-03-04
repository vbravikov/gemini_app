import { DEFAULT_DAILY_GOALS } from "@/constants/nutrition";
import { useTheme } from "@/constants/theme";
import {
  DailyGoals,
  DIET_GOAL_PRESETS,
  useCustomDailyGoals,
} from "@/hooks/useDailyGoals";
import { useDietPreferences } from "@/hooks/useDietPreferences";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { useRef } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GoalKey = keyof DailyGoals;

interface FieldConfig {
  key: GoalKey;
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
}

const FIELDS: FieldConfig[] = [
  {
    key: "calories_kcal",
    label: "Calories",
    unit: "kcal",
    color: "#10b981",
    min: 800,
    max: 5000,
  },
  {
    key: "protein_g",
    label: "Protein",
    unit: "g",
    color: "#3b82f6",
    min: 20,
    max: 400,
  },
  {
    key: "carbs_g",
    label: "Carbohydrates",
    unit: "g",
    color: "#f97316",
    min: 0,
    max: 700,
  },
  {
    key: "fats_g",
    label: "Fats",
    unit: "g",
    color: "#eab308",
    min: 10,
    max: 300,
  },
];

// ---------------------------------------------------------------------------
// GoalField — individual numeric input row
// ---------------------------------------------------------------------------

function GoalField({
  config,
  initialValue,
  onChangeText,
  theme,
}: {
  config: FieldConfig;
  initialValue: number;
  onChangeText: (key: GoalKey, value: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={[styles.fieldDot, { backgroundColor: config.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
          {config.label}
        </Text>
      </View>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.isDark ? "#0f2d1f" : "#f0fdf4",
            borderColor: theme.isDark ? "#1f3d29" : "#d1fae5",
          },
        ]}
      >
        <TextInput
          defaultValue={String(initialValue)}
          onChangeText={(v) => onChangeText(config.key, v)}
          keyboardType="number-pad"
          returnKeyType="done"
          selectTextOnFocus
          style={[
            styles.input,
            { color: theme.text, fontVariant: ["tabular-nums"] },
          ]}
          placeholderTextColor={theme.textMuted}
          maxLength={5}
        />
        <Text style={[styles.unitText, { color: theme.textMuted }]}>
          {config.unit}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function EditGoalsScreen() {
  const theme = useTheme();
  const { goals, setGoals, resetToDefault, applyPreset, isCustom } =
    useCustomDailyGoals();
  const { dietGoal, goalConfig } = useDietPreferences();

  // Use refs so text inputs don't cause re-renders on every keystroke
  const draft = useRef<DailyGoals>({ ...goals });

  const handleChangeText = (key: GoalKey, value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      draft.current = { ...draft.current, [key]: parsed };
    }
  };

  const handleApplyPreset = () => {
    if (!dietGoal) return;
    const preset = DIET_GOAL_PRESETS[dietGoal];
    applyPreset(preset);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Navigate back so the screen re-mounts with fresh defaultValues
    router.back();
  };

  const handleSave = () => {
    const d = draft.current;
    // Validate ranges
    for (const field of FIELDS) {
      const val = d[field.key];
      if (val < field.min || val > field.max) {
        Alert.alert(
          "Invalid value",
          `${field.label} must be between ${field.min} and ${field.max} ${field.unit}.`,
        );
        return;
      }
    }
    setGoals(d);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleReset = () => {
    const resetTarget = dietGoal
      ? DIET_GOAL_PRESETS[dietGoal]
      : DEFAULT_DAILY_GOALS;
    const resetLabel =
      dietGoal && goalConfig
        ? `${goalConfig.label} preset values`
        : "default values";
    Alert.alert(
      "Reset Goals",
      `Reset all goals to the ${resetLabel}?\n\n${resetTarget.calories_kcal} kcal · ${resetTarget.protein_g}g protein · ${resetTarget.carbs_g}g carbs · ${resetTarget.fats_g}g fats`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            if (dietGoal) {
              applyPreset(resetTarget);
            } else {
              resetToDefault();
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ],
    );
  };

  // Lift the save bar above the keyboard
  const keyboard = useAnimatedKeyboard();
  const footerStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value > 0 ? keyboard.height.value + 12 : 24,
  }));

  return (
    <>
      <Stack.Screen options={{ title: "Edit Daily Goals" }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Preset banner — only shown when a diet goal is active */}
          {dietGoal && goalConfig && (
            <Animated.View entering={FadeInDown.duration(320).delay(0)}>
              <Pressable
                onPress={handleApplyPreset}
                style={({ pressed }) => [
                  styles.presetBanner,
                  {
                    backgroundColor: theme.isDark ? "#0f2d1f" : "#ecfdf5",
                    borderColor: theme.tint,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <View style={styles.presetLeft}>
                  <MaterialIcons
                    name={
                      goalConfig.icon as keyof typeof MaterialIcons.glyphMap
                    }
                    size={20}
                    color={theme.tint}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.presetTitle, { color: theme.tint }]}>
                      Use {goalConfig.label} preset
                    </Text>
                    <Text
                      style={[
                        styles.presetSubtitle,
                        { color: theme.textMuted },
                      ]}
                    >
                      {DIET_GOAL_PRESETS[dietGoal].calories_kcal} kcal ·{" "}
                      {DIET_GOAL_PRESETS[dietGoal].protein_g}g protein ·{" "}
                      {DIET_GOAL_PRESETS[dietGoal].carbs_g}g carbs ·{" "}
                      {DIET_GOAL_PRESETS[dietGoal].fats_g}g fats
                    </Text>
                  </View>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={theme.tint}
                />
              </Pressable>
            </Animated.View>
          )}

          {/* Input fields */}
          <Animated.View
            entering={FadeInDown.duration(320).delay(60)}
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
              },
            ]}
          >
            <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
              DAILY TARGETS
            </Text>
            {FIELDS.map((field, i) => (
              <View key={field.key}>
                <GoalField
                  config={field}
                  initialValue={goals[field.key]}
                  onChangeText={handleChangeText}
                  theme={theme}
                />
                {i < FIELDS.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor: theme.isDark ? "#1f3d29" : "#f3f4f6",
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </Animated.View>

          {/* Reset link */}
          {isCustom && (
            <Animated.View
              entering={FadeInDown.duration(320).delay(120)}
              style={styles.resetRow}
            >
              <Pressable
                onPress={handleReset}
                hitSlop={12}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={[styles.resetText, { color: "#ef4444" }]}>
                  {dietGoal && goalConfig
                    ? `Reset to ${goalConfig.label} preset`
                    : "Reset to default"}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>

        {/* Save button — keyboard-aware */}
        <Animated.View
          style={[
            styles.footer,
            footerStyle,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
            },
          ]}
        >
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <MaterialIcons
              name="check"
              size={20}
              color={theme.isDark ? "#000" : "#fff"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.saveButtonText,
                { color: theme.isDark ? "#000" : "#fff" },
              ]}
            >
              Save Goals
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 8,
    gap: 16,
  },
  presetBanner: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1.5,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  presetLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  presetTitle: {
    fontSize: 14,
    fontFamily: "semibold",
    marginBottom: 2,
  },
  presetSubtitle: {
    fontSize: 12,
    fontFamily: "medium",
    lineHeight: 17,
  },
  card: {
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    fontSize: 11,
    fontFamily: "semibold",
    letterSpacing: 1.5,
    paddingTop: 12,
    paddingBottom: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  fieldDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fieldLabel: {
    fontSize: 15,
    fontFamily: "medium",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    gap: 4,
    minWidth: 100,
  },
  input: {
    fontSize: 16,
    fontFamily: "semibold",
    textAlign: "right",
    flexShrink: 1,
    minWidth: 52,
  },
  unitText: {
    fontSize: 13,
    fontFamily: "medium",
  },
  divider: {
    height: 1,
    marginLeft: 22,
  },
  resetRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 14,
    fontFamily: "medium",
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderCurve: "continuous",
    paddingVertical: 16,
    boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "bold",
  },
});
