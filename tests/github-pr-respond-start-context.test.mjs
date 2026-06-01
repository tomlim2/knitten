import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRespondStartContext,
  inlineReviewItems,
  reviewBodyItems,
} from "../agent/lib/github-pr-respond-start-context.mjs";

test("builds start context with approval signal and review items", () => {
  const context = buildRespondStartContext({
    pr: "253",
    view: { reviewDecision: "APPROVED", headRefName: "feature/respond-pr", baseRefName: "main" },
    comments: [
      {
        id: 3091862347,
        path: "src/lib.rs",
        line: 12,
        body: "Please fix this.",
        diff_hunk: "@@ -1 +1 @@",
        user: { login: "reviewer1", type: "User" },
        html_url: "https://example.test/comment",
      },
    ],
    reviews: [
      {
        id: 42,
        state: "APPROVED",
        body: "Optional: simplify the wording.",
        submitted_at: "2026-05-27T01:00:00Z",
        user: { login: "reviewer1", type: "User" },
      },
    ],
    files: { view: "/tmp/pr253-view.json" },
  });

  assert.equal(context.pr, 253);
  assert.equal(context.headRefName, "feature/respond-pr");
  assert.equal(context.baseRefName, "main");
  assert.equal(context.reviewApproved, true);
  assert.deepEqual(context.counts, { inline: 1, reviewBody: 1, total: 2 });
  assert.equal(context.reviewItems[0].source, "inline");
  assert.equal(context.reviewItems[0].route, null);
  assert.equal(context.reviewItems[1].source, "review-body");
});

test("inline review items preserve comment id and reply planning placeholders", () => {
  const items = inlineReviewItems([
    { id: 101, body: "Fix", user: { login: "bot", type: "Bot" }, original_line: 9 },
    { body: "missing id" },
  ]);

  assert.deepEqual(items, [
    {
      source: "inline",
      commentId: 101,
      author: "bot",
      authorType: "Bot",
      authorAssociation: null,
      path: null,
      line: 9,
      url: null,
      body: "Fix",
      diffHunk: "",
      route: null,
      replyPlan: null,
    },
  ]);
});

test("review body items skip empty review bodies", () => {
  const items = reviewBodyItems([
    { id: 1, state: "COMMENTED", body: "  " },
    { id: 2, state: "CHANGES_REQUESTED", body: "Top-level finding", user: { login: "alice", type: "User" } },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].source, "review-body");
  assert.equal(items[0].reviewId, 2);
  assert.equal(items[0].author, "alice");
  assert.equal(items[0].authorType, "User");
});
