import { BlobNotFoundError, del, get, list, put } from "@vercel/blob"

import { mergeHiddenId, parseHiddenIds } from "./delete-plan"
import type { Entry, EntryStatus } from "./types"

export const BLOB_IMAGE_PREFIX = "blob/"
export const BLOB_ENTRY_PREFIX = "entries/"
export const HIDDEN_BLOB_PATH = "meta/hidden.json"

const PRIVATE = { access: "private" as const }

export function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export function entryBlobPath(id: string): string {
  return `${BLOB_ENTRY_PREFIX}${id}.json`
}

export function isBlobImagePath(pathname: string): boolean {
  if (!/^blob\/[A-Za-z0-9._-]+$/.test(pathname)) return false
  const name = pathname.slice(BLOB_IMAGE_PREFIX.length)
  return name !== "." && name !== ".."
}

export async function listBlobEntries(): Promise<Entry[]> {
  const blobs = await listAll(BLOB_ENTRY_PREFIX)
  const entries: Entry[] = []
  for (const blob of blobs) {
    if (!blob.pathname.endsWith(".json")) continue
    try {
      const raw = await readBlobJson(blob.pathname)
      const entry = parseEntry(raw)
      if (entry) entries.push(entry)
    } catch (error) {
      console.error("Skipping unreadable blob entry", blob.pathname, error)
    }
  }
  return entries
}

export async function readBlobEntry(id: string): Promise<Entry | null> {
  const raw = await readBlobJson(entryBlobPath(id))
  return parseEntry(raw)
}

export async function putBlobEntry(entry: Entry): Promise<void> {
  await put(entryBlobPath(entry.id), JSON.stringify(entry), {
    ...PRIVATE,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  })
}

export async function putBlobImage(
  pathname: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  await put(pathname, bytes, {
    ...PRIVATE,
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType,
  })
}

export async function deleteBlobPlate(entry: Entry): Promise<void> {
  await deleteQuiet(entry.filename)
  await deleteQuiet(entryBlobPath(entry.id))
}

export async function readHiddenIds(): Promise<string[]> {
  const raw = await readBlobJson(HIDDEN_BLOB_PATH)
  return parseHiddenIds(raw)
}

export async function addHiddenId(id: string): Promise<void> {
  const current = await readHiddenIds()
  const next = mergeHiddenId(current, id)
  if (next === current) return
  await put(HIDDEN_BLOB_PATH, JSON.stringify({ ids: next }), {
    ...PRIVATE,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  })
}

export async function readBlobImage(
  pathname: string,
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  if (!isBlobImagePath(pathname)) return null
  const result = await get(pathname, PRIVATE)
  if (!result || result.statusCode !== 200 || !result.stream) return null
  return {
    stream: result.stream,
    contentType: result.blob.contentType,
  }
}

async function readBlobJson(pathname: string): Promise<unknown | null> {
  const result = await get(pathname, { ...PRIVATE, useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) return null
  const text = await new Response(result.stream).text()
  return JSON.parse(text) as unknown
}

async function listAll(prefix: string) {
  const blobs = []
  let cursor: string | undefined
  do {
    const page = await list({ prefix, cursor, limit: 1000 })
    blobs.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return blobs
}

async function deleteQuiet(pathname: string) {
  try {
    await del(pathname)
  } catch (error) {
    if (error instanceof BlobNotFoundError) return
    throw error
  }
}

function parseEntry(raw: unknown): Entry | null {
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>
  if (typeof value.id !== "string" || typeof value.filename !== "string") return null
  if (typeof value.checksum !== "string" || typeof value.createdAt !== "string") return null
  const status = parseStatus(value.status)
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === "string")
    : []
  const entry: Entry = {
    id: value.id,
    filename: value.filename,
    checksum: value.checksum,
    title: typeof value.title === "string" ? value.title : "",
    vibe: typeof value.vibe === "string" ? value.vibe : "",
    description: typeof value.description === "string" ? value.description : "",
    family: typeof value.family === "string" ? value.family : "",
    tags,
    recipe: typeof value.recipe === "string" ? value.recipe : "",
    uiNotes: typeof value.uiNotes === "string" ? value.uiNotes : "",
    status,
    createdAt: value.createdAt,
  }
  if (typeof value.error === "string" && value.error) entry.error = value.error
  return entry
}

function parseStatus(value: unknown): EntryStatus {
  if (value === "ready" || value === "error" || value === "pending") return value
  return "pending"
}
