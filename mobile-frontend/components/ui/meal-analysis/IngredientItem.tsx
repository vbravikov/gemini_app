import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface IngredientCardProps {
  ingredient: string;
  portionSizeG: number;
  ingredientsCount: number;
  theme: any;
}

export const IngredientCard = ({
  ingredient,
  portionSizeG,
  ingredientsCount,
  theme,
}: IngredientCardProps) => {
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
            backgroundColor: theme.isDark ? "rgba(19, 236, 55, 0.1)" : "#f0fdf4",
          },
        ]}
      >
        <Text style={styles.ingredientEmoji}>{emoji}</Text>
      </View>
      <View style={styles.ingredientInfo}>
        <Text style={[styles.ingredientName, { color: theme.text }]}>
          {ingredient}
        </Text>
        <Text style={[styles.ingredientMeta, { color: theme.textMuted }]}>
          ~{Math.round(portionSizeG / ingredientsCount)}g
        </Text>
      </View>
      <View style={styles.ingredientCalories}>
        <Text style={[styles.ingredientCalValue, { color: theme.text }]}>
          {mockCalories}
        </Text>
        <Text style={[styles.ingredientCalLabel, { color: theme.textMuted }]}>
          kcal
        </Text>
      </View>
    </View>
  );
};

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
});
