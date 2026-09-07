import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Backpack, BookOpen, House, Info, Siren } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/state/app";
import { Button, C, fonts, T } from "./ui";
export function BottomBar() {
  const path = usePathname(),
    insets = useSafeAreaInsets();
  const tabs = [
    { label: "Home", path: "/" as const, icon: House },
    { label: "Prepare", path: "/prepare" as const, icon: Backpack },
    { label: "Emergency", path: "/emergency" as const, icon: Siren },
    { label: "Guide", path: "/guide" as const, icon: BookOpen },
    { label: "About", path: "/about" as const, icon: Info },
  ];
  const active =
    path.startsWith("/plans") || path === "/profile"
      ? "/prepare"
      : path.startsWith("/article") || path === "/resources"
        ? "/guide"
        : path;
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: C.line,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: 3,
      }}
    >
      {tabs.map((tab) => {
        const selected = active === tab.path;
        const color = selected
          ? tab.path === "/emergency"
            ? C.orangeDark
            : C.green
          : C.muted;
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            aria-selected={selected}
            onPress={() => router.navigate(tab.path)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 52,
              padding: 4,
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              opacity: pressed ? 0.6 : 1,
              borderRadius: 8,
              backgroundColor: selected ? "#F0F4ED" : "transparent",
            })}
          >
            <tab.icon
              size={22}
              color={tab.path === "/emergency" ? C.orange : color}
            />
            <T
              style={{
                fontFamily: fonts.bold,
                fontSize: 10,
                lineHeight: 15,
                color,
              }}
            >
              {tab.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
export function AppOverlays() {
  const { dialog, setDialog, run, toast } = useApp();
  return (
    <>
      {!!toast && (
        <View pointerEvents="none" style={styles.toast}>
          <T
            accessibilityLiveRegion="polite"
            style={{ color: "white", fontSize: 13, textAlign: "center" }}
          >
            {toast}
          </T>
        </View>
      )}
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => setDialog(null)}
      >
        <View style={styles.scrim}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <T
              accessibilityRole="header"
              style={{
                fontFamily: fonts.display,
                fontSize: 27,
                lineHeight: 32,
                color: C.forest,
                marginBottom: 12,
              }}
            >
              {dialog?.title}
            </T>
            <T selectable style={{ marginBottom: 22 }}>
              {dialog?.message}
            </T>
            <View style={{ gap: 10 }}>
              {dialog?.onConfirm && (
                <Button
                  label={dialog.confirmLabel || "Continue"}
                  onPress={() => {
                    const action = dialog.onConfirm;
                    setDialog(null);
                    if (action) void run(async () => action());
                  }}
                />
              )}
              <Button
                label={dialog?.onConfirm ? "Cancel" : "Got it"}
                variant={dialog?.onConfirm ? "outline" : "primary"}
                onPress={() => setDialog(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
export function PracticeBanner() {
  const { practice, setPractice } = useApp();
  if (!practice) return null;
  return (
    <View
      style={{
        backgroundColor: "#C98A2C",
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <T
        style={{
          flex: 1,
          fontFamily: fonts.bold,
          fontSize: 11,
          lineHeight: 17,
          color: "#241A04",
        }}
      >
        PRACTICE MODE — DOES NOT CONTACT 911
      </T>
      <Pressable
        accessibilityRole="button"
        onPress={() => setPractice(false)}
        style={{
          minHeight: 44,
          justifyContent: "center",
          paddingHorizontal: 10,
        }}
      >
        <T style={{ fontFamily: fonts.bold, fontSize: 13 }}>Exit</T>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: C.ink,
    borderRadius: 20,
    padding: 13,
    zIndex: 20,
  },
  scrim: {
    flex: 1,
    backgroundColor: "rgba(8,20,13,.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: C.paper,
    padding: 24,
    borderRadius: 16,
    maxHeight: "90%",
    ...Platform.select({ web: { overflow: "auto" as "scroll" } }),
  },
});
