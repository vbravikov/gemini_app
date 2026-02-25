/**
 * IngredientSheets.tsx
 *
 * Reusable bottom-sheet modals for the meal-info screen:
 *   - IngredientEditSheet  — edit or delete an existing ingredient
 *   - AddIngredientSheet   — add a brand-new ingredient
 *   - MacroEditSheet       — manually override protein / carbs / fats / calories
 *
 * All use:
 *   - @lodev09/react-native-true-sheet for native bottom-sheet behaviour
 *   - TrueSheet handles keyboard avoidance natively (no KeyboardAvoidingView needed)
 *   - Uncontrolled TextInput via defaultValue + useRef draft
 *   - expo-haptics feedback on save / delete
 */

import { Ingredient, NutritionData } from "@/utils/api";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Shared field row
// ---------------------------------------------------------------------------

function FieldRow({
  label,
  defaultValue,
  unit,
  keyboardType,
  onChangeText,
  inputRef,
  theme,
}: {
  label: string;
  defaultValue: string;
  unit: string;
  keyboardType: "default" | "number-pad" | "decimal-pad";
  onChangeText: (v: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  theme: Theme;
}) {
  return (
    <View style={sharedStyles.fieldRow}>
      <Text style={[sharedStyles.fieldLabel, { color: theme.textMuted }]}>
        {label}
      </Text>
      <View
        style={[
          sharedStyles.inputWrapper,
          {
            backgroundColor: theme.isDark ? "#0f2d1f" : "#f0fdf4",
            borderColor: theme.isDark ? "#1f3d29" : "#d1fae5",
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          defaultValue={defaultValue}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          returnKeyType="done"
          selectTextOnFocus
          style={[
            sharedStyles.input,
            { color: theme.text, fontVariant: ["tabular-nums"] },
          ]}
          placeholderTextColor={theme.textMuted}
          maxLength={keyboardType === "default" ? 60 : 6}
        />
        {unit ? (
          <Text style={[sharedStyles.unitText, { color: theme.textMuted }]}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// IngredientEditSheet — edit or delete an existing ingredient
// ---------------------------------------------------------------------------

export interface IngredientEditSheetProps {
  visible: boolean;
  ingredient: Ingredient | null;
  theme: Theme;
  onClose: () => void;
  onSave: (updated: Ingredient) => void;
  onDelete: (ingredient: Ingredient) => void;
}

export function IngredientEditSheet({
  visible,
  ingredient,
  theme,
  onClose,
  onSave,
  onDelete,
}: IngredientEditSheetProps) {
  const sheetRef = useRef<TrueSheet>(null);
  const nameInputRef = useRef<TextInput>(null);

  const draft = useRef<Ingredient>(
    ingredient ?? { name: "", weight_g: 0, calories_kcal: 0 },
  );

  // Keep draft in sync when a different ingredient is opened
  if (ingredient && ingredient.name !== draft.current.name) {
    draft.current = { ...ingredient };
  }

  // Drive present / dismiss from the visible prop
  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSave = () => {
    const d = draft.current;
    if (!d.name.trim()) {
      Alert.alert("Missing name", "Please enter an ingredient name.");
      return;
    }
    if (d.weight_g <= 0 || d.weight_g > 9999) {
      Alert.alert("Invalid weight", "Weight must be between 1 and 9999 g.");
      return;
    }
    if (d.calories_kcal < 0 || d.calories_kcal > 9999) {
      Alert.alert("Invalid calories", "Calories must be between 0 and 9999.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ ...d });
  };

  const handleDelete = () => {
    if (!ingredient) return;
    Alert.alert(
      "Remove Ingredient",
      `Remove "${ingredient.name}" from this meal?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(ingredient);
          },
        },
      ],
    );
  };

  if (!ingredient) return null;

  return (
    <TrueSheet
      ref={sheetRef}
      detents={["auto"]}
      onDidDismiss={onClose}
      backgroundBlur={theme.isDark ? "dark" : "light"}
      onDidPresent={() => {
        // Focus name field after sheet finishes presenting (avoid autoFocus)
        nameInputRef.current?.focus();
      }}
      footer={
        <View
          style={[
            sharedStyles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
            },
          ]}
        >
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              sharedStyles.saveButton,
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
                sharedStyles.saveButtonText,
                { color: theme.isDark ? "#000" : "#fff" },
              ]}
            >
              Save Changes
            </Text>
          </Pressable>
        </View>
      }
    >
      <View
        style={[
          sharedStyles.sheetContent,
          { backgroundColor: theme.background },
        ]}
      >
        {/* Header */}
        <View style={sharedStyles.header}>
          <Text style={[sharedStyles.title, { color: theme.text }]}>
            Edit Ingredient
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={sharedStyles.body}
        >
          <FieldRow
            label="Name"
            defaultValue={ingredient.name}
            unit=""
            keyboardType="default"
            inputRef={nameInputRef}
            onChangeText={(v) => {
              draft.current = { ...draft.current, name: v };
            }}
            theme={theme}
          />
          <View
            style={[
              sharedStyles.divider,
              { backgroundColor: theme.isDark ? "#1f3d29" : "#f3f4f6" },
            ]}
          />
          <FieldRow
            label="Weight"
            defaultValue={String(ingredient.weight_g)}
            unit="g"
            keyboardType="number-pad"
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n)) draft.current = { ...draft.current, weight_g: n };
            }}
            theme={theme}
          />
          <View
            style={[
              sharedStyles.divider,
              { backgroundColor: theme.isDark ? "#1f3d29" : "#f3f4f6" },
            ]}
          />
          <FieldRow
            label="Calories"
            defaultValue={String(ingredient.calories_kcal)}
            unit="kcal"
            keyboardType="number-pad"
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n))
                draft.current = { ...draft.current, calories_kcal: n };
            }}
            theme={theme}
          />
          <TouchableOpacity
            onPress={handleDelete}
            style={sharedStyles.deleteRow}
            hitSlop={8}
          >
            <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
            <Text style={sharedStyles.deleteText}>Remove ingredient</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TrueSheet>
  );
}

// ---------------------------------------------------------------------------
// AddIngredientSheet — add a brand-new ingredient
// ---------------------------------------------------------------------------

export interface AddIngredientSheetProps {
  visible: boolean;
  theme: any;
  onClose: () => void;
  onAdd: (ingredient: Ingredient) => void;
}

const EMPTY_INGREDIENT: Ingredient = {
  name: "",
  weight_g: 100,
  calories_kcal: 0,
};

export function AddIngredientSheet({
  visible,
  theme,
  onClose,
  onAdd,
}: AddIngredientSheetProps) {
  const sheetRef = useRef<TrueSheet>(null);
  const nameInputRef = useRef<TextInput>(null);
  const draft = useRef<Ingredient>({ ...EMPTY_INGREDIENT });

  // Drive present / dismiss from the visible prop
  useEffect(() => {
    if (visible) {
      draft.current = { ...EMPTY_INGREDIENT };
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleAdd = () => {
    const d = draft.current;
    if (!d.name.trim()) {
      Alert.alert("Missing name", "Please enter an ingredient name.");
      return;
    }
    if (d.weight_g <= 0 || d.weight_g > 9999) {
      Alert.alert("Invalid weight", "Weight must be between 1 and 9999 g.");
      return;
    }
    if (d.calories_kcal < 0 || d.calories_kcal > 9999) {
      Alert.alert("Invalid calories", "Calories must be between 0 and 9999.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({ ...d });
  };

  return (
    <TrueSheet
      ref={sheetRef}
      detents={["auto"]}
      onDidDismiss={onClose}
      backgroundBlur={theme.isDark ? "dark" : "light"}
      onDidPresent={() => {
        // Focus name field after sheet finishes presenting (avoid autoFocus)
        nameInputRef.current?.focus();
      }}
      footer={
        <View
          style={[
            sharedStyles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
            },
          ]}
        >
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              sharedStyles.saveButton,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <MaterialIcons
              name="add"
              size={20}
              color={theme.isDark ? "#000" : "#fff"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                sharedStyles.saveButtonText,
                { color: theme.isDark ? "#000" : "#fff" },
              ]}
            >
              Add Ingredient
            </Text>
          </Pressable>
        </View>
      }
    >
      <View
        style={[
          sharedStyles.sheetContent,
          { backgroundColor: theme.background },
        ]}
      >
        {/* Header */}
        <View style={sharedStyles.header}>
          <Text style={[sharedStyles.title, { color: theme.text }]}>
            Add Ingredient
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={sharedStyles.body}>
          <FieldRow
            label="Name"
            defaultValue=""
            unit=""
            keyboardType="default"
            inputRef={nameInputRef}
            onChangeText={(v) => {
              draft.current = { ...draft.current, name: v };
            }}
            theme={theme}
          />
          <View
            style={[
              sharedStyles.divider,
              { backgroundColor: theme.isDark ? "#1f3d29" : "#f3f4f6" },
            ]}
          />
          <FieldRow
            label="Weight"
            defaultValue="100"
            unit="g"
            keyboardType="number-pad"
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n)) draft.current = { ...draft.current, weight_g: n };
            }}
            theme={theme}
          />
          <View
            style={[
              sharedStyles.divider,
              { backgroundColor: theme.isDark ? "#1f3d29" : "#f3f4f6" },
            ]}
          />
          <FieldRow
            label="Calories"
            defaultValue="0"
            unit="kcal"
            keyboardType="number-pad"
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n))
                draft.current = { ...draft.current, calories_kcal: n };
            }}
            theme={theme}
          />
        </View>
      </View>
    </TrueSheet>
  );
}

// ---------------------------------------------------------------------------
// WeightEditSheet — manually override the portion weight
// ---------------------------------------------------------------------------

export interface WeightEditSheetProps {
  visible: boolean;
  weight: number;
  theme: any;
  onClose: () => void;
  onSave: (weight: number) => void;
}

export function WeightEditSheet({
  visible,
  weight,
  theme,
  onClose,
  onSave,
}: WeightEditSheetProps) {
  const sheetRef = useRef<TrueSheet>(null);
  const inputRef = useRef<TextInput>(null);
  const draft = useRef<number>(weight);

  // Keep draft in sync when weight prop changes
  if (weight !== draft.current) {
    draft.current = weight;
  }

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSave = () => {
    const w = draft.current;
    if (w <= 0 || w > 9999) {
      Alert.alert("Invalid weight", "Weight must be between 1 and 9999 g.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(w);
  };

  return (
    <TrueSheet
      ref={sheetRef}
      detents={["auto"]}
      cornerRadius={28}
      onDidDismiss={onClose}
      onDidPresent={() => {
        inputRef.current?.focus();
      }}
      footer={
        <View
          style={[
            sharedStyles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
            },
          ]}
        >
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              sharedStyles.saveButton,
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
                sharedStyles.saveButtonText,
                { color: theme.isDark ? "#000" : "#fff" },
              ]}
            >
              Save Weight
            </Text>
          </Pressable>
        </View>
      }
    >
      <View
        style={[
          sharedStyles.sheetContent,
          { backgroundColor: theme.background },
        ]}
      >
        <View style={sharedStyles.header}>
          <Text style={[sharedStyles.title, { color: theme.text }]}>
            Adjust Portion Weight
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={sharedStyles.body}>
          <FieldRow
            label="Weight"
            defaultValue={String(weight)}
            unit="g"
            keyboardType="number-pad"
            inputRef={inputRef}
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n)) draft.current = n;
            }}
            theme={theme}
          />
        </View>
      </View>
    </TrueSheet>
  );
}

// ---------------------------------------------------------------------------
// MacroEditSheet — manually override protein / carbs / fats
// ---------------------------------------------------------------------------

export interface MacroEditSheetProps {
  visible: boolean;
  nutrition: Pick<NutritionData, "protein_g" | "carbs_g" | "fats_g">;
  theme: any;
  onClose: () => void;
  onSave: (
    macros: Pick<NutritionData, "protein_g" | "carbs_g" | "fats_g">,
  ) => void;
}

export function MacroEditSheet({
  visible,
  nutrition,
  theme,
  onClose,
  onSave,
}: MacroEditSheetProps) {
  const sheetRef = useRef<TrueSheet>(null);
  const proteinRef = useRef<TextInput>(null);

  type MacroDraft = Pick<NutritionData, "protein_g" | "carbs_g" | "fats_g">;
  const draft = useRef<MacroDraft>({ ...nutrition });

  // Keep draft in sync when nutrition prop changes (new meal loaded)
  if (
    nutrition.protein_g !== draft.current.protein_g ||
    nutrition.carbs_g !== draft.current.carbs_g ||
    nutrition.fats_g !== draft.current.fats_g
  ) {
    draft.current = { ...nutrition };
  }

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSave = () => {
    const d = draft.current;
    if (d.protein_g < 0 || d.protein_g > 9999) {
      Alert.alert("Invalid protein", "Protein must be between 0 and 9999 g.");
      return;
    }
    if (d.carbs_g < 0 || d.carbs_g > 9999) {
      Alert.alert("Invalid carbs", "Carbs must be between 0 and 9999 g.");
      return;
    }
    if (d.fats_g < 0 || d.fats_g > 9999) {
      Alert.alert("Invalid fats", "Fats must be between 0 and 9999 g.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ ...d });
  };

  return (
    <TrueSheet
      ref={sheetRef}
      detents={["auto"]}
      onDidDismiss={onClose}
      onDidPresent={() => {
        proteinRef.current?.focus();
      }}
      footer={
        <View
          style={[
            sharedStyles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
            },
          ]}
        >
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              sharedStyles.saveButton,
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
                sharedStyles.saveButtonText,
                { color: theme.isDark ? "#000" : "#fff" },
              ]}
            >
              Save Macros
            </Text>
          </Pressable>
        </View>
      }
    >
      <View
        style={[
          sharedStyles.sheetContent,
          { backgroundColor: theme.background },
        ]}
      >
        {/* Header */}
        <View style={sharedStyles.header}>
          <Text style={[sharedStyles.title, { color: theme.text }]}>
            Edit Macros
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={sharedStyles.body}>
          <FieldRow
            label="Protein"
            defaultValue={String(nutrition.protein_g)}
            unit="g"
            keyboardType="decimal-pad"
            inputRef={proteinRef}
            onChangeText={(v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) draft.current = { ...draft.current, protein_g: n };
            }}
            theme={theme}
          />
          <View
            style={[
              sharedStyles.divider,
              { backgroundColor: theme.isDark ? "#1f3d29" : "#f3f4f6" },
            ]}
          />
          <FieldRow
            label="Carbs"
            defaultValue={String(nutrition.carbs_g)}
            unit="g"
            keyboardType="decimal-pad"
            onChangeText={(v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) draft.current = { ...draft.current, carbs_g: n };
            }}
            theme={theme}
          />
          <View
            style={[
              sharedStyles.divider,
              { backgroundColor: theme.isDark ? "#1f3d29" : "#f3f4f6" },
            ]}
          />
          <FieldRow
            label="Fats"
            defaultValue={String(nutrition.fats_g)}
            unit="g"
            keyboardType="decimal-pad"
            onChangeText={(v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) draft.current = { ...draft.current, fats_g: n };
            }}
            theme={theme}
          />
        </View>
      </View>
    </TrueSheet>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const sharedStyles = StyleSheet.create({
  sheetContent: {
    // TrueSheet manages its own container; this wraps the header + body
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "bold",
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 96, // clear the FooterComponent (~80px tall) + breathing room
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  fieldLabel: {
    flex: 1,
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
    minWidth: 110,
  },
  input: {
    fontSize: 16,
    fontFamily: "semibold",
    textAlign: "right",
    flex: 1,
    minWidth: 52,
  },
  unitText: {
    fontSize: 13,
    fontFamily: "medium",
  },
  divider: {
    height: 1,
    marginLeft: 0,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderCurve: "continuous",
    paddingVertical: 16,
    boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "bold",
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: "medium",
    color: "#ef4444",
  },
});
