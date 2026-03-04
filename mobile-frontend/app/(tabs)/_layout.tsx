import { useTheme } from "@/constants/theme";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";

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
      rippleColor={"transparent"}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" sf={"house"} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="logs">
        <NativeTabs.Trigger.Icon md="list" sf={"list.bullet"} />
        <NativeTabs.Trigger.Label>Logs</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon md="person" sf={"person"} />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
