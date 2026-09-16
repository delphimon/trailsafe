import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Platform,
  Vibration,
} from "react-native";
import { DeviceMotion } from "expo-sensors";
import { useAudioPlayer } from "expo-audio";
import {
  AlertTriangle,
  Compass,
  Eye,
  Flashlight,
  Megaphone,
  Radio,
  Sun,
  Sunset,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import {
  Button,
  Callout,
  Card,
  Chip,
  fonts,
  Heading,
  Kicker,
  Note,
  Screen,
  T,
  useThemeStyles,
} from "@/components/trailsafe/ui";
import { useAutomaticLocation } from "@/hooks/use-location";
import {
  calculateSolarTimes,
  formatDurationMinutes,
  PNW_TRAILHEAD_PRESETS,
  type CanopyType,
} from "@/lib/solar";
import {
  getMorseSOSElements,
  playWebWhistleTone,
  WHISTLE_CADENCE_STEPS,
} from "@/lib/signaling";
import {
  calculateHikingTime,
  getSlopeAvalancheRisk,
  WATER_TREATMENT_PRESETS,
  type PaceLevel,
  type PackWeight,
  type WaterTreatmentPreset,
} from "@/lib/hiking-tools";

type ToolTab = "solar" | "signaling" | "backcountry";

export default function ToolsScreen() {
  const { C, s } = useThemeStyles();
  const [activeTab, setActiveTab] = useState<ToolTab>("solar");

  // GPS & Location for Solar
  const { fix } = useAutomaticLocation(activeTab === "solar");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("gps");
  const [canopy, setCanopy] = useState<CanopyType>("moderate");

  const currentCoords = useMemo(() => {
    if (selectedPresetId === "gps" && fix) {
      return {
        lat: fix.latitude,
        lon: fix.longitude,
      };
    }
    const preset =
      PNW_TRAILHEAD_PRESETS.find((p) => p.id === selectedPresetId) ||
      PNW_TRAILHEAD_PRESETS[0];
    return {
      lat: preset.latitude,
      lon: preset.longitude,
    };
  }, [selectedPresetId, fix]);

  // Live clock tick (every 30 seconds)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const solar = useMemo(() => {
    return calculateSolarTimes(
      currentCoords.lat,
      currentCoords.lon,
      now,
      canopy,
    );
  }, [currentCoords, now, canopy]);

  // --------------------------------------------------------------------------
  // SIGNALING STATE
  // --------------------------------------------------------------------------
  const [whistleActive, setWhistleActive] = useState(false);
  const [whistleStepIdx, setWhistleStepIdx] = useState(0);
  const [whistleSecondsLeft, setWhistleSecondsLeft] = useState(
    WHISTLE_CADENCE_STEPS[0].durationSeconds,
  );
  const [audioToneEnabled, setAudioToneEnabled] = useState(true);
  const nativePlayer = useAudioPlayer(
    Platform.OS !== "web" ? require("../../assets/audio/whistle.wav") : null
  );

  // Audio tone and vibration effect for active blast
  useEffect(() => {
    if (!whistleActive) return;
    const currentStep = WHISTLE_CADENCE_STEPS[whistleStepIdx];
    let stopTone: (() => void) | undefined;

    if (currentStep.isBlasting) {
      if (audioToneEnabled) {
        if (Platform.OS === "web") {
          stopTone = playWebWhistleTone(2800);
        } else if (nativePlayer) {
          nativePlayer.loop = true;
          nativePlayer.play();
          stopTone = () => {
            nativePlayer.pause();
            nativePlayer.seekTo(0);
          };
        }
      }
      try {
        Vibration.vibrate(currentStep.durationSeconds * 1000);
      } catch {
        // Ignore vibration errors
      }
    }

    return () => {
      if (stopTone) stopTone();
    };
  }, [whistleActive, whistleStepIdx, audioToneEnabled, nativePlayer]);

  // Whistle cycle countdown timer
  useEffect(() => {
    if (!whistleActive) return;

    const timer = setInterval(() => {
      setWhistleSecondsLeft((prev) => {
        if (prev <= 1) {
          setWhistleStepIdx((currentIdx) => {
            const nextIdx = (currentIdx + 1) % WHISTLE_CADENCE_STEPS.length;
            setWhistleSecondsLeft(
              WHISTLE_CADENCE_STEPS[nextIdx].durationSeconds,
            );
            return nextIdx;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [whistleActive]);

  // Screen Beacon Modal State
  type BeaconMode = "strobe" | "sos" | "red" | "mirror" | null;
  const [beaconMode, setBeaconMode] = useState<BeaconMode>(null);
  const [strobeState, setStrobeState] = useState(true);
  const [morseIdx, setMorseIdx] = useState(0);
  const morseElements = useMemo(() => getMorseSOSElements(), []);

  // Strobe alternating interval
  useEffect(() => {
    if (beaconMode !== "strobe") return;
    const interval = setInterval(() => {
      setStrobeState((prev) => !prev);
    }, 140);
    return () => clearInterval(interval);
  }, [beaconMode]);

  // Morse SOS advancement
  useEffect(() => {
    if (beaconMode !== "sos") return;
    const currentElement = morseElements[morseIdx];
    const timeout = setTimeout(() => {
      setMorseIdx((prev) => (prev + 1) % morseElements.length);
    }, currentElement.durationMs);

    return () => clearTimeout(timeout);
  }, [beaconMode, morseIdx, morseElements]);

  const isBeaconLightActive =
    beaconMode === "strobe"
      ? strobeState
      : beaconMode === "sos"
        ? morseElements[morseIdx].light
        : true;

  // --------------------------------------------------------------------------
  // BACKCOUNTRY UTILITIES STATE
  // --------------------------------------------------------------------------
  // Inclinometer
  const [deviceTilt, setDeviceTilt] = useState<number>(34); // Default 34° to showcase danger zone
  const [isMeasuringTilt, setIsMeasuringTilt] = useState(false);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    if (isMeasuringTilt && typeof window !== "undefined") {
      DeviceMotion.setUpdateInterval(250);
      subscription = DeviceMotion.addListener((e) => {
        if (e.rotation) {
          // beta is tilt in radians (approx front-to-back tilt)
          const angle = Math.abs(Math.round(e.rotation.beta * (180 / Math.PI)));
          setDeviceTilt(Math.min(90, angle));
        }
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isMeasuringTilt]);

  const slopeRisk = useMemo(
    () => getSlopeAvalancheRisk(deviceTilt),
    [deviceTilt],
  );

  // Naismith Estimator
  const [hikingMiles, setHikingMiles] = useState(5);
  const [hikingGainFt, setHikingGainFt] = useState(2400);
  const [hikingLossFt, setHikingLossFt] = useState(2400);
  const [hikingPace, setHikingPace] = useState<PaceLevel>("moderate");
  const [hikingPack, setHikingPack] = useState<PackWeight>("light");

  const hikingEstimate = useMemo(() => {
    return calculateHikingTime(
      hikingMiles,
      hikingGainFt,
      hikingLossFt,
      hikingPace,
      hikingPack,
    );
  }, [hikingMiles, hikingGainFt, hikingLossFt, hikingPace, hikingPack]);

  // Water Treatment Timer
  const [selectedWaterPreset, setSelectedWaterPreset] = useState(
    WATER_TREATMENT_PRESETS[0].id,
  );
  const currentWaterPreset = useMemo(
    () =>
      WATER_TREATMENT_PRESETS.find((p) => p.id === selectedWaterPreset) ||
      WATER_TREATMENT_PRESETS[0],
    [selectedWaterPreset],
  );
  const [waterSecondsLeft, setWaterSecondsLeft] = useState(
    currentWaterPreset.durationSeconds,
  );
  const [waterTimerRunning, setWaterTimerRunning] = useState(false);

  const handleSelectWaterPreset = (p: WaterTreatmentPreset) => {
    setSelectedWaterPreset(p.id);
    setWaterSecondsLeft(p.durationSeconds);
    setWaterTimerRunning(false);
  };

  useEffect(() => {
    if (!waterTimerRunning) return;
    const interval = setInterval(() => {
      setWaterSecondsLeft((prev) => {
        if (prev <= 1) {
          setWaterTimerRunning(false);
          try {
            Vibration.vibrate([0, 500, 200, 500]);
          } catch {
            // Ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [waterTimerRunning]);

  return (
    <Screen
      title="Wilderness Tools"
      subtitle="Offline solar, signaling, and backcountry utilities"
    >
      {/* Tab Switcher */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
        <Chip
          label="Solar & Dusk"
          selected={activeTab === "solar"}
          onPress={() => setActiveTab("solar")}
        />
        <Chip
          label="Signaling"
          selected={activeTab === "signaling"}
          onPress={() => setActiveTab("signaling")}
        />
        <Chip
          label="Backcountry"
          selected={activeTab === "backcountry"}
          onPress={() => setActiveTab("backcountry")}
        />
      </View>

      {/* ====================================================================
          TAB 1: SOLAR & FOREST DUSK CALCULATOR (Recommendation 6)
         ==================================================================== */}
      {activeTab === "solar" && (
        <View style={{ gap: 14 }}>
          {/* Location Selector */}
          <Kicker>Location reference</Kicker>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingBottom: 4 }}
          >
            <Chip
              label={fix ? "GPS Location (Active)" : "GPS (Searching...)"}
              selected={selectedPresetId === "gps"}
              onPress={() => setSelectedPresetId("gps")}
            />
            {PNW_TRAILHEAD_PRESETS.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                selected={selectedPresetId === p.id}
                onPress={() => setSelectedPresetId(p.id)}
              />
            ))}
          </ScrollView>

          {/* Canopy / Terrain Selector */}
          <Kicker>Forest canopy / terrain</Kicker>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Chip
              label="Open Ridge (0m)"
              selected={canopy === "open"}
              onPress={() => setCanopy("open")}
            />
            <Chip
              label="Moderate (-30m)"
              selected={canopy === "moderate"}
              onPress={() => setCanopy("moderate")}
            />
            <Chip
              label="Dense Timber (-60m)"
              selected={canopy === "dense"}
              onPress={() => setCanopy("dense")}
            />
          </View>
          <Note>
            In dense Pacific Northwest coniferous forests (hemlock, cedar, fir)
            and steep valleys, usable trail light ends 45–60 minutes earlier than
            civil twilight.
          </Note>

          {/* Primary Countdown / Status Banner */}
          {solar.forestDusk && (
            <Card
              style={{
                backgroundColor: C.checkBg,
                borderColor: C.orange,
                borderWidth: 1.5,
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ gap: 4 }}>
                  <T
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 12,
                      color: C.kicker,
                      letterSpacing: 1,
                    }}
                  >
                    ESTIMATED FOREST DUSK
                  </T>
                  <T
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 32,
                      lineHeight: 38,
                      color: C.heading,
                    }}
                  >
                    {solar.forestDusk.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </T>
                  <T style={{ fontSize: 13, color: C.ink }}>
                    {solar.minutesUntilForestDusk !== null &&
                    solar.minutesUntilForestDusk > 0 ? (
                      <>
                        Headlamp required in:{" "}
                        <T
                          style={{
                            fontFamily: fonts.bold,
                            color: C.orangeDark,
                          }}
                        >
                          {formatDurationMinutes(solar.minutesUntilForestDusk)}
                        </T>
                      </>
                    ) : (
                      <T style={{ fontFamily: fonts.bold, color: C.orange }}>
                        TRAIL DARKNESS REACHED — HEADLAMP REQUIRED
                      </T>
                    )}
                  </T>
                </View>
                <Sunset size={36} color={C.orange} />
              </View>
            </Card>
          )}

          {/* Detailed Solar Times Card */}
          <Kicker>Astronomical solar table</Kicker>
          <Card style={{ padding: 14, gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}
            >
              <T style={{ color: C.muted }}>Sunrise (First Sun)</T>
              <T style={{ fontFamily: fonts.bold }}>
                {solar.sunrise
                  ? solar.sunrise.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "—"}
              </T>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}
            >
              <T style={{ color: C.muted }}>Solar Noon (Zenith)</T>
              <T style={{ fontFamily: fonts.bold }}>
                {solar.solarNoon
                  ? solar.solarNoon.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "—"}
              </T>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}
            >
              <T style={{ color: C.muted }}>Sunset (Flat Horizon)</T>
              <T style={{ fontFamily: fonts.bold }}>
                {solar.sunset
                  ? solar.sunset.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "—"}
              </T>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
                backgroundColor: C.checkBg,
                paddingHorizontal: 8,
                borderRadius: 6,
              }}
            >
              <T style={{ fontFamily: fonts.bold, color: C.orangeDark }}>
                Forest Dusk (Canopy Darkness)
              </T>
              <T style={{ fontFamily: fonts.bold, color: C.orangeDark }}>
                {solar.forestDusk
                  ? solar.forestDusk.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "—"}
              </T>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}
            >
              <T style={{ color: C.muted }}>Civil Twilight (Open Dusk)</T>
              <T style={{ fontFamily: fonts.bold }}>
                {solar.civilDusk
                  ? solar.civilDusk.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "—"}
              </T>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
              }}
            >
              <T style={{ color: C.muted }}>Total Daylight Duration</T>
              <T style={{ fontFamily: fonts.bold }}>
                {formatDurationMinutes(solar.dayLengthMinutes)}
              </T>
            </View>
          </Card>

          {/* Sun Compass Orientation */}
          <Kicker>Sun-compass orientation</Kicker>
          <Card style={{ padding: 14, gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Sun size={24} color={C.green} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: fonts.bold }}>
                  Sun Bearing: {solar.solarAzimuthDeg}° · Elevation:{" "}
                  {solar.solarElevationDeg}°
                </T>
                <T style={s.note}>
                  Face the sun to verify your compass heading. Near solar noon,
                  the sun points almost directly South.
                </T>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* ====================================================================
          TAB 2: AUDIBLE & VISUAL SIGNALING (Recommendation 9)
         ==================================================================== */}
      {activeTab === "signaling" && (
        <View style={{ gap: 16 }}>
          {/* Whistle Cadence Card */}
          <Kicker>Alpine distress whistle cadence</Kicker>
          <Card style={{ padding: 16, gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ gap: 2 }}>
                <Heading>Universal 3-Blast Signal</Heading>
                <T style={s.note}>
                  3 sharp blasts · 1 minute silence · Repeat
                </T>
              </View>
              <Megaphone size={28} color={C.orange} />
            </View>

            {/* Live Whistle Display */}
            {whistleActive && (
              <View
                style={{
                  backgroundColor:
                    WHISTLE_CADENCE_STEPS[whistleStepIdx].isBlasting
                      ? C.orange
                      : C.checkBg,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <T
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 28,
                    color: WHISTLE_CADENCE_STEPS[whistleStepIdx].isBlasting
                      ? C.white
                      : C.heading,
                  }}
                >
                  {WHISTLE_CADENCE_STEPS[whistleStepIdx].displayTitle}
                </T>
                <T
                  style={{
                    fontSize: 14,
                    textAlign: "center",
                    color: WHISTLE_CADENCE_STEPS[whistleStepIdx].isBlasting
                      ? C.white
                      : C.ink,
                  }}
                >
                  {WHISTLE_CADENCE_STEPS[whistleStepIdx].displayInstruction}
                </T>
                <T
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 22,
                    color: WHISTLE_CADENCE_STEPS[whistleStepIdx].isBlasting
                      ? C.white
                      : C.orangeDark,
                  }}
                >
                  {whistleSecondsLeft}s
                </T>
              </View>
            )}

            {/* Controls */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={
                    whistleActive ? "Stop Cadence" : "Start Whistle Cadence"
                  }
                  variant={whistleActive ? "outline" : "orange"}
                  onPress={() => {
                    if (whistleActive) {
                      setWhistleActive(false);
                      setWhistleStepIdx(0);
                      setWhistleSecondsLeft(
                        WHISTLE_CADENCE_STEPS[0].durationSeconds,
                      );
                    } else {
                      setWhistleStepIdx(0);
                      setWhistleSecondsLeft(
                        WHISTLE_CADENCE_STEPS[0].durationSeconds,
                      );
                      setWhistleActive(true);
                    }
                  }}
                />
              </View>
              <Button
                label={audioToneEnabled ? "Audio ON" : "Audio OFF"}
                variant="outline"
                icon={audioToneEnabled ? Volume2 : VolumeX}
                onPress={() => setAudioToneEnabled((v) => !v)}
              />
            </View>

            <Callout title="SAR Responder Reply Doctrine">
              Search &amp; Rescue ground teams reply with 2 blasts. If you hear 2
              blasts, stay completely stationary and blast 3 times in return to
              triangulate your position.
            </Callout>
          </Card>

          {/* Visual Screen Beacon */}
          <Kicker>Visual screen beacon &amp; optical signals</Kicker>
          <Card style={{ padding: 16, gap: 10 }}>
            <Heading>Screen Light Signals</Heading>
            <T style={s.note}>
              Turn phone screen outward to attract ground searchers or aircraft.
            </T>
            <View style={{ gap: 8, marginTop: 6 }}>
              <Button
                label="Emergency Strobe (High-Frequency)"
                variant="orange"
                icon={Flashlight}
                onPress={() => {
                  setStrobeState(true);
                  setBeaconMode("strobe");
                }}
              />
              <Button
                label="Optical Morse SOS (... --- ...)"
                variant="primary"
                icon={Radio}
                onPress={() => {
                  setMorseIdx(0);
                  setBeaconMode("sos");
                }}
              />
              <Button
                label="Night-Vision Red Lantern"
                variant="outline"
                icon={Eye}
                onPress={() => {
                  setBeaconMode("red");
                }}
              />
              <Button
                label="Daylight Signal Mirror Sight"
                variant="outline"
                icon={Sun}
                onPress={() => {
                  setBeaconMode("mirror");
                }}
              />
            </View>
          </Card>

          {/* Ground to Air Doctrine */}
          <Kicker>Ground-to-air visual signals</Kicker>
          <Card style={{ padding: 14, gap: 8 }}>
            <T style={{ fontFamily: fonts.bold, fontSize: 14 }}>
              Body Signals for Aircraft:
            </T>
            <T style={{ fontSize: 13, lineHeight: 20 }}>
              • <T style={{ fontFamily: fonts.bold }}>Both arms up in &apos;V&apos;</T> =
              &quot;Require assistance (YES)&quot;
            </T>
            <T style={{ fontSize: 13, lineHeight: 20 }}>
              • <T style={{ fontFamily: fonts.bold }}>One arm up, one down</T> =
              &quot;All OK (NO)&quot;
            </T>
            <T style={{ fontSize: 13, lineHeight: 20 }}>
              • <T style={{ fontFamily: fonts.bold }}>Night Search</T>: Never
              shine high-powered lights straight into a helicopter cockpit.
              Sweep your beam horizontally along tree branches or rocks near
              you.
            </T>
          </Card>
        </View>
      )}

      {/* ====================================================================
          TAB 3: BACKCOUNTRY UTILITIES SUITE
         ==================================================================== */}
      {activeTab === "backcountry" && (
        <View style={{ gap: 16 }}>
          {/* Avalanche Inclinometer */}
          <Kicker>Avalanche slope inclinometer</Kicker>
          <Card style={{ padding: 16, gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ gap: 2 }}>
                <Heading>Slope Angle Meter</Heading>
                <T style={s.note}>Place phone edge along slope or ski pole</T>
              </View>
              <Compass size={28} color={C.green} />
            </View>

            {/* Angle & Risk Banner */}
            <View
              style={{
                backgroundColor:
                  slopeRisk.level === "prime" ? "#FDF0ED" : C.checkBg,
                borderColor: slopeRisk.color,
                borderWidth: 2,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                gap: 4,
              }}
            >
              <T
                style={{
                  fontFamily: fonts.display,
                  fontSize: 48,
                  lineHeight: 54,
                  color: slopeRisk.color,
                }}
              >
                {deviceTilt}°
              </T>
              <T
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 14,
                  color: slopeRisk.color,
                  textAlign: "center",
                }}
              >
                {slopeRisk.title}
              </T>
              <T
                style={{
                  fontSize: 12,
                  textAlign: "center",
                  color: C.ink,
                  lineHeight: 18,
                }}
              >
                {slopeRisk.description}
              </T>
            </View>

            {/* Angle Adjustment / Sensor Button */}
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Button
                label="-5°"
                variant="outline"
                small
                onPress={() => setDeviceTilt((v) => Math.max(0, v - 5))}
              />
              <Button
                label="-1°"
                variant="outline"
                small
                onPress={() => setDeviceTilt((v) => Math.max(0, v - 1))}
              />
              <View style={{ flex: 1 }}>
                <Button
                  label={isMeasuringTilt ? "Sensor Active" : "Use Tilt Sensor"}
                  variant={isMeasuringTilt ? "primary" : "outline"}
                  small
                  onPress={() => setIsMeasuringTilt((v) => !v)}
                />
              </View>
              <Button
                label="+1°"
                variant="outline"
                small
                onPress={() => setDeviceTilt((v) => Math.min(90, v + 1))}
              />
              <Button
                label="+5°"
                variant="outline"
                small
                onPress={() => setDeviceTilt((v) => Math.min(90, v + 5))}
              />
            </View>
          </Card>

          {/* Naismith Hiking Time Estimator */}
          <Kicker>Pace &amp; mountain hiking time (Naismith&apos;s Rule)</Kicker>
          <Card style={{ padding: 16, gap: 12 }}>
            <Heading>Hiking Time Estimator</Heading>
            <T style={s.note}>
              Calculates mountain travel time with elevation and pack weight.
            </T>

            {/* Controls */}
            <View style={{ gap: 10 }}>
              {/* Miles */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <T style={{ fontFamily: fonts.bold }}>
                  Distance: {hikingMiles} miles
                </T>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Button
                    label="-1"
                    variant="outline"
                    small
                    onPress={() => setHikingMiles((m) => Math.max(1, m - 1))}
                  />
                  <Button
                    label="+1"
                    variant="outline"
                    small
                    onPress={() => setHikingMiles((m) => m + 1)}
                  />
                  <Button
                    label="+5"
                    variant="outline"
                    small
                    onPress={() => setHikingMiles((m) => m + 5)}
                  />
                </View>
              </View>

              {/* Elevation Gain */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <T style={{ fontFamily: fonts.bold }}>
                  Ascent: +{hikingGainFt} ft
                </T>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Button
                    label="-500"
                    variant="outline"
                    small
                    onPress={() => setHikingGainFt((g) => Math.max(0, g - 500))}
                  />
                  <Button
                    label="+500"
                    variant="outline"
                    small
                    onPress={() => setHikingGainFt((g) => g + 500)}
                  />
                </View>
              </View>

              {/* Elevation Loss */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <T style={{ fontFamily: fonts.bold }}>
                  Descent: -{hikingLossFt} ft
                </T>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Button
                    label="-500"
                    variant="outline"
                    small
                    onPress={() => setHikingLossFt((l) => Math.max(0, l - 500))}
                  />
                  <Button
                    label="+500"
                    variant="outline"
                    small
                    onPress={() => setHikingLossFt((l) => l + 500)}
                  />
                </View>
              </View>

              {/* Pace & Pack */}
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Chip
                  label="Casual"
                  selected={hikingPace === "casual"}
                  onPress={() => setHikingPace("casual")}
                />
                <Chip
                  label="Moderate"
                  selected={hikingPace === "moderate"}
                  onPress={() => setHikingPace("moderate")}
                />
                <Chip
                  label="Fast"
                  selected={hikingPace === "fast"}
                  onPress={() => setHikingPace("fast")}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Chip
                  label="Day Pack"
                  selected={hikingPack === "light"}
                  onPress={() => setHikingPack("light")}
                />
                <Chip
                  label="Overnight (30 lbs)"
                  selected={hikingPack === "overnight"}
                  onPress={() => setHikingPack("overnight")}
                />
                <Chip
                  label="Heavy Pack"
                  selected={hikingPack === "heavy"}
                  onPress={() => setHikingPack("heavy")}
                />
              </View>
            </View>

            {/* Estimated Output */}
            <View
              style={{
                backgroundColor: C.checkBg,
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
                gap: 4,
              }}
            >
              <T
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 11,
                  color: C.kicker,
                }}
              >
                ESTIMATED TRAIL TIME
              </T>
              <T
                style={{
                  fontFamily: fonts.display,
                  fontSize: 34,
                  lineHeight: 40,
                  color: C.heading,
                }}
              >
                {hikingEstimate.formattedDuration}
              </T>
              <T style={{ fontSize: 12, color: C.ink }}>
                Base flat: {hikingEstimate.flatHours}h · Ascent: +
                {hikingEstimate.ascentMinutes}m · Descent: +
                {hikingEstimate.descentMinutes}m
              </T>
            </View>
          </Card>

          {/* Water Treatment Timer */}
          <Kicker>Water treatment &amp; cold-water countdown</Kicker>
          <Card style={{ padding: 16, gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ gap: 2 }}>
                <Heading>Disinfection Timer</Heading>
                <T style={s.note}>
                  Chemical purifiers take longer in cold snowmelt
                </T>
              </View>
              <Timer size={28} color={C.green} />
            </View>

            {/* Preset Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingBottom: 4 }}
            >
              {WATER_TREATMENT_PRESETS.map((p) => (
                <Chip
                  key={p.id}
                  label={p.name}
                  selected={selectedWaterPreset === p.id}
                  onPress={() => handleSelectWaterPreset(p)}
                />
              ))}
            </ScrollView>

            {/* Instructions */}
            <View
              style={{
                backgroundColor: C.checkBg,
                padding: 12,
                borderRadius: 8,
                gap: 4,
              }}
            >
              <T style={{ fontFamily: fonts.bold, fontSize: 13 }}>
                {currentWaterPreset.waterCondition}
              </T>
              <T style={{ fontSize: 12, lineHeight: 18, color: C.ink }}>
                {currentWaterPreset.instructions}
              </T>
            </View>

            {/* Timer Display */}
            <View
              style={{
                alignItems: "center",
                gap: 4,
                paddingVertical: 6,
              }}
            >
              <T
                style={{
                  fontFamily: fonts.display,
                  fontSize: 44,
                  lineHeight: 50,
                  color: waterSecondsLeft === 0 ? C.green : C.heading,
                }}
              >
                {Math.floor(waterSecondsLeft / 60)}:
                {(waterSecondsLeft % 60).toString().padStart(2, "0")}
              </T>
              {waterSecondsLeft === 0 && (
                <T style={{ fontFamily: fonts.bold, color: C.green }}>
                  ✓ TREATMENT COMPLETE — SAFE TO DRINK
                </T>
              )}
            </View>

            {/* Controls */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={
                    waterTimerRunning
                      ? "Pause Timer"
                      : waterSecondsLeft === 0
                        ? "Restart Timer"
                        : "Start Timer"
                  }
                  variant={waterTimerRunning ? "outline" : "primary"}
                  onPress={() => {
                    if (waterSecondsLeft === 0) {
                      setWaterSecondsLeft(currentWaterPreset.durationSeconds);
                      setWaterTimerRunning(true);
                    } else {
                      setWaterTimerRunning((v) => !v);
                    }
                  }}
                />
              </View>
              <Button
                label="Reset"
                variant="outline"
                onPress={() => {
                  setWaterTimerRunning(false);
                  setWaterSecondsLeft(currentWaterPreset.durationSeconds);
                }}
              />
            </View>
          </Card>

          {/* Additional Wilderness Utilities Analysis */}
          <Kicker>Other high-value offline hiker utilities</Kicker>
          <Card style={{ padding: 14, gap: 8 }}>
            <T style={{ fontFamily: fonts.bold, fontSize: 14 }}>
              Planned Wilderness Tools Roadmap:
            </T>
            <T style={{ fontSize: 13, lineHeight: 20 }}>
              • <T style={{ fontFamily: fonts.bold }}>Wind Chill &amp; Wet Cold Matrix</T>:
              Calculates &quot;Cascade Concrete&quot; hypothermia risk when rain is combined
              with 40°F–50°F wind.
            </T>
            <T style={{ fontSize: 13, lineHeight: 20 }}>
              • <T style={{ fontFamily: fonts.bold }}>Backcountry SOAP Handover</T>:
              Standard emergency field scratchpad for recording pulse, respiration,
              and Glasgow Coma Scale (GCS) for incoming SAR paramedics.
            </T>
            <T style={{ fontSize: 13, lineHeight: 20 }}>
              • <T style={{ fontFamily: fonts.bold }}>Satellite 160-Char Formatter</T>:
              Optimizes coordinates and injury codes into a compact text string
              under Garmin inReach and ZOLEO byte budgets.
            </T>
          </Card>
        </View>
      )}

      {/* ====================================================================
          FULLSCREEN BEACON MODAL
         ==================================================================== */}
      <Modal
        visible={beaconMode !== null}
        animationType="none"
        transparent={false}
        onRequestClose={() => setBeaconMode(null)}
      >
        <Pressable
          onPress={() => setBeaconMode(null)}
          style={{
            flex: 1,
            backgroundColor:
              beaconMode === "red"
                ? "#FF0000"
                : beaconMode === "mirror"
                  ? "#FFFFFF"
                  : isBeaconLightActive
                    ? "#FFFFFF"
                    : "#000000",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          {beaconMode === "strobe" && (
            <View style={styles.beaconOverlay}>
              <AlertTriangle
                size={32}
                color={isBeaconLightActive ? "#000" : "#FFF"}
              />
              <T
                style={[
                  styles.beaconText,
                  { color: isBeaconLightActive ? "#000" : "#FFF" },
                ]}
              >
                EMERGENCY STROBE ACTIVE
              </T>
              <T
                style={[
                  styles.beaconSubtext,
                  { color: isBeaconLightActive ? "#333" : "#CCC" },
                ]}
              >
                Tap anywhere to stop
              </T>
            </View>
          )}

          {beaconMode === "sos" && (
            <View style={styles.beaconOverlay}>
              <Radio
                size={32}
                color={isBeaconLightActive ? "#000" : "#FFF"}
              />
              <T
                style={[
                  styles.beaconText,
                  { color: isBeaconLightActive ? "#000" : "#FFF" },
                ]}
              >
                OPTICAL MORSE SOS
              </T>
              <T
                style={[
                  styles.beaconSubtext,
                  { color: isBeaconLightActive ? "#333" : "#CCC" },
                ]}
              >
                {isBeaconLightActive ? "LIGHT ON" : "PAUSE"} · Tap anywhere to
                exit
              </T>
            </View>
          )}

          {beaconMode === "red" && (
            <View style={styles.beaconOverlay}>
              <Eye size={32} color="#FFF" />
              <T style={[styles.beaconText, { color: "#FFF" }]}>
                NIGHT-VISION RED
              </T>
              <T style={[styles.beaconSubtext, { color: "#FFF" }]}>
                Preserves rhodopsin dark adaptation · Tap to exit
              </T>
            </View>
          )}

          {beaconMode === "mirror" && (
            <View style={styles.beaconOverlay}>
              <Sun size={48} color="#000" />
              <T style={[styles.beaconText, { color: "#000" }]}>
                DAYLIGHT SIGNAL MIRROR
              </T>
              <T style={[styles.beaconSubtext, { color: "#222" }]}>
                Hold two fingers in a &apos;V&apos; over aircraft. Flash light
                through the &apos;V&apos;. Tap to exit.
              </T>
            </View>
          )}
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  beaconOverlay: {
    alignItems: "center",
    gap: 12,
    padding: 20,
  },
  beaconText: {
    fontFamily: fonts.display,
    fontSize: 26,
    textAlign: "center",
    letterSpacing: 1,
  },
  beaconSubtext: {
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: "center",
  },
});
