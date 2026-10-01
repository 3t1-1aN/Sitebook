"use client"

import { formatAccession } from "@/lib/accession"
import type { Entry } from "@/lib/types"

type StyleCardProps = {
  entry: Entry
  n: number
  total: number
  onOpen: () => void
}

export function StyleCard({ entry, n, total, onOpen }: StyleCardProps) {
  const unclassified = entry.status === "pending" && !entry.title
  const title = unclassified ? "Unclassified" : entry.title || "Untitled"
  const family = entry.family
  const visible = entry.tags.slice(0, 3)
  const extra = entry.tags.length - visible.length

  return (
    <article className="flex flex-col border border-rule bg-paper">
      <button
        type="button"
        onClick={onOpen}
        className="block aspect-[16/9] w-full overflow-hidden border-b border-rule bg-paper-deep text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/images/${entry.filename}`}
          alt={title}
          className="h-full w-full object-cover object-center"
        />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-[2rem] leading-[1.05] tracking-tight text-ink">
            {title}
          </h2>
          {entry.vibe ? (
            <p className="shrink-0 text-[11px] text-ink-soft">{entry.vibe}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {visible.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-chip px-2.5 py-1 text-[10px] leading-none text-ink-soft"
            >
              {tag}
            </span>
          ))}
          {extra > 0 ? (
            <span className="text-[10px] text-ink-soft">+{extra}</span>
          ) : null}
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          {family ? (
            <p className="font-serif text-[13px] uppercase tracking-[0.04em] text-accent">
              <span aria-hidden className="mr-1.5 inline-block text-[9px] leading-none">
                ◆
              </span>
              {family}
            </p>
          ) : (
            <span />
          )}
          <p className="text-[11px] tabular-nums text-ink-soft">
            {formatAccession(n, total)}
          </p>
        </div>
      </div>
    </article>
  )
}
