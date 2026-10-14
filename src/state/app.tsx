/** Shared dialogs, system handoffs and foreground emergency location. */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Linking, Platform, Share } from "react-native";
import { router, usePathname } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as SMS from "expo-sms";
import { useLocation } from "@/hooks/use-location";
import { performEmergencyAction, buildEmergencyDraft } from "@/lib/emergency";
import { useStore } from "@/state/store";

/** Generic modal alert/confirmation dialog state. */
type Dialog = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
  cancelLabel?: string;
  onCancel?: () => void;
};

/** App context interface. */
type AppValue = {
  /** Active modal dialog, or null if no dialog is presented. */
  dialog: Dialog | null;
  navigate: (action: () => void) => void;
  setNavigationGuard: (guard: ((action: () => void) => void) | null) => void;
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
  /** Opens the system phone handoff or an editable emergency draft. */
  emergency: (kind: "call" | "text", situation?: string) => Promise<void>;
  sendEmergencyText: (draft: string) => Promise<void>;
  /** Active GPS location hook state. */
  location: ReturnType<typeof useLocation>;
};

const Context = createContext<AppValue | null>(null);

/**
 * Top-level application context provider managing modal dialogs, toasts, and handoffs.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [dialog, setDialog] = useState<Dialog | null>(null),
    [toast, setToast] = useState("");
  const [navigationGuard, setGuard] = useState<
    ((action: () => void) => void) | null
  >(null);
  const setNavigationGuard = React.useCallback(
    (guard: ((action: () => void) => void) | null) => setGuard(() => guard),
    [],
  );
  const navigate = (action: () => void) =>
    navigationGuard ? navigationGuard(action) : action();
  const location = useLocation();
  const { data } = useStore();

  const requestLocation = location.requestLocation;
  useEffect(() => {
    if (path === "/emergency") return requestLocation();
  }, [path, requestLocation]);
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
  const share = async (text: string, title = "TrailSafe") => {
    if (Platform.OS === "web" && !globalThis.navigator?.share) {
      await copy(text);
      notify("Sharing is unavailable here. Text copied to clipboard.");
      return;
    }
    await Share.share({ message: text, title });
    // Opening a share sheet or a composer is never evidence of delivery.
  };
  const sendEmergencyText = async (draft: string) => {
    if (await SMS.isAvailableAsync()) {
      await SMS.sendSMSAsync(["911"], draft);
    } else if (Platform.OS === "web") {
      const isIOS = /iPad|iPhone|iPod/.test(
        globalThis.navigator?.userAgent || "",
      );
      await Linking.openURL(
        `sms:911${isIOS ? "&" : "?"}body=${encodeURIComponent(draft)}`,
      );
    } else {
      throw new Error(
        "Messaging is unavailable. Use your phone to call 911, or text if you cannot call. Include the emergency location first.",
      );
    }
    notify(
      "Check Messages for replies. TrailSafe cannot verify sending or delivery.",
    );
  };
  const emergency = async (
    kind: "call" | "text",
    situation = "Describe what happened",
  ) =>
    run(async () => {
      await performEmergencyAction(kind, {
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
          if (/missing|overdue|elsewhere/i.test(situation)) {
            router.push({
              pathname: "/emergency-message",
              params: { situation, kind: "elsewhere" },
            });
          } else {
            await sendEmergencyText(
              buildEmergencyDraft(
                location.fix,
                situation,
                undefined,
                data.profile.travelerPhone,
                "here",
              ),
            );
          }
        },
      });
    });
  return (
    <Context.Provider
      value={{
        dialog,
        navigate,
        setNavigationGuard,
        setDialog,
        toast,
        notify,
        run,
        copy,
        share,
        emergency,
        sendEmergencyText,
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
