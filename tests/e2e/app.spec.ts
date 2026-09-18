import { test, expect, type Page } from "@playwright/test";

declare global {
  interface Window {
    locationWatches: number;
    locationClears: number;
    sharedText: string;
    copiedText: string;
    externalCalls: string[];
  }
}
async function setupLocation(
  page: Page,
  options: {
    denied?: boolean;
    stale?: boolean;
    accuracy?: number;
    lat?: number;
    lon?: number;
  } = {},
) {
  await page.addInitScript((opts) => {
    window.locationWatches = 0;
    window.locationClears = 0;
    window.sharedText = "";
    window.copiedText = "";
    window.externalCalls = [];
    const position = {
      coords: {
        latitude: opts.lat ?? 47.42537,
        longitude: opts.lon ?? -121.41382,
        accuracy: opts.accuracy ?? 8,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now() - (opts.stale ? 180000 : 0),
    };
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        query: async () => ({
          state: opts.denied ? "denied" : "granted",
          addEventListener() {},
          removeEventListener() {},
        }),
      },
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: (p: unknown) => void) =>
          success(position),
        watchPosition: (success: (p: unknown) => void) => {
          window.locationWatches++;
          setTimeout(() => success(position), 20);
          return 17;
        },
        clearWatch: () => {
          window.locationClears++;
        },
      },
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: { text?: string }) => {
        window.sharedText = data.text || "";
      },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          window.copiedText = text;
        },
      },
    });
    window.open = ((url: string) => {
      window.externalCalls.push(String(url));
      return null;
    }) as typeof window.open;
  }, options);
}
async function ready(page: Page) {
  await page.getByRole("tab", { name: "Home", exact: true }).waitFor();
  await expect
    .poll(() =>
      page.evaluate(() => document.fonts.check("16px PublicSans_400Regular")),
    )
    .toBe(true);
}

test("prototype home, automatic coordinates, dropdown persistence, and watcher cleanup", async ({
  page,
}) => {
  await setupLocation(page);
  await page.goto("/");
  await ready(page);
  await page.screenshot({ path: "docs/screenshots/home.png" });
  expect(await page.evaluate(() => window.locationWatches)).toBe(0);
  await page.getByRole("button", { name: "NEED HELP?", exact: true }).click();
  await expect(page.getByTestId("coordinates")).toContainText("47.42537° N");
  await expect(
    page.getByRole("button", { name: "Get Location", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Coordinate format", exact: true })
    .click();
  await page
    .getByRole("radio", {
      name: "Degrees & decimal minutes (DDM)",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("coordinates")).toContainText("47° 25.522′ N");
  await page
    .getByRole("button", { name: "Coordinate format", exact: true })
    .click();
  await page
    .getByRole("radio", {
      name: "Universal Transverse Mercator (UTM)",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("coordinates")).toContainText("10T");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.copiedText))
    .toContain("UTM, WGS84");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.sharedText))
    .toContain("Accuracy: ±26 ft");
  await page.screenshot({ path: "docs/screenshots/emergency-utm.png" });
  await page.reload();
  await expect(page.getByTestId("coordinates")).toContainText("10T");
  await page.getByRole("tab", { name: "Home", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.locationClears))
    .toBeGreaterThan(0);
});

test("denied location never blocks emergency actions", async ({ page }) => {
  await setupLocation(page, { denied: true });
  await page.goto("/emergency");
  await ready(page);
  await expect(
    page.getByText("Location permission denied", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "CALL 911", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Copy", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Share", exact: true }),
  ).toBeDisabled();
  expect(await page.evaluate(() => window.locationWatches)).toBe(0);
});

test("stale and poor accuracy are visible and retained when sharing", async ({
  page,
}) => {
  await setupLocation(page, { stale: true, accuracy: 350 });
  await page.goto("/emergency");
  await ready(page);
  await expect(page.getByText(/STALE LOCATION/)).toBeVisible();
  await expect(page.getByText(/LOW ACCURACY/)).toBeVisible();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.sharedText))
    .toContain("STALE LOCATION");
});

