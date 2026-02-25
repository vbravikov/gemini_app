import { NutritionData } from "./api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OFFFoodItem {
  /** Open Food Facts product code */
  code: string;
  product_name: string;
  brands?: string;
  /** Whether all macro fields are present */
  isComplete: boolean;
  nutrition: NutritionData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives the per-portion nutriment values from an OFF product object.
 * OFF stores values per 100g. We scale to the requested portion.
 */
function mapOFFToNutrition(product: any, portionG: number): NutritionData {
  const n = product.nutriments ?? {};

  const per100 = {
    calories: n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0,
    protein: n["proteins_100g"] ?? n["proteins"] ?? 0,
    carbs: n["carbohydrates_100g"] ?? n["carbohydrates"] ?? 0,
    fats: n["fat_100g"] ?? n["fat"] ?? 0,
  };

  const scale = portionG / 100;

  const dishName =
    (product.product_name_en || product.product_name || "Unknown food").trim();

  const isComplete =
    per100.calories > 0 &&
    (per100.protein > 0 || per100.carbs > 0 || per100.fats > 0);

  return {
    dish_name: dishName,
    portion_size_g: portionG,
    calories_kcal: Math.round(per100.calories * scale),
    protein_g: Math.round(per100.protein * scale * 10) / 10,
    carbs_g: Math.round(per100.carbs * scale * 10) / 10,
    fats_g: Math.round(per100.fats * scale * 10) / 10,
    ingredients: [],
    // Low confidence when data is incomplete — triggers warning badge in UI
    confidence: isComplete ? "medium" : "low",
  };
}

/** Returns true when the product has enough data to be usable. */
function hasMinimalData(product: any): boolean {
  const n = product.nutriments ?? {};
  const name = product.product_name_en || product.product_name;
  if (!name || name.trim() === "") return false;
  // Must have at least energy info
  return (
    (n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0) > 0
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search Open Food Facts by food name.
 * Returns up to 10 results, sorted by completeness (complete data first).
 */
export async function searchFoodByName(
  query: string,
  portionG: number = 100,
  signal?: AbortSignal,
): Promise<OFFFoodItem[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,product_name_en,brands,nutriments`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OFF search failed: ${res.status}`);

  const data = await res.json();
  const products: any[] = data.products ?? [];

  const mapped: OFFFoodItem[] = products
    .filter(hasMinimalData)
    .slice(0, 20)
    .map((p) => {
      const nutrition = mapOFFToNutrition(p, portionG);
      const n = p.nutriments ?? {};
      const isComplete =
        (n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0) > 0 &&
        (n["proteins_100g"] ?? n["proteins"] ?? 0) > 0 &&
        (n["carbohydrates_100g"] ?? n["carbohydrates"] ?? 0) > 0 &&
        (n["fat_100g"] ?? n["fat"] ?? 0) > 0;
      return {
        code: p.code ?? "",
        product_name:
          (p.product_name_en || p.product_name || "Unknown").trim(),
        brands: p.brands ?? undefined,
        isComplete,
        nutrition,
      };
    });

  // Complete results first
  mapped.sort((a, b) => (b.isComplete ? 1 : 0) - (a.isComplete ? 1 : 0));

  return mapped.slice(0, 10);
}

/**
 * Look up a product by barcode (EAN/UPC).
 * Returns null if not found.
 */
export async function getFoodByBarcode(
  barcode: string,
  portionG: number = 100,
  signal?: AbortSignal,
): Promise<OFFFoodItem | null> {
  const url =
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json` +
    `?fields=code,product_name,product_name_en,brands,nutriments`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OFF barcode lookup failed: ${res.status}`);

  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  if (!hasMinimalData(p)) return null;

  const nutrition = mapOFFToNutrition(p, portionG);
  const n = p.nutriments ?? {};
  const isComplete =
    (n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0) > 0 &&
    (n["proteins_100g"] ?? n["proteins"] ?? 0) > 0 &&
    (n["carbohydrates_100g"] ?? n["carbohydrates"] ?? 0) > 0 &&
    (n["fat_100g"] ?? n["fat"] ?? 0) > 0;

  return {
    code: p.code ?? barcode,
    product_name: (p.product_name_en || p.product_name || "Unknown").trim(),
    brands: p.brands ?? undefined,
    isComplete,
    nutrition,
  };
}

// ---------------------------------------------------------------------------
// Food emoji helper
// ---------------------------------------------------------------------------

const EMOJI_MAP: [RegExp, string][] = [
  [/pizza/i, "🍕"],
  [/burger|hamburger/i, "🍔"],
  [/sushi|roll|maki/i, "🍣"],
  [/salad/i, "🥗"],
  [/chicken/i, "🍗"],
  [/steak|beef|meat/i, "🥩"],
  [/fish|salmon|tuna|cod|tilapia/i, "🐟"],
  [/shrimp|prawn/i, "🍤"],
  [/pasta|spaghetti|noodle/i, "🍝"],
  [/rice/i, "🍚"],
  [/sandwich|wrap|sub/i, "🥪"],
  [/taco/i, "🌮"],
  [/burrito/i, "🌯"],
  [/soup|stew|broth/i, "🍲"],
  [/egg/i, "🍳"],
  [/bread|toast/i, "🍞"],
  [/cake|cupcake/i, "🎂"],
  [/cookie|biscuit/i, "🍪"],
  [/donut|doughnut/i, "🍩"],
  [/ice.?cream/i, "🍦"],
  [/chocolate/i, "🍫"],
  [/apple/i, "🍎"],
  [/banana/i, "🍌"],
  [/orange/i, "🍊"],
  [/strawberry/i, "🍓"],
  [/grape/i, "🍇"],
  [/watermelon/i, "🍉"],
  [/fruit/i, "🍑"],
  [/vegetable|veggie/i, "🥦"],
  [/carrot/i, "🥕"],
  [/corn/i, "🌽"],
  [/potato|fries|chips/i, "🍟"],
  [/cheese/i, "🧀"],
  [/milk|yogurt|dairy/i, "🥛"],
  [/coffee|espresso|latte/i, "☕"],
  [/tea/i, "🍵"],
  [/juice/i, "🧃"],
  [/smoothie/i, "🥤"],
  [/beer/i, "🍺"],
  [/wine/i, "🍷"],
  [/cereal|oat|granola/i, "🥣"],
  [/pancake|waffle/i, "🥞"],
  [/hot.?dog|sausage/i, "🌭"],
  [/popcorn/i, "🍿"],
  [/nut|almond|peanut|cashew/i, "🥜"],
  [/avocado/i, "🥑"],
  [/mushroom/i, "🍄"],
  [/tomato/i, "🍅"],
];

/**
 * Returns a food emoji based on the dish name, falling back to 🍽️.
 */
export function getFoodEmoji(dishName: string): string {
  for (const [pattern, emoji] of EMOJI_MAP) {
    if (pattern.test(dishName)) return emoji;
  }
  return "🍽️";
}
