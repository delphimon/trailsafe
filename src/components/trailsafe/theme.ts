/**
 * @file theme.ts
 * @description Design tokens, color palettes, typography, and contrast standards for TrailSafe.
 *
 * Architecture Notes:
 * 1. Pure TypeScript Module: Kept free of React Native / JSX runtime imports so it can be directly
 *    imported and executed by Node.js test runners (`node:test` + `tsx`) without bundler mocks.
 * 2. WCAG Contrast Compliance: Every foreground/background pairing meets or exceeds WCAG 2.1 AA
 *    contrast standards (>= 4.5:1 for standard text, >= 3.0:1 for large/bold text). Verified by `tests/theme.test.ts`.
 * 3. Semantic Tokens: Colors are structured into semantic roles (`headerBg`, `heading`, `kicker`,
 *    `locationCardBg`, `btnPrimaryBg`, `toastBg`, etc.) to prevent naive inversion bugs when switching themes.
 */

/** Light theme palette (classic Pacific Northwest forest green & paper identity). */
export const LightColors = {
  forest: "#1B3A2E",
  deep: "#132720",
  green: "#25503F",
  stone: "#EAEDE7",
  line: "#CBD1C4",
  ink: "#171B18",
  muted: "#5C645D",
  paper: "#F6F7F3",
  orange: "#E4572E",
  orangeDark: "#B83B1A",
  amber: "#FBF1DD",
  white: "#FFFFFF",
  cardBg: "#FFFFFF",
  chipBg: "#FFFFFF",
  inputBg: "#FFFFFF",
  calloutBorder: "#EAD3A0",
  criticalBg: "#FBE7E0",
  criticalBorder: "#F0B29C",
  criticalText: "#7A2A11",
  calloutTitle: "#5C3F0C",
  checkBorder: "#84907E",
  headerText: "#FFFFFF",
  headerSub: "#CFE0D6",
  checkBg: "#F0F5EE",
  fieldLabel: "#3A413B",
  inputPlaceholder: "#758073",
  chevron: "#7E8B7D",
  // Semantic tokens
  headerBg: "#1B3A2E",
  heading: "#1B3A2E",
  kicker: "#25503F",
  chipText: "#1B3A2E",
  chipSelectedBg: "#1B3A2E",
  chipSelectedText: "#FFFFFF",
  locationCardBg: "#1B3A2E",
  locationCardBorder: "#1B3A2E",
  toastBg: "#171B18",
  toastText: "#FFFFFF",
  btnPrimaryBg: "#1B3A2E",
  btnPrimaryText: "#FFFFFF",
  btnOutlineBorder: "#1B3A2E",
  btnOutlineText: "#1B3A2E",
  btnOutlineBg: "#FFFFFF",
};

export const DarkColors = {
  forest: "#4A6B58",
  deep: "#0B120E",
  green: "#8EB49F",
  stone: "#242E28",
  line: "#2D3A32",
  ink: "#E6EBE8",
  muted: "#8C9B92",
  paper: "#151A17",
  orange: "#E4572E",
  orangeDark: "#F0734F",
  amber: "#2E2512",
  white: "#FFFFFF",
  cardBg: "#1E2621",
  chipBg: "#1E2621",
  inputBg: "#1E2621",
  calloutBorder: "#4F432A",
  criticalBg: "#471708",
  criticalBorder: "#7A2A11",
  criticalText: "#FFDED1",
  calloutTitle: "#EAD3A0",
  checkBorder: "#5C645D",
  headerText: "#FFFFFF",
  headerSub: "#CFE0D6",
  checkBg: "#28352D",
  fieldLabel: "#B4C2BB",
  inputPlaceholder: "#7D9084",
  chevron: "#8C9B92",
  // Semantic tokens
  headerBg: "#13231B",
  heading: "#E6EBE8",
  kicker: "#8EB49F",
  chipText: "#D0DDD5",
  chipSelectedBg: "#2E684E",
  chipSelectedText: "#FFFFFF",
  locationCardBg: "#162E24",
  locationCardBorder: "#284B3C",
  toastBg: "#25332B",
  toastText: "#FFFFFF",
  btnPrimaryBg: "#2E684E",
  btnPrimaryText: "#FFFFFF",
  btnOutlineBorder: "#557A66",
  btnOutlineText: "#D2E3D8",
  btnOutlineBg: "#1E2621",
};

export type ThemeColors = typeof LightColors;

export const fonts = {
  body: "PublicSans_400Regular",
  medium: "PublicSans_500Medium",
  bold: "PublicSans_700Bold",
  display: "BarlowCondensed_600SemiBold",
};
