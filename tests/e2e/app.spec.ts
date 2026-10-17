import { newPlan } from "../../src/lib/plans";
import { initialData } from "../../src/lib/persistence";
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
  await page.getByRole("tab", { name: "Prepare", exact: true }).waitFor();
  await expect
    .poll(() =>
      page.evaluate(() => document.fonts.check("16px PublicSans_400Regular")),
    )
    .toBe(true);
}

test("browser preview blocks background telemetry requests while bundled fonts load", async ({
  page,
}) => {
  await setupLocation(page);
  let sent = 0;
  await page.route("**/telemetry-probe", async (route) => {
    sent++;
    await route.fulfill({ status: 204 });
  });
  await page.goto("/");
  await ready(page);
  const result = await page.evaluate(async () => {
    const violation = new Promise<string>((resolve) => {
      document.addEventListener(
        "securitypolicyviolation",
        (event) => resolve(event.effectiveDirective),
        { once: true },
      );
    });
    const rejected = await fetch("/telemetry-probe").then(
      () => false,
      () => true,
    );
    return { rejected, directive: await violation };
  });
  expect(result).toEqual({ rejected: true, directive: "connect-src" });
  expect(sent).toBe(0);
});

test("home landing, automatic coordinates, format persistence, and watcher cleanup", async ({
  page,
}) => {
  await setupLocation(page);
  await page.goto("/");
  await ready(page);
  await page.screenshot({ path: "test-results/screenshots/home.png" });
  expect(await page.evaluate(() => window.locationWatches)).toBe(0);
  await page.getByRole("button", { name: "NEED HELP?", exact: true }).click();
  await expect(page.getByTestId("coordinates")).toContainText("47.42537° N");
  await expect(
    page.getByRole("button", { name: "Get Location", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "DDM", exact: true }).click();
  await expect(page.getByTestId("coordinates")).toContainText("47° 25.522′ N");
  await page.getByRole("button", { name: "UTM", exact: true }).click();
  await expect(page.getByTestId("coordinates")).toContainText("10T");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.copiedText))
    .toContain("UTM, WGS84");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.sharedText))
    .toContain("Accuracy: ±26 ft");
  await page.screenshot({ path: "test-results/screenshots/emergency-utm.png" });
  await page.reload();
  await expect(page.getByTestId("coordinates")).toContainText("10T");
  await page.getByRole("tab", { name: "Prepare", exact: true }).click();
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

