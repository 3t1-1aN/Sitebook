import path from "node:path"

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"])

export function containedImagePath(root: string, filename: string): string {
  const normalized = filename.replace(/^[/\\]+/, "")
  if (!normalized || normalized.includes("\0")) {
    throw new Error("Invalid image path")
  }
  const segments = normalized.split(/[/\\]/)
  if (segments.some((part) => part === "" || part === "." || part === "..")) {
    throw new Error("Invalid image path")
  }
  const base = path.resolve(root)
  const absolute = path.resolve(base, ...segments)
  const relative = path.relative(base, absolute)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid image path")
  }
  if (!IMAGE_EXT.has(path.extname(absolute).toLowerCase())) {
    throw new Error("Invalid image path")
  }
  return absolute
}
