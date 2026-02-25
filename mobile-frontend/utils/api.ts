import Constants from "expo-constants";
import { Platform } from "react-native";
import { ICON_KEYS } from "@/constants/ingredientIcons";

/**
 * Dynamically determines the backend URL.
 */
const getBackendUrl = () => {
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
}

export interface AnalysisResponse {
  filename: string;
  content_type: string;
  markdown: string;
  nutrition_data: NutritionData | null;
}

const buildPrompt = () => {
  const iconList = ICON_KEYS.join(", ");
  return (
    "You are a nutrition assistant. From this photo, estimate what the food is and give an approximate nutrition breakdown.\n\n" +
    "Return two parts:\n" +
    "1. A detailed markdown summary for the user. Include a title, portion estimate, and a friendly nutritional note.\n" +
    "2. A structured JSON block delimited by ```json ... ``` containing the following fields:\n" +
    "   'dish_name' (string), 'portion_size_g' (number), 'calories_kcal' (number), 'protein_g' (number),\n" +
    "   'carbs_g' (number), 'fats_g' (number),\n" +
    "   'confidence' (string) — your overall confidence in the analysis: one of 'low', 'medium', or 'high',\n" +
    "   'ingredients': an array of objects, each with:\n" +
    "     'name' (string) — the ingredient name,\n" +
    "     'calories_kcal' (number) — estimated calories for this ingredient,\n" +
    "     'weight_g' (number) — estimated weight in grams,\n" +
    "     'icon_key' (string) — the single best matching key from this list: " +
    iconList +
    ".\n" +
    "   The sum of ingredient calories_kcal should approximately equal the total calories_kcal.\n\n" +
    "Ensure the JSON is valid and accurate based on your visual estimation."
  );
};

/**
 * MOCK response for testing
 */
export const MOCK_ANALYSIS_DATA: AnalysisResponse = {
  filename: "mock_image.jpg",
  content_type: "image/jpeg",
  markdown: `
# 🥗 Analysis: Grilled Chicken Salad

Based on the image, here is the nutritional breakdown of your meal:

### 📋 Summary
- **Dish**: Mediterranean Style Grilled Chicken Salad
- **Estimated Portion**: 350g

### 📊 Quick Facts
* **Calories**: 450 kcal
* **Protein**: 38g
* **Carbs**: 12g
* **Fats**: 22g

### 💡 Nutritional Note
This is an **excellent** high-protein meal choice. It's rich in fiber and micronutrients. The avocado provides great satiety. 
`,
  nutrition_data: {
    dish_name: "Grilled Chicken Salad",
    portion_size_g: 350,
    calories_kcal: 450,
    protein_g: 38,
    carbs_g: 12,
    fats_g: 22,
    confidence: "high",
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

  formData.append("prompt", buildPrompt());

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
