import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

interface MealSummaryTabProps {
  markdown: string;
  theme: any;
}

export const MealSummaryTab = ({ markdown, theme }: MealSummaryTabProps) => {
  return (
    <View style={styles.tabContent}>
      {/* AI Analysis */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        AI Analysis
      </Text>
      <View
        style={[
          styles.markdownCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.isDark ? "#1f3d29" : "#e5e7eb",
          },
        ]}
      >
        <EnrichedMarkdownText markdown={markdown} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 0,
    marginBottom: 16,
  },
  markdownCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
});
