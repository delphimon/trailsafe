/**
 * @file use-location.ts
 * @description Automatic foreground location acquisition hook with battery and privacy safeguards.
 *
 * Operational Principles:
 * 1. Automatic On-Screen Start: Location acquisition automatically initiates when the emergency screen mounts.
 *    No manual "Get Location" button is needed or expected by hikers under extreme stress.
 * 2. Foreground-Only: Watches are strictly active while the app is foregrounded and active (`AppState === 'active'`).
 *    Backgrounding the app or navigating away immediately tears down GPS hardware subscriptions to conserve battery.
 * 3. Platform Geolocation Isolation: On web, uses `navigator.geolocation` directly to bypass Expo SDK 57's
 *    known web adapter watch ID collision bug while preserving high accuracy and error reporting.
 * 4. Defensive Recovery: Automatically schedules a 30-second backoff retry when satellite visibility is temporarily
 *    lost, rather than leaving the emergency screen stuck in a permanent error state.
 */

import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import * as Location from "expo-location";
import { Fix, validCoordinates } from "@/lib/coordinates";

/** Current operational state of the location service. */
export type LocationStatus =
  | "idle"        // Location watching has not been requested
  | "locating"    // Acquiring satellite lock or querying provider
  | "located"     // Valid, fresh GPS fix received
  | "denied"      // Location permission rejected by user or system
  | "disabled"    // Device-level location services are turned off
  | "unavailable";// Provider failed, timed out (15s), or satellite signal lost

/**
 * React hook that manages automatic GPS tracking while an emergency or map surface is visible.
 *
 * @param enabled True to begin active location acquisition; false to stop and release hardware.
 * @returns Object containing the latest in-memory `fix` and current lifecycle `status`.
 */
export function useAutomaticLocation(enabled: boolean): {
  fix: Fix | null;
  status: LocationStatus;
} {
  const [fix, setFix] = useState<Fix | null>(null),
    [status, setStatus] = useState<LocationStatus>("idle");
  const [active, setActive] = useState(AppState.currentState === "active"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) =>
      setActive(s === "active"),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!enabled || !active) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let recovery: ReturnType<typeof setTimeout> | undefined;
    const unavailable = () => {
      if (cancelled) return;
      clearTimeout(recovery);
      setStatus("unavailable");
      recovery = setTimeout(() => {
        if (!cancelled) setRetry((n) => n + 1);
      }, 30000);
    };
    const receive = (position: Location.LocationObject) => {
      if (
        cancelled ||
        !validCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        ) ||
        !Number.isFinite(position.timestamp)
      )
        return;
      clearTimeout(timeout);
      clearTimeout(recovery);
      const { latitude, longitude, accuracy, altitude, altitudeAccuracy } =
        position.coords;
      setFix({
        latitude,
        longitude,
        accuracy,
        timestamp: position.timestamp,
        altitude,
        altitudeAccuracy,
        mocked: position.mocked,
      });
      setStatus("located");
    };
    async function start() {
      setStatus("locating");
      try {
        if (Platform.OS === "web") {
          if (!navigator.geolocation) {
            unavailable();
            return;
          }
          // Expo 57's web adapter replaces its subscriber ID with the browser watch ID.
          // Use the browser API here to preserve IDs, precision options, and error callbacks.
          const permission = await navigator.permissions
            ?.query({ name: "geolocation" })
            .catch(() => null);
          if (cancelled) return;
          if (permission?.state === "denied") {
            setStatus("denied");
            return;
          }
          timeout = setTimeout(unavailable, 15000);
          const watchId = navigator.geolocation.watchPosition(
            receive,
            (error) => {
              if (cancelled) return;
              if (error.code === 1) {
                clearTimeout(timeout);
                clearTimeout(recovery);
                setStatus("denied");
              } else unavailable();
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
          );
          subscription = {
            remove: () => navigator.geolocation.clearWatch(watchId),
          };
          return;
        }
        if (!(await Location.hasServicesEnabledAsync())) {
          if (!cancelled) {
            setStatus("disabled");
            recovery = setTimeout(() => {
              if (!cancelled) setRetry((n) => n + 1);
            }, 30000);
          }
          return;
        }
        let permission = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (permission.status === "undetermined")
          permission = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (permission.status !== "granted") {
          setStatus("denied");
          return;
        }
        timeout = setTimeout(unavailable, 15000);
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 0,
          },
          receive,
          unavailable,
        );
        if (cancelled) subscription.remove();
      } catch {
        unavailable();
      }
    }
    void start();
    return () => {
      cancelled = true;
      subscription?.remove();
      clearTimeout(timeout);
      clearTimeout(recovery);
    };
  }, [enabled, active, retry]);
  return { fix, status };
}
