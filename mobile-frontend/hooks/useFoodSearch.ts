import { useCallback, useEffect, useRef, useState } from "react";
import { NutritionData, AnalysisResponse, analyzeTextFood } from "@/utils/api";
import {
  OFFFoodItem,
  searchFoodByName,
  getFoodByBarcode,
} from "@/utils/openFoodFacts";
import { useDietPreferences } from "@/hooks/useDietPreferences";
import { useMealLogs } from "@/hooks/useMealLogs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FoodSearchResult {
  /** Open Food Facts data (shown immediately on selection) */
  offItem: OFFFoodItem;
  /** Gemini-enriched nutrition (replaces OFF data when ready) */
  enrichedNutrition: NutritionData | null;
  /** True while Gemini enrichment is in flight */
  enriching: boolean;
}

export interface UseFoodSearchReturn {
  /** Current text query */
  query: string;
  setQuery: (q: string) => void;
  /** OFF search results for the current query */
  searchResults: OFFFoodItem[];
  /** True while OFF search is loading */
  searching: boolean;
  /** Portion size in grams (user-editable) */
  portionG: number;
  setPortionG: (g: number) => void;
  /** Currently selected result (with optional Gemini enrichment) */
  selected: FoodSearchResult | null;
  /** Select an item from search results and kick off Gemini enrichment */
  selectItem: (item: OFFFoodItem) => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Scan a barcode — returns the matched item or null */
  scanBarcode: (barcode: string) => Promise<OFFFoodItem | null>;
  /** The final NutritionData to log: enriched if ready, else OFF data */
  finalNutrition: NutritionData | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 350;

export function useFoodSearch(): UseFoodSearchReturn {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OFFFoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [portionG, setPortionG] = useState(100);
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);

  const { goalConfig } = useDietPreferences();
  const { getLogsForDate } = useMealLogs();

  // Abort controllers
  const searchAbortRef = useRef<AbortController | null>(null);
  const enrichAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Search ----
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    // Debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Cancel previous search
      searchAbortRef.current?.abort();
      searchAbortRef.current = new AbortController();

      setSearching(true);
      try {
        const results = await searchFoodByName(
          trimmed,
          portionG,
          searchAbortRef.current.signal,
        );
        setSearchResults(results);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[FoodSearch] Search failed:", err);
        }
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, portionG]);

  // ---- Select + enrich ----
  const selectItem = useCallback(
    (item: OFFFoodItem) => {
      // Cancel any in-flight enrichment
      enrichAbortRef.current?.abort();
      enrichAbortRef.current = new AbortController();

      // Set OFF result immediately
      setSelected({
        offItem: item,
        enrichedNutrition: null,
        enriching: true,
      });

      // Kick off Gemini enrichment in background
      const signal = enrichAbortRef.current.signal;
      const todaysMeals = getLogsForDate(new Date()).map(
        (l) => l.nutrition.dish_name,
      );
      const context = {
        dietGoalHint: goalConfig?.promptHint,
        todaysMeals,
      };

      analyzeTextFood(item.nutrition.dish_name, portionG, signal, context)
        .then((response: AnalysisResponse) => {
          if (response.nutrition_data) {
            setSelected((prev) =>
              prev
                ? {
                    ...prev,
                    enrichedNutrition: response.nutrition_data,
                    enriching: false,
                  }
                : null,
            );
          } else {
            setSelected((prev) =>
              prev ? { ...prev, enriching: false } : null,
            );
          }
        })
        .catch((err: any) => {
          if (err?.name !== "AbortError") {
            console.warn("[FoodSearch] Gemini enrichment failed:", err);
          }
          setSelected((prev) =>
            prev ? { ...prev, enriching: false } : null,
          );
        });
    },
    [portionG, goalConfig, getLogsForDate],
  );

  const clearSelection = useCallback(() => {
    enrichAbortRef.current?.abort();
    setSelected(null);
  }, []);

  // ---- Barcode ----
  const scanBarcode = useCallback(
    async (barcode: string): Promise<OFFFoodItem | null> => {
      try {
        const item = await getFoodByBarcode(barcode, portionG);
        if (item) selectItem(item);
        return item;
      } catch (err) {
        console.error("[FoodSearch] Barcode lookup failed:", err);
        return null;
      }
    },
    [portionG, selectItem],
  );

  // ---- Derived final nutrition ----
  const finalNutrition: NutritionData | null = selected
    ? selected.enrichedNutrition ?? selected.offItem.nutrition
    : null;

  return {
    query,
    setQuery,
    searchResults,
    searching,
    portionG,
    setPortionG,
    selected,
    selectItem,
    clearSelection,
    scanBarcode,
    finalNutrition,
  };
}
