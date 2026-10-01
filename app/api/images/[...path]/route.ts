import { readFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { resolveImagePath } from "@/lib/catalog"

export const runtime = "nodejs"

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params
  const relative = parts.join("/")
  try {
    const absolute = resolveImagePath(relative)
    const bytes = await readFile(absolute)
    const ext = path.extname(absolute).toLowerCase()
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
