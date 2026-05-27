import assert from "node:assert/strict";
import test from "node:test";

import {
  applyApprovedState,
  computeApprovedState,
  computeReviewApproval,
  latestSubstantiveReviewState,
} from "../agent/lib/github-pr-approved-state-plan.mjs";

test("reports early review approval signal without reply-plan metadata", () => {
  const signal = computeReviewApproval({
    view: { reviewDecision: "" },
    reviews: [
      { state: "COMMENTED", submitted_at: "2026-05-27T01:00:00Z" },
      { state: "APPROVED", submitted_at: "2026-05-27T02:00:00Z" },
    ],
  });

  assert.deepEqual(signal, {
    reviewApproved: true,
    reviewDecision: "",
    latestReviewState: "APPROVED",
  });
});

test("uses latest substantive APPROVED review when reviewDecision is empty", () => {
  const reviews = [
    { state: "COMMENTED", submitted_at: "2026-05-27T01:00:00Z" },
    { state: "CHANGES_REQUESTED", submitted_at: "2026-05-27T02:00:00Z" },
    { state: "APPROVED", submitted_at: "2026-05-27T03:00:00Z" },
  ];

  assert.equal(latestSubstantiveReviewState(reviews), "APPROVED");

  const decision = computeApprovedState({
    view: { reviewDecision: "" },
    reviews,
    plan: {
      pr: 253,
      items: [{ route: "track-out-of-scope-nit", nonBlocking: true }],
      suppressedSummary: null,
    },
  });

  assert.equal(decision.approvedState, true);
  assert.equal(decision.reRequestDefault, false);
});

test("does not approve route when any actionable item is blocking", () => {
  const decision = computeApprovedState({
    view: { reviewDecision: "APPROVED" },
    reviews: [],
    plan: {
      pr: 253,
      items: [
        { route: "track-out-of-scope-nit", nonBlocking: true },
        { route: "fix-as-rec", severity: "P2", nonBlocking: false },
      ],
      suppressedSummary: null,
    },
  });

  assert.equal(decision.approvedState, false);
  assert.equal(decision.reRequestDefault, true);
});

test("requires suppressed summary metadata before approving suppressed-only plan", () => {
  const withoutMetadata = computeApprovedState({
    view: { reviewDecision: "APPROVED" },
    reviews: [],
    plan: {
      pr: 253,
      items: [],
      suppressedSummary: "Addressed optional review-body notes.",
    },
  });

  assert.equal(withoutMetadata.approvedState, false);

  const withMetadata = computeApprovedState({
    view: { reviewDecision: "APPROVED" },
    reviews: [],
    plan: {
      pr: 253,
      items: [],
      suppressedSummary: {
        nonBlocking: true,
        reply: "Addressed optional review-body notes.",
      },
    },
  });

  assert.equal(withMetadata.approvedState, true);
});

test("updates reply plan routing fields without changing replies", () => {
  const plan = {
    pr: 253,
    approvedState: false,
    items: [{ reply: "Fixed in abc1234. Corrected the typo." }],
    reRequest: { default: true, reviewers: ["reviewer1"] },
  };

  const next = applyApprovedState(plan, {
    approvedState: true,
    reRequestDefault: false,
  });

  assert.equal(next.approvedState, true);
  assert.equal(next.reRequest.default, false);
  assert.deepEqual(next.items, plan.items);
  assert.deepEqual(next.reRequest.reviewers, ["reviewer1"]);
});
