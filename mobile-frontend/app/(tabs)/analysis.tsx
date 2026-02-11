import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/constants/theme';

export default function AnalysisScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: theme.text }}>Analysis Screen</Text>
    </View>
  );
}
