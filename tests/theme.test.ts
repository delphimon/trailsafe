import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { LightColors, DarkColors } from "../src/components/trailsafe/theme";

/**
 * Calculates W3C WCAG 2.1 relative luminance for an sRGB hex color.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return (
    0.2126 * toLinear(r) +
    0.7152 * toLinear(g) +
    0.0722 * toLinear(b)
  );
}

/**
 * Calculates WCAG contrast ratio between two hex colors.
 * (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

void describe("Theme Colors & Token Parity", () => {
  void test("has matching tokens in LightColors and DarkColors", () => {
    const lightKeys = Object.keys(LightColors).sort();
    const darkKeys = Object.keys(DarkColors).sort();
    assert.deepEqual(darkKeys, lightKeys);
  });

  void test("ensures literal white is pure white in both palettes", () => {
    assert.equal(LightColors.white, "#FFFFFF");
    assert.equal(DarkColors.white, "#FFFFFF");
  });
});

void describe("WCAG Contrast Standards - Light Mode", () => {
  const C = LightColors;

  void test("meets WCAG AA for body and note text on paper and card", () => {
    assert.ok(getContrastRatio(C.ink, C.paper) >= 4.5);
    assert.ok(getContrastRatio(C.ink, C.cardBg) >= 4.5);
    assert.ok(getContrastRatio(C.muted, C.paper) >= 4.5);
    assert.ok(getContrastRatio(C.muted, C.cardBg) >= 4.5);
  });

  void test("meets WCAG AA for headings and kickers", () => {
    assert.ok(getContrastRatio(C.heading, C.paper) >= 4.5);
    assert.ok(getContrastRatio(C.heading, C.cardBg) >= 4.5);
    assert.ok(getContrastRatio(C.kicker, C.paper) >= 4.5);
    assert.ok(getContrastRatio(C.kicker, C.cardBg) >= 4.5);
  });

  void test("meets WCAG AA for screen header title and subtitle", () => {
    assert.ok(getContrastRatio(C.headerText, C.headerBg) >= 4.5);
    assert.ok(getContrastRatio(C.headerSub, C.headerBg) >= 4.5);
  });

  void test("meets WCAG AA for buttons (primary, orange, outline)", () => {
    assert.ok(getContrastRatio(C.btnPrimaryText, C.btnPrimaryBg) >= 4.5);
    assert.ok(getContrastRatio(C.white, C.orange) >= 3.0); // Large/bold button
    assert.ok(getContrastRatio(C.btnOutlineText, C.btnOutlineBg) >= 4.5);
  });

  void test("meets WCAG AA for chips and toasts", () => {
    assert.ok(getContrastRatio(C.chipText, C.chipBg) >= 4.5);
    assert.ok(getContrastRatio(C.chipSelectedText, C.chipSelectedBg) >= 4.5);
    assert.ok(getContrastRatio(C.toastText, C.toastBg) >= 4.5);
  });

  void test("meets WCAG AA for callouts", () => {
    assert.ok(getContrastRatio(C.calloutTitle, C.amber) >= 4.5);
    assert.ok(getContrastRatio(C.criticalText, C.criticalBg) >= 4.5);
  });
});

void describe("WCAG Contrast Standards - Dark Mode", () => {
  const C = DarkColors;

  void test("meets WCAG AA for body and note text on dark paper and card", () => {
    assert.ok(getContrastRatio(C.ink, C.paper) >= 4.5);
    assert.ok(getContrastRatio(C.ink, C.cardBg) >= 4.5);
    assert.ok(getContrastRatio(C.muted, C.paper) >= 4.5);
    assert.ok(getContrastRatio(C.muted, C.cardBg) >= 4.5);
  });

  void test("meets WCAG AA for headings and kickers in dark mode", () => {
    assert.ok(getContrastRatio(C.heading, C.paper) >= 4.5);
    assert.ok(getContrastRatio(C.heading, C.cardBg) >= 4.5);
    assert.ok(getContrastRatio(C.kicker, C.paper) >= 4.5);
    assert.ok(getContrastRatio(C.kicker, C.cardBg) >= 4.5);
  });

  void test("meets WCAG AA for screen header title and subtitle in dark mode", () => {
    assert.ok(getContrastRatio(C.headerText, C.headerBg) >= 4.5);
    assert.ok(getContrastRatio(C.headerSub, C.headerBg) >= 4.5);
  });

  void test("meets WCAG AA for buttons in dark mode", () => {
    assert.ok(getContrastRatio(C.btnPrimaryText, C.btnPrimaryBg) >= 4.5);
    assert.ok(getContrastRatio(C.white, C.orange) >= 3.0); // Bold button CTA
    assert.ok(getContrastRatio(C.btnOutlineText, C.btnOutlineBg) >= 4.5);
  });

  void test("meets WCAG AA for chips and toasts in dark mode", () => {
    assert.ok(getContrastRatio(C.chipText, C.chipBg) >= 4.5);
    assert.ok(getContrastRatio(C.chipSelectedText, C.chipSelectedBg) >= 4.5);
    assert.ok(getContrastRatio(C.toastText, C.toastBg) >= 4.5);
  });

  void test("meets WCAG AA for callouts in dark mode", () => {
    assert.ok(getContrastRatio(C.calloutTitle, C.amber) >= 4.5);
    assert.ok(getContrastRatio(C.criticalText, C.criticalBg) >= 4.5);
  });

  void test("ensures checked background and cards have distinguishable contrast in dark mode", () => {
    const checkLum = getLuminance(C.checkBg);
    const cardLum = getLuminance(C.cardBg);
    assert.ok(checkLum > cardLum);
  });
});
