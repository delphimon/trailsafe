import { useEffect, useState } from "react";
import { Linking, Modal, Platform, Pressable, View } from "react-native";
import {
  Check,
  Copy,
  LocateFixed,
  MapPin,
  Share2,
  Settings,
} from "lucide-react-native";
import { useApp } from "@/state/app";
import { useStore } from "@/state/store";
import {
  FORMATS,
  fixAge,
  fixWarnings,
  formatCoordinates,
  locationText,
} from "@/lib/coordinates";
import { Button, useThemeStyles, fonts, T } from "./ui";
export function LocationCard() {
  const { C, s } = useThemeStyles();
  const { location, run, copy, share } = useApp(),
    { data, update } = useStore();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const fix = location.fix;
  const coords = fix ? formatCoordinates(fix, data.format) : null;
  const payload = fix ? locationText(fix, data.format, now) : null;
  const messages = {
    idle: "Locating…",
    locating: "Locating…",
    located: "",
    denied: "Location permission denied",
    disabled: "Location Services are off",
    unavailable: "Still searching for a location fix…",
  };
  const age = fix ? fixAge(fix, now) : 0;
  const formatAge = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s ago`;
    return `${Math.round(seconds / 60)} min ago`;
  };
  const cardTitle = !fix
    ? "YOUR LOCATION"
    : age > 120
      ? `LAST KNOWN LOCATION — ${formatAge(age)}`
      : fix.accuracy != null && fix.accuracy > 100
        ? "APPROXIMATE CURRENT LOCATION"
        : "YOUR LOCATION";
  return (
    <View
      style={{
        backgroundColor: C.locationCardBg,
        borderWidth: 1,
        borderColor: C.locationCardBorder,
        borderRadius: 10,
        padding: 17,
        marginVertical: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          marginBottom: 10,
        }}
      >
        <LocateFixed size={17} color="#AFCDBB" />
        <T
          style={{
            fontFamily: fonts.display,
            fontSize: 15,
            color: "#AFCDBB",
            letterSpacing: 1,
          }}
        >
          {cardTitle}
        </T>
      </View>
      {fix &&
        fixWarnings(fix, now).map((w) => (
          <View
            key={w}
            style={{
              backgroundColor: "#5C3527",
              borderRadius: 6,
              padding: 10,
              marginBottom: 12,
            }}
          >
            <T style={{ fontSize: 12, lineHeight: 19, color: "#FFDED1" }}>
              {w}
            </T>
          </View>
        ))}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Coordinate format toggle"
        style={{
          flexDirection: "row",
          backgroundColor: "#132720",
          borderRadius: 8,
          padding: 3,
          marginBottom: 10,
        }}
      >
        {FORMATS.map((format) => {
          const selected = data.format === format.value;
          return (
            <Pressable
              key={format.value}
              accessibilityRole="button"
              accessibilityLabel={format.value}
              accessibilityState={{ selected }}
              aria-selected={selected}
              onPress={() =>
                void run(() => update((d) => ({ ...d, format: format.value })))
              }
              style={{
                flex: 1,
                minHeight: 36,
                borderRadius: 6,
                backgroundColor: selected ? "#2E684E" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 13,
                  color: selected ? "white" : "#AFCDBB",
                }}
              >
                {format.value}
              </T>
            </Pressable>
          );
        })}
      </View>
      {fix && coords ? (
        <>
          <T
            selectable
            testID="coordinates"
            style={{
              fontFamily: fonts.bold,
              fontVariant: ["tabular-nums"],
              fontSize: data.format === "UTM" ? 18 : 23,
              lineHeight: 33,
              color: age >= 120 ? "#FFDED1" : "white",
            }}
          >
            {coords}
          </T>
          {fix.altitude != null && (
            <View style={{ marginTop: 2 }}>
              <T
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 18,
                  color: age >= 120 ? "#FFDED1" : "white",
                }}
              >
                Device elevation: ~{Math.round(fix.altitude * 3.28084)} ft
              </T>
            </View>
          )}
          <T
            style={{
              color: "#BFD8CB",
              fontSize: 12,
              lineHeight: 20,
              marginTop: 8,
              marginBottom: 10,
            }}
          >
            WGS84 · Acc:{" "}
            {fix.accuracy != null && fix.accuracy >= 0
              ? `±${Math.round(fix.accuracy * 3.28084)} ft`
              : "unknown"}
            {"\n"}Updated{" "}
            {age < 60 ? `${age}s` : `${Math.floor(age / 60)}m ${age % 60}s`} ago
            · {new Date(fix.timestamp).toLocaleTimeString()}
          </T>
        </>
      ) : fix ? (
        <T style={{ color: age >= 120 ? "#FFDED1" : "white", marginBottom: 12 }}>
          UTM is defined between 80° S and 84° N. Choose DD or DDM for this
          location.
        </T>
      ) : (
        <T
          accessibilityLiveRegion="polite"
          style={{ color: "#CFE0D6", fontFamily: fonts.bold, marginBottom: 12 }}
        >
          {messages[location.status]}
        </T>
      )}
      {(location.status === "denied" ||
        location.status === "disabled" ||
        location.status === "unavailable") && (
        <>
          <T
            style={{
              color: "#CFE0D6",
              fontSize: 12,
              lineHeight: 19,
              marginBottom: 12,
            }}
          >
            {messages[location.status]}.{" "}
            {fix ? "The coordinates above are the last available fix. " : ""}
            Describe your trail, trailhead, and landmarks to 911. Do not delay
            calling while waiting for GPS.
          </T>
          {location.status === "denied" || location.status === "disabled" ? (
            <Button
              label={
                Platform.OS === "web"
                  ? "Location permission help"
                  : "Open Settings"
              }
              small
              variant="light"
              icon={Settings}
              onPress={() =>
                void run(async () => {
                  if (Platform.OS === "web")
                    throw new Error(
                      "Allow Location in your browser’s site permissions, then reload the page.",
                    );
                  await Linking.openSettings();
                })
              }
            />
          ) : (
            <T style={{ fontSize: 12, color: "#CFE0D6", marginBottom: 10 }}>
              Location updates automatically. A clear view of the sky may help;
              stay in a safe place.
            </T>
          )}
        </>
      )}
      {!fix && location.status === "locating" && (
        <T
          style={{
            color: "#BFD8CB",
            fontSize: 12,
            lineHeight: 19,
            marginBottom: 12,
          }}
        >
          Your coordinates will appear automatically. Allow location access when
          your phone asks. Do not wait for GPS to call 911.
        </T>
      )}
      <View style={[s.flexRow, { marginTop: 8 }]}>
        <View style={{ flex: 1 }}>
          <Button
            label="Copy"
            icon={Copy}
            variant="light"
            small
            disabled={!payload}
            onPress={() => payload && void run(() => copy(payload))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Share"
            icon={Share2}
            variant="light"
            small
            disabled={!payload}
            onPress={() =>
              payload && void run(() => share(payload, "My location"))
            }
          />
        </View>
      </View>
      <View style={{ marginTop: 8 }}>
        <Button
          label="Open in Maps"
          small
          icon={MapPin}
          variant="light"
          disabled={!fix}
          onPress={() =>
            void run(async () => {
              if (!fix) return;
              const q = `${fix.latitude},${fix.longitude}`;
              await Linking.openURL(
                Platform.OS === "ios"
                  ? `maps:0,0?q=${q}`
                  : Platform.OS === "android"
                    ? `geo:${q}?q=${q}`
                    : `https://www.google.com/maps/search/?api=1&query=${q}`,
              );
            })
          }
        />
      </View>
    </View>
  );
}
