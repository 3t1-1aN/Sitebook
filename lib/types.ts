export type EntryStatus = "pending" | "ready" | "error"

export type Entry = {
  id: string
  filename: string
  checksum: string
  title: string
  vibe: string
  description: string
  family: string
  tags: string[]
  recipe: string
  status: EntryStatus
  error?: string
  createdAt: string
}

export type Catalog = {
  families: string[]
  entries: Entry[]
}

export type ClassifyResult = {
  title: string
  vibe: string
  description: string
  family: string
  tags: string[]
  recipe: string
}

export const CLASSIFY_FIELDS = [
  "title",
  "vibe",
  "description",
  "family",
  "tags",
  "recipe",
] as const

export const PATCH_FIELDS = CLASSIFY_FIELDS

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
export const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"])
