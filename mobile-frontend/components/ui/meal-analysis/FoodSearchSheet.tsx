/**
 * FoodSearchSheet.tsx
 *
 * A TrueSheet-based bottom sheet for searching and logging food without a photo.
 *
 * Sections:
 *   - Search input with barcode icon
 *   - Search results list (OFF data, with incomplete-data badge)
 *   - Portion size input
 *   - Gemini enrichment loading indicator (inline)
 *   - "View Details" button navigating to meal-info with manualNutritionJson
 *
 * Barcode scanning uses CameraView.launchScanner() (native system scanner,
 * opens in a new screen — NOT inline inside the sheet).
 */

import { useTheme } from "@/constants/theme";
import { OFFFoodItem, getFoodEmoji } from "@/utils/openFoodFacts";
import { useFoodSearch } from "@/hooks/useFoodSearch";
import { MaterialIcons } from "@expo/vector-icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ---------------------------------------------------------------------------
// Imperative API
// ---------------------------------------------------------------------------

export interface FoodSearchSheetHandle {
  present: () => void;
  dismiss: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Single result row in the search list */
const ResultRow = ({
  item,
  portionG,
  onSelect,
  theme,
}: {
  item: OFFFoodItem;
  portionG: number;
  onSelect: (item: OFFFoodItem) => void;
  theme: ReturnType<typeof useTheme>;
}) => {
  const emoji = getFoodEmoji(item.product_name);
  return (
    <TouchableOpacity
      style={[rowStyles.row, { backgroundColor: theme.card }]}
      onPress={() => {
        Haptics.selectionAsync();
        onSelect(item);
      }}
      activeOpacity={0.75}
    >
      <View style={rowStyles.emojiWrap}>
        <Text style={rowStyles.emoji}>{emoji}</Text>
      </View>
      <View style={rowStyles.info}>
        <View style={rowStyles.nameRow}>
          <Text
            style={[rowStyles.name, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.product_name}
          </Text>
          {!item.isComplete && (
            <View
              style={[
                rowStyles.incompleteBadge,
                { backgroundColor: theme.isDark ? "#2d1a00" : "#fef3c7" },
              ]}
            >
              <MaterialIcons name="warning" size={10} color="#d97706" />
              <Text style={rowStyles.incompleteText}>Incomplete</Text>
            </View>
          )}
        </View>
        {item.brands ? (
          <Text
            style={[rowStyles.brand, { color: theme.textMuted }]}
            numberOfLines={1}
          >
            {item.brands}
          </Text>
        ) : null}
        <Text style={[rowStyles.macros, { color: theme.textMuted }]}>
          {item.nutrition.calories_kcal} kcal · {item.nutrition.protein_g}g P ·{" "}
          {item.nutrition.carbs_g}g C · {item.nutrition.fats_g}g F{"  "}
          <Text style={{ opacity: 0.6 }}>per {portionG}g</Text>
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );
};

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(128,128,128,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 15,
    fontFamily: "semibold",
    flexShrink: 1,
  },
  brand: {
    fontSize: 12,
    fontFamily: "medium",
    opacity: 0.7,
  },
  macros: {
    fontSize: 12,
    fontFamily: "medium",
    marginTop: 2,
  },
  incompleteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  incompleteText: {
    fontSize: 10,
    fontFamily: "semibold",
    color: "#d97706",
  },
});

// ---------------------------------------------------------------------------
// Main sheet
// ---------------------------------------------------------------------------

const SCREEN_HEIGHT = Dimensions.get("window").height;
// Reserve space for: handle (~20) + header (~60) + search bar (~52) + portion row (~52) + bottom safe area (~40)
const SCROLL_MAX_HEIGHT = SCREEN_HEIGHT * 0.55;

