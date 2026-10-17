/**
 * @file search-indexing.ts
 * @description Indexes offline safety guide articles into device search (iOS CoreSpotlight & Android Shortcuts).
 *
 * Architecture & OTA Compatibility:
 * 1. Offline-First: Articles are read directly from bundled content and indexed locally.
 * 2. OTA Updates: Calculates a content checksum/version so that when EAS Update updates library.json,
 *    the app detects the new version on startup and automatically re-indexes without needing a native binary build.
 * 3. Deep Linking: Every indexed item links to `trailsafe://article/<target>`, which Expo Router maps to `/article/[id]`.
 * 4. Node Test Isolation: Native storage and search modules are imported lazily so domain formatting
 *    can be tested in standard Node test runners without React Native transpilation.
 */

import { articles, topics } from "@/content";
import { WASHINGTON_REGION } from "@/content/regions";

export const INDEXED_GUIDE_VERSION_KEY = "@trailsafe_indexed_guide_version";

export type GuideSearchItem = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  url: string;
};

/**
 * Computes a deterministic version string based on article content and versions.
 */
export function getGuideContentVersion(items = formatGuideSearchItems()): string {
  let hash = 0;
  const str = JSON.stringify(items);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `guide-${Math.abs(hash)}`;
}

/**
 * Extracts all searchable plain text for a guide topic without including JSON property names.
 */
export function extractTopicPlainText(t: (typeof topics)[number]): string {
  const art = articles[t.target];
  return [
    t.title,
    t.sub,
    t.keywords || "",
    art?.title || "",
    art?.subtitle || "",
    ...(art?.blocks || [])
      .map((b) =>
        [b.title, b.text, ...(b.items || [])].filter(Boolean).join(" "),
      )
      .filter(Boolean),
    t.target === "calling-help" ? WASHINGTON_REGION.sarCostNote : "",
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Filters guide topics using tokenized plain-text matching (all query words must match).
 */
export function searchGuideTopics(
  query: string,
  topicList = topics,
): typeof topics {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return topicList;
  return topicList.filter((t) => {
    const text = extractTopicPlainText(t);
    return tokens.every((token) => text.includes(token));
  });
}

/**
 * Transforms topics and bundled article content into search index items.
 */
export function formatGuideSearchItems(): GuideSearchItem[] {
  return topics.map((t) => {
    const art = articles[t.target];
    const rawKeywords = extractTopicPlainText(t);

    // Extract unique words of length >= 3
    const words = rawKeywords
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    const uniqueKeywords = Array.from(
      new Set([t.title.toLowerCase(), ...words]),
    );

    return {
      id: t.target,
      title: t.title,
      description: t.sub || art?.subtitle || "",
      keywords: uniqueKeywords,
      url: `trailsafe://article/${t.target}`,
    };
  });
}

/**
 * Indexes the offline guide content into native system search if not already up to date.
 * Safe to call on every app launch — performs no-op if the content version has not changed.
 */
export async function indexGuideContent(force = false): Promise<boolean> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const DeviceSearch = await import("@/modules/device-search");

    const currentVersion = getGuideContentVersion();
    if (!force) {
      const storedVersion = await AsyncStorage.getItem(
        INDEXED_GUIDE_VERSION_KEY,
      );
      if (storedVersion === currentVersion) {
        return false;
      }
    }

    const items = formatGuideSearchItems();
    if (!(await DeviceSearch.indexItems(items))) return false;
    await AsyncStorage.setItem(INDEXED_GUIDE_VERSION_KEY, currentVersion);
    return true;
  } catch {
    return false;
  }
}
