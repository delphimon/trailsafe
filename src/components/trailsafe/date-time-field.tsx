import { Field } from "./ui";
export type DateTimeFieldProps = {
  label: string;
  value: string;
  mode: "date" | "time";
  timeZone: string;
  onChange: (value: string) => void;
};
/** Browser fallback: explicit calendar date / 24-hour time. */
export function DateTimeField({
  label,
  value,
  mode,
  onChange,
}: DateTimeFieldProps) {
  return (
    <Field
      label={label}
      value={value}
      onChangeText={onChange}
      autoCapitalize="none"
      placeholder={mode === "date" ? "YYYY-MM-DD" : "HH:MM"}
      hint={mode === "date" ? "YYYY-MM-DD" : "24-hour time"}
    />
  );
}
