import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  BarlowCondensed_600SemiBold,
} from "@expo-google-fonts/barlow-condensed";
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_700Bold,
} from "@expo-google-fonts/public-sans";
import { StoreProvider } from "@/state/store";
import { AppProvider } from "@/state/app";
import {
  AppOverlays,
  BottomBar,
  PracticeBanner,
} from "@/components/trailsafe/shell";
import { C } from "@/components/trailsafe/ui";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_600SemiBold,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_700Bold,
  });
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setFontTimeout(true), 2000);
    return () => clearTimeout(timer);
  }, []);
  const ready = fontsLoaded || !!fontError || fontTimeout;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  // Mount native Text after font registration; never block emergency access on a font failure.
  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <AppProvider>
          <StatusBar style="light" />
          <View
            style={{ flex: 1, backgroundColor: C.deep, alignItems: "center" }}
          >
            <View
              style={{
                flex: 1,
                width: "100%",
                maxWidth: 620,
                backgroundColor: C.paper,
              }}
            >
              <PracticeBanner />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: C.paper },
                  animation: "none",
                }}
              />
              <BottomBar />
              <AppOverlays />
            </View>
          </View>
        </AppProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