test("editable emergency drafts distinguish subject location without opening a handoff", async ({
  page,
}) => {
  await setupLocation(page);
  await page.goto("/emergency");
  await ready(page);
  await expect(page.getByRole("button", { name: /Practice/ })).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Help for someone elsewhere / edit message",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Emergency message" }),
  ).not.toContainText("47.42537");
  await page
    .getByRole("button", { name: "At my location", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Emergency message" }),
  ).toContainText("47.42537");
  await page
    .getByRole("button", { name: "Someone elsewhere", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Emergency message" }),
  ).not.toContainText("47.42537");
  await expect(
    page.getByRole("textbox", { name: "Emergency message" }),
  ).toContainText("last known location");
  expect(await page.evaluate(() => window.externalCalls)).toEqual([]);
  // Deliberately never click native handoff controls. Inert transports are exercised in unit tests.
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
  await page.getByRole("checkbox", { name: "Water", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Water", exact: true }),
  ).toBeChecked();
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search safety topics", exact: true })
    .fill("water boil");
  await expect(
    page.getByRole("button", { name: /Water treatment/ }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search safety topics", exact: true })
    .fill("hypothermia");
  await page.getByRole("button", { name: /Cold & hypothermia/ }).click();
  await expect(
    page.getByText("Watch for changes", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search safety topics", exact: true })
    .fill("calling");
  await page.getByRole("button", { name: /Calling for help/ }).click();
  await expect(
    page.getByText("Regional SAR policy (Washington and nearby PNW)", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "In Washington State, search-and-rescue response does not bill rescued persons.",
      { exact: true },
    ),
  ).toBeVisible();
  await context.setOffline(false);
  await page.goto("/prepare");
  await expect(
    page.getByRole("checkbox", { name: "Water", exact: true }),
  ).toBeChecked();
  await page.screenshot({ path: "test-results/screenshots/prepare.png" });
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
    "Contact name": "Home Contact",
    "Contact phone": "206 555 0199",
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
    .getByRole("button", { name: "Save and preview", exact: true })
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
    .getByRole("button", { name: "Save Changes", exact: true })
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
    .getByRole("textbox", {
      name: "Car 1: License plate and state",
      exact: true,
    })
    .fill("WA SUB123");
  await page
    .getByRole("textbox", { name: "Car 2: Color, make, model", exact: true })
    .fill("Blue Rivian R1S");
  await page
    .getByRole("textbox", {
      name: "Car 2: License plate and state",
      exact: true,
    })
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
    page.getByRole("textbox", {
      name: "Car 1: Color, make, model",
      exact: true,
    }),
  ).toHaveValue("Silver Subaru Outback");
  await expect(
    page.getByRole("textbox", {
      name: "Car 2: Color, make, model",
      exact: true,
    }),
  ).toHaveValue("Blue Rivian R1S");

  await page.goto("/plans/new");
  await ready(page);
  await expect(
    page.getByRole("textbox", { name: "Your name", exact: true }),
  ).toHaveValue("Test Profile");
  await expect(
    page.getByRole("textbox", {
      name: "Vehicle color, make, model",
      exact: true,
    }),
  ).toHaveValue("Silver Subaru Outback");
  await expect(
    page.getByRole("textbox", { name: "License plate and state", exact: true }),
  ).toHaveValue("WA SUB123");

  // Select Car 2 and verify fields update
  const car2Button = page.getByRole("button", { name: /Car 2:/ });
  await expect(car2Button).toBeVisible();
  await car2Button.click();

  await expect(
    page.getByRole("textbox", {
      name: "Vehicle color, make, model",
      exact: true,
    }),
  ).toHaveValue("Blue Rivian R1S");
  await expect(
    page.getByRole("textbox", { name: "License plate and state", exact: true }),
  ).toHaveValue("WA RIV789");

  // Switch back to Car 1
  const car1Button = page.getByRole("button", { name: /Car 1:/ });
  await expect(car1Button).toBeVisible();
  await car1Button.click();

  await expect(
    page.getByRole("textbox", {
      name: "Vehicle color, make, model",
      exact: true,
    }),
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
    page.getByRole("tab", { name: "Help", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/screenshots/emergency-small.png",
  });
});

test("about screen displays native build and update info with check for updates action", async ({
  page,
}) => {
  await page.goto("/about");
  await ready(page);
  await expect(page.getByText("Version Details")).toBeVisible();
  await expect(page.getByTestId("build-version")).toContainText(
    /\d+\.\d+\.\d+/,
  );
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

test("tools put answers above settings and estimates use quick controls", async ({
  page,
}) => {
  await setupLocation(page);
  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto("/tools");
  await ready(page);
  await expect(page.getByTestId("headlamp-result")).not.toContainText(
    "Waiting",
  );
  const box = await page.getByTestId("headlamp-result").boundingBox();
  expect(box!.y + box!.height).toBeLessThan(650);
  await expect(
    page.getByRole("button", { name: "Snoqualmie Pass", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/screenshots/tools-daylight.png",
  });
  await page.getByRole("button", { name: "Compass", exact: true }).click();
  await expect(page.getByTestId("declination-result")).toContainText("E");
  await expect(
    page.getByText(/Magnetic North is .* East of True North/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hiking", exact: true }).click();
  const first = await page.getByTestId("hiking-result").textContent();
  await page.getByRole("button", { name: "10 mi", exact: true }).click();
  await expect(page.getByTestId("hiking-result")).not.toHaveText(first!);
  const slider = page.getByRole("slider", {
    name: "Total distance",
    exact: true,
  });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByText("Total distance: 10.5 miles", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/screenshots/tools-hiking.png" });
  await page.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByText(/Use your phone’s Clock timer/)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Start Timer|Whistle Cadence|Strobe|Hazards/,
    }),
  ).toHaveCount(0);
});
test("denied tools location never substitutes a preset", async ({ page }) => {
  await setupLocation(page, { denied: true });
  await page.goto("/tools");
  await ready(page);
  await expect(page.getByText(/Location unavailable/)).toBeVisible();
  await expect(page.getByTestId("headlamp-result")).toContainText("Waiting");
  await page.getByRole("button", { name: /Location: GPS.*Change/ }).click();
  await page
    .getByRole("button", { name: "Snoqualmie Pass", exact: true })
    .click();
  await expect(page.getByTestId("headlamp-result")).not.toContainText(
    "Waiting",
  );
  await expect(page.getByText(/Today · Snoqualmie Pass/)).toBeVisible();
});
test("Text 911 reaches the intercepted system handoff in one click", async ({
  page,
}) => {
  await setupLocation(page);
  await page.goto("/emergency");
  await ready(page);
  await expect(page.getByTestId("coordinates")).toContainText("47.42537");
  await page.getByRole("button", { name: "TEXT 911", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.externalCalls.length))
    .toBe(1);
  const url = await page.evaluate(() => window.externalCalls[0]);
  expect(url).toMatch(/^sms:911/);
  expect(decodeURIComponent(url)).toContain("47.42537");
  expect(decodeURIComponent(url)).toContain("Emergency at my location");
  await expect(
    page.getByRole("textbox", { name: "Emergency message" }),
  ).toHaveCount(0);
});
test("Home exposes Plan separately from the packing checklist", async ({
  page,
}) => {
  await seedPlan(page, "current");
  await page.goto("/");
  await ready(page);
  await expect(
    page.getByRole("button", { name: "Open current trip", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  for (const name of ["Current", "Upcoming", "Past"])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await expect(page.getByText("Original trip", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Prepare", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Water", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New Trip Plan", exact: true }),
  ).toHaveCount(0);
});

async function seedPlan(page: Page, status: "current" | "completed") {
  const plan = {
    ...newPlan(),
    id: "review-plan",
    status,
    title: "Original trip",
    travelerName: "Test hiker",
    travelerPhone: "2065550100",
    trustedContactName: "Test contact",
    trustedContactPhone: "2065550199",
    partySize: "1",
    trailhead: "Test trailhead",
    route: "Test route",
    date: "2027-01-01",
    startTime: "08:00",
    returnDate: "2027-01-01",
    returnTime: "16:00",
    overdueDate: "2027-01-01",
    overdueTime: "18:00",
    timeZone: "America/Los_Angeles",
  };
  await page.addInitScript(
    (data) => {
      if (!localStorage.getItem("trailsafe.local.v1"))
        localStorage.setItem("trailsafe.local.v1", JSON.stringify(data));
    },
    { ...initialData, plans: [plan] },
  );
}
test("completed edits persist and preserve completed status", async ({
  page,
}) => {
  await setupLocation(page);
  await seedPlan(page, "completed");
  await page.goto("/plans/review-plan?edit=1");
  await ready(page);
  await page
    .getByRole("textbox", { name: "Trip title / destination" })
    .fill("Edited completed trip");
  await page
    .getByRole("button", { name: "Save Changes", exact: true })
    .click();
  await expect(page.getByTestId("plan-preview")).toContainText(
    "Edited completed trip",
  );
  await expect(page.getByTestId("plan-preview")).toContainText("COMPLETED");
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("trailsafe.local.v1")!).plans[0],
  );
  expect(stored.title).toBe("Edited completed trip");
  expect(stored.status).toBe("completed");
});
test("voice-action cancellation returns to a usable plan", async ({ page }) => {
  await setupLocation(page);
  await seedPlan(page, "current");
  await page.goto("/plan/current/complete");
  await ready(page);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByTestId("plan-preview")).toContainText("CURRENT");
  await expect(page.getByText(/Updating your trip/)).toHaveCount(0);
});
test("failed voice storage write never announces completion or changes saved status", async ({
  page,
}) => {
  await setupLocation(page);
  await seedPlan(page, "current");
  await page.goto("/plan/current/complete");
  await ready(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "trailsafe.local.v1")
        throw new Error("Simulated storage failure");
      return original.call(this, key, value);
    };
  });
  await page
    .getByRole("button", { name: "Mark Complete", exact: true })
    .click();
  await expect(
    page.getByText("Could not finish", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Simulated storage failure", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("trailsafe.local.v1")!).plans[0].status,
    ),
  ).toBe("current");
  await expect(page.getByText(/Trip completed locally/)).toHaveCount(0);
});
test("navigation protects unsaved edits", async ({ page }) => {
  await setupLocation(page);
  await page.goto("/plans/new");
  await ready(page);
  await page
    .getByRole("textbox", { name: "Trip title / destination" })
    .fill("Unsaved trip");
  await page.getByRole("button", { name: "About", exact: true }).click();
  await expect(
    page.getByText("Discard unsaved changes?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Trip title / destination" }),
  ).toHaveValue("Unsaved trip");
  await page.getByRole("tab", { name: "Prepare", exact: true }).click();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Prepare", exact: true }),
  ).toBeVisible();
});

test("browser Back protects unsaved plans, and saving bypasses the warning", async ({
  page,
}) => {
  await setupLocation(page);
  await page.goto("/plans");
  await ready(page);
  await page
    .getByRole("button", { name: "New Trip Plan", exact: true })
    .click();
  const title = page.getByRole("textbox", {
    name: "Trip title / destination",
    exact: true,
  });
  await title.fill("Unsaved route");
  await page.goBack();
  await expect(
    page.getByText("Discard unsaved changes?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(title).toHaveValue("Unsaved route");
  await page.goBack();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "New Trip Plan", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "New Trip Plan", exact: true })
    .click();
  await title.fill("Saved draft");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.getByTestId("plan-preview")).toContainText("Saved draft");
  await expect(
    page.getByText("Discard unsaved changes?", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Edit Details", exact: true }).click();
  await expect(title).toBeInViewport();
  await title.fill("New unsaved edit");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(
    page.getByText("Discard unsaved changes?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(title).toHaveValue("New unsaved edit");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.getByTestId("plan-preview")).toContainText(
    "New unsaved edit",
  );
});

test("profile edits are protected on tabs and browser Back, with no warning after save", async ({
  page,
}) => {
  await page.goto("/plans");
  await ready(page);
  await page.getByRole("button", { name: /My reusable profile/ }).click();
  const name = page.getByRole("textbox", { name: "Your name", exact: true });
  await name.fill("Unsaved profile");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(name).toHaveValue("Unsaved profile");
  await page.goBack();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(name).toHaveValue("Unsaved profile");
  await page.getByRole("button", { name: "Save Profile", exact: true }).click();
  await expect(
    page.getByText("Profile saved on this device", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(
    page.getByText("Discard unsaved changes?", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await page.getByRole("button", { name: /My reusable profile/ }).click();
  await name.fill("Discard this profile edit");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await page.getByRole("button", { name: /My reusable profile/ }).click();
  await expect(name).toHaveValue("Unsaved profile");
});

test("Hiking needs no location watcher; Compass starts one and releases it on return", async ({
  page,
}) => {
  await setupLocation(page);
  await page.goto("/tools?tool=hiking");
  await ready(page);
  await expect(page.getByTestId("hiking-result")).toBeVisible();
  expect(await page.evaluate(() => window.locationWatches)).toBe(0);
  await page.getByRole("button", { name: "Compass", exact: true }).click();
  await expect(page.getByTestId("declination-result")).toContainText("E");
  expect(await page.evaluate(() => window.locationWatches)).toBe(1);
  await page.getByRole("button", { name: "Hiking", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.locationClears)).toBe(1);
});

test("trip Today, Tomorrow and Now respect the selected zone and midnight rollover", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-15T06:58:00Z"));
  await page.goto("/plans/new");
  await ready(page);
  const zone = page.getByRole("textbox", {
    name: "Trip time zone",
    exact: true,
  });
  const date = page.getByRole("textbox", { name: "Start date", exact: true });
  const time = page.getByRole("textbox", { name: "Start time", exact: true });
  await page.getByRole("button", { name: "Eastern", exact: true }).click();
  await expect(zone).toHaveValue("America/New_York");
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(date).toHaveValue("2026-10-15");
  await page
    .getByRole("button", { name: "Tomorrow", exact: true })
    .first()
    .click();
  await expect(date).toHaveValue("2026-10-16");
  await page.getByRole("button", { name: "Now", exact: true }).click();
  await expect(date).toHaveValue("2026-10-15");
  await expect(time).toHaveValue("03:00");
  await page.getByRole("button", { name: "Pacific", exact: true }).click();
  await expect(zone).toHaveValue("America/Los_Angeles");
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(date).toHaveValue("2026-10-14");
  await page.getByRole("button", { name: "Now", exact: true }).click();
  await expect(date).toHaveValue("2026-10-15");
  await expect(time).toHaveValue("00:00");
  await zone.fill("America/Invalid_Zone");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(
    page.getByText(/Enter a valid IANA time zone/),
  ).toBeVisible();
});

test("first packing check for the current trip stays current after reload", async ({
  page,
}) => {
  await seedPlan(page, "current");
  await page.goto("/prepare");
  await ready(page);
  await page.getByRole("checkbox", { name: "Water", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Water", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByText("Checklist may be from a previous trip", { exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("trailsafe.local.v1")!).checklist
            .planId,
      ),
    )
    .toBe("review-plan");
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Water", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByText("Checklist may be from a previous trip", { exact: true }),
  ).toHaveCount(0);
});

test("five roomy tabs keep Home and About beside every tab title", async ({
  page,
}) => {
  await setupLocation(page);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await ready(page);
  await expect(page.getByRole("tab")).toHaveCount(5);
  await expect(
    page.getByRole("tab", { name: "Home", exact: true }),
  ).toHaveCount(0);
  for (const [name, title] of [
    ["Plan", "Trip Plans"],
    ["Prepare", "Prepare"],
    ["Help", "Need Help?"],
    ["Guide", "Safety Guide"],
    ["Tools", "Tools"],
  ]) {
    const tab = page.getByRole("tab", { name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const home = page.getByRole("button", { name: "Home", exact: true });
    const about = page.getByRole("button", { name: "About", exact: true });
    const heading = page.getByRole("heading", { name: title, exact: true });
    await expect(heading).toBeVisible();
    const [homeBox, titleBox, infoBox, tabBox] = await Promise.all([
      home.boundingBox(),
      heading.boundingBox(),
      about.boundingBox(),
      tab.boundingBox(),
    ]);
    expect(homeBox!.width).toBeGreaterThanOrEqual(44);
    expect(homeBox!.height).toBeGreaterThanOrEqual(44);
    expect(infoBox!.width).toBeGreaterThanOrEqual(44);
    expect(infoBox!.height).toBeGreaterThanOrEqual(44);
    expect(homeBox!.x + homeBox!.width).toBeLessThanOrEqual(titleBox!.x);
    expect(infoBox!.x).toBeGreaterThanOrEqual(titleBox!.x + titleBox!.width);
    expect(tabBox!.width).toBeGreaterThanOrEqual(63);
    expect(tabBox!.height).toBeGreaterThanOrEqual(56);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
    await about.click();
    await expect(
      page.getByRole("heading", { name: "About", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(heading).toBeVisible();
    await home.click();
    await expect(
      page.getByRole("heading", { name: "TrailSafe", exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await page.screenshot({
    path: "test-results/screenshots/five-tabs-small.png",
  });
});
