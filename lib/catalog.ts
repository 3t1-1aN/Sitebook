import { createHash } from "node:crypto"
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  addHiddenId,
  blobEnabled,
  deleteBlobPlate,
  listBlobEntries,
  putBlobEntry,
  putBlobImage,
  readBlobEntry,
  readHiddenIds,
} from "./blob-entries"
import { planDelete } from "./delete-plan"
import type { Catalog, ClassifyResult, Entry, Family } from "./types"
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

export function familyNames(families: Family[]): string[] {
  return families.map((family) => family.name)
}

export async function readCatalog(): Promise<Catalog> {
  const raw = await readFile(CATALOG_PATH, "utf8")
  return JSON.parse(raw) as Catalog
}

async function hiddenIds(): Promise<Set<string>> {
  if (!blobEnabled()) return new Set()
  try {
    return new Set(await readHiddenIds())
  } catch (error) {
    console.error("Hidden list could not be read", error)
    return new Set()
  }
}

export async function readMergedCatalog(): Promise<Catalog> {
  const catalog = await readCatalog()
  if (!blobEnabled()) return catalog
  const hidden = await hiddenIds()
  try {
    const extra = await listBlobEntries()
    const ids = new Set(catalog.entries.map((entry) => entry.id))
    const fresh = extra.filter((entry) => !ids.has(entry.id) && !hidden.has(entry.id))
    const visible = catalog.entries.filter((entry) => !hidden.has(entry.id))
    return { ...catalog, entries: [...visible, ...fresh] }
  } catch (error) {
    console.error("Blob entries could not be read", error)
    const visible = catalog.entries.filter((entry) => !hidden.has(entry.id))
    return { ...catalog, entries: visible }
  }
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

function blankEntry(input: {
  id: string
  relativePath: string
  checksum: string
}): Entry {
  return {
    id: input.id,
    filename: input.relativePath,
    checksum: input.checksum,
    title: "",
    vibe: "",
    description: "",
    family: "",
    tags: [],
    recipe: "",
    uiNotes: "",
    status: "pending",
    createdAt: new Date().toISOString(),
  }
}

export async function ingestPending(input: {
  id: string
  relativePath: string
  bytes: Buffer
  contentType: string
}): Promise<{ entry: Entry } | { duplicate: true; existingId: string }> {
  return withCatalogLock(async () => {
    const catalog = await readCatalog()
    const checksum = sha256(input.bytes)
    const hidden = await hiddenIds()
    const existing = catalog.entries.find(
      (entry) => entry.checksum === checksum && !hidden.has(entry.id),
    )
    if (existing) {
      return { duplicate: true, existingId: existing.id }
    }

    if (blobEnabled()) {
      const blobEntries = await listBlobEntries()
      const blobExisting = blobEntries.find((entry) => entry.checksum === checksum)
      if (blobExisting) {
        return { duplicate: true, existingId: blobExisting.id }
      }
      const entry = blankEntry({
        id: input.id,
        relativePath: input.relativePath,
        checksum,
      })
      await putBlobImage(input.relativePath, input.bytes, input.contentType)
      try {
        await putBlobEntry(entry)
      } catch (error) {
        await deleteBlobPlate(entry).catch(() => undefined)
        throw error
      }
      return { entry }
    }

    const absolute = resolveImagePath(input.relativePath)
    await mkdir(path.dirname(absolute), { recursive: true })
    await writeFile(absolute, input.bytes)

    const entry = blankEntry({
      id: input.id,
      relativePath: input.relativePath,
      checksum,
    })
    catalog.entries.push(entry)
    await writeCatalog(catalog)
    return { entry }
  })
}

function applyResult(
  entry: Entry,
  result: ClassifyResult,
  names: Set<string>,
  mode: "fill-empty" | "overwrite",
): string | null {
  if (!names.has(result.family)) {
    return `Unknown family: ${result.family}`
  }

  const overwrite = mode === "overwrite"
  if (overwrite || isEmptyField(entry.title)) entry.title = result.title
  if (overwrite || isEmptyField(entry.vibe)) entry.vibe = result.vibe
  if (overwrite || isEmptyField(entry.description)) entry.description = result.description
  if (overwrite || isEmptyField(entry.family)) entry.family = result.family
  if (overwrite || isEmptyField(entry.tags)) entry.tags = result.tags
  if (overwrite || isEmptyField(entry.recipe)) entry.recipe = result.recipe
  if (overwrite || isEmptyField(entry.uiNotes)) entry.uiNotes = result.uiNotes
  entry.status = "ready"
  delete entry.error
  return null
}

export async function applyClassify(
  id: string,
  result: ClassifyResult | { error: string },
  mode: "fill-empty" | "overwrite",
): Promise<Entry | null> {
  return withCatalogLock(async () => {
    const catalog = await readCatalog()
    const names = new Set(familyNames(catalog.families))
    const entry = catalog.entries.find((item) => item.id === id)

    if (!entry) {
      if (!blobEnabled()) return null
      const blobEntry = await readBlobEntry(id)
      if (!blobEntry) return null
      if ("error" in result) {
        blobEntry.status = "error"
        blobEntry.error = result.error
      } else {
        const problem = applyResult(blobEntry, result, names, mode)
        if (problem) {
          blobEntry.status = "error"
          blobEntry.error = problem
        }
      }
      await putBlobEntry(blobEntry)
      return blobEntry
    }

    if ("error" in result) {
      entry.status = "error"
      entry.error = result.error
      await writeCatalog(catalog)
      return entry
    }

    const problem = applyResult(entry, result, names, mode)
    if (problem) {
      entry.status = "error"
      entry.error = problem
    }
    await writeCatalog(catalog)
    return entry
  })
}

type EntryPatch = Partial<Pick<Entry, (typeof PATCH_FIELDS)[number]>>

function applyPatch(entry: Entry, patch: EntryPatch, names: string[]) {
  if (patch.title !== undefined) entry.title = patch.title
  if (patch.vibe !== undefined) entry.vibe = patch.vibe
  if (patch.description !== undefined) entry.description = patch.description
  if (patch.tags !== undefined) entry.tags = patch.tags
  if (patch.recipe !== undefined) entry.recipe = patch.recipe
  if (patch.uiNotes !== undefined) entry.uiNotes = patch.uiNotes
  if (patch.family !== undefined) {
    if (patch.family !== "" && !names.includes(patch.family)) {
      throw new Error("Unknown family")
    }
    entry.family = patch.family
  }
}

export async function patchEntry(id: string, patch: EntryPatch): Promise<Entry | null> {
  return withCatalogLock(async () => {
    const catalog = await readCatalog()
    const names = familyNames(catalog.families)
    const entry = catalog.entries.find((item) => item.id === id)
    if (entry) {
      applyPatch(entry, patch, names)
      await writeCatalog(catalog)
      return entry
    }

    if (!blobEnabled()) return null
    const blobEntry = await readBlobEntry(id)
    if (!blobEntry) return null
    applyPatch(blobEntry, patch, names)
    await putBlobEntry(blobEntry)
    return blobEntry
  })
}

export async function deleteEntry(id: string): Promise<boolean> {
  return withCatalogLock(async () => {
    const catalog = await readCatalog()
    const index = catalog.entries.findIndex((item) => item.id === id)
    const inRepo = index !== -1
    const blobEntry = blobEnabled() && !inRepo ? await readBlobEntry(id) : null
    const plan = planDelete({
      blobConfigured: blobEnabled(),
      inRepo,
      inBlobStore: Boolean(blobEntry),
    })

    if (plan === "hide-seed") {
      await addHiddenId(id)
      return true
    }

    if (plan === "delete-blob") {
      if (!blobEntry) return false
      await deleteBlobPlate(blobEntry)
      return true
    }

    if (plan === "missing") return false

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
