import { createHash } from "node:crypto"
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Catalog, ClassifyResult, Entry } from "./types"
import { PATCH_FIELDS } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")
const CATALOG_PATH = path.join(DATA_DIR, "catalog.json")
export const IMAGES_DIR = path.join(DATA_DIR, "images")

let writeChain: Promise<unknown> = Promise.resolve()

function withCatalogLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn)
  writeChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex")
}

export async function readCatalog(): Promise<Catalog> {
  const raw = await readFile(CATALOG_PATH, "utf8")
  return JSON.parse(raw) as Catalog
}

async function writeCatalog(catalog: Catalog): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  const tmp = `${CATALOG_PATH}.tmp`
  await writeFile(tmp, `${JSON.stringify(catalog, null, 2)}\n`, "utf8")
  await rename(tmp, CATALOG_PATH)
}

export function resolveImagePath(filename: string): string {
  const normalized = path.normalize(filename).replace(/^[/\\]+/, "")
  if (normalized.includes("..")) {
    throw new Error("Invalid image path")
  }
  const absolute = path.join(IMAGES_DIR, normalized)
  if (!absolute.startsWith(IMAGES_DIR)) {
    throw new Error("Invalid image path")
  }
  return absolute
}

export function isEmptyField(value: string | string[]): boolean {
  if (Array.isArray(value)) return value.length === 0
  return value === ""
}

export async function ingestPending(input: {
  id: string
  relativePath: string
  bytes: Buffer
}): Promise<{ entry: Entry } | { duplicate: true; existingId: string }> {
  return withCatalogLock(async () => {
    const catalog = await readCatalog()
    const checksum = sha256(input.bytes)
    const existing = catalog.entries.find((entry) => entry.checksum === checksum)
    if (existing) {
      return { duplicate: true, existingId: existing.id }
    }

    const absolute = resolveImagePath(input.relativePath)
    await mkdir(path.dirname(absolute), { recursive: true })
    await writeFile(absolute, input.bytes)

    const entry: Entry = {
      id: input.id,
      filename: input.relativePath,
      checksum,
      title: "",
      vibe: "",
      description: "",
      family: "",
      tags: [],
      recipe: "",
      status: "pending",
      createdAt: new Date().toISOString(),
    }
    catalog.entries.push(entry)
    await writeCatalog(catalog)
    return { entry }
  })
}

export async function applyClassify(
  id: string,
  result: ClassifyResult | { error: string },
  mode: "fill-empty" | "overwrite",
): Promise<Entry | null> {
  return withCatalogLock(async () => {
    const catalog = await readCatalog()
    const entry = catalog.entries.find((item) => item.id === id)
    if (!entry) return null

    if ("error" in result) {
      entry.status = "error"
      entry.error = result.error
      await writeCatalog(catalog)
      return entry
    }

    const families = new Set(catalog.families)
    const family = families.has(result.family) ? result.family : "Unfiled"

    if (mode === "overwrite") {
      entry.title = result.title
      entry.vibe = result.vibe
      entry.description = result.description
      entry.family = family
      entry.tags = result.tags
      entry.recipe = result.recipe
    } else {
      if (isEmptyField(entry.title)) entry.title = result.title
      if (isEmptyField(entry.vibe)) entry.vibe = result.vibe
      if (isEmptyField(entry.description)) entry.description = result.description
      if (isEmptyField(entry.family)) entry.family = family
      if (isEmptyField(entry.tags)) entry.tags = result.tags
      if (isEmptyField(entry.recipe)) entry.recipe = result.recipe
    }

    entry.status = "ready"
    delete entry.error
    await writeCatalog(catalog)
    return entry
  })
}

export async function patchEntry(
  id: string,
  patch: Partial<Pick<Entry, (typeof PATCH_FIELDS)[number]>>,
): Promise<Entry | null> {
  return withCatalogLock(async () => {
    const catalog = await readCatalog()
    const entry = catalog.entries.find((item) => item.id === id)
    if (!entry) return null

    if (patch.title !== undefined) entry.title = patch.title
    if (patch.vibe !== undefined) entry.vibe = patch.vibe
    if (patch.description !== undefined) entry.description = patch.description
    if (patch.tags !== undefined) entry.tags = patch.tags
    if (patch.recipe !== undefined) entry.recipe = patch.recipe
    if (patch.family !== undefined) {
      if (patch.family !== "" && !catalog.families.includes(patch.family)) {
        throw new Error("Unknown family")
      }
      entry.family = patch.family
    }

    await writeCatalog(catalog)
    return entry
  })
}

export async function deleteEntry(id: string): Promise<boolean> {
  return withCatalogLock(async () => {
    const catalog = await readCatalog()
    const index = catalog.entries.findIndex((item) => item.id === id)
    if (index === -1) return false
    const [removed] = catalog.entries.splice(index, 1)
    await writeCatalog(catalog)
    try {
      await unlink(resolveImagePath(removed.filename))
    } catch {
      // Catalog row is gone even if the file was already missing.
    }
    return true
  })
}

export function safeOriginalName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "-")
  return base.slice(0, 80) || "image"
}

export function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}
