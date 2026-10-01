import { readFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { blobEnabled, isBlobImagePath, readBlobImage } from "@/lib/blob-entries"
import { resolveImagePath } from "@/lib/catalog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

  if (isBlobImagePath(relative)) {
    if (!blobEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    try {
      const image = await readBlobImage(relative)
      if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 })
      const ext = path.extname(relative).toLowerCase()
      return new NextResponse(image.stream, {
        headers: {
          "Content-Type": image.contentType || TYPES[ext] || "application/octet-stream",
          "Cache-Control": "private, max-age=3600",
        },
      })
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
  }

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
