import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useState } from "react";
import { createMMKV } from "react-native-mmkv";
import { AnalysisResponse, NutritionData } from "../utils/api";

export const storage = createMMKV({
  id: "meal-logs-storage",
});

export interface MealLog {
  id: string;
  timestamp: number;
  imageUri: string;
  nutrition: NutritionData;
  markdown: string;
}

const LOGS_KEY = "user_meal_history";
const MEAL_IMAGES_DIR = `${FileSystem.documentDirectory}meal_images/`;

// Ensure directory exists
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(MEAL_IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(MEAL_IMAGES_DIR, {
      intermediates: true,
    });
  }
};

export function useMealLogs() {
  const [logs, setLogs] = useState<MealLog[]>(() => {
    const storedLogs = storage.getString(LOGS_KEY);
    return storedLogs ? JSON.parse(storedLogs) : [];
  });

  // Sync with MMKV storage changes
  useEffect(() => {
    const listener = storage.addOnValueChangedListener((key) => {
      if (key === LOGS_KEY) {
        const storedLogs = storage.getString(LOGS_KEY);
        const parsed = storedLogs ? JSON.parse(storedLogs) : [];
        setLogs(parsed);
      }
    });
    return () => listener.remove();
  }, []);

  const addLog = useCallback(
    async (data: AnalysisResponse, tempImageUri: string) => {
      if (!data.nutrition_data) return;

      try {
        await ensureDirExists();
        const filename = `${Date.now()}.jpg`;
        const localImageUri = `${MEAL_IMAGES_DIR}${filename}`;

        // Copy image to permanent storage
        await FileSystem.copyAsync({
          from: tempImageUri,
          to: localImageUri,
        });

        const newLog: MealLog = {
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
          imageUri: localImageUri,
          nutrition: data.nutrition_data,
          markdown: data.markdown,
        };

        const currentLogs = JSON.parse(storage.getString(LOGS_KEY) || "[]");
        const updated = [newLog, ...currentLogs];
        storage.set(LOGS_KEY, JSON.stringify(updated));
        // setLogs(updated); // Optional, listener will catch it
      } catch (error) {
        console.error("Error saving meal log with image:", error);
      }
    },
    [],
  );

  const deleteLog = useCallback(async (id: string) => {
    const currentLogs: MealLog[] = JSON.parse(
      storage.getString(LOGS_KEY) || "[]",
    );
    const logToDelete = currentLogs.find((l) => l.id === id);

    if (logToDelete) {
      try {
        // Delete local image file
        const fileInfo = await FileSystem.getInfoAsync(logToDelete.imageUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(logToDelete.imageUri);
        }
      } catch (error) {
        console.error("Error deleting local image:", error);
      }
    }

    const updated = currentLogs.filter((log) => log.id !== id);
    storage.set(LOGS_KEY, JSON.stringify(updated));
  }, []);

  const getLogsForDate = useCallback(
    (date: Date) => {
      return logs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return (
          logDate.getDate() === date.getDate() &&
          logDate.getMonth() === date.getMonth() &&
          logDate.getFullYear() === date.getFullYear()
        );
      });
    },
    [logs],
  );

  const getDailyTotals = useCallback(
    (date: Date) => {
      const dayLogs = getLogsForDate(date);
      return dayLogs.reduce(
        (acc, log) => ({
          calories: acc.calories + log.nutrition.calories_kcal,
          protein: acc.protein + log.nutrition.protein_g,
          carbs: acc.carbs + log.nutrition.carbs_g,
          fats: acc.fats + log.nutrition.fats_g,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 },
      );
    },
    [getLogsForDate],
  );

  return {
    logs,
    addLog,
    deleteLog,
    getLogsForDate,
    getDailyTotals,
  };
}
