import { useState } from "react";
import { Platform, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, Note, T } from "./ui";
import { localDate, parseDateTimeInTimeZone } from "@/lib/plans";
import type { DateTimeFieldProps } from "./date-time-field";
export function DateTimeField({
  label,
  value,
  mode,
  timeZone,
  onChange,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  let zone = timeZone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
  } catch {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  const reference =
    parseDateTimeInTimeZone(
      mode === "date" ? value : localDate(),
      mode === "time" ? value : "12:00",
      zone,
    ) ?? new Date();
  const update = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const part = (type: string) =>
      parts.find((p) => p.type === type)?.value || "";
    onChange(
      mode === "date"
        ? `${part("year")}-${part("month")}-${part("day")}`
        : `${part("hour")}:${part("minute")}`,
    );
    if (Platform.OS === "android") setOpen(false);
  };
  return (
    <View style={{ marginBottom: 16, gap: 6 }}>
      <T>{label}</T>
      <Button
        label={value || (mode === "date" ? "Choose date" : "Choose time")}
        variant="outline"
        onPress={() => setOpen(!open)}
      />
      {open && (
        <DateTimePicker
          value={reference}
          mode={mode}
          timeZoneName={zone}
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={(_, date) => update(date)}
          onDismiss={() => setOpen(false)}
        />
      )}
      {open && Platform.OS === "ios" && (
        <Button
          label="Done"
          variant="ghost"
          onPress={() => {
            update(reference);
            setOpen(false);
          }}
        />
      )}
      <Note>{zone}</Note>
    </View>
  );
}
