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
    .toContain("Accuracy: ±8 m");
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

test("saved profile survives reload and prefills a new plan", async ({
  page,
}) => {
  await page.goto("/profile");
  await ready(page);
  await page
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Test Profile");
  await page.getByRole("button", { name: "Save Profile", exact: true }).click();
  await expect(
    page.getByText("Profile saved on this device", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Your name", exact: true }),
  ).toHaveValue("Test Profile");
  await page.goto("/plans/new");
  await expect(
    page.getByRole("textbox", { name: "Your name", exact: true }),
  ).toHaveValue("Test Profile");
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
