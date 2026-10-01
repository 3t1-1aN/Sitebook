import assert from "node:assert/strict"
import { test } from "node:test"

import { mergeHiddenId, parseHiddenIds, planDelete } from "../lib/delete-plan.ts"

test("a seed plate is hidden when Blob is configured", () => {
  assert.equal(
    planDelete({ blobConfigured: true, inRepo: true, inBlobStore: false }),
    "hide-seed",
  )
  assert.equal(
    planDelete({ blobConfigured: true, inRepo: true, inBlobStore: true }),
    "hide-seed",
  )
})

test("a Blob upload is deleted from the store", () => {
  assert.equal(
    planDelete({ blobConfigured: true, inRepo: false, inBlobStore: true }),
    "delete-blob",
  )
})

test("local dev deletes the catalog row when Blob is off", () => {
  assert.equal(
    planDelete({ blobConfigured: false, inRepo: true, inBlobStore: false }),
    "delete-local",
  )
})

test("unknown ids are missing", () => {
  assert.equal(
    planDelete({ blobConfigured: true, inRepo: false, inBlobStore: false }),
    "missing",
  )
  assert.equal(
    planDelete({ blobConfigured: false, inRepo: false, inBlobStore: false }),
    "missing",
  )
})

test("hidden ids stay a unique string list", () => {
  assert.deepEqual(parseHiddenIds(null), [])
  assert.deepEqual(parseHiddenIds({ ids: ["a", "a", "", 4, "b"] }), ["a", "b"])
  assert.deepEqual(mergeHiddenId(["a"], "a"), ["a"])
  assert.deepEqual(mergeHiddenId(["a"], "b"), ["a", "b"])
})
