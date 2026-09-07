#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: bash scripts/install-iphone.sh <iPhone-UDID> <Apple-team-ID>" >&2
  exit 2
fi

cd "$(dirname "$0")/.."
if [[ ! -d ios/TrailSafe.xcworkspace ]]; then
  echo "Run npx expo prebuild --platform ios before installing." >&2
  exit 1
fi
if ! /usr/libexec/PlistBuddy -c 'Print :UIApplicationSceneManifest' ios/TrailSafe/Info.plist >/dev/null 2>&1; then
  echo "Regenerate iOS with npx expo prebuild --platform ios to include iOS 27 scene support." >&2
  exit 1
fi

device_id="$1"
team_id="$2"
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
