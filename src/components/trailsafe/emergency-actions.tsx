import { View } from "react-native";
import { router } from "expo-router";
import { LocateFixed, MessageSquare, Phone } from "lucide-react-native";
import { useApp } from "@/state/app";
import { useLocation } from "@/hooks/use-location";
import { Button, Note, useThemeStyles } from "./ui";
export function EmergencyActions({
  situation,
  compact = false,
}: {
  situation?: string;
  compact?: boolean;
}) {
  const { s } = useThemeStyles();
  const { emergency, navigate } = useApp();
  const { fix, status } = useLocation();
  return (
    <View style={{ gap: 6 }}>
      <View style={compact ? s.flexRow : { gap: 10 }}>
        <View style={compact ? { flex: 1 } : undefined}>
          <Button
            label={compact ? "Call 911" : "CALL 911"}
            icon={Phone}
            variant="orange"
            small={compact}
            onPress={() => void emergency("call", situation)}
          />
        </View>
        <View style={compact ? { flex: 1 } : undefined}>
          <Button
            label={compact ? "Text 911" : "TEXT 911"}
            icon={MessageSquare}
            variant="outline"
            small={compact}
            onPress={() => void emergency("text", situation)}
          />
        </View>
        {compact && (
          <View style={{ flex: 1 }}>
            <Button
              label="Location"
              small
              icon={LocateFixed}
              onPress={() => navigate(() => router.navigate("/emergency"))}
            />
          </View>
        )}
      </View>
      {compact && (
        <Note>
          {fix
            ? `GPS ready (${fix.latitude.toFixed(5)}°, ${fix.longitude.toFixed(5)}°)`
            : status === "locating" || status === "idle"
              ? "Acquiring GPS… Wait a moment before tapping Text 911 to include coordinates."
              : "GPS unavailable — Text 911 will prompt you to describe your trailhead and route."}
        </Note>
      )}
    </View>
  );
}
