/**
 * Registry of vector icons that can be assigned to food ingredients.
 * Each entry is a tuple of [family, iconName] where family must match
 * one of the @expo/vector-icons component names.
 *
 * The keys are the values Gemini will pick from; they are also what gets
 * stored in Ingredient.icon_key and passed to the prompt.
 */

import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import type { ComponentProps } from "react";

export const ICON_FAMILY_MAP = {
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
  FontAwesome,
  Feather,
} as const;

export type IconFamily = keyof typeof ICON_FAMILY_MAP;

type IconNameFor<K extends IconFamily> = ComponentProps<
  (typeof ICON_FAMILY_MAP)[K]
>["name"];

export type IconEntry = {
  [K in IconFamily]: { family: K; name: IconNameFor<K> };
}[IconFamily];

/**
 * Map of stable key → icon entry.
 * Keys are what Gemini chooses from; they must be stable strings with no spaces.
 */
export const INGREDIENT_ICONS: Record<string, IconEntry> = {
  // ── Proteins ──────────────────────────────────────────────────────────────
  chicken: { family: "MaterialCommunityIcons", name: "food-drumstick" },
  steak: { family: "MaterialCommunityIcons", name: "food-steak" },
  turkey: { family: "MaterialCommunityIcons", name: "food-turkey" },
  fish: { family: "Ionicons", name: "fish" },
  salmon: { family: "Ionicons", name: "fish" },
  tuna: { family: "Ionicons", name: "fish" },
  shrimp: { family: "MaterialCommunityIcons", name: "food-variant" },
  egg: { family: "MaterialCommunityIcons", name: "egg" },
  egg_fried: { family: "MaterialCommunityIcons", name: "egg-fried" },
  tofu: { family: "MaterialCommunityIcons", name: "food-variant" },
  beans: { family: "MaterialCommunityIcons", name: "seed" },
  lentils: { family: "MaterialCommunityIcons", name: "seed" },
  peanuts: { family: "MaterialCommunityIcons", name: "peanut" },
  nuts: { family: "MaterialCommunityIcons", name: "nut" },
  cheese: { family: "MaterialCommunityIcons", name: "cheese" },
  milk: { family: "MaterialCommunityIcons", name: "cup" },
  yogurt: { family: "MaterialCommunityIcons", name: "cup-outline" },

  // ── Grains & Carbs ────────────────────────────────────────────────────────
  rice: { family: "MaterialCommunityIcons", name: "rice" },
  noodles: { family: "MaterialCommunityIcons", name: "noodles" },
  pasta: { family: "MaterialCommunityIcons", name: "noodles" },
  bread: { family: "MaterialCommunityIcons", name: "bread-slice" },
  toast: { family: "MaterialCommunityIcons", name: "bread-slice-outline" },
  croissant: { family: "MaterialCommunityIcons", name: "food-croissant" },
  grain: { family: "MaterialCommunityIcons", name: "grain" },
  oats: { family: "MaterialCommunityIcons", name: "grain" },
  corn: { family: "MaterialCommunityIcons", name: "corn" },
  potato: { family: "MaterialCommunityIcons", name: "food-variant" },
  sweet_potato: { family: "MaterialCommunityIcons", name: "food-variant" },
  tortilla: { family: "MaterialCommunityIcons", name: "food-variant" },

  // ── Vegetables ────────────────────────────────────────────────────────────
  carrot: { family: "MaterialCommunityIcons", name: "carrot" },
  broccoli: { family: "MaterialCommunityIcons", name: "food-variant" },
  spinach: { family: "MaterialCommunityIcons", name: "leaf" },
  lettuce: { family: "MaterialCommunityIcons", name: "leaf" },
  kale: { family: "MaterialCommunityIcons", name: "leaf" },
  herb: { family: "MaterialCommunityIcons", name: "leaf" },
  greens: { family: "Ionicons", name: "leaf" },
  salad: { family: "MaterialIcons", name: "eco" },
  mushroom: { family: "MaterialCommunityIcons", name: "mushroom" },
  onion: { family: "MaterialCommunityIcons", name: "food-variant" },
  garlic: { family: "MaterialCommunityIcons", name: "seed" },
  pepper: { family: "MaterialCommunityIcons", name: "food-variant" },
  tomato: { family: "MaterialCommunityIcons", name: "food-variant" },
  cucumber: { family: "MaterialCommunityIcons", name: "food-variant" },
  celery: { family: "MaterialCommunityIcons", name: "leaf" },
  zucchini: { family: "MaterialCommunityIcons", name: "food-variant" },
  asparagus: { family: "MaterialCommunityIcons", name: "food-variant" },
  cauliflower: { family: "MaterialCommunityIcons", name: "food-variant" },

  // ── Fruits ────────────────────────────────────────────────────────────────
  apple: { family: "MaterialCommunityIcons", name: "food-apple" },
  banana: { family: "MaterialCommunityIcons", name: "fruit-pineapple" },
  orange: { family: "MaterialCommunityIcons", name: "fruit-citrus" },
  lemon: { family: "MaterialCommunityIcons", name: "fruit-citrus" },
  lime: { family: "MaterialCommunityIcons", name: "fruit-citrus" },
  grapes: { family: "MaterialCommunityIcons", name: "fruit-grapes" },
  watermelon: { family: "MaterialCommunityIcons", name: "fruit-watermelon" },
  pineapple: { family: "MaterialCommunityIcons", name: "fruit-pineapple" },
  pear: { family: "MaterialCommunityIcons", name: "fruit-pear" },
  cherries: { family: "MaterialCommunityIcons", name: "fruit-cherries" },
  berries: { family: "MaterialCommunityIcons", name: "fruit-cherries" },
  strawberry: { family: "MaterialCommunityIcons", name: "fruit-cherries" },
  avocado: { family: "MaterialCommunityIcons", name: "food-apple-outline" },
  mango: { family: "MaterialCommunityIcons", name: "fruit-pineapple" },

  // ── Fats & Condiments ─────────────────────────────────────────────────────
  olive_oil: { family: "MaterialCommunityIcons", name: "oil" },
  oil: { family: "MaterialCommunityIcons", name: "oil" },
  butter: { family: "MaterialCommunityIcons", name: "food-variant" },
  mayo: { family: "MaterialCommunityIcons", name: "food-variant" },
  sauce: { family: "MaterialCommunityIcons", name: "bowl-mix" },
  dressing: { family: "MaterialCommunityIcons", name: "bowl-mix" },
  vinegar: { family: "MaterialCommunityIcons", name: "bottle-tonic" },
  soy_sauce: { family: "MaterialCommunityIcons", name: "bottle-soda" },
  ketchup: { family: "MaterialCommunityIcons", name: "bottle-tonic-plus" },
  mustard: { family: "MaterialCommunityIcons", name: "bottle-tonic-plus" },
  hot_sauce: { family: "MaterialCommunityIcons", name: "bottle-tonic-skull" },
  salt: { family: "MaterialIcons", name: "set-meal" },
  sugar: { family: "MaterialCommunityIcons", name: "spoon-sugar" },
  honey: { family: "MaterialCommunityIcons", name: "spoon-sugar" },

  // ── Beverages ────────────────────────────────────────────────────────────
  water: { family: "Ionicons", name: "water" },
  coffee: { family: "MaterialCommunityIcons", name: "coffee" },
  tea: { family: "MaterialCommunityIcons", name: "tea" },
  juice: { family: "MaterialCommunityIcons", name: "cup" },
  milk_drink: { family: "MaterialCommunityIcons", name: "cup-outline" },
  smoothie: { family: "MaterialCommunityIcons", name: "cup-water" },
  wine: { family: "Ionicons", name: "wine" },
  beer: { family: "Ionicons", name: "beer" },

  // ── Prepared / Mixed dishes ───────────────────────────────────────────────
  pizza: { family: "Ionicons", name: "pizza" },
  burger: { family: "MaterialCommunityIcons", name: "food-hot-dog" },
  hotdog: { family: "MaterialCommunityIcons", name: "food-hot-dog" },
  soup: { family: "MaterialCommunityIcons", name: "bowl-mix" },
  stew: { family: "MaterialCommunityIcons", name: "pot-steam" },
  curry: { family: "MaterialCommunityIcons", name: "pot-steam" },
  sushi: { family: "MaterialCommunityIcons", name: "food-variant" },
  sandwich: { family: "MaterialCommunityIcons", name: "food-variant" },
  wrap: { family: "MaterialCommunityIcons", name: "food-variant" },
  bowl: { family: "MaterialCommunityIcons", name: "bowl-outline" },
  salad_bowl: { family: "MaterialCommunityIcons", name: "bowl-mix" },
  popcorn: { family: "MaterialCommunityIcons", name: "popcorn" },
  cookie: { family: "MaterialCommunityIcons", name: "cookie" },
  cake: { family: "MaterialCommunityIcons", name: "cupcake" },
  ice_cream: { family: "Ionicons", name: "ice-cream" },

  // ── Fallback ──────────────────────────────────────────────────────────────
  generic_food: { family: "MaterialCommunityIcons", name: "food" },
  generic_drink: { family: "MaterialCommunityIcons", name: "cup-water" },
  restaurant: { family: "Ionicons", name: "restaurant" },
  nutrition: { family: "Ionicons", name: "nutrition" },
};

/** The icon keys as a plain list — injected into the prompt. */
export const ICON_KEYS = Object.keys(INGREDIENT_ICONS);

/** Resolve an icon entry from a key, falling back to generic_food. */
export function resolveIcon(key: string | undefined): IconEntry {
  if (key && INGREDIENT_ICONS[key]) return INGREDIENT_ICONS[key];
  return INGREDIENT_ICONS.generic_food;
}

/**
 * Render helper types — one per family so the component can switch on family.
 */
