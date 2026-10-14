import Slider from "@react-native-community/slider";
import { View } from "react-native";
import { T, useThemeStyles } from "./ui";
export function EstimateSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const { C } = useThemeStyles();
  return (
    <View style={{ marginVertical: 8 }}>
      <T>{label}</T>
      <Slider
        accessible
        accessibilityLabel={label.split(":")[0]}
        accessibilityRole="adjustable"
        accessibilityValue={{
          min,
          max,
          now: value,
          text: label.split(": ")[1],
        }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === "increment")
            onChange(Math.min(max, value + step));
          if (nativeEvent.actionName === "decrement")
            onChange(Math.max(min, value - step));
        }}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={C.green}
        maximumTrackTintColor={C.line}
        thumbTintColor={C.green}
        style={{ width: "100%", height: 44 }}
      />
    </View>
  );
}
