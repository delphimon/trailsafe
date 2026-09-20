/**
 * @file app.tsx
 * @description Application-level UI state, notifications, system handoffs, and emergency action orchestration.
 *
 * Responsibilities:
 * 1. Global Practice Mode: Manages the active Practice state across all tabs and screens.
 * 2. System Handoffs: Provides resilient wrappers around native clipboard (`expo-clipboard`),
 *    share sheets (`react-native` Share), and SMS composer (`expo-sms`).
 * 3. Emergency 911 Guard: Coordinates `emergency(kind, situation)` actions, ensuring that practice mode
 *    never opens native phone dialers or sends messages, while real actions prepare emergency drafts with coordinates.
 * 4. Location Coordination: Automatically activates the `useAutomaticLocation` hook when the user visits `/emergency`.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppState, Linking, Platform, Share } from "react-native";
import { usePathname } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as SMS from "expo-sms";
import { useLocation } from "@/hooks/use-location";
import { buildEmergencyDraft, performEmergencyAction } from "@/lib/emergency";
import { useStore } from "./store";

/** Generic modal alert/confirmation dialog state. */
type Dialog = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
  cancelLabel?: string;
};

/** App context interface. */
type AppValue = {
  /** True when practice mode is enabled, isolating all 911 triggers. */
  practice: boolean;
  setPractice: (v: boolean) => void;
  /** Active modal dialog, or null if no dialog is presented. */
  dialog: Dialog | null;
  setDialog: (v: Dialog | null) => void;
  /** Active temporary toast message text. */
  toast: string;
  /** Displays a transient toast notification. */
  notify: (text: string) => void;
  /** Executes an async operation with automatic error catching and dialog display. */
  run: (fn: () => Promise<unknown>) => Promise<void>;
  /** Copies text to device clipboard with user notification. */
  copy: (text: string) => Promise<void>;
  /** Opens native share sheet or falls back to clipboard on unsupported browsers. */
  share: (text: string, title?: string) => Promise<void>;
  /** Initiates an emergency call or text with practice safety interlock. */
  emergency: (kind: "call" | "text", situation?: string) => Promise<void>;
  /** Active GPS location hook state. */
  location: ReturnType<typeof useLocation>;
};

const Context = createContext<AppValue | null>(null);

/**
 * Top-level application context provider managing modal dialogs, toasts, practice mode, and handoffs.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { data } = useStore();
  const [practice, setPractice] = useState(false),
    [dialog, setDialog] = useState<Dialog | null>(null),
    [toast, setToast] = useState("");
  const location = useLocation();

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        setPractice(false);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!practice) return;
    const t = setTimeout(() => setPractice(false), 15 * 60 * 1000);
    return () => clearTimeout(t);
  }, [practice]);

  useEffect(() => {
    if (path === "/emergency") return location.requestLocation();
  }, [path, location]);
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
            confirmLabel: "Exit Practice Mode",
            onConfirm: () => setPractice(false),
            cancelLabel: "Continue Practice",
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
            undefined,
            data.profile.travelerPhone || current?.travelerPhone,
          );
          if (await SMS.isAvailableAsync()) {
            await SMS.sendSMSAsync(["911"], draft);
            notify(
              "Check Messages for replies. TrailSafe cannot verify delivery.",
            );
          } else if (Platform.OS === "web") {
            try {
              const isIOSWeb = /iPad|iPhone|iPod/.test(globalThis.navigator?.userAgent || "");
              const sep = isIOSWeb ? "&" : "?";
              await Linking.openURL(`sms:911${sep}body=${encodeURIComponent(draft)}`);
              notify("Check Messages for replies. TrailSafe cannot verify delivery.");
            } catch {
              setDialog({
                title: "Messaging unavailable here",
                message:
                  "Use a phone to call 911, or text 911 if you cannot call. Include your location and type of emergency first. A bounce-back means your text was not delivered.\n\n" +
                  draft,
              });
            }
          } else {
            setDialog({
              title: "Messaging unavailable here",
              message:
                "Use a phone to call 911, or text 911 if you cannot call. Include your location and type of emergency first. A bounce-back means your text was not delivered.\n\n" +
                draft,
            });
          }
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
