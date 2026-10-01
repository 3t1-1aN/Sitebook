import { NextResponse } from "next/server"

import { readMergedCatalog } from "@/lib/catalog"
import { passcodeRequired } from "@/lib/passcode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const catalog = await readMergedCatalog()
  return NextResponse.json({ ...catalog, passcodeRequired: passcodeRequired() })
}
