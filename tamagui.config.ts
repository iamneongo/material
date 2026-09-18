import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

const appThemes = {
  ...defaultConfig.themes,
  light: {
    ...defaultConfig.themes.light,
    background: "#F7F8FA",
    backgroundHover: "#EEF1F5",
    backgroundPress: "#E5E9EF",
    color: "#1A1C20",
    colorHover: "#1A1C20",
    colorPress: "#1A1C20",
    borderColor: "#DCE1E8",
    borderColorHover: "#C7CFD9",
    blue10: "#0B57D0",
    blue11: "#FFFFFF",
  },
};

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    body: { ...defaultConfig.fonts.body, family: "GoogleSansFlex_400Regular" },
    heading: { ...defaultConfig.fonts.heading, family: "GoogleSansFlex_600SemiBold" },
  },
  themes: appThemes,
});

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
