import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const configure = require("../plugins/with-release-diagnostics.cjs");
test("production prebuild never registers native crash initialization", () => {
  const result = configure({
    name: "TrailSafe",
    slug: "trailsafe",
    extra: { releaseChannel: "production" },
  });
  assert.deepEqual(Object.keys(result.mods.ios), ["infoPlist"]);
  assert.equal(result.mods.android, undefined);
});
test("pre-release artifacts register native initialization on both platforms", () => {
  for (const releaseChannel of ["development", "preview", "testflight"]) {
    const result = configure({
      name: "TrailSafe",
      slug: "trailsafe",
      extra: { releaseChannel, bugsnag: { apiKey: "test-only" } },
    });
    assert.equal(typeof result.mods.ios.appDelegate, "function");
    assert.equal(typeof result.mods.android.mainApplication, "function");
  }
});
