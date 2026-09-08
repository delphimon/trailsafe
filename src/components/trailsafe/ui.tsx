import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextProps,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  type LucideIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "react-native";

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
};

export const DarkColors = {
  forest: "#4A6B58",
  deep: "#0B120E",
  green: "#6C8A79",
  stone: "#1E2621",
  line: "#2D3A32",
  ink: "#E6EBE8",
  muted: "#8C9B92",
  paper: "#151A17",
  orange: "#E4572E",
  orangeDark: "#F0734F",
  amber: "#2E2512",
  white: "#1E2621",
  cardBg: "#1E2621",
  chipBg: "#1E2621",
  inputBg: "#1E2621",
  calloutBorder: "#4F432A",
  criticalBg: "#471708",
  criticalBorder: "#7A2A11",
  criticalText: "#FFDED1",
  calloutTitle: "#EAD3A0",
  checkBorder: "#5C645D",
  headerText: "#E6EBE8",
  headerSub: "#8C9B92",
  checkBg: "#1E2621",
  fieldLabel: "#B4C2BB",
  inputPlaceholder: "#6B7B71",
  chevron: "#8C9B92",
};

export type ThemeColors = typeof LightColors;

export function useThemeStyles() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = isDark ? DarkColors : LightColors;
  const s = React.useMemo(() => getStyles(C), [C]);
  return { C, s, isDark };
}

