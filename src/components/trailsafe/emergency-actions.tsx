import { View } from "react-native";
import { router } from "expo-router";
import { LocateFixed, MessageSquare, Phone } from "lucide-react-native";
import { useApp } from "@/state/app";
import { Button, useThemeStyles } from "./ui";
export function EmergencyActions({
  situation,
  compact = false,
}: {
  situation?: string;
  compact?: boolean;
}) {
  const { C, s } = useThemeStyles();
  const { emergency } = useApp();
  return (
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
            onPress={() => router.navigate("/emergency")}
          />
        </View>
      )}
    </View>
  );
}
