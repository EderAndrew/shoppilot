import { defaultConfig } from "@tamagui/config/v5";
import { animationsReactNative } from "@tamagui/config/v5-rn";
import { createTamagui } from "tamagui";

import { tamaguiThemeExtension } from "./src/shared/design-system/themes";

// Extend the default light theme with app-prefixed semantic tokens.
// These do not shadow any existing Tamagui theme keys.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseThemes = defaultConfig.themes as any;
const themes = {
  ...baseThemes,
  light: { ...(baseThemes.light ?? {}), ...tamaguiThemeExtension },
} as typeof defaultConfig.themes;

const tamaguiConfig = createTamagui({ ...defaultConfig, themes, animations: animationsReactNative });

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default tamaguiConfig;
