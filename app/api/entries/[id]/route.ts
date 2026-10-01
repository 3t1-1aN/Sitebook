import { NextResponse } from "next/server"

import { deleteEntry, patchEntry } from "@/lib/catalog"
import type { Entry } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type PatchBody = Partial<
  Pick<Entry, "title" | "vibe" | "description" | "family" | "tags" | "recipe" | "uiNotes">
>

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const body = (await request.json()) as Record<string, unknown>
  const patch: PatchBody = {}

  for (const key of ["title", "vibe", "description", "family", "recipe", "uiNotes"] as const) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "string") {
        return NextResponse.json({ error: `${key} must be a string` }, { status: 400 })
      }
      patch[key] = body[key]
    }
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((tag) => typeof tag !== "string")) {
      return NextResponse.json({ error: "tags must be a string array" }, { status: 400 })
    }
    patch.tags = body.tags
  }

  try {
    const entry = await patchEntry(id, patch)
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(entry)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid patch"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const removed = await deleteEntry(id)
  if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
