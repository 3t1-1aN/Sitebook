import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { spawn, type ChildProcess } from "node:child_process"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const port = 3467
const base = `http://127.0.0.1:${port}`
const seed = "11fea6dd-c182-4698-8fca-6a55d791c024"

function catalogHash(): string {
  return createHash("sha256").update(readFileSync("data/catalog.json")).digest("hex")
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/api/catalog`)
      if (response.ok) return
    } catch {
      // Server is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error("Production server did not start. Run npm run build first.")
}

test("PATCH without a passcode returns 401 and does not write", async () => {
  const before = catalogHash()
  const child: ChildProcess = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      env: { ...process.env, SITEBOOK_PASSCODE: "secret" },
      stdio: "ignore",
    },
  )
  try {
    await waitForServer()

    const missing = await fetch(`${base}/api/entries/${seed}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hacked" }),
    })
    assert.equal(missing.status, 401)
    assert.deepEqual(await missing.json(), { error: "Wrong passcode." })

    const wrong = await fetch(`${base}/api/entries/${seed}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "nope", title: "Hacked" }),
    })
    assert.equal(wrong.status, 401)
    assert.deepEqual(await wrong.json(), { error: "Wrong passcode." })

    assert.equal(catalogHash(), before)

    for (const pathname of [
      "/api/images/..%2F..%2Fpackage.json",
      "/api/images/user/%2e%2e/%2e%2e/package.json",
      "/api/images/user/..%2F..%2Fpackage.json",
    ]) {
      const response = await fetch(base + pathname)
      const text = await response.text()
      assert.equal(response.status, 404)
      assert.equal(text.includes('"name": "sitebook"'), false)
    }
  } finally {
    child.kill("SIGTERM")
  }
})
