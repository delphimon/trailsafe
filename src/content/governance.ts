/**
 * Content governance metadata for safety-relevant guidance (issue #8).
 *
 * Every safety-content unit — bundled guide articles in `library.json` and
 * guidance embedded in Tools code — carries the same metadata so sources and
 * revalidation dates are auditable, including across OTA updates.
 *
 * IMPORTANT: this metadata records *citations and maintenance*, not outside
 * approval. TrailSafe is released by the Center for Adventure Leadership.
 * Cited organizations (KCSAR, King County 911, NWAC, CDC, NWS, …) are sources
 * only; never describe them as authors, reviewers, sponsors, or endorsers.
 *
 * Pure TypeScript (no React Native imports) so it can be tested under `tsx`.
 */

import library from "./library.json";
import { HYPOTHERMIA_TOOL_METADATA } from "../lib/hypothermia";
import {
  AVALANCHE_SLOPE_METADATA,
  HIKING_TIME_METADATA,
  WATER_TREATMENT_METADATA,
} from "../lib/hiking-tools";
import { SOLAR_TOOL_METADATA } from "../lib/solar";

export const CONTENT_OWNER = "Center for Adventure Leadership";

/** Domain of the guidance; determines what kind of expertise should verify it. */
export type ContentCategory =
  | "medical"
  | "dispatch-911"
  | "sar-operational"
  | "general-outdoor";

export type ContentGovernance = {
  /** Stable identifier, e.g. an article id or `tool:hypothermia`. */
  id: string;
  title: string;
  category: ContentCategory;
  /** Maintaining organization (the publisher). */
  owner: string;
  /** Authoritative sources: https URLs or full print citations. */
  sources: string[];
  /** Version string bumped whenever the guidance text changes. */
  contentVersion: string;
  /** ISO date (YYYY-MM-DD) the guidance was last checked against its sources. */
  lastVerified: string;
  /** ISO date (YYYY-MM-DD) by which it must be re-checked. */
  nextReview: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns human-readable problems with a governance record. An empty array
 * means the metadata is structurally complete — it does NOT mean the guidance
 * is substantively correct.
 *
 * @param g Governance record to validate.
 * @param today ISO date used to detect overdue revalidation (omit to skip).
 */
export function governanceProblems(
  g: ContentGovernance,
  today?: string,
): string[] {
  const p: string[] = [];
  if (!g.id.trim()) p.push("missing id");
  if (!g.title.trim()) p.push(`${g.id}: missing title`);
  if (!g.owner.trim()) p.push(`${g.id}: missing owner`);
  if (!g.contentVersion.trim()) p.push(`${g.id}: missing contentVersion`);
  if (!g.sources.length) p.push(`${g.id}: no sources`);
  for (const s of g.sources)
    if (!s.trim() || (/^https?:/.test(s) && !/^https:\/\/\S+$/.test(s)))
      p.push(`${g.id}: invalid source "${s}"`);
  if (!ISO_DATE.test(g.lastVerified)) p.push(`${g.id}: bad lastVerified`);
  if (!ISO_DATE.test(g.nextReview)) p.push(`${g.id}: bad nextReview`);
  if (g.nextReview <= g.lastVerified)
    p.push(`${g.id}: nextReview must be after lastVerified`);
  if (today && g.nextReview < today)
    p.push(`${g.id}: revalidation overdue since ${g.nextReview}`);
  return p;
}

/**
 * Audit registry classifying all 22 bundled guide articles by safety domain,
 * last verification date, and scheduled next review date.
 */
export const ARTICLE_GOVERNANCE_REGISTRY: Record<
  string,
  {
    category: ContentCategory;
    lastVerified: string;
    nextReview: string;
  }
> = {
  "calling-help": {
    category: "dispatch-911",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "ten-essentials": {
    category: "general-outdoor",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "phone-smart": {
    category: "general-outdoor",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "signaling": {
    category: "sar-operational",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "unexpected-overnight": {
    category: "sar-operational",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "cold-hypothermia": {
    category: "medical",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "heat": {
    category: "medical",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "winter-safety": {
    category: "general-outdoor",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "satellite-plb": {
    category: "sar-operational",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "backcountry-radio": {
    category: "sar-operational",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "children-family": {
    category: "general-outdoor",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "wildlife": {
    category: "general-outdoor",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "lessons-learned": {
    category: "sar-operational",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "river-crossings": {
    category: "general-outdoor",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "clothing-layering": {
    category: "general-outdoor",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "g-lost": {
    category: "sar-operational",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "g-injured": {
    category: "medical",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "g-stranded": {
    category: "sar-operational",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "g-party-missing": {
    category: "sar-operational",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "g-overdue": {
    category: "dispatch-911",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "g-other": {
    category: "dispatch-911",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
  "g-waiting": {
    category: "sar-operational",
    lastVerified: "2026-09-30",
    nextReview: "2027-09-30",
  },
};

/**
 * Returns governance metadata for a single bundled guide article.
 */
export function getArticleGovernance(articleId: string): ContentGovernance | null {
  const articles = library.ARTICLES as Record<
    string,
    { title: string; contentVersion: string; sources?: string[] }
  >;
  const article = articles[articleId];
  if (!article) return null;
  const reg = ARTICLE_GOVERNANCE_REGISTRY[articleId];
  if (!reg) return null;
  return {
    id: articleId,
    title: article.title,
    category: reg.category,
    owner: CONTENT_OWNER,
    sources: article.sources || [],
    contentVersion: article.contentVersion,
    lastVerified: reg.lastVerified,
    nextReview: reg.nextReview,
  };
}

/**
 * Returns governance metadata for all 22 bundled guide articles.
 */
export function getAllArticleGovernance(): ContentGovernance[] {
  const articles = library.ARTICLES as Record<string, unknown>;
  const list: ContentGovernance[] = [];
  for (const id of Object.keys(articles)) {
    const gov = getArticleGovernance(id);
    if (gov) list.push(gov);
  }
  return list;
}

/**
 * Returns governance records for safety-relevant tools embedded in the app.
 */
export function getAllToolGovernance(): ContentGovernance[] {
  return [
    HYPOTHERMIA_TOOL_METADATA,
    AVALANCHE_SLOPE_METADATA,
    WATER_TREATMENT_METADATA,
    HIKING_TIME_METADATA,
    SOLAR_TOOL_METADATA,
  ];
}

/**
 * Returns all 27 safety content units (22 guide articles + 5 embedded tools).
 */
export function getAllSafetyGovernance(): ContentGovernance[] {
  return [...getAllArticleGovernance(), ...getAllToolGovernance()];
}

/**
 * Evaluates whether a production release is blocked due to missing, invalid,
 * or overdue content reviews.
 */
export function isProductionReleaseBlocked(
  allGovernance: ContentGovernance[] = getAllSafetyGovernance(),
  today: string = new Date().toISOString().slice(0, 10),
): { blocked: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const g of allGovernance) {
    const problems = governanceProblems(g, today);
    if (problems.length > 0) {
      reasons.push(...problems);
    }
  }
  return {
    blocked: reasons.length > 0,
    reasons,
  };
}