export const FoodSearchSheet = forwardRef<FoodSearchSheetHandle>((_, ref) => {
  const theme = useTheme();
  const router = useRouter();
  const sheetRef = useRef<TrueSheet>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const isSheetPresented = useRef(false);

  const {
    query,
    setQuery,
    searchResults,
    searching,
    scanning,
    portionG,
    setPortionG,
    selected,
    selectItem,
    clearSelection,
    cancelAll,
    scanBarcode,
    finalNutrition,
  } = useFoodSearch();

  // Expose present/dismiss imperatively
  useImperativeHandle(ref, () => ({
    present: () => {
      isSheetPresented.current = true;
      sheetRef.current?.present();
    },
    dismiss: () => {
      isSheetPresented.current = false;
      sheetRef.current?.dismiss();
    },
  }));

  // Set up the native barcode scanner listener once on mount
  useEffect(() => {
    const sub = CameraView.onModernBarcodeScanned(async (result) => {
      console.log("Barcode scanned:", result);
      CameraView.dismissScanner();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Clear search results so the selected preview has room / isn't hidden by list
      setQuery("");

      const item = await scanBarcode(result.data);

      if (item) {
        // Ensure sheet is present after scanner dismissal
        // OS transition sometimes hides the sheet.
        setTimeout(() => {
          if (!isSheetPresented.current) {
            isSheetPresented.current = true;
            sheetRef.current?.present();
          }
        }, 300);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    });
    return () => sub.remove();
  }, [scanBarcode, setQuery]);

  const handleDismiss = useCallback(() => {
    isSheetPresented.current = false;
    cancelAll();
  }, [cancelAll]);

  const handleBarcodeTap = useCallback(async () => {
    Keyboard.dismiss();
    // Ensure camera permission before launching
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    await CameraView.launchScanner({
      barcodeTypes: [
        "ean13",
        "ean8",
        "upc_a",
        "upc_e",
        "qr",
        "code128",
        "code39",
      ],
    });
  }, [permission, requestPermission]);

  const handleViewDetails = useCallback(() => {
    if (!finalNutrition) return;
    try {
      sheetRef.current?.dismiss();
    } catch (e) {
      console.warn("Failed to dismiss sheet:", e);
    }
    router.push({
      pathname: "/meal-info",
      params: {
        manualNutritionJson: JSON.stringify(finalNutrition),
      },
    });
  }, [finalNutrition, router]);

  const portionDisplay = String(portionG);

  return (
    <TrueSheet
      ref={sheetRef}
      detents={["auto"]}
      onDidDismiss={handleDismiss}
      onDidPresent={() => {
        isSheetPresented.current = true;
      }}
      backgroundBlur={theme.isDark ? "dark" : "light"}
      backgroundColor={theme.background}
    >
      {/* TrueSheet with detents=["large"] needs a plain View child — no flex:1 */}
      <View
        style={[
          styles.container,
          { backgroundColor: theme.isDark ? "#0a1a0e" : "#f8faf8" },
        ]}
      >
        {/* ---- Header ---- */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Search Food</Text>
          <TouchableOpacity
            style={[
              styles.barcodeBtn,
              {
                backgroundColor: theme.isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              },
            ]}
            onPress={handleBarcodeTap}
          >
            <MaterialIcons
              name="qr-code-scanner"
              size={22}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* ---- Search input ---- */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.isDark
                ? "rgba(255,255,255,0.07)"
                : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <MaterialIcons
            name="search"
            size={20}
            color={theme.textMuted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="e.g. Greek yogurt, banana..."
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <MaterialIcons name="cancel" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ---- Portion size row ---- */}
        <View style={styles.portionRow}>
          <Text style={[styles.portionLabel, { color: theme.textMuted }]}>
            Portion size
          </Text>
          <View
            style={[
              styles.portionInput,
              {
                backgroundColor: theme.isDark
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <TextInput
              style={[styles.portionValue, { color: theme.text }]}
              keyboardType="number-pad"
              defaultValue={portionDisplay}
              onEndEditing={(e) => {
                const val = parseInt(e.nativeEvent.text, 10);
                if (!isNaN(val) && val > 0) setPortionG(val);
              }}
              selectTextOnFocus
            />
            <Text style={[styles.portionUnit, { color: theme.textMuted }]}>
              g
            </Text>
          </View>
        </View>

        {/* ---- Scrollable content area ---- */}
        <ScrollView
          style={[styles.scroll, { maxHeight: SCROLL_MAX_HEIGHT }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ---- Barcode / Initial fetch scanning indicator ---- */}
          {scanning && (
            <View style={styles.scanningIndicator}>
              <ActivityIndicator color={theme.tint} />
              <Text style={[styles.statusText, { color: theme.textMuted }]}>
                Identifying product...
              </Text>
            </View>
          )}

          {/* ---- Selected item preview ---- */}
          {selected && !scanning && (
            <View
              style={[
                styles.selectedPreview,
                {
                  backgroundColor: theme.isDark
                    ? "rgba(19,236,55,0.06)"
                    : "rgba(19,200,55,0.07)",
                  borderColor: theme.tint + "44",
                },
              ]}
            >
              <View style={styles.selectedHeader}>
                <Text style={styles.selectedEmoji}>
                  {getFoodEmoji(selected.offItem.product_name)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.selectedName, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {selected.offItem.product_name}
                  </Text>
                  {selected.offItem.brands ? (
                    <Text
                      style={[styles.selectedBrand, { color: theme.textMuted }]}
                    >
                      {selected.offItem.brands}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={clearSelection}>
                  <MaterialIcons
                    name="close"
                    size={20}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Macro row */}
              <View style={styles.macroRow}>
                {[
                  {
                    label: "Cal",
                    value: `${(selected.enrichedNutrition ?? selected.offItem.nutrition).calories_kcal}`,
                    color: theme.tint,
                  },
                  {
                    label: "Protein",
                    value: `${(selected.enrichedNutrition ?? selected.offItem.nutrition).protein_g}g`,
                    color: "#3b82f6",
                  },
                  {
                    label: "Carbs",
                    value: `${(selected.enrichedNutrition ?? selected.offItem.nutrition).carbs_g}g`,
                    color: "#f97316",
                  },
                  {
                    label: "Fats",
                    value: `${(selected.enrichedNutrition ?? selected.offItem.nutrition).fats_g}g`,
                    color: "#eab308",
                  },
                ].map(({ label, value, color }) => (
                  <View key={label} style={styles.macroChip}>
                    <Text style={[styles.macroValue, { color }]}>{value}</Text>
                    <Text
                      style={[styles.macroLabel, { color: theme.textMuted }]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Enrichment indicator */}
              {selected.enriching && (
                <View style={styles.enrichingRow}>
                  <ActivityIndicator
                    size="small"
                    color={theme.tint}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[styles.enrichingText, { color: theme.textMuted }]}
                  >
                    Getting AI breakdown...
                  </Text>
                </View>
              )}
              {selected.enrichedNutrition && !selected.enriching && (
                <View style={styles.enrichingRow}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={14}
                    color={theme.tint}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.enrichingText, { color: theme.tint }]}>
                    AI analysis complete
                  </Text>
                </View>
              )}

              {/* View Details CTA */}
              <TouchableOpacity
                style={[styles.viewDetailsBtn, { backgroundColor: theme.tint }]}
                onPress={handleViewDetails}
                disabled={!finalNutrition}
              >
                <MaterialIcons
                  name="open-in-new"
                  size={16}
                  color={theme.isDark ? "#000" : "#fff"}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.viewDetailsBtnText,
                    { color: theme.isDark ? "#000" : "#fff" },
                  ]}
                >
                  View Details & Add to Log
                </Text>
              </TouchableOpacity>

              {!selected.offItem.isComplete && (
                <View
                  style={[
                    styles.warningBanner,
                    {
                      backgroundColor: theme.isDark ? "#2d1a00" : "#fef3c7",
                    },
                  ]}
                >
                  <MaterialIcons name="warning" size={14} color="#d97706" />
                  <Text style={[styles.warningText, { color: "#d97706" }]}>
                    Some nutrition data is missing from the database. AI
                    analysis will fill in the gaps.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ---- Search results ---- */}
          {!selected && !scanning && (
            <>
              {searching && (
                <View style={styles.centeredRow}>
                  <ActivityIndicator color={theme.tint} />
                  <Text style={[styles.statusText, { color: theme.textMuted }]}>
                    Searching...
                  </Text>
                </View>
              )}

              {!searching &&
                query.trim().length >= 2 &&
                searchResults.length === 0 && (
                  <View style={styles.centeredRow}>
                    <MaterialIcons
                      name="search-off"
                      size={32}
                      color={theme.textMuted}
                      style={{ opacity: 0.4 }}
                    />
                    <Text
                      style={[styles.statusText, { color: theme.textMuted }]}
                    >
                      No results found
                    </Text>
                  </View>
                )}

              {!searching &&
                searchResults.map((item) => (
                  <ResultRow
                    key={item.code || item.product_name}
                    item={item}
                    portionG={portionG}
                    onSelect={selectItem}
                    theme={theme}
                  />
                ))}

              {query.trim().length < 2 && (
                <View style={styles.emptyHint}>
                  <Text
                    style={[styles.emptyHintText, { color: theme.textMuted }]}
                  >
                    Start typing to search Open Food Facts, or tap the barcode
                    icon to scan a product.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </TrueSheet>
  );
});

FoodSearchSheet.displayName = "FoodSearchSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    // No flex:1 — TrueSheet with detents=["large"] measures children naturally
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: "bold",
  },
  barcodeBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 6,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "medium",
  },
  portionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  portionLabel: {
    fontSize: 14,
    fontFamily: "medium",
  },
  portionInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    gap: 4,
  },
  portionValue: {
    fontSize: 16,
    fontFamily: "semibold",
    minWidth: 40,
    textAlign: "right",
  },
  portionUnit: {
    fontSize: 14,
    fontFamily: "medium",
  },
  scroll: {
    // maxHeight set dynamically via SCROLL_MAX_HEIGHT
  },
  scrollContent: {
    paddingBottom: 8,
  },
  selectedPreview: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  selectedEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  selectedName: {
    fontSize: 17,
    fontFamily: "bold",
    lineHeight: 22,
  },
  selectedBrand: {
    fontSize: 13,
    fontFamily: "medium",
    marginTop: 2,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  macroChip: {
    alignItems: "center",
    gap: 2,
  },
  macroValue: {
    fontSize: 16,
    fontFamily: "bold",
  },
  macroLabel: {
    fontSize: 11,
    fontFamily: "medium",
    opacity: 0.75,
  },
  enrichingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  enrichingText: {
    fontSize: 13,
    fontFamily: "medium",
  },
  viewDetailsBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
  },
  viewDetailsBtnText: {
    fontSize: 15,
    fontFamily: "bold",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "medium",
    lineHeight: 18,
  },
  centeredRow: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  scanningIndicator: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  statusText: {
    fontSize: 15,
    fontFamily: "medium",
  },
  emptyHint: {
    paddingTop: 32,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  emptyHintText: {
    fontSize: 14,
    fontFamily: "medium",
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.7,
  },
});
