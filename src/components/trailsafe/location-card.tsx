import { useEffect, useState } from "react";
import { Linking, Modal, Platform, Pressable, View } from "react-native";
import {
  Check,
  ChevronDown,
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
import { Button, C, fonts, T, s } from "./ui";
export function LocationCard() {
  const { location, run, copy, share } = useApp(),
    { data, update } = useStore();
  const [open, setOpen] = useState(false),
    [now, setNow] = useState(() => Date.now());
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
  return (
    <View
      style={{
        backgroundColor: C.forest,
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
          YOUR LOCATION
        </T>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Coordinate format"
        accessibilityHint="Choose decimal degrees, DDM, or UTM"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#789987",
          borderRadius: 6,
          padding: 11,
          minHeight: 44,
          marginBottom: 15,
        }}
      >
        <T
          style={{
            color: "white",
            fontSize: 13,
            fontFamily: fonts.bold,
            flex: 1,
          }}
        >
          {FORMATS.find((f) => f.value === data.format)?.label}
        </T>
        <ChevronDown size={17} color="white" />
      </Pressable>
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
              color: "white",
            }}
          >
            {coords}
          </T>
          <T
            style={{
              color: "#BFD8CB",
              fontSize: 12,
              lineHeight: 20,
              marginTop: 8,
              marginBottom: 10,
            }}
          >
            WGS84 · Accuracy:{" "}
            {fix.accuracy != null && fix.accuracy >= 0
              ? `±${Math.round(fix.accuracy)} m`
              : "unknown"}
            {"\n"}Updated{" "}
            {age < 60 ? `${age}s` : `${Math.floor(age / 60)}m ${age % 60}s`} ago
            · {new Date(fix.timestamp).toLocaleTimeString()}
          </T>
        </>
      ) : fix ? (
        <T style={{ color: "white", marginBottom: 12 }}>
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
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(8,20,13,.6)",
            justifyContent: "center",
            padding: 24,
            alignItems: "center",
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              width: "100%",
              maxWidth: 460,
              padding: 22,
              borderRadius: 16,
              backgroundColor: C.paper,
            }}
          >
            <T
              accessibilityRole="header"
              style={{
                fontFamily: fonts.display,
                fontSize: 26,
                marginBottom: 16,
              }}
            >
              Coordinate format
            </T>
            {FORMATS.map((format) => (
              <Pressable
                key={format.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: data.format === format.value }}
                aria-checked={data.format === format.value}
                onPress={() =>
                  void run(async () => {
                    await update((d) => ({ ...d, format: format.value }));
                    setOpen(false);
                  })
                }
                style={{
                  minHeight: 60,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: C.line,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <T style={{ flex: 1, fontSize: 14 }}>{format.label}</T>
                {data.format === format.value && (
                  <Check size={20} color={C.green} />
                )}
              </Pressable>
            ))}
            <T
              style={{
                fontSize: 12,
                color: C.muted,
                lineHeight: 19,
                marginVertical: 16,
              }}
            >
              All formats use WGS84. Read the format and accuracy aloud with
              your coordinates.
            </T>
            <Button
              label="Close"
              variant="outline"
              onPress={() => setOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
