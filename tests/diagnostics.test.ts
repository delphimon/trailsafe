import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shouldInitializeCrashDiagnostics,
  getReleaseChannel,
} from "../src/lib/diagnostics";

test("crash diagnostics policy enforces disabling for production release builds", () => {
  // Production store releases must never initialize Bugsnag
  assert.equal(
    shouldInitializeCrashDiagnostics("production", "ios"),
    false,
    "Production iOS store build must not initialize Bugsnag",
  );
  assert.equal(
    shouldInitializeCrashDiagnostics("production", "android"),
    false,
    "Production Android store build must not initialize Bugsnag",
  );
});

test("crash diagnostics policy allows Bugsnag in development, preview, and testflight builds", () => {
  assert.equal(shouldInitializeCrashDiagnostics("development", "ios"), true);
  assert.equal(shouldInitializeCrashDiagnostics("testflight", "ios"), true);
  assert.equal(shouldInitializeCrashDiagnostics("preview", "ios"), true);
  assert.equal(shouldInitializeCrashDiagnostics("development", "android"), true);
});

test("crash diagnostics policy strictly forbids Bugsnag on web platform", () => {
  assert.equal(shouldInitializeCrashDiagnostics("development", "web"), false);
  assert.equal(shouldInitializeCrashDiagnostics("preview", "web"), false);
  assert.equal(shouldInitializeCrashDiagnostics("testflight", "web"), false);
  assert.equal(shouldInitializeCrashDiagnostics("production", "web"), false);
});

test("getReleaseChannel respects EXPO_PUBLIC_RELEASE_CHANNEL environment variable", () => {
  const orig = process.env.EXPO_PUBLIC_RELEASE_CHANNEL;
  try {
    process.env.EXPO_PUBLIC_RELEASE_CHANNEL = "production";
    assert.equal(getReleaseChannel(), "production");

    process.env.EXPO_PUBLIC_RELEASE_CHANNEL = "testflight";
    assert.equal(getReleaseChannel(), "testflight");

    process.env.EXPO_PUBLIC_RELEASE_CHANNEL = "preview";
    assert.equal(getReleaseChannel(), "preview");

    process.env.EXPO_PUBLIC_RELEASE_CHANNEL = "development";
    assert.equal(getReleaseChannel(), "development");
  } finally {
    process.env.EXPO_PUBLIC_RELEASE_CHANNEL = orig;
  }
});
