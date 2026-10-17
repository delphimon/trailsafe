import { useCallback, useState } from "react";
import { View } from "react-native";
import { Compass } from "lucide-react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Button,
  Callout,
  Card,
  Chip,
  Field,
  Heading,
  Kicker,
  Note,
  Row,
  Screen,
  T,
  fonts,
  useThemeStyles,
} from "@/components/trailsafe/ui";
import { DateTimeField } from "@/components/trailsafe/date-time-field";
import { EstimateSlider } from "@/components/trailsafe/estimate-slider";
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
type Tool = "daylight" | "compass" | "hiking" | "more";
const toolChoices = [
  { id: "daylight", label: "Daylight" },
  { id: "compass", label: "Compass" },
  { id: "hiking", label: "Hiking" },
  { id: "more", label: "More" },
] as const;
export default function ToolsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tool?: Tool }>();
  const { C, s } = useThemeStyles();
  const { fix, status, requestLocation } = useLocation();
  const tool: Tool = toolChoices.some((t) => t.id === params.tool)
    ? params.tool!
    : "daylight";
  const setTool = (next: Tool) => router.setParams({ tool: next });
  const [locationId, setLocationId] = useState("gps"),
    [changeLocation, setChangeLocation] = useState(false),
    [settings, setSettings] = useState(false),
    [details, setDetails] = useState(false);
  const [canopy, setCanopy] = useState<CanopyType>("moderate");
  const [date, setDate] = useState(() => localDate()),
    [now, setNow] = useState(() => Date.now());
  const [miles, setMiles] = useState(6),
    [gain, setGain] = useState(2000),
    [loss, setLoss] = useState<string | null>(null);
  const [pace, setPace] = useState<PaceLevel>("casual"),
    [pack, setPack] = useState<PackWeight>("light");
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 30000);
      const release =
        locationId === "gps" && (tool === "daylight" || tool === "compass")
          ? requestLocation()
          : undefined;
      return () => {
        clearInterval(timer);
        release?.();
      };
    }, [locationId, tool, requestLocation]),
  );
  const preset = WASHINGTON_REGION.trailheads.find((p) => p.id === locationId);
  const coords =
    locationId === "gps"
      ? fix
        ? { latitude: fix.latitude, longitude: fix.longitude, name: "GPS" }
        : null
      : (preset ?? null);
  const warnings = locationId === "gps" && fix ? fixWarnings(fix, now) : [];
  const timeZone = preset
    ? preset.timeZone
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isToday = date === localDate(new Date(now), timeZone);
  const reference = isToday
    ? new Date(now)
    : parseDateTimeInTimeZone(date, "12:00", timeZone);
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
  const descent = loss === null ? gain : loss.trim() ? Number(loss) : NaN;
  const estimate =
    Number.isFinite(descent) && descent >= 0
      ? calculateHikingTime(miles, gain, descent, pace, pack)
      : null;
  const locationControl = (
    <>
      <Button
        label={`Location: ${coords?.name ?? (locationId === "gps" ? "GPS" : "Choose")} · Change`}
        variant="ghost"
        small
        onPress={() => setChangeLocation(!changeLocation)}
      />
      {changeLocation && (
        <Card>
          <Heading>Choose a location</Heading>
          <View style={[s.wrap, { marginTop: 10 }]}>
            <Chip
              label="GPS"
              selected={locationId === "gps"}
              onPress={() => {
                setLocationId("gps");
                setChangeLocation(false);
              }}
            />
            {WASHINGTON_REGION.trailheads.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                selected={locationId === p.id}
                onPress={() => {
                  setLocationId(p.id);
                  setChangeLocation(false);
                }}
              />
            ))}
          </View>
        </Card>
      )}
      {!coords && (
        <Note>
          {status === "denied" || status === "disabled"
            ? "Location unavailable. Choose a trailhead with Change."
            : "Finding your GPS location… You can also choose a trailhead."}
        </Note>
      )}
      {warnings.map((w) => (
        <Callout key={w} title="Location warning">
          {w}
        </Callout>
      ))}
    </>
  );
  return (
    <Screen title="Tools" subtitle="Useful answers, right at hand">
      <View
        accessibilityRole="tablist"
        style={[s.flexRow, { marginBottom: 14 }]}
      >
        {toolChoices.map((t) => (
          <View key={t.id} style={{ flex: 1 }}>
            <Chip
              label={t.label}
              selected={tool === t.id}
              onPress={() => {
                setTool(t.id);
                setChangeLocation(false);
              }}
            />
          </View>
        ))}
      </View>
      {tool === "daylight" && (
        <>
          <Card>
            <Heading>When will I need a headlamp?</Heading>
            <T
              testID="headlamp-result"
              style={{
                fontFamily: fonts.display,
                fontSize: 44,
                lineHeight: 52,
                color: C.green,
                marginVertical: 8,
              }}
            >
              {solar ? time(solar.forestDusk) : "Waiting for location"}
            </T>
            <Note>
              {isToday ? "Today" : date} · {coords?.name ?? "GPS"} · {timeZone}
            </Note>
            <View style={[s.wrap, { marginVertical: 10 }]}>
              {(
                [
                  { id: "open", label: "No buffer" },
                  { id: "moderate", label: "30 min early" },
                  { id: "dense", label: "60 min early" },
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
              <T>
                Sunrise {time(solar.sunrise)} · Sunset {time(solar.sunset)} ·
                Civil dusk {time(solar.civilDusk)}
              </T>
            )}
            <Note>
              {isToday && solar?.headlampStatusHeadline
                ? `${solar.headlampStatusHeadline}. Trees, terrain and weather can make it dark sooner.`
                : "Have it ready by this time. Trees, terrain and weather can make it dark sooner."}
            </Note>
          </Card>
          {locationControl}
          <Row
            title="Compass declination"
            icon={Compass}
            subtitle={
              declination === null
                ? "Choose a location"
                : `${Math.abs(declination).toFixed(1)}° ${declination >= 0 ? "east" : "west"} of true north`
            }
            onPress={() => setTool("compass")}
          />
          <Button
            label={
              settings ? "Hide daylight settings" : "Date & daylight details"
            }
            variant="ghost"
            small
            onPress={() => setSettings(!settings)}
          />
          {settings && (
            <Card>
              <DateTimeField
                label="Daylight date"
                value={date}
                mode="date"
                timeZone={timeZone}
                onChange={setDate}
              />
              <Note>Times shown in {timeZone}.</Note>
              {solar && (
                <>
                  <T>Sunrise: {time(solar.sunrise)}</T>
                  <Note>
                    {solar.weatherDisclaimer} The selected buffer is a planning
                    allowance, not a measurement of forest darkness.
                  </Note>
                </>
              )}
            </Card>
          )}
        </>
      )}
      {tool === "compass" && (
        <>
          <Card>
            <Heading>Compass declination</Heading>
            <T
              testID="declination-result"
              style={{
                fontFamily: fonts.display,
                fontSize: 44,
                lineHeight: 52,
                color: C.green,
                marginVertical: 12,
              }}
            >
              {declination === null
                ? "Waiting for location"
                : `${Math.abs(declination).toFixed(1)}° ${declination >= 0 ? "E" : "W"}`}
            </T>
            <T>
              {declination === null
                ? "Choose a location to calculate declination."
                : declinationDescription(declination)}
            </T>
            <Note>
              World Magnetic Model · {coords?.name ?? "GPS"} · current date
            </Note>
          </Card>
          {locationControl}
          <Note>
            Follow your compass manufacturer’s adjustment instructions. This is
            true-to-magnetic declination; grid north depends on your map.
          </Note>
        </>
      )}
      {tool === "hiking" && (
        <>
          <Card>
            <Heading>Estimated hiking time</Heading>
            <T
              testID="hiking-result"
              style={{
                fontFamily: fonts.display,
                fontSize: 40,
                lineHeight: 48,
                color: C.green,
              }}
            >
              {estimate?.formattedDuration ?? "Check descent"}
            </T>
            <Note>
              Includes breaks · {miles} miles · {gain.toLocaleString()} ft gain
            </Note>
          </Card>
          <EstimateSlider
            label={`Total distance: ${miles} miles`}
            value={miles}
            min={0.5}
            max={30}
            step={0.5}
            onChange={setMiles}
          />
          <View style={s.wrap}>
            {[3, 6, 10, 15].map((v) => (
              <Chip
                key={v}
                label={`${v} mi`}
                selected={miles === v}
                onPress={() => setMiles(v)}
              />
            ))}
          </View>
          <EstimateSlider
            label={`Elevation gain: ${gain.toLocaleString()} ft`}
            value={gain}
            min={0}
            max={8000}
            step={250}
            onChange={setGain}
          />
          <View style={s.wrap}>
            {[0, 1000, 2000, 4000].map((v) => (
              <Chip
                key={v}
                label={`${v.toLocaleString()} ft`}
                selected={gain === v}
                onPress={() => setGain(v)}
              />
            ))}
          </View>
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
          {estimate &&
            solar?.forestDusk &&
            date === localDate() &&
            now + estimate.totalMinutes * 60000 >
              solar.forestDusk.getTime() && (
              <Callout title="Carry a headlamp">
                Starting now would put your estimated finish after the headlamp
                planning time.
              </Callout>
            )}
          <Note>
            Rough estimate; conditions and your group can change it. Descent
            matches ascent unless you change it below. Leave extra time and
            choose a turnaround time.
          </Note>
          <Button
            label={
              details
                ? "Hide descent input"
                : "Different descent / one-way hike"
            }
            variant="ghost"
            small
            onPress={() => setDetails(!details)}
          />
          {details && (
            <Card>
              <Field
                label="Total descent (feet)"
                value={loss ?? String(gain)}
                keyboardType="decimal-pad"
                onChangeText={setLoss}
              />
              <Button
                label="Match descent to ascent"
                variant="ghost"
                small
                onPress={() => setLoss(null)}
              />
            </Card>
          )}
        </>
      )}
      {tool === "more" && (
        <>
          <Kicker>Water treatment</Kicker>
          <Card>
            <Heading>Treat backcountry water</Heading>
            <T style={{ marginVertical: 12 }}>
              Bring clear water to a rolling boil for 1 minute, or 3 minutes
              above 6,500 feet. Let it cool before drinking.
            </T>
            <T>
              For chemicals, filters and UV devices, follow the exact product
              instructions for dose, volume, water clarity, temperature and
              contact time. Different methods remove different germs; do not
              assume one treatment handles everything.
            </T>
            <Note>
              Use your phone’s Clock timer for any required waiting period. Set
              it yourself using your product’s instructions; TrailSafe does not
              run a water timer.
            </Note>
            <Note>
              Boiling and disinfection do not remove fuel, toxic chemicals or
              radioactive contamination. Choose another water source if
              contamination is suspected.
            </Note>
            <Button
              label="Read water treatment guide"
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: "/article/[id]",
                  params: { id: "water-treatment" },
                })
              }
            />
          </Card>
          <Kicker>Signaling</Kicker>
          <Card>
            <Heading>Carry a physical whistle</Heading>
            <T style={{ marginVertical: 12 }}>
              Use repeated groups of three whistle blasts to attract attention,
              then pause and listen. A phone speaker is not a replacement for a
              whistle.
            </T>
            <T>
              Use a headlamp or signal mirror to attract nearby rescuers. SOS is
              three short signals, three long signals, then three short signals.
              A visible signal does not mean help has been contacted.
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
        </>
      )}
    </Screen>
  );
}
