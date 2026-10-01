import type { Entry } from "./types"

export function newestFirst(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const byDate = b.createdAt.localeCompare(a.createdAt)
    if (byDate !== 0) return byDate
    return b.id.localeCompare(a.id)
  })
}

export function accessionFor(entries: Entry[]): Map<string, { n: number; total: number }> {
  const ordered = newestFirst(entries)
  const total = entries.length
  const map = new Map<string, { n: number; total: number }>()
  ordered.forEach((entry, index) => {
    map.set(entry.id, { n: index + 1, total })
  })
  return map
}

export function formatAccession(n: number, total: number): string {
  const width = Math.max(2, String(total).length)
  return `${String(n).padStart(width, "0")} / ${String(total).padStart(width, "0")}`
}
