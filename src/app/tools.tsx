import { useCallback, useState } from "react";
import { View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  Button,
  Callout,
  Card,
  Chip,
  Field,
  Heading,
  Kicker,
  Note,
  Screen,
  T,
  useThemeStyles,
} from "@/components/trailsafe/ui";
import { DateTimeField } from "@/components/trailsafe/date-time-field";
import { useLocation } from "@/hooks/use-location";
import {
  fixWarnings,
  getMagneticDeclination,
  declinationDescription,
} from "@/lib/coordinates";
import { calculateSolarTimes, type CanopyType } from "@/lib/solar";
import { WASHINGTON_REGION } from "@/content/regions";
import {
  calculateHikingTime,
  type PaceLevel,
  type PackWeight,
} from "@/lib/hiking-tools";
import { localDate, parseDateTimeInTimeZone } from "@/lib/plans";

export default function ToolsScreen() {
  const { s } = useThemeStyles();
  const { fix, status, requestLocation } = useLocation();
  const [locationId, setLocationId] = useState("gps");
  const [canopy, setCanopy] = useState<CanopyType>("moderate");
  const [date, setDate] = useState(() => localDate());
  const [now, setNow] = useState(() => Date.now());
  const [miles, setMiles] = useState("6");
  const [gain, setGain] = useState("2000");
  const [loss, setLoss] = useState("2000");
  const [pace, setPace] = useState<PaceLevel>("casual");
  const [pack, setPack] = useState<PackWeight>("light");
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 30000);
      const release = locationId === "gps" ? requestLocation() : undefined;
      return () => {
        clearInterval(timer);
        release?.();
      };
    }, [locationId, requestLocation]),
  );
  const preset = WASHINGTON_REGION.trailheads.find((p) => p.id === locationId);
  const coords =
    locationId === "gps"
      ? fix
        ? {
            latitude: fix.latitude,
            longitude: fix.longitude,
            name: "GPS location",
          }
        : null
      : preset
        ? { ...preset }
        : null;
  const warnings = locationId === "gps" && fix ? fixWarnings(fix, now) : [];
  const timeZone = preset
    ? WASHINGTON_REGION.timeZone
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const reference = parseDateTimeInTimeZone(date, "12:00", timeZone);
  const solar =
    coords && reference
      ? calculateSolarTimes(
          coords.latitude,
          coords.longitude,
          reference,
          canopy,
        )
      : null;
  const declination = coords
    ? getMagneticDeclination(coords.latitude, coords.longitude)
    : null;
  const time = (value: Date | null) =>
    value
      ? value.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          timeZone,
        })
      : "No event on this date";
  const inputs = [miles, gain, loss].map((v) => (v.trim() ? Number(v) : NaN));
  const validEstimate =
    inputs.every((v) => Number.isFinite(v) && v >= 0) && inputs[0] > 0;
  const estimate = validEstimate
    ? calculateHikingTime(inputs[0], inputs[1], inputs[2], pace, pack)
    : null;
  return (
    <Screen title="Tools" subtitle="Simple estimates and offline guidance">
      <Kicker>Daylight & compass</Kicker>
      <Card>
        <Heading>Choose a location</Heading>
        <View style={[s.wrap, { marginVertical: 12 }]}>
          <Chip
            label="GPS"
            selected={locationId === "gps"}
            onPress={() => setLocationId("gps")}
          />
          {WASHINGTON_REGION.trailheads.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              selected={locationId === p.id}
              onPress={() => setLocationId(p.id)}
            />
          ))}
        </View>
        {locationId === "gps" && (
          <Note>
            GPS: {status === "located" ? "Fix available" : status}.{" "}
            {status === "denied" || status === "disabled"
              ? "Enable location in device settings or choose a preset."
              : ""}
          </Note>
        )}
        {warnings.map((w) => (
          <Callout key={w} title="Location warning">
            {w}
          </Callout>
        ))}
        {!coords && (
          <Callout title="Location needed">
            Choose a preset or wait for a GPS fix. No daylight or compass
            estimate is shown without a location.
          </Callout>
        )}
        {coords && (
          <Note>
            {coords.name} · {coords.latitude.toFixed(4)},{" "}
            {coords.longitude.toFixed(4)}
          </Note>
        )}
        <DateTimeField
          label="Daylight date"
          value={date}
          mode="date"
          timeZone={timeZone}
          onChange={setDate}
        />
        {!reference && <Note>Enter a valid date as YYYY-MM-DD.</Note>}
        <Note>
          Times shown in {timeZone}. For GPS outside this time zone, use the
          displayed zone when reading times.
        </Note>
        <Kicker>Headlamp planning buffer</Kicker>
        <View style={s.wrap}>
          {(
            [
              { id: "open", label: "None" },
              { id: "moderate", label: "30 min" },
              { id: "dense", label: "60 min" },
            ] as const
          ).map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              selected={canopy === p.id}
              onPress={() => setCanopy(p.id)}
            />
          ))}
        </View>
        {solar && (
          <View style={{ gap: 10, marginTop: 16 }}>
            <T>Sunrise: {time(solar.sunrise)}</T>
            <T>Horizon sunset: {time(solar.sunset)}</T>
            <T>Civil dusk: {time(solar.civilDusk)}</T>
            <Heading>Headlamp ready by: {time(solar.forestDusk)}</Heading>
            <Note>
              The buffer is your planning allowance, not a measurement of forest
              darkness. Carry a headlamp and use it sooner if needed.{" "}
              {solar.weatherDisclaimer}
            </Note>
          </View>
        )}
      </Card>
      {coords && (
        <Card>
          <Heading>Compass declination</Heading>
          <T style={{ marginVertical: 12 }}>
            {declination === null
              ? "Magnetic estimate unavailable."
              : declinationDescription(declination)}
          </T>
          <Note>
            World Magnetic Model estimate for this location and the current
            date. Follow your compass manufacturer’s adjustment instructions.
            Grid north is map-specific; this value is true-to-magnetic
            declination.
          </Note>
        </Card>
      )}
      <Kicker>Hiking time</Kicker>
      <Card>
        <Field
          label="Total distance (miles)"
          value={miles}
          onChangeText={setMiles}
          keyboardType="decimal-pad"
        />
        <Field
          label="Total ascent (feet)"
          value={gain}
          onChangeText={setGain}
          keyboardType="decimal-pad"
        />
        <Field
          label="Total descent (feet)"
          value={loss}
          onChangeText={setLoss}
          keyboardType="decimal-pad"
        />
        <Kicker>Pace</Kicker>
        <View style={s.wrap}>
          {(["casual", "moderate", "fast"] as const).map((p) => (
            <Chip
              key={p}
              label={p}
              selected={pace === p}
              onPress={() => setPace(p)}
            />
          ))}
        </View>
        <Kicker>Pack</Kicker>
        <View style={s.wrap}>
          {(["light", "overnight", "heavy"] as const).map((p) => (
            <Chip
              key={p}
              label={p}
              selected={pack === p}
              onPress={() => setPack(p)}
            />
          ))}
        </View>
        <Heading>
          {estimate
            ? `Estimated duration: ${estimate.formattedDuration}`
            : "Enter a positive distance and nonnegative elevation totals."}
        </Heading>
        <Note>
          Includes a break allowance. Rough planning estimate only: snow, trail
          conditions, navigation, fatigue and your group can change the time
          substantially. Choose a turnaround time and leave extra daylight.
        </Note>
      </Card>
      <Kicker>Water treatment</Kicker>
      <Card>
        <Heading>Treat backcountry water</Heading>
        <T style={{ marginVertical: 12 }}>
          Bring clear water to a rolling boil for 1 minute, or 3 minutes above
          6,500 feet. Let it cool before drinking.
        </T>
        <T>
          For chemicals, filters and UV devices, follow the exact product
          instructions for dose, volume, water clarity, temperature and contact
          time. Different methods remove different germs; do not assume one
          treatment handles everything.
        </T>
        <Note>
          Use your phone’s Clock timer for any required waiting period. Set it
          yourself using your product’s instructions; TrailSafe does not run a
          water timer.
        </Note>
        <Note>
          Boiling and disinfection do not remove fuel, toxic chemicals or
          radioactive contamination. Choose another water source if
          contamination is suspected.
        </Note>
      </Card>
      <Kicker>Signaling</Kicker>
      <Card>
        <Heading>Carry a physical whistle</Heading>
        <T style={{ marginVertical: 12 }}>
          Use repeated groups of three whistle blasts to attract attention, then
          pause and listen. A phone speaker is not a replacement for a whistle.
        </T>
        <T>
          Use a headlamp or signal mirror to attract nearby rescuers. SOS is
          three short signals, three long signals, then three short signals. A
          visible signal does not mean help has been contacted.
        </T>
        <Button
          label="Read signaling guide"
          variant="outline"
          onPress={() =>
            router.push({
              pathname: "/article/[id]",
              params: { id: "signaling" },
            })
          }
        />
      </Card>
      <Button
        label="Cold & wet exposure guide"
        variant="outline"
        onPress={() =>
          router.push({
            pathname: "/article/[id]",
            params: { id: "cold-hypothermia" },
          })
        }
      />
      <View style={{ marginTop: 12 }}>
        <Button
          label="Winter travel guide"
          variant="outline"
          onPress={() =>
            router.push({
              pathname: "/article/[id]",
              params: { id: "winter-safety" },
            })
          }
        />
      </View>
    </Screen>
  );
}
