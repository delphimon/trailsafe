import React, { createContext, useContext, useState } from "react";
import { Linking, Platform, Share } from "react-native";
import { usePathname } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as SMS from "expo-sms";
import { useAutomaticLocation } from "@/hooks/use-location";
import { buildEmergencyDraft, performEmergencyAction } from "@/lib/emergency";
import { useStore } from "./store";

type Dialog = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
};
type AppValue = {
  practice: boolean;
  setPractice: (v: boolean) => void;
  dialog: Dialog | null;
  setDialog: (v: Dialog | null) => void;
  toast: string;
  notify: (text: string) => void;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  copy: (text: string) => Promise<void>;
  share: (text: string, title?: string) => Promise<void>;
  emergency: (kind: "call" | "text", situation?: string) => Promise<void>;
  location: ReturnType<typeof useAutomaticLocation>;
};
const Context = createContext<AppValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { data } = useStore();
  const [practice, setPractice] = useState(false),
    [dialog, setDialog] = useState<Dialog | null>(null),
    [toast, setToast] = useState("");
  const location = useAutomaticLocation(path === "/emergency");
  const notify = (text: string) => setToast(text);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      setDialog({
        title: "Could not finish",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  };
  const copy = async (text: string) => {
    const ok = await Clipboard.setStringAsync(text);
    if (ok === false)
      throw new Error(
        "Clipboard is unavailable. Select the text to copy it manually.",
      );
    notify("Copied to clipboard");
  };
  const share = async (text: string, title = "KCESAR TrailSafe") => {
    if (Platform.OS === "web" && !globalThis.navigator?.share) {
      await copy(text);
      notify("Sharing is unavailable here. Text copied to clipboard.");
      return;
    }
    await Share.share({ message: text, title });
    // Opening a share sheet or a composer is never evidence of delivery.
  };
  const emergency = async (
    kind: "call" | "text",
    situation = "Describe what happened",
  ) =>
    run(async () => {
      await performEmergencyAction(practice, kind, {
        simulate: (action) =>
          setDialog({
            title: "Practice Mode",
            message: `In an emergency, this would ${action === "call" ? "open your phone to call 911" : "open a text message to 911"}. Nothing was contacted. No phone or messaging app was opened.`,
          }),
        call: async () => {
          try {
            await Linking.openURL("tel:911");
          } catch {
            throw new Error(
              "Could not open the phone app. Use your phone’s emergency dialer to call 911.",
            );
          }
        },
        text: async () => {
          const current = data.plans.find((p) => p.status === "current");
          const draft = buildEmergencyDraft(
            location.fix,
            situation,
            current?.partySize,
            data.profile.phone || current?.phone,
          );
          if (await SMS.isAvailableAsync()) {
            await SMS.sendSMSAsync(["911"], draft);
            notify(
              "Check Messages for replies. TrailSafe cannot verify delivery.",
            );
          } else
            setDialog({
              title: "Messaging unavailable here",
              message:
                "Use a phone to call 911, or text 911 if you cannot call. Include your location and type of emergency first. A bounce-back means your text was not delivered.\n\n" +
                draft,
            });
        },
      });
    });
  return (
    <Context.Provider
      value={{
        practice,
        setPractice,
        dialog,
        setDialog,
        toast,
        notify,
        run,
        copy,
        share,
        emergency,
        location,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const c = useContext(Context);
  if (!c) throw new Error("App context missing");
  return c;
}