export const fonts = {
  body: "PublicSans_400Regular",
  medium: "PublicSans_500Medium",
  bold: "PublicSans_700Bold",
  display: "BarlowCondensed_600SemiBold",
};
export function T({ style, ...props }: TextProps) {
  const { C, s } = useThemeStyles();
  return <Text {...props} style={[s.text, style]} />;
}
export function Heading({ children }: { children: React.ReactNode }) {
  const { C, s } = useThemeStyles();
  return (
    <T accessibilityRole="header" style={s.heading}>
      {children}
    </T>
  );
}
export function Kicker({ children }: { children: React.ReactNode }) {
  const { C, s } = useThemeStyles();
  return (
    <T accessibilityRole="header" style={s.kicker}>
      {children}
    </T>
  );
}
export function Note({ children }: { children: React.ReactNode }) {
  const { C, s } = useThemeStyles();
  return <T style={s.note}>{children}</T>;
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { C, s } = useThemeStyles();
  return <View style={[s.card, style]}>{children}</View>;
}
export function Callout({
  children,
  title,
  critical = false,
}: {
  children: React.ReactNode;
  title?: string;
  critical?: boolean;
}) {
  const { C, s } = useThemeStyles();
  return (
    <View style={[s.callout, critical && s.critical]}>
      {title && (
        <T style={[s.calloutTitle, critical && { color: C.criticalText }]}>
          {title}
        </T>
      )}
      <T
        style={{
          color: critical ? C.criticalText : C.calloutTitle,
          fontSize: 14,
          lineHeight: 22,
        }}
      >
        {children}
      </T>
    </View>
  );
}
export function Button({
  label,
  onPress,
  icon: Icon,
  variant = "primary",
  disabled = false,
  small = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "orange" | "outline" | "light" | "ghost";
  disabled?: boolean;
  small?: boolean;
  testID?: string;
}) {
  const { C, s } = useThemeStyles();
  const color =
    variant === "light"
      ? C.white
      : variant === "outline" || variant === "ghost"
        ? C.forest
        : C.white;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        variant === "orange" && { backgroundColor: C.orange },
        (variant === "outline" || variant === "ghost") && {
          backgroundColor: variant === "ghost" ? "transparent" : C.white,
          borderColor: variant === "ghost" ? C.line : C.forest,
        },
        variant === "light" && {
          backgroundColor: "transparent",
          borderColor: "#789987",
        },
        small && { paddingHorizontal: 10, paddingVertical: 10 },
        (pressed || disabled) && { opacity: disabled ? 0.45 : 0.75 },
      ]}
    >
      {Icon && <Icon size={small ? 18 : 21} color={color} />}
      <T
        style={{
          color,
          fontFamily: fonts.bold,
          fontSize: small ? 13 : 16,
          textAlign: "center",
          flexShrink: 1,
        }}
      >
        {label}
      </T>
    </Pressable>
  );
}
export function Row({
  title,
  subtitle,
  icon: Icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onPress: () => void;
}) {
  const { C, s } = useThemeStyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}
    >
      <View style={s.iconBox}>
        <Icon size={20} color={C.green} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <T style={{ fontFamily: fonts.bold, fontSize: 15 }}>{title}</T>
        {subtitle && <T style={s.note}>{subtitle}</T>}
      </View>
      <ChevronRight size={18} color={C.chevron} />
    </Pressable>
  );
}
export function Checkbox({
  label,
  description,
  checked,
  onPress,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onPress: () => void;
}) {
  const { C, s } = useThemeStyles();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={onPress}
      style={[s.checkRow, checked && { backgroundColor: C.checkBg }]}
    >
      <View
        style={[
          s.check,
          checked && { backgroundColor: C.forest, borderColor: C.forest },
        ]}
      >
        {checked && <Check size={16} color={C.headerText} />}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <T style={{ fontFamily: fonts.bold, fontSize: 14 }}>{label}</T>
        {description && <T style={s.note}>{description}</T>}
      </View>
    </Pressable>
  );
}
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { C, s } = useThemeStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      aria-selected={selected}
      onPress={onPress}
      style={[
        s.chip,
        selected && { backgroundColor: C.forest, borderColor: C.forest },
      ]}
    >
      <T
        style={{
          fontFamily: fonts.bold,
          fontSize: 13,
          color: selected ? "white" : C.forest,
        }}
      >
        {label}
      </T>
    </Pressable>
  );
}
export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  const { C, s } = useThemeStyles();
  return (
    <View style={{ gap: 6, marginBottom: 15 }}>
      <T style={{ fontFamily: fonts.bold, fontSize: 13, color: C.fieldLabel }}>
        {label}
      </T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={C.inputPlaceholder}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
          props.style,
        ]}
      />
      {hint && <Note>{hint}</Note>}
    </View>
  );
}
export function Screen({
  title,
  subtitle,
  back = false,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  children: React.ReactNode;
}) {
  const { C, s } = useThemeStyles();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={[s.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              minHeight: 44,
              alignSelf: "flex-start",
            }}
          >
            <ArrowLeft size={18} color={C.headerText} />
            <T style={{ color: C.headerText, fontFamily: fonts.bold, fontSize: 14 }}>
              Back
            </T>
          </Pressable>
        )}
        <T accessibilityRole="header" style={s.headerTitle}>
          {title}
        </T>
        {subtitle && <T style={s.headerSub}>{subtitle}</T>}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function FooterNote() {
  const { C, s } = useThemeStyles();
  return (
    <T style={s.footer}>
      King County Explorer Search & Rescue{"\n"}This app is not monitored.
      Emergencies: call 911.
    </T>
  );
}
export const getStyles = (C: ThemeColors) => StyleSheet.create({
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: C.ink },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    color: C.forest,
    marginBottom: 7,
  },
  kicker: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 23,
    color: C.green,
    marginTop: 22,
    marginBottom: 10,
  },
  note: { fontSize: 12.5, lineHeight: 19, color: C.muted },
  card: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  callout: {
    backgroundColor: C.amber,
    borderWidth: 1,
    borderColor: C.calloutBorder,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  critical: { backgroundColor: C.criticalBg, borderColor: C.criticalBorder },
  calloutTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: C.calloutTitle,
    marginBottom: 4,
  },
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 10,
    padding: 15,
    backgroundColor: C.forest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    minHeight: 64,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: C.stone,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    minHeight: 52,
  },
  check: {
    width: 23,
    height: 23,
    borderWidth: 1.5,
    borderColor: C.checkBorder,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  chip: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.cardBg,
    justifyContent: "center",
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: C.ink,
    padding: 13,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 6,
    backgroundColor: C.cardBg,
  },
  header: {
    backgroundColor: C.forest,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 29,
    lineHeight: 35,
    color: C.headerText,
  },
  headerSub: { fontSize: 13, lineHeight: 20, color: C.headerSub, marginTop: 2 },
  content: { padding: 20, paddingBottom: 32 },
  footer: {
    textAlign: "center",
    fontSize: 11.5,
    lineHeight: 19,
    color: C.muted,
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  flexRow: { flexDirection: "row", gap: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
