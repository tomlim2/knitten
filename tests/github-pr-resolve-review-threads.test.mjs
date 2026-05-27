import assert from "node:assert/strict";
import test from "node:test";

import {
  commentIdsFromPlan,
  plannedThreadResolutions,
} from "../agent/lib/github-pr-resolve-review-threads.mjs";

test("extracts numeric comment ids from reply plan items", () => {
  const ids = commentIdsFromPlan({
    items: [
      { commentId: 101 },
      { commentId: "102" },
      { commentId: "not-a-number" },
      { source: "suppressed" },
    ],
  });

  assert.deepEqual([...ids].sort((a, b) => a - b), [101, 102]);
});

test("maps reply-plan comments to unresolved review threads", () => {
  const resolutions = plannedThreadResolutions({
    plan: {
      items: [{ commentId: 101 }, { commentId: 102 }, { commentId: 999 }],
    },
    graphqlResponse: {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  id: "PRRT_open",
                  isResolved: false,
                  comments: { nodes: [{ databaseId: 101 }] },
                },
                {
                  id: "PRRT_done",
                  isResolved: true,
                  comments: { nodes: [{ databaseId: 102 }] },
                },
                {
                  id: "PRRT_other",
                  isResolved: false,
                  comments: { nodes: [{ databaseId: 103 }] },
                },
              ],
            },
          },
        },
      },
    },
  });

  assert.deepEqual(resolutions, [
    {
      threadId: "PRRT_open",
      isResolved: false,
      commentId: 101,
      action: "resolve",
    },
    {
      threadId: "PRRT_done",
      isResolved: true,
      commentId: 102,
      action: "skip-already-resolved",
    },
  ]);
});
