import assert from "node:assert/strict"
import path from "node:path"
import { test } from "node:test"

import { containedImagePath } from "../lib/image-path.ts"

const root = path.join("/tmp", "sitebook-images")

test("image reads stay inside the images directory", () => {
  assert.equal(
    containedImagePath(root, "user/plate.png"),
    path.resolve(root, "user/plate.png"),
  )
  for (const filename of [
    "../package.json",
    "user/../../package.json",
    "/etc/passwd",
    "user/catalog.json",
    "user/plate.png/../../../package.json",
    "..\\..\\package.json",
  ]) {
    assert.throws(() => containedImagePath(root, filename), /Invalid image path/)
  }
})
