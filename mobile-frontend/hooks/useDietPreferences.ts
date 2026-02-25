import { useCallback, useEffect, useState } from "react";
import { storage } from "./useMealLogs"; // reuse the same MMKV instance

export type DietGoal =
  | "lose_weight"
  | "build_muscle"
  | "maintain"
  | "eat_healthier"
  | "high_protein"
  | "low_carb";

export interface DietGoalConfig {
  key: DietGoal;
  label: string;
  description: string;
  icon: string; // MaterialIcons glyph name
  /** Plain-English string passed to the AI prompt */
  promptHint: string;
}

export const DIET_GOAL_OPTIONS: DietGoalConfig[] = [
  {
    key: "lose_weight",
    label: "Lose Weight",
    description: "Calorie deficit, lower fat & sugar",
    icon: "trending-down",
    promptHint:
      "The user's goal is weight loss. Prioritise meals that are low in calories and saturated fat. Flag meals that are calorie-dense or high in sugar.",
  },
  {
    key: "build_muscle",
    label: "Build Muscle",
    description: "High protein, adequate calories",
    icon: "fitness-center",
    promptHint:
      "The user's goal is building muscle. Prioritise high-protein meals. Flag meals that are low in protein or lack sufficient calories for muscle growth.",
  },
  {
    key: "maintain",
    label: "Maintain Weight",
    description: "Balanced macros, steady calories",
    icon: "balance",
    promptHint:
      "The user's goal is weight maintenance. Assess whether the meal fits a balanced 2000 kcal daily intake without significant excess or deficit.",
  },
  {
    key: "eat_healthier",
    label: "Eat Healthier",
    description: "Whole foods, lower processed intake",
    icon: "eco",
    promptHint:
      "The user's goal is to eat healthier overall. Highlight meals rich in whole foods, vegetables, and fibre. Flag highly processed ingredients, excessive sodium, or added sugars.",
  },
  {
    key: "high_protein",
    label: "High Protein",
    description: "Maximum protein per meal",
    icon: "egg",
    promptHint:
      "The user follows a high-protein diet. Evaluate the meal primarily by its protein content. Meals with less than 25g protein should be noted as falling short.",
  },
  {
    key: "low_carb",
    label: "Low Carb",
    description: "Minimal carbohydrates, higher fat",
    icon: "no-meals",
    promptHint:
      "The user follows a low-carb diet. Flag meals with more than 30g of carbohydrates as not aligned with their goal. Prefer meals high in fat and protein.",
  },
];

const PREF_KEY = "diet_preferences";

interface StoredPrefs {
  dietGoal: DietGoal | null;
}

const defaultPrefs: StoredPrefs = { dietGoal: null };

function readPrefs(): StoredPrefs {
  const raw = storage.getString(PREF_KEY);
  return raw ? JSON.parse(raw) : defaultPrefs;
}

export function useDietPreferences() {
  const [prefs, setPrefs] = useState<StoredPrefs>(readPrefs);

  useEffect(() => {
    const listener = storage.addOnValueChangedListener((key) => {
      if (key === PREF_KEY) setPrefs(readPrefs());
    });
    return () => listener.remove();
  }, []);

  const setDietGoal = useCallback((goal: DietGoal | null) => {
    const next: StoredPrefs = { ...readPrefs(), dietGoal: goal };
    storage.set(PREF_KEY, JSON.stringify(next));
  }, []);

  const goalConfig = DIET_GOAL_OPTIONS.find((o) => o.key === prefs.dietGoal) ?? null;

  return {
    dietGoal: prefs.dietGoal,
    goalConfig,
    setDietGoal,
  };
}
