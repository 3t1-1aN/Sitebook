import { NextResponse } from "next/server"

import {
  ingestPending,
  extensionForMime,
  safeOriginalName,
} from "@/lib/catalog"
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "@/lib/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File exceeds 15MB" }, { status: 400 })
  }

  const mime = file.type
  if (!ALLOWED_MIME.has(mime)) {
    const heic = mime === "image/heic" || mime === "image/heif" || /\.heic$/i.test(file.name)
    return NextResponse.json(
      { error: heic ? "HEIC is not supported. Drop PNG, JPEG, or WebP." : "Use PNG, JPEG, or WebP." },
      { status: 400 },
    )
  }

  const id = crypto.randomUUID()
  const ext = extensionForMime(mime)
  const relativePath = `user/${id}-${safeOriginalName(file.name).replace(/\.[^.]+$/, "")}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const result = await ingestPending({ id, relativePath, bytes })
  if ("duplicate" in result) {
    return NextResponse.json(
      { error: "already in library", existingId: result.existingId },
      { status: 409 },
    )
  }

  return NextResponse.json(result.entry, { status: 201 })
}
