#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export EXPO_PUBLIC_RELEASE_CHANNEL=production
export EXPO_NO_METRO_WORKSPACE_ROOT=1
export EXPO_NO_TELEMETRY=1
npm run typecheck
npm test
npx eslint .
npx expo export --platform web
node scripts/prepare-surge.cjs
npx surge dist --domain trailsafe.kass.net
