import { ICON_FAMILY_MAP, resolveIcon } from "@/constants/ingredientIcons";
import { Ingredient } from "@/utils/api";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface IngredientCardProps {
  ingredient: Ingredient;
  theme: any;
  onEdit?: (ingredient: Ingredient) => void;
}

const IngredientIcon = ({
  iconKey,
  color,
}: {
  iconKey: string | undefined;
  color: string;
}) => {
  const entry = resolveIcon(iconKey);
  const IconComponent = ICON_FAMILY_MAP[entry.family] as any;
  return <IconComponent name={entry.name} size={22} color={color} />;
};

export const IngredientCard = ({ ingredient, theme, onEdit }: IngredientCardProps) => (
  <View
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
      <IngredientIcon iconKey={ingredient.icon_key} color={theme.tint} />
    </View>
    <View style={styles.ingredientInfo}>
      <Text style={[styles.ingredientName, { color: theme.text }]}>
        {ingredient.name}
      </Text>
      <Text style={[styles.ingredientMeta, { color: theme.textMuted }]}>
        ~{ingredient.weight_g}g
      </Text>
    </View>
    <View style={styles.ingredientCalories}>
      <Text style={[styles.ingredientCalValue, { color: theme.text }]}>
        ~{ingredient.calories_kcal}
      </Text>
      <Text style={[styles.ingredientCalLabel, { color: theme.textMuted }]}>
        kcal
      </Text>
    </View>
    {onEdit ? (
      <TouchableOpacity
        onPress={() => onEdit(ingredient)}
        hitSlop={12}
        style={styles.editButton}
      >
        <MaterialIcons name="edit" size={16} color={theme.textMuted} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  ingredientCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  ingredientIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
  editButton: {
    padding: 4,
    marginLeft: 4,
  },
});
