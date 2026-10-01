import type { Entry, Family } from "./types"

const ANTI_SLOP = "No purple gradients. No Inter. No 3D blobs. No generic card grids."

export function copyBrief(entry: Entry, family: Family | undefined): string {
  const name = family?.name || entry.family || "Unclassified"
  const definition = family?.definition?.trim() ?? ""
  const blend = entry.vibe.trim() ? `Blend: ${entry.vibe.trim()}.` : ""
  const aesthetic = [`Aesthetic: ${name}.`, definition, blend].filter(Boolean).join(" ")
  const title = entry.title.trim() || "Untitled"
  const always = family?.always.join(" ") || "None filed."
  const never = family?.never.join(" ") || "None filed."
  const notes = entry.uiNotes.trim() || "None filed."

  return [
    aesthetic,
    "",
    `Reference: ${title}. Use this plate's image. Match the feel, not the content.`,
    "",
    "Intent: [what it is, who it's for, and the one action]",
    "",
    "Guardrails:",
    `Always: ${always}`,
    `Never: ${never}`,
    `UI notes: ${notes}`,
    `Anti-slop: ${ANTI_SLOP}`,
  ].join("\n")
}

export function copyImagePrompt(entry: Entry): string {
  return entry.recipe
}
