import Constants from "expo-constants";
import { Platform } from "react-native";
import { ICON_KEYS } from "@/constants/ingredientIcons";

/**
 * Dynamically determines the backend URL.
 */
const getBackendUrl = () => {
  const prod_url = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (prod_url) {
    return prod_url;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && Platform.OS !== "android") {
    const host = hostUri!.split(":")[0];
    return `http://${host}:8000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }
  return "https://z2r94701-8000.euw.devtunnels.ms";
};

export const BACKEND_URL = getBackendUrl();

export interface Ingredient {
  name: string;
  calories_kcal: number;
  weight_g: number;
  /** Key from the app's icon registry. Gemini selects the best match. */
  icon_key?: string;
}

export interface NutritionData {
  dish_name: string;
  portion_size_g: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  ingredients: Ingredient[];
  /** AI confidence in the analysis. */
  confidence?: "low" | "medium" | "high";
  /**
   * Single-word diet verdict for this meal relative to typical daily goals.
   * excellent → well-balanced, high protein, low sugar/fat
   * good      → solid choice with minor trade-offs
   * moderate  → acceptable but notable caveats (high carbs, moderate fat, etc.)
   * limit     → high calories, saturated fat, sugar, or sodium — eat sparingly
   */
  diet_verdict?: "excellent" | "good" | "moderate" | "limit";
  /** 1–2 sentence plain-text explanation of the verdict. */
  summary_note?: string;
}

export interface AnalysisResponse {
  filename: string;
  content_type: string;
  markdown: string;
  nutrition_data: NutritionData | null;
}

interface PromptContext {
  dietGoalHint?: string;
  todaysMeals?: string[];
}

const buildPrompt = (context?: PromptContext): string => {
  const iconList = ICON_KEYS.join(", ");

  let contextSection = "";
  if (context?.dietGoalHint) {
    contextSection += `User's diet goal: ${context.dietGoalHint}\n\n`;
  }
  if (context?.todaysMeals && context.todaysMeals.length > 0) {
    contextSection +=
      `Meals already eaten today: ${context.todaysMeals.join(", ")}. ` +
      "Factor this into your verdict and summary_note — mention whether this meal complements or conflicts with what was already eaten, " +
      "and suggest what the user should prioritise in later meals.\n\n";
  }

  return (
    "You are a nutrition assistant. Analyse the food in this photo and return a single JSON block delimited by ```json ... ```. " +
    "Do not include any text outside the JSON block.\n\n" +
    contextSection +
    "The JSON must contain these fields:\n" +
    "  'dish_name' (string),\n" +
    "  'portion_size_g' (number),\n" +
    "  'calories_kcal' (number),\n" +
    "  'protein_g' (number),\n" +
    "  'carbs_g' (number),\n" +
    "  'fats_g' (number),\n" +
    "  'confidence' (string) — your confidence in the analysis: 'low', 'medium', or 'high',\n" +
    "  'diet_verdict' (string) — how healthy this meal is relative to the user's goal (or a typical 2000 kcal diet if no goal is set):\n" +
    "    'excellent' = well-balanced, high protein, low saturated fat and sugar,\n" +
    "    'good'      = solid choice with minor trade-offs,\n" +
    "    'moderate'  = acceptable but with notable caveats (high carbs, moderate fat, etc.),\n" +
    "    'limit'     = high calories, saturated fat, sugar, or sodium — eat sparingly.\n" +
    "  'summary_note' (string) — exactly 1–2 plain-text sentences explaining the verdict. " +
    "Be specific and direct: mention the strongest positive and the biggest concern. No markdown, no emojis.\n" +
    "  'ingredients' (array) — each item has:\n" +
    "    'name' (string),\n" +
    "    'calories_kcal' (number),\n" +
    "    'weight_g' (number),\n" +
    "    'icon_key' (string) — best matching key from: " +
    iconList +
    ".\n" +
    "The sum of ingredient calories_kcal should approximately equal total calories_kcal. " +
    "Return valid JSON only."
  );
};

/**
 * MOCK response for testing
 */
export const MOCK_ANALYSIS_DATA: AnalysisResponse = {
  filename: "mock_image.jpg",
  content_type: "image/jpeg",
  markdown: "",
  nutrition_data: {
    dish_name: "Grilled Chicken Salad",
    portion_size_g: 350,
    calories_kcal: 450,
    protein_g: 38,
    carbs_g: 12,
    fats_g: 22,
    confidence: "high",
    diet_verdict: "excellent",
    summary_note:
      "High protein and fibre-rich greens make this an excellent choice for satiety and muscle recovery. Fat content is slightly elevated due to avocado and olive oil, but these are predominantly healthy unsaturated fats.",
    ingredients: [
      {
        name: "Chicken Breast",
        calories_kcal: 220,
        weight_g: 150,
        icon_key: "chicken",
      },
      {
        name: "Mixed Greens",
        calories_kcal: 20,
        weight_g: 60,
        icon_key: "greens",
      },
      {
        name: "Cherry Tomatoes",
        calories_kcal: 25,
        weight_g: 50,
        icon_key: "tomato",
      },
      {
        name: "Avocado",
        calories_kcal: 120,
        weight_g: 60,
        icon_key: "avocado",
      },
      {
        name: "Olive Oil",
        calories_kcal: 65,
        weight_g: 8,
        icon_key: "olive_oil",
      },
    ],
  },
};

/**
 * Uploads an image to the backend for nutrition analysis.
 * @param imageUri The local URI of the captured image.
 * @param useMock Defaults to __DEV__ — uses mock data in development, real API in production.
 * @param signal Optional AbortSignal to cancel the request.
 */
export const analyzeImage = async (
  imageUri: string,
  signal?: AbortSignal,
  useMock: boolean = __DEV__,
  context?: PromptContext,
): Promise<AnalysisResponse> => {
  if (useMock) {
    console.log(`[API] Using MOCK response for: ${imageUri}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return MOCK_ANALYSIS_DATA;
  }
  const formData = new FormData();

  // @ts-expect-error React Native FormData type issue
  formData.append("image", {
    uri: imageUri,
    name: "food.jpg",
    type: "image/jpeg",
  });

  formData.append("prompt", buildPrompt(context));

  console.log(`[API] Attempting upload to: ${BACKEND_URL}/analyze`);

  try {
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      body: formData,
      signal,
    });

    if (!response.ok) {
      console.error(`[API] Server responded with status ${response.status}`);
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Analysis successful`);
    return data;
  } catch (error) {
    console.error(`[API] Network request failed for ${BACKEND_URL}/analyze`);
    throw error;
  }
};
