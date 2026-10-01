import { timingSafeEqual } from "node:crypto"

import { blobEnabled } from "./blob-entries"

export function passcodeRequired(): boolean {
  return blobEnabled() || Boolean(process.env.SITEBOOK_PASSCODE)
}

export function checkPasscode(given: unknown): string | null {
  const expected = process.env.SITEBOOK_PASSCODE ?? ""
  if (!expected) {
    if (blobEnabled()) return "Upload is off until SITEBOOK_PASSCODE is set."
    return null
  }
  const value = typeof given === "string" ? given : ""
  if (!safeEqual(value, expected)) return "Wrong passcode."
  return null
}

function safeEqual(given: string, expected: string): boolean {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  if (a.length !== b.length) {
    timingSafeEqual(b, b)
    return false
  }
  return timingSafeEqual(a, b)
}
