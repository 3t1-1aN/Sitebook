export type DeletePlan = "hide-seed" | "delete-blob" | "delete-local" | "missing"

export function planDelete(input: {
  blobConfigured: boolean
  inRepo: boolean
  inBlobStore: boolean
}): DeletePlan {
  if (input.blobConfigured) {
    if (input.inRepo) return "hide-seed"
    if (input.inBlobStore) return "delete-blob"
    return "missing"
  }
  if (input.inRepo) return "delete-local"
  return "missing"
}

export function parseHiddenIds(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return []
  const ids = (raw as { ids?: unknown }).ids
  if (!Array.isArray(ids)) return []
  const unique: string[] = []
  for (const id of ids) {
    if (typeof id !== "string" || !id || unique.includes(id)) continue
    unique.push(id)
  }
  return unique
}

export function mergeHiddenId(ids: string[], id: string): string[] {
  if (!id || ids.includes(id)) return ids
  return [...ids, id]
}
