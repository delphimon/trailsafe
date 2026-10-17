import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { isLoaded, useFonts } from "expo-font";
import { initializeDiagnostics } from "@/lib/diagnostics";

import { router, type ErrorBoundaryProps } from "expo-router";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BarlowCondensed_600SemiBold } from "@expo-google-fonts/barlow-condensed/600SemiBold";
import { PublicSans_400Regular } from "@expo-google-fonts/public-sans/400Regular";
import { PublicSans_500Medium } from "@expo-google-fonts/public-sans/500Medium";
import { PublicSans_700Bold } from "@expo-google-fonts/public-sans/700Bold";
import { StoreProvider } from "@/state/store";
import { AppProvider } from "@/state/app";
import { LocationProvider } from "@/hooks/use-location";
import { AppOverlays, BottomBar } from "@/components/trailsafe/shell";
import {
  Button,
  Callout,
  Heading,
  T,
  useThemeStyles,
} from "@/components/trailsafe/ui";
import { indexGuideContent } from "@/lib/search-indexing";

initializeDiagnostics();
void SplashScreen.preventAutoHideAsync().catch(() => {});

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { C } = useThemeStyles();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.paper,
        padding: 24,
        justifyContent: "center",
        gap: 12,
      }}
    >
      <Heading>Something went wrong</Heading>
      <Callout critical title="Emergency access is still available">
        In an emergency, call or text 911 directly from your phone or open the
        Help screen below.
      </Callout>
      <T selectable>{error.message || "Unexpected screen error."}</T>
      <Button label="Try again" onPress={() => void retry()} />
      <Button
        label="Need Help? (911 & GPS)"
        variant="orange"
        onPress={() => router.replace("/emergency")}
      />
    </View>
  );
}

export default function RootLayout() {
  const { C } = useThemeStyles();
  const fontsEmbedded =
    Platform.OS !== "web" &&
    isLoaded("BarlowCondensed_600SemiBold") &&
    isLoaded("PublicSans_400Regular") &&
    isLoaded("PublicSans_500Medium") &&
    isLoaded("PublicSans_700Bold");
  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_600SemiBold,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_700Bold,
  });
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    if (fontsEmbedded || fontsLoaded) return;
    const timer = setTimeout(() => setFontTimeout(true), 2000);
    return () => clearTimeout(timer);
  }, [fontsEmbedded, fontsLoaded]);
  const ready = fontsEmbedded || fontsLoaded || !!fontError || fontTimeout;
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
                <Stack
                  unstable_screenErrorBoundary={ErrorBoundary}
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
