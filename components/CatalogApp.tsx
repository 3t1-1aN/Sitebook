"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { newestFirst } from "@/lib/accession"
import type { Catalog, Entry } from "@/lib/types"

import { CatalogGrid } from "./CatalogGrid"
import { DetailModal } from "./DetailModal"
import { DropZone } from "./DropZone"

async function loadCatalog(): Promise<Catalog> {
  const response = await fetch("/api/catalog", { cache: "no-store" })
  if (!response.ok) throw new Error("Could not load catalog")
  return (await response.json()) as Catalog
}

export function CatalogApp() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [family, setFamily] = useState("All")
  const [openId, setOpenId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const next = await loadCatalog()
    setCatalog(next)
    return next
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const hasPending = catalog?.entries.some((entry) => entry.status === "pending") ?? false

  useEffect(() => {
    if (!hasPending) return
    const timer = window.setInterval(() => {
      void refresh()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [hasPending, refresh])

  const ordered = useMemo(
    () => (catalog ? newestFirst(catalog.entries) : []),
    [catalog],
  )
  const visible = useMemo(() => {
    if (family === "All") return ordered
    return ordered.filter((entry) => (entry.family || "Unfiled") === family)
  }, [family, ordered])
  const openEntry = ordered.find((entry) => entry.id === openId) ?? null

  async function onFiles(files: FileList | File[]) {
    setBusy(true)
    setNotice(null)
    try {
      for (const file of Array.from(files)) {
        const body = new FormData()
        body.append("file", file)
        const response = await fetch("/api/ingest", { method: "POST", body })
        const payload = (await response.json()) as Entry & { error?: string }
        if (!response.ok) {
          setNotice(payload.error || "Drop failed")
          continue
        }
        setCatalog((current) =>
          current
            ? { ...current, entries: [...current.entries, payload] }
            : current,
        )
      }
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function onChange(id: string, patch: Partial<Entry>) {
    const response = await fetch(`/api/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!response.ok) return
    const updated = (await response.json()) as Entry
    setCatalog((current) =>
      current
        ? {
            ...current,
            entries: current.entries.map((entry) =>
              entry.id === id ? updated : entry,
            ),
          }
        : current,
    )
  }

  async function onDelete(id: string) {
    const response = await fetch(`/api/entries/${id}`, { method: "DELETE" })
    if (!response.ok) return
    setOpenId(null)
    setCatalog((current) =>
      current
        ? { ...current, entries: current.entries.filter((entry) => entry.id !== id) }
        : current,
    )
  }

  if (!catalog) {
    return (
      <main className="mx-auto max-w-[1400px] px-6 py-10 text-[13px] text-ink-soft">
        Loading catalog…
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex items-end justify-between gap-6">
          <h1 className="font-serif text-5xl leading-none tracking-tight">Sitebook</h1>
          <p className="text-[12px] tabular-nums text-ink-soft">
            {catalog.entries.length} {catalog.entries.length === 1 ? "plate" : "plates"}
          </p>
        </div>
        <DropZone busy={busy} notice={notice} onFiles={onFiles} />
        <div className="flex flex-wrap gap-2">
          {["All", ...catalog.families].map((name) => {
            const active = family === name
            return (
              <button
                key={name}
                type="button"
                onClick={() => setFamily(name)}
                className={`border px-3 py-1 text-[11px] uppercase tracking-[0.06em] ${
                  active
                    ? "border-rule bg-ink text-paper"
                    : "border-rule bg-paper text-ink"
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </header>

      {visible.length === 0 ? (
        <p className="border border-dashed border-rule px-4 py-16 text-center text-[13px] text-ink-soft">
          Nothing in this family yet. Drop a screenshot above.
        </p>
      ) : (
        <CatalogGrid
          entries={visible}
          allEntries={catalog.entries}
          onOpen={setOpenId}
        />
      )}

      {openEntry ? (
        <DetailModal
          entry={openEntry}
          families={catalog.families}
          onClose={() => setOpenId(null)}
          onChange={onChange}
          onDelete={onDelete}
        />
      ) : null}
    </main>
  )
}
