import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const configure = require("../plugins/with-release-diagnostics.cjs");
const ios = `import Expo
class AppDelegate {
  func launch() {
    let delegate = ReactNativeDelegate()
    // preserve scene and signing-independent native code
  }
}
`;
const android = `package org.adventureleader.trailsafe
class MainApplication {
  override fun onCreate() {
    super.onCreate()
    // preserve unrelated native code
  }
}
`;
async function transform(
  platform: "ios" | "android",
  source: string,
  releaseChannel: string,
) {
  const config = configure({
    name: "TrailSafe",
    slug: "trailsafe",
    extra: { releaseChannel, bugsnag: { apiKey: "test-only" } },
  });
  const mod = platform === "ios" ? "appDelegate" : "mainApplication";
  const result = await config.mods[platform][mod]({
    ...config,
    modRequest: { platform, modName: mod },
    modResults: {
      contents: source,
      language: platform === "ios" ? "swift" : "kt",
    },
  });
  return result.modResults.contents as string;
}
for (const [platform, original] of [
  ["ios", ios],
  ["android", android],
] as const) {
  test(`${platform}: preview → production strips initialization and preserves native source`, async () => {
    const preview = await transform(platform, original, "preview");
    assert.match(preview, /Bugsnag.start/);
    assert.match(preview, /releaseStage = "preview"/);
    assert.equal(await transform(platform, preview, "preview"), preview);
    const production = await transform(platform, preview, "production");
    assert.equal(production, original);
    assert.equal(await transform(platform, production, "production"), original);
    assert.equal(await transform(platform, production, "preview"), preview);
  });
  test(`${platform}: old blocks without an end marker are removed and channels can change`, async () => {
    const legacy = (await transform(platform, original, "preview")).replace(
      /    \/\/ End TrailSafe diagnostics\n/,
      "",
    );
    assert.equal(await transform(platform, legacy, "production"), original);
    const testflight = await transform(platform, legacy, "testflight");
    assert.match(testflight, /releaseStage = "testflight"/);
    assert.doesNotMatch(testflight, /releaseStage = "preview"/);
    assert.equal(testflight.match(/Bugsnag.start/g)?.length, 1);
  });
  test(`${platform}: incomplete blocks or unknown production initializers fail prebuild`, async () => {
    await assert.rejects(
      () =>
        transform(
          platform,
          original + "// TrailSafe pre-release diagnostics\n",
          "production",
        ),
      /incomplete/,
    );
    await assert.rejects(
      () =>
        transform(platform, original + "Bugsnag.start(custom)\n", "production"),
      /unrecognized/,
    );
  });
}
test("pre-release diagnostics requires a configured key", () => {
  assert.throws(
    () =>
      configure({
        name: "TrailSafe",
        slug: "trailsafe",
        extra: { releaseChannel: "preview" },
      }),
    /API key/,
  );
});
