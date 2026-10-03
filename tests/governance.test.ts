import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTENT_OWNER,
  getAllArticleGovernance,
  getAllToolGovernance,
  getAllSafetyGovernance,
  governanceProblems,
  isProductionReleaseBlocked,
  ContentCategory,
} from "../src/content/governance";
import library from "../src/content/library.json";

test("content governance covers all 22 bundled articles in library.json", () => {
  const articleKeys = Object.keys(library.ARTICLES);
  assert.equal(articleKeys.length, 22, "Expected exactly 22 bundled articles");

  const articleGovernance = getAllArticleGovernance();
  assert.equal(articleGovernance.length, 22);

  for (const g of articleGovernance) {
    assert.equal(g.owner, CONTENT_OWNER);
    assert.ok(g.sources.length >= 1, `Article ${g.id} has no sources`);
    const problems = governanceProblems(g, "2026-10-02");
    assert.deepEqual(problems, [], `Governance problems found for article ${g.id}: ${problems.join(", ")}`);
  }
});

test("content governance covers all embedded wilderness safety tools", () => {
  const toolGovernance = getAllToolGovernance();
  assert.equal(toolGovernance.length, 5, "Expected 5 embedded tools");

  const expectedToolIds = [
    "tool:hypothermia",
    "tool:avalanche-slope",
    "tool:water-treatment",
    "tool:hiking-time",
    "tool:solar",
  ];

  for (const expectedId of expectedToolIds) {
    const found = toolGovernance.find((t) => t.id === expectedId);
    assert.ok(found, `Missing tool governance for ${expectedId}`);
    assert.equal(found.owner, CONTENT_OWNER);
    assert.ok(found.sources.length >= 2, `Tool ${expectedId} should cite at least 2 sources`);
    const problems = governanceProblems(found, "2026-10-02");
    assert.deepEqual(problems, [], `Governance problems found for ${expectedId}: ${problems.join(", ")}`);
  }
});

test("all safety units are appropriately partitioned by review category", () => {
  const all = getAllSafetyGovernance();
  assert.equal(all.length, 27, "Expected 27 total safety units (22 articles + 5 tools)");

  const categories = new Set<ContentCategory>();
  for (const item of all) {
    categories.add(item.category);
    assert.ok(
      ["medical", "dispatch-911", "sar-operational", "general-outdoor"].includes(item.category),
      `Unknown category for ${item.id}: ${item.category}`,
    );
  }

  // Ensure every category has at least one safety item requiring that domain expertise
  assert.ok(categories.has("medical"), "Should have medical guidance");
  assert.ok(categories.has("dispatch-911"), "Should have 911 dispatch guidance");
  assert.ok(categories.has("sar-operational"), "Should have SAR operational guidance");
  assert.ok(categories.has("general-outdoor"), "Should have general outdoor guidance");
});

test("isProductionReleaseBlocked blocks releases when reviews are overdue or sources invalid", () => {
  const currentCheck = isProductionReleaseBlocked(getAllSafetyGovernance(), "2026-10-02");
  assert.equal(currentCheck.blocked, false, `Current content should not block release: ${currentCheck.reasons.join(", ")}`);
  assert.equal(currentCheck.reasons.length, 0);

  // Future date past nextReview should trigger a block
  const overdueCheck = isProductionReleaseBlocked(getAllSafetyGovernance(), "2028-01-01");
  assert.equal(overdueCheck.blocked, true, "Release should be blocked when reviews are overdue");
  assert.ok(overdueCheck.reasons.length >= 27);

  // Missing sources or invalid ID should also block
  const brokenGovernance = [
    {
      id: "tool:broken",
      title: "Broken Tool",
      category: "medical" as const,
      owner: CONTENT_OWNER,
      sources: [],
      contentVersion: "1.0.0",
      lastVerified: "2026-09-30",
      nextReview: "2027-09-30",
    },
  ];
  const brokenCheck = isProductionReleaseBlocked(brokenGovernance, "2026-10-02");
  assert.equal(brokenCheck.blocked, true);
  assert.ok(brokenCheck.reasons.some((r) => r.includes("no sources")));
});
