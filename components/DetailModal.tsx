"use client"

import { useEffect, useState } from "react"

import { copyBrief, copyImagePrompt } from "@/lib/copy"
import type { Entry } from "@/lib/types"

type DetailModalProps = {
  entry: Entry
  families: string[]
  onClose: () => void
  onChange: (id: string, patch: Partial<Pick<Entry, "title" | "vibe" | "description" | "family" | "tags" | "recipe">>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function DetailModal({
  entry,
  families,
  onClose,
  onChange,
  onDelete,
}: DetailModalProps) {
  const [title, setTitle] = useState(entry.title)
  const [vibe, setVibe] = useState(entry.vibe)
  const [description, setDescription] = useState(entry.description)
  const [family, setFamily] = useState(entry.family)
  const [tags, setTags] = useState(entry.tags)
  const [recipe, setRecipe] = useState(entry.recipe)
  const [tagDraft, setTagDraft] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTitle(entry.title)
    setVibe(entry.vibe)
    setDescription(entry.description)
    setFamily(entry.family)
    setTags(entry.tags)
    setRecipe(entry.recipe)
    setConfirmDelete(false)
  }, [entry])

  async function persist(
    patch: Partial<Pick<Entry, "title" | "vibe" | "description" | "family" | "tags" | "recipe">>,
  ) {
    await onChange(entry.id, patch)
  }

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(null), 1400)
  }

  function commitTag() {
    const next = tagDraft.trim()
    if (!next || tags.includes(next)) {
      setTagDraft("")
      return
    }
    const updated = [...tags, next]
    setTags(updated)
    setTagDraft("")
    void persist({ tags: updated })
  }

  const displayTitle = title || "Untitled"

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-[#161412]/45 px-4 py-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-title"
        className="w-full max-w-3xl border border-rule bg-paper shadow-[0_24px_80px_rgba(22,20,18,0.18)]"
      >
        <div className="aspect-[16/8] overflow-hidden border-b border-rule bg-paper-deep">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/images/${entry.filename}`}
            alt={displayTitle}
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="space-y-5 p-6">
          <div className="grid gap-3">
            <input
              id="entry-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => persist({ title })}
              placeholder="Untitled"
              className="w-full bg-transparent font-serif text-[3rem] leading-[1.05] tracking-tight text-ink outline-none"
            />
            <input
              value={vibe}
              onChange={(event) => setVibe(event.target.value)}
              onBlur={() => persist({ vibe })}
              placeholder="vibe formula"
              className="w-full bg-transparent text-[12px] text-ink-soft outline-none"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={() => persist({ description })}
              placeholder="One sentence about the construction."
              rows={2}
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const updated = tags.filter((item) => item !== tag)
                  setTags(updated)
                  void persist({ tags: updated })
                }}
                className="rounded-full bg-chip px-3 py-1 text-[11px] text-ink-soft"
              >
                {tag}
              </button>
            ))}
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onBlur={commitTag}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  commitTag()
                }
              }}
              placeholder="add tag"
              className="min-w-32 bg-transparent text-[11px] text-ink-soft outline-none"
            />
          </div>

          <label className="block text-[12px] text-ink-soft">
            Family
            <select
              value={family}
              onChange={(event) => {
                setFamily(event.target.value)
                void persist({ family: event.target.value })
              }}
              className="mt-1 block w-full border border-rule bg-paper px-3 py-2 font-serif text-[15px] text-ink"
            >
              {family === "" ? <option value="">Unfiled</option> : null}
              {families.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <section className="border border-rule bg-recipe p-4">
            <p className="mb-3 text-[11px] uppercase tracking-[0.08em] text-accent">
              Image recipe — fill [SUBJECT], send to Higgsfield gpt_image_2 @ 2K
            </p>
            <textarea
              value={recipe}
              onChange={(event) => setRecipe(event.target.value)}
              onBlur={() => persist({ recipe })}
              rows={6}
              className="w-full resize-y bg-transparent font-mono text-[13px] leading-relaxed text-ink outline-none"
            />
          </section>

          {entry.status === "pending" ? (
            <p className="text-[12px] text-ink-soft">
              Waiting for plate notes. Run /classify to file this plate.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                copy(
                  "brief",
                  copyBrief({ ...entry, title, vibe, description, family, tags, recipe }),
                )
              }
              className="bg-ink px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-paper active:scale-[0.98]"
            >
              {copied === "brief" ? "Copied brief" : "Copy brief"}
            </button>
            <button
              type="button"
              onClick={() =>
                copy("prompt", copyImagePrompt({ ...entry, recipe }))
              }
              className="bg-ink px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-paper active:scale-[0.98]"
            >
              {copied === "prompt" ? "Copied prompt" : "Copy image prompt"}
            </button>
            {confirmDelete ? (
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                className="border border-accent px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-accent"
              >
                Confirm delete
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="border border-rule px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-ink"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="border border-rule bg-paper px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-ink"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
