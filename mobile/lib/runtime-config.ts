import Constants from "expo-constants";

const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;

export const apiBaseUrl = (
  process.env.EXPO_PUBLIC_API_URL ??
  (typeof configuredApiUrl === "string" ? configuredApiUrl : undefined)
)?.replace(/\/$/, "");
