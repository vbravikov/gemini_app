import { useCallback, useEffect, useState } from "react";
import { storage } from "./useMealLogs";
import { DEFAULT_DAILY_GOALS } from "@/constants/nutrition";
import type { DietGoal } from "./useDietPreferences";

export interface DailyGoals {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

/**
 * Sensible macro presets per diet goal.
 * These are reasonable population-level starting points — not medical advice.
 */
export const DIET_GOAL_PRESETS: Record<DietGoal, DailyGoals> = {
  lose_weight: {
    calories_kcal: 1600,
    protein_g: 130,
    carbs_g: 160,
    fats_g: 55,
  },
  build_muscle: {
    calories_kcal: 2500,
    protein_g: 180,
    carbs_g: 280,
    fats_g: 80,
  },
  maintain: {
    calories_kcal: 2000,
    protein_g: 140,
    carbs_g: 250,
    fats_g: 70,
  },
  eat_healthier: {
    calories_kcal: 1900,
    protein_g: 130,
    carbs_g: 230,
    fats_g: 65,
  },
  high_protein: {
    calories_kcal: 2200,
    protein_g: 200,
    carbs_g: 200,
    fats_g: 70,
  },
  low_carb: {
    calories_kcal: 1800,
    protein_g: 150,
    carbs_g: 50,
    fats_g: 110,
  },
};

const GOALS_KEY = "custom_daily_goals";
/**
 * Boolean flag stored as "1" / absent.
 * Set to "1" when the user manually edits goals in edit-goals.tsx.
 * Cleared when they reset or when a diet goal preset is applied.
 */
const GOALS_MANUAL_KEY = "custom_daily_goals_manual";

function readGoals(): DailyGoals {
  const raw = storage.getString(GOALS_KEY);
  return raw ? (JSON.parse(raw) as DailyGoals) : DEFAULT_DAILY_GOALS;
}

function readIsManual(): boolean {
  return storage.getString(GOALS_MANUAL_KEY) === "1";
}

export function useCustomDailyGoals() {
  const [goals, setGoalsState] = useState<DailyGoals>(readGoals);
  const [isManual, setIsManualState] = useState<boolean>(readIsManual);

  useEffect(() => {
    const listener = storage.addOnValueChangedListener((key) => {
      if (key === GOALS_KEY) setGoalsState(readGoals());
      if (key === GOALS_MANUAL_KEY) setIsManualState(readIsManual());
    });
    return () => listener.remove();
  }, []);

  /** Called from edit-goals.tsx — marks goals as manually overridden. */
  const setGoals = useCallback((next: DailyGoals) => {
    storage.set(GOALS_KEY, JSON.stringify(next));
    storage.set(GOALS_MANUAL_KEY, "1");
  }, []);

  /**
   * Called from edit-goals.tsx "Reset to default" and from
   * useDietPreferences when a new diet goal is selected.
   * Clears the manual flag.
   */
  const resetToDefault = useCallback(() => {
    storage.remove(GOALS_KEY);
    storage.remove(GOALS_MANUAL_KEY);
  }, []);

  /**
   * Applied automatically when the user picks a diet goal in Profile.
   * Does NOT set the manual flag — the goals reflect the preset, not a
   * hand-crafted override.
   */
  const applyPreset = useCallback((preset: DailyGoals) => {
    storage.set(GOALS_KEY, JSON.stringify(preset));
    storage.remove(GOALS_MANUAL_KEY);
  }, []);

  /**
   * true only when the user has manually edited goals (not just selected a
   * diet goal preset).
   */
  const isCustom = isManual;

  return { goals, setGoals, resetToDefault, applyPreset, isCustom };
}
