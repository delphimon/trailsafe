import { useCallback } from "react";
import { useFocusEffect, useIsFocused, usePreventRemove } from "expo-router";
import { useApp } from "@/state/app";

/** Protect both app navigation and OS/browser back using Router's own context. */
export function useUnsavedChanges(
  dirty: boolean,
  discard: () => void,
  message: string,
) {
  const { setDialog, setNavigationGuard } = useApp();
  const focused = useIsFocused();
  const protectedChanges = dirty && focused;
  const promptLeave = useCallback(
    (leave: () => void) => {
      setDialog({
        title: "Discard unsaved changes?",
        message,
        confirmLabel: "Discard changes",
        cancelLabel: "Keep editing",
        onConfirm: () => {
          discard();
          leave();
        },
      });
    },
    [discard, message, setDialog],
  );
  const disablePrevention = usePreventRemove(protectedChanges, ({ repeat }) =>
    promptLeave(repeat),
  );
  const confirmLeave = useCallback(
    (leave: () => void) =>
      promptLeave(() => {
        disablePrevention();
        leave();
      }),
    [promptLeave, disablePrevention],
  );
  useFocusEffect(
    useCallback(() => {
      setNavigationGuard(protectedChanges ? confirmLeave : null);
      return () => setNavigationGuard(null);
    }, [protectedChanges, confirmLeave, setNavigationGuard]),
  );
  // Call only after a durable save, before replacing the editor route.
  return () => {
    disablePrevention();
  };
}
