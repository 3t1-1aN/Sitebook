import type { Entry } from "./types"

export function copyBrief(entry: Entry): string {
  const family = entry.family || "Unfiled"
  return [
    entry.title || "Untitled",
    entry.vibe,
    entry.description,
    `Family: ${family}`,
    `Tags: ${entry.tags.join(", ")}`,
  ].join("\n")
}

export function copyImagePrompt(entry: Entry): string {
  return entry.recipe
}
