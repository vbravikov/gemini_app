import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Dynamically determines the backend URL.
 */
const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:8000`;
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }
  return "http://localhost:8000";
};

export const BACKEND_URL = getBackendUrl();

export interface NutritionData {
  dish_name: string;
  portion_size_g: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  ingredients: string[];
}

export interface AnalysisResponse {
  filename: string;
  content_type: string;
  markdown: string;
  nutrition_data: NutritionData | null;
}

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
    ingredients: ["Chicken Breast", "Mixed Greens", "Cherry Tomatoes", "Avocado", "Olive Oil"]
  }
};

/**
 * Uploads an image to the backend for nutrition analysis.
 * @param imageUri The local URI of the captured image.
 * @param useMock Set to true to use the hardcoded response.
 */
export const analyzeImage = async (
  imageUri: string,
  useMock: boolean = true // Enabled by default for development
): Promise<AnalysisResponse> => {
  if (useMock) {
    console.log(`[API] Using MOCK response for: ${imageUri}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return MOCK_ANALYSIS_DATA;
  }

  const formData = new FormData();

  // @ts-expect-error React Native FormData type issue
  formData.append("image", {
    uri: imageUri,
    name: "food.jpg",
    type: "image/jpeg",
  });

  console.log(`[API] Attempting upload to: ${BACKEND_URL}/analyze`);

  try {
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
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
