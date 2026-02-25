import { ConfigContext, ExpoConfig } from "expo/config";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({
  path: [
    path.resolve(__dirname, ".env.local"),
    path.resolve(__dirname, ".env"),
  ],
});

export default ({ config }: ConfigContext): ExpoConfig => {
  const requiredEnvVars = [
    "PACKAGE_NAME",
    "EXPO_PUBLIC_BACKEND_URL",
    "PROJECT_ID_EXPO",
  ];
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  const expo_updates_url = `https://u.expo.dev/${process.env.PROJECT_ID_EXPO}`;

  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier: process.env.PACKAGE_NAME,
    },
    android: {
      ...config.android,
      package: process.env.PACKAGE_NAME,
    },
    extra: {
      ...config.extra,
      eas: {
        projectId: process.env.PROJECT_ID_EXPO,
      },
    },
    updates: {
      ...config.updates,
      url: expo_updates_url,
    },
  } as ExpoConfig;
};