test("practice actions across emergency and guide screens never open a handoff", async ({
  page,
}) => {
  await setupLocation(page);
  await page.goto("/emergency");
  await ready(page);
  await page
    .getByRole("button", { name: "Practice Emergency Mode", exact: true })
    .click();
  await page.getByRole("button", { name: "CALL 911", exact: true }).click();
  await expect(page.getByText(/Nothing was contacted/)).toBeVisible();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await page.getByRole("button", { name: "TEXT 911", exact: true }).click();
  await expect(page.getByText(/Nothing was contacted/)).toBeVisible();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await page
    .getByRole("button", { name: "Lost / off route", exact: true })
    .click();
  await page.getByRole("button", { name: "Call 911", exact: true }).click();
  await expect(page.getByText(/Nothing was contacted/)).toBeVisible();
  expect(await page.evaluate(() => window.externalCalls)).toEqual([]);
});

test("checklist, search, and articles work offline after launch", async ({
  page,
  context,
}) => {
  await setupLocation(page);
  await page.goto("/");
  await ready(page);
  await context.setOffline(true);
  await page.getByRole("tab", { name: "Prepare", exact: true }).click();
  await page.getByRole("checkbox", { name: "Hydration", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Hydration", exact: true }),
  ).toBeChecked();
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search safety topics", exact: true })
    .fill("hypothermia");
  await page.getByRole("button", { name: /Cold & hypothermia/ }).click();
  await expect(
    page.getByText("Recognize it early", { exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
  await page.goto("/prepare");
  await expect(
    page.getByRole("checkbox", { name: "Hydration", exact: true }),
  ).toBeChecked();
  await page.screenshot({ path: "docs/screenshots/prepare.png" });
});

test("trip creation, midnight buffer, persistence, editing, and deletion", async ({
  page,
}) => {
  await setupLocation(page);
  await page.goto("/plans/new");
  await ready(page);
  const fields: { [label: string]: string } = {
    "Trip title / destination": "Granite Mountain test",
    "Your name": "Test Hiker",
    "Party size": "2",
    "Phone / contact method": "206 555 0100",
    "Starting location / trailhead": "Granite Mountain Trailhead, King County",
    "Planned route": "Summit\nReturn on same trail",
    "Start date": "2026-09-06",
    "Start time": "08:00",
    "Return date": "2026-09-06",
    "Expected return": "23:00",
  };
  for (const [label, value] of Object.entries(fields))
    await page.getByRole("textbox", { name: label, exact: true }).fill(value);
  await page
    .getByRole("button", {
      name: "Suggest: expected return + 2 hours",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Overdue date", exact: true }),
  ).toHaveValue("2026-09-07");
  await page
    .getByRole("button", { name: "Generate Plan", exact: true })
    .click();
  await expect(page.getByTestId("plan-preview")).toContainText(
    "2026-09-07 01:00",
  );
  await page
    .getByRole("button", { name: "Mark as Current", exact: true })
    .click();
  await expect(page.getByTestId("plan-preview")).toContainText("CURRENT");
  await page
    .getByRole("button", { name: "Share Trip Plan Now", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.sharedText))
    .toContain("not monitored");
  await page.goto("/plans");
  await expect(
    page.getByText("Granite Mountain test", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Granite Mountain test", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Planned route", exact: true })
    .fill("Changed route\nStay on main trail");
  await page
    .getByRole("button", { name: "Generate Plan", exact: true })
    .click();
  await expect(page.getByTestId("plan-preview")).toContainText("Changed route");
  await page
    .getByRole("button", { name: "Share Trip Plan Now", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.sharedText))
    .toContain("Changed route");
  await expect
    .poll(() => page.evaluate(() => window.sharedText))
    .toContain("UPDATED");
  await page.goto("/plans");
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(
    page.getByRole("textbox", {
      name: "Trip title / destination",
      exact: true,
    }),
  ).toHaveValue("Granite Mountain test (copy)");
  await page.goto("/plans");
  await expect(
    page.getByRole("button", { name: "Delete", exact: true }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Delete", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Delete plan", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Delete", exact: true }),
  ).toHaveCount(1);
});

test("saved profile survives reload and prefills a new plan with dual vehicle selection", async ({
  page,
}) => {
  await page.goto("/profile");
  await ready(page);
  await page
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Test Profile");
  await page
    .getByRole("textbox", { name: "Car 1: Color, make, model", exact: true })
    .fill("Silver Subaru Outback");
  await page
    .getByRole("textbox", { name: "Car 1: License plate and state", exact: true })
    .fill("WA SUB123");
  await page
    .getByRole("textbox", { name: "Car 2: Color, make, model", exact: true })
    .fill("Blue Rivian R1S");
  await page
    .getByRole("textbox", { name: "Car 2: License plate and state", exact: true })
    .fill("WA RIV789");

  await page.getByRole("button", { name: "Save Profile", exact: true }).click();
  await expect(
    page.getByText("Profile saved on this device", { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Your name", exact: true }),
  ).toHaveValue("Test Profile");
  await expect(
    page.getByRole("textbox", { name: "Car 1: Color, make, model", exact: true }),
  ).toHaveValue("Silver Subaru Outback");
  await expect(
    page.getByRole("textbox", { name: "Car 2: Color, make, model", exact: true }),
  ).toHaveValue("Blue Rivian R1S");

  await page.goto("/plans/new");
  await ready(page);
  await expect(
    page.getByRole("textbox", { name: "Your name", exact: true }),
  ).toHaveValue("Test Profile");
  await expect(
    page.getByRole("textbox", { name: "Vehicle color, make, model", exact: true }),
  ).toHaveValue("Silver Subaru Outback");
  await expect(
    page.getByRole("textbox", { name: "License plate and state", exact: true }),
  ).toHaveValue("WA SUB123");

  // Select Car 2 and verify fields update
  const car2Button = page.getByRole("button", { name: /Car 2:/ });
  await expect(car2Button).toBeVisible();
  await car2Button.click();

  await expect(
    page.getByRole("textbox", { name: "Vehicle color, make, model", exact: true }),
  ).toHaveValue("Blue Rivian R1S");
  await expect(
    page.getByRole("textbox", { name: "License plate and state", exact: true }),
  ).toHaveValue("WA RIV789");

  // Switch back to Car 1
  const car1Button = page.getByRole("button", { name: /Car 1:/ });
  await expect(car1Button).toBeVisible();
  await car1Button.click();

  await expect(
    page.getByRole("textbox", { name: "Vehicle color, make, model", exact: true }),
  ).toHaveValue("Silver Subaru Outback");
  await expect(
    page.getByRole("textbox", { name: "License plate and state", exact: true }),
  ).toHaveValue("WA SUB123");
});

test("small screen has no horizontal overflow and retains all tabs", async ({
  page,
}) => {
  await setupLocation(page);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/emergency");
  await ready(page);
  await expect(page.getByTestId("coordinates")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await expect(
    page.getByRole("tab", { name: "Emergency", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/emergency-small.png" });
});

test("about screen displays native build and update info with check for updates action", async ({
  page,
}) => {
  await page.goto("/about");
  await ready(page);
  await expect(page.getByText("Version Details")).toBeVisible();
  await expect(page.getByTestId("build-version")).toContainText(/\d+\.\d+\.\d+/);
  await expect(page.getByText("OTA Status")).toBeVisible();
  const checkBtn = page.getByRole("button", { name: "Check for Updates" });
  await expect(checkBtn).toBeVisible();
  await checkBtn.click();
  await expect(
    page.getByText(
      /OTA updates are only active on installed native builds|You are on the latest update/,
    ),
  ).toBeVisible();
});

test("wilderness tools screen navigates, calculates forest dusk, runs signaling tools, and backcountry utilities", async ({
  page,
}) => {
  await setupLocation(page, { lat: 47.425, lon: -121.414 });
  await page.goto("/tools");
  await ready(page);

  // Check header and tab navigation
  await expect(page.getByText("Wilderness Tools")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Tools", exact: true })).toBeVisible();

  // Verify Solar & Forest Dusk
  await expect(
    page.getByText(/TRAIL LIGHT REMAINING|HEADLAMP REQUIRED/),
  ).toBeVisible();
  await expect(page.getByText(/Headlamp needed/i)).toBeVisible();
  await expect(
    page.getByText(/Estimates are based on a clear sky/i).first(),
  ).toBeVisible();
  await expect(page.getByText("Astronomical solar table")).toBeVisible();
  await expect(page.getByText("Civil Twilight (Open Dusk)")).toBeVisible();

  // Switch canopy preset
  await page.getByRole("button", { name: "Dense Timber (-60m)" }).click();
  await page.screenshot({ path: "docs/screenshots/tools-solar.png" });

  // Switch to Signaling tab
  await page.getByRole("button", { name: "Signaling" }).click();
  await expect(page.getByText("Alpine distress whistle cadence")).toBeVisible();
  await expect(page.getByText("Universal 3-Blast Signal")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/tools-signaling.png" });

  // Start whistle cadence
  const startCadenceBtn = page.getByRole("button", { name: "Start Whistle Cadence" });
  await expect(startCadenceBtn).toBeVisible();
  await startCadenceBtn.click();
  await expect(page.getByText(/BLAST 1 OF 3/)).toBeVisible();
  await page.getByRole("button", { name: "Stop Cadence" }).click();

  // Launch Strobe modal and dismiss
  await page.getByRole("button", { name: "Emergency Strobe (High-Frequency)" }).click();
  await expect(page.getByText("EMERGENCY STROBE ACTIVE")).toBeVisible();
  await page.getByText("EMERGENCY STROBE ACTIVE").click();
  await expect(page.getByText("EMERGENCY STROBE ACTIVE")).not.toBeVisible();

  // Switch to Hazards tab
  await page.getByRole("button", { name: "Hazards" }).click();
  await expect(page.getByText("Avalanche slope inclinometer")).toBeVisible();
  await expect(page.getByText("PRIME AVALANCHE ZONE (30°–45°)")).toBeVisible();

  // Verify Hypothermia & Wind Chill Index (Cascade Concrete Hazard)
  await expect(page.getByRole("heading", { name: "Hypothermia & Wind Chill", exact: true })).toBeVisible();
  await expect(page.getByText("CASCADE CONCRETE ZONE")).toBeVisible();
  await expect(page.getByText("Why Wet Cold Kills: 4 Life-Safety Principles")).toBeVisible();
  await expect(page.getByText("Core Chill Equivalent (Feels Like)")).toBeVisible();
  await expect(page.getByText(/Early Warning: The "Umbles" Checklist/)).toBeVisible();
  await expect(page.getByText(/Search & Rescue Field Protocol/i)).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/tools-hazards.png" });

  // Switch preset to Crisp Alpine Ridge (Dry)
  await page.getByRole("button", { name: "Crisp Alpine Ridge (Dry)" }).click();
  await expect(page.getByText(/Dry Clothing \(0°F penalty\)/).first()).toBeVisible();

  // Switch to Backcountry tab
  await page.getByRole("button", { name: "Backcountry" }).click();
  await expect(page.getByText("Compass Navigation")).toBeVisible();
  await expect(page.getByText("Magnetic Declination")).toBeVisible();
  await expect(page.getByText("Hiking Time Estimator")).toBeVisible();
  await expect(page.getByText("Disinfection Timer")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/tools-backcountry.png" });
});

