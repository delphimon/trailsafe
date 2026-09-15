/* global __dirname */
const {
  withXcodeProject,
  withInfoPlist,
  withAndroidManifest,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

function withIosAppIntents(config) {
  // 1. Info.plist user activity types
  config = withInfoPlist(config, (mod) => {
    const existing = mod.modResults.NSUserActivityTypes || [];
    const needed = [
      'com.apple.corespotlightitem',
      'OpenEmergencyIntent',
      'CompleteCurrentTripIntent',
      'SearchGuideIntent',
    ];
    for (const item of needed) {
      if (!existing.includes(item)) {
        existing.push(item);
      }
    }
    mod.modResults.NSUserActivityTypes = existing;
    return mod;
  });

  // 2. Add TrailSafeIntents.swift to the iOS project target
  config = withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const target = project.getFirstTarget().uuid;
    const platformProjectRoot =
      mod.modRequest?.platformProjectRoot ||
      mod.platformProjectRoot ||
      path.join(mod.modRequest?.projectRoot || process.cwd(), 'ios');
    const sourceFilePath = path.join(__dirname, 'ios', 'TrailSafeIntents.swift');
    const destDir = path.join(platformProjectRoot, 'TrailSafe');
    const destFilePath = path.join(destDir, 'TrailSafeIntents.swift');

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(sourceFilePath, destFilePath);

    // Add file to Xcode project if not already present
    const groupKey =
      project.findPBXGroupKey({ name: 'TrailSafe' }) ||
      project.findPBXGroupKey({ path: 'TrailSafe' });
    const fileAlreadyInProject =
      project.hasFile('TrailSafe/TrailSafeIntents.swift') ||
      project.hasFile('TrailSafeIntents.swift');
    if (!fileAlreadyInProject) {
      project.addSourceFile('TrailSafe/TrailSafeIntents.swift', { target }, groupKey);
    }
    return mod;
  });

  return config;
}

function withAndroidShortcuts(config) {
  // 1. AndroidManifest.xml: attach shortcuts metadata to the main activity
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const app = manifest.application?.[0];
    if (app && app.activity) {
      const mainActivity = app.activity.find((a) => {
        return a['intent-filter']?.some((f) =>
          f.action?.some((act) => act.$['android:name'] === 'android.intent.action.MAIN')
        );
      });
      if (mainActivity) {
        mainActivity['meta-data'] = mainActivity['meta-data'] || [];
        const exists = mainActivity['meta-data'].some(
          (m) => m.$['android:name'] === 'android.app.shortcuts'
        );
        if (!exists) {
          mainActivity['meta-data'].push({
            $: {
              'android:name': 'android.app.shortcuts',
              'android:resource': '@xml/shortcuts',
            },
          });
        }
      }
    }
    return mod;
  });

  // 2. Create res/xml/shortcuts.xml
  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const platformProjectRoot =
        mod.modRequest?.platformProjectRoot ||
        mod.platformProjectRoot ||
        path.join(mod.modRequest?.projectRoot || process.cwd(), 'android');
      const xmlDir = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      const shortcutsXmlPath = path.join(xmlDir, 'shortcuts.xml');
      const shortcutsXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
    <capability android:name="actions.intent.OPEN_APP_FEATURE">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.appliedinteractions.trailsafe"
            android:data="trailsafe://emergency" />
    </capability>
    <capability android:name="actions.intent.GET_THING">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.appliedinteractions.trailsafe"
            android:data="trailsafe://guide?search={thing}">
            <parameter
                android:name="thing.name"
                android:key="thing" />
        </intent>
    </capability>
    <shortcut
        android:shortcutId="emergency_panic"
        android:enabled="true"
        android:icon="@mipmap/ic_launcher"
        android:shortLabel="@string/shortcut_emergency_short"
        android:longLabel="@string/shortcut_emergency_long">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.appliedinteractions.trailsafe"
            android:data="trailsafe://emergency" />
        <capability-binding android:key="actions.intent.OPEN_APP_FEATURE" />
    </shortcut>
    <shortcut
        android:shortcutId="complete_trip"
        android:enabled="true"
        android:icon="@mipmap/ic_launcher"
        android:shortLabel="@string/shortcut_complete_short"
        android:longLabel="@string/shortcut_complete_long">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.appliedinteractions.trailsafe"
            android:data="trailsafe://plan/current/complete" />
    </shortcut>
</shortcuts>
`;
      fs.writeFileSync(shortcutsXmlPath, shortcutsXmlContent, 'utf8');

      // Also create or ensure res/values/strings.xml has shortcut labels
      const valuesDir = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'values');
      if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, { recursive: true });
      }
      const stringsPath = path.join(valuesDir, 'strings.xml');
      if (fs.existsSync(stringsPath)) {
        let stringsContent = fs.readFileSync(stringsPath, 'utf8');
        if (!stringsContent.includes('shortcut_emergency_short')) {
          const insert = `    <string name="shortcut_emergency_short">Emergency</string>\n    <string name="shortcut_emergency_long">Open Emergency &amp; GPS Coordinates</string>\n    <string name="shortcut_complete_short">Complete Trip</string>\n    <string name="shortcut_complete_long">Mark Current Trip Complete</string>\n</resources>`;
          stringsContent = stringsContent.replace('</resources>', insert);
          fs.writeFileSync(stringsPath, stringsContent, 'utf8');
        }
      }
      return mod;
    },
  ]);

  return config;
}

function withAppIntents(config) {
  config = withIosAppIntents(config);
  config = withAndroidShortcuts(config);
  return config;
}

module.exports = withAppIntents;
