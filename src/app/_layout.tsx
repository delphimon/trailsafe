import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Platform } from "react-native";

if (typeof window !== 'undefined' && Platform.OS !== 'web') {
  const Bugsnag = require('@bugsnag/expo').default || require('@bugsnag/expo');
  Bugsnag.start({
    onError: function (event: any) {
      // Redact sensitive data from Bugsnag reports
      event.context = "redacted";
      event.user = {};
      event.addMetadata('device', 'id', 'redacted');
    }
  });
}
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
import { LocationProvider } from "@/hooks/use-location";
import {
  AppOverlays,
  BottomBar,
  PracticeBanner,
} from "@/components/trailsafe/shell";
import { useThemeStyles } from "@/components/trailsafe/ui";
import { indexGuideContent } from "@/lib/search-indexing";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { C } = useThemeStyles();
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
    if (ready) {
      void SplashScreen.hideAsync().catch(() => {});
      void indexGuideContent().catch(() => {});
    }
  }, [ready]);
  // Mount native Text after font registration; never block emergency access on a font failure.
  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <LocationProvider>
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
        </LocationProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
