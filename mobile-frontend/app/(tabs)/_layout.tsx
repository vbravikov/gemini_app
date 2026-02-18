import {
  NativeTabs,
  VectorIcon,
  Label,
  Icon,
} from "expo-router/unstable-native-tabs";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/constants/theme";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      labelVisibilityMode="selected"
      backBehavior="history"
      backgroundColor={theme.background}
      labelStyle={{
        color: theme.text,
      }}
      indicatorColor={theme.background}
      tintColor={theme.primaryDark}
    >
      <NativeTabs.Trigger name="index">
        <Icon src={<VectorIcon family={MaterialIcons} name="home" />} />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="logs">
        <Icon src={<VectorIcon family={MaterialIcons} name="history" />} />
        <Label>Logs</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon src={<VectorIcon family={MaterialIcons} name="person" />} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
