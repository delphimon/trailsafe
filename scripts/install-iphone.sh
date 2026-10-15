#!/usr/bin/env bash
set -euo pipefail

# Local signed installs are internal builds. Store builds must explicitly select production.
export EXPO_PUBLIC_RELEASE_CHANNEL="${EXPO_PUBLIC_RELEASE_CHANNEL:-preview}"

cd "$(dirname "$0")/.."
if [[ $# -eq 0 && -f .iphone-device.local.json ]]; then
  device_defaults=$(node -e '
    try {
      const config = JSON.parse(require("node:fs").readFileSync(".iphone-device.local.json", "utf8"));
      if (!/^[A-Za-z0-9-]+$/.test(config.udid || "") || !/^[A-Z0-9]{10}$/.test(config.teamId || ""))
        throw new Error("Expected a device udid and 10-character teamId.");
      process.stdout.write(`${config.udid} ${config.teamId}`);
    } catch (error) {
      console.error(`Invalid .iphone-device.local.json: ${error.message}`);
      process.exit(1);
    }
  ')
  read -r device_id team_id <<< "$device_defaults"
elif [[ $# -eq 2 ]]; then
  device_id="$1"
  team_id="$2"
else
  echo "Usage: bash scripts/install-iphone.sh [<iPhone-UDID> <Apple-team-ID>]" >&2
  echo "No arguments uses .iphone-device.local.json (udid and teamId)." >&2
  exit 2
fi

if [[ ! -d ios/TrailSafe.xcworkspace ]]; then
  echo "Run npx expo prebuild --platform ios before installing." >&2
  exit 1
fi
if ! /usr/libexec/PlistBuddy -c 'Print :UIApplicationSceneManifest' ios/TrailSafe/Info.plist >/dev/null 2>&1; then
  echo "Regenerate iOS with npx expo prebuild --platform ios to include iOS 27 scene support." >&2
  exit 1
fi
native_channel=$(/usr/libexec/PlistBuddy -c 'Print :TrailSafeReleaseChannel' ios/TrailSafe/Info.plist 2>/dev/null || true)
if [[ "$native_channel" != "$EXPO_PUBLIC_RELEASE_CHANNEL" ]]; then
  echo "Regenerate iOS with EXPO_PUBLIC_RELEASE_CHANNEL=$EXPO_PUBLIC_RELEASE_CHANNEL npx expo prebuild --platform ios before building this channel." >&2
  exit 1
fi

build_dir="$PWD/builds/iphone"

# Release embeds the JavaScript bundle and assets; Metro is not required.
xcodebuild \
  -workspace ios/TrailSafe.xcworkspace \
  -scheme TrailSafe \
  -configuration Release \
  -destination "id=$device_id" \
  -derivedDataPath "$build_dir" \
  -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration \
  DEVELOPMENT_TEAM="$team_id" \
  CODE_SIGN_STYLE=Automatic \
  build

app_path="$build_dir/Build/Products/Release-iphoneos/TrailSafe.app"
codesign --verify --deep --strict "$app_path"
xcrun devicectl device install app --device "$device_id" "$app_path"
echo "Installed TrailSafe Release on the selected iPhone."
