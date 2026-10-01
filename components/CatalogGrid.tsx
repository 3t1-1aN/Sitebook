"use client"

import { accessionFor } from "@/lib/accession"
import type { Entry } from "@/lib/types"

import { StyleCard } from "./StyleCard"

type CatalogGridProps = {
  entries: Entry[]
  allEntries: Entry[]
  onOpen: (id: string) => void
}

export function CatalogGrid({ entries, allEntries, onOpen }: CatalogGridProps) {
  const accessions = accessionFor(allEntries)

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => {
        const accession = accessions.get(entry.id) ?? { n: 0, total: allEntries.length }
        return (
          <StyleCard
            key={entry.id}
            entry={entry}
            n={accession.n}
            total={accession.total}
            onOpen={() => onOpen(entry.id)}
          />
        )
      })}
    </div>
  )
}
