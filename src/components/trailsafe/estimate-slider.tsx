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
      <input
        aria-label={label.split(":")[0]}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          width: "100%",
          height: 44,
          accentColor: C.green,
          cursor: "pointer",
          margin: 0,
        }}
      />
    </View>
  );
}
