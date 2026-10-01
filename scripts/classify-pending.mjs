import { createWriteStream, readFileSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { get, list, put } from "@vercel/blob"

const ENTRY_PREFIX = "entries/"
const CACHE_DIR = path.join("data", ".classify-cache")
const PRIVATE = { access: "private" }

const usage = `List pending Blob plates, or write classifications back.

  npm run classify:pending
  npm run classify:pending -- --apply data/.classify-cache/filed.json

List downloads each pending image into data/.classify-cache/ so you can look at it.
Apply reads a JSON array. Each object needs id, title, vibe, description, family, tags, recipe, and uiNotes.

A recipe is a background only. It starts with [SUBJECT: ...], then the medium and what it is not.
It needs a STRICT palette of named hex colors, Lighting:, Composition: with frame percentages,
Mood:, and Avoid:. The avoid list includes text, logos, and interface, plus the likely wrong
medium, palette, and composition. Put nav, type, and buttons in uiNotes, not in the recipe.
Match the tested EOSAI recipe in .cursor/commands/classify.md.

BLOB_READ_WRITE_TOKEN must be set. This script does not call a classify API.
Filesystem plates stay in data/catalog.json. Do not copy Blob plates into that file.`

function fail(message) {
  console.error(message)
  process.exit(1)
}

function token() {
  return process.env.BLOB_READ_WRITE_TOKEN || ""
}

async function listAll(prefix) {
  const blobs = []
  let cursor
  do {
    const page = await list({ prefix, cursor, limit: 1000 })
    blobs.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return blobs
}

async function readEntry(pathname) {
  const result = await get(pathname, { ...PRIVATE, useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) return null
  const text = await new Response(result.stream).text()
  return JSON.parse(text)
}

function familyNames() {
  const catalog = JSON.parse(readFileSync(path.join("data", "catalog.json"), "utf8"))
  return catalog.families.map((family) => family.name)
}

function isPending(entry) {
  return entry.status === "pending" || (!entry.title && !entry.family)
}

async function downloadImage(entry) {
  const result = await get(entry.filename, { ...PRIVATE, useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error(`Could not download ${entry.filename}`)
  }
  const ext = path.extname(entry.filename) || ".img"
  const dest = path.join(CACHE_DIR, `${entry.id}${ext}`)
  await pipeline(Readable.fromWeb(result.stream), createWriteStream(dest))
  return dest
}

async function listPending() {
  if (!token()) {
    console.log(
      "BLOB_READ_WRITE_TOKEN is not set, so there is no Blob library to file. File pending rows in data/catalog.json instead.",
    )
    return
  }
  await mkdir(CACHE_DIR, { recursive: true })
  const blobs = await listAll(ENTRY_PREFIX)
  const pending = []
  for (const blob of blobs) {
    if (!blob.pathname.endsWith(".json")) continue
    const entry = await readEntry(blob.pathname)
    if (!entry || !isPending(entry)) continue
    const image = await downloadImage(entry)
    pending.push({
      id: entry.id,
      filename: entry.filename,
      image,
      createdAt: entry.createdAt,
    })
  }
  const names = familyNames()
  console.log(`Pending blob plates: ${pending.length}`)
  console.log(`Families: ${names.join(", ")}`)
  if (pending.length === 0) return
  for (const plate of pending) {
    console.log(`- ${plate.id}`)
    console.log(`  image: ${plate.image}`)
    console.log(`  created: ${plate.createdAt}`)
  }
  const manifest = path.join(CACHE_DIR, "pending.json")
  await writeFile(manifest, `${JSON.stringify(pending, null, 2)}\n`)
  console.log(`Manifest: ${manifest}`)
  console.log(
    "Look at each image. Write a JSON array, then run: npm run classify:pending -- --apply <file>",
  )
}

function asString(value, label, errors) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${label} must be a non-empty string`)
    return ""
  }
  if (value.includes("\u2014") || value.includes("\u2013")) {
    errors.push(`${label} has a dash. Use a period or a comma.`)
  }
  return value.trim()
}

function validate(item, names) {
  const errors = []
  const id = asString(item.id, "id", errors)
  const title = asString(item.title, `${id || "entry"} title`, errors)
  const vibe = asString(item.vibe, `${id} vibe`, errors)
  const description = asString(item.description, `${id} description`, errors)
  const family = asString(item.family, `${id} family`, errors)
  const recipe = asString(item.recipe, `${id} recipe`, errors)
  const uiNotes = asString(item.uiNotes, `${id} uiNotes`, errors)
  if (description.includes("\n")) errors.push(`${id} description must be one line`)
  if (!names.includes(family)) errors.push(`${id} family is not in catalog.json: ${family}`)
  if (!Array.isArray(item.tags) || item.tags.length < 3 || item.tags.some((tag) => typeof tag !== "string" || !tag.trim())) {
    errors.push(`${id} tags must be at least three short strings`)
  } else if (item.tags.join(" ").includes("\u2014") || item.tags.join(" ").includes("\u2013")) {
    errors.push(`${id} tags have a dash. Use a comma or a hyphen.`)
  }
  if (!recipe.startsWith("[SUBJECT:")) errors.push(`${id} recipe must start with [SUBJECT:`)
  if (!recipe.includes("STRICT palette")) errors.push(`${id} recipe needs a STRICT palette of named hex colors`)
  if (!/#[0-9A-Fa-f]{6}/.test(recipe)) errors.push(`${id} recipe needs hex colors like #3B4A63`)
  for (const label of ["Lighting:", "Composition:", "Mood:", "Avoid:"]) {
    if (!recipe.includes(label)) errors.push(`${id} recipe needs ${label}`)
  }
  const avoid = recipe.slice(recipe.indexOf("Avoid:")).toLowerCase()
  for (const word of ["text", "logos", "interface"]) {
    if (!avoid.includes(word)) errors.push(`${id} recipe Avoid list must include ${word}`)
  }
  return {
    errors,
    filed: {
      title,
      vibe,
      description,
      family,
      tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).trim()) : [],
      recipe,
      uiNotes,
    },
  }
}

async function applyFile(file) {
  if (!token()) fail("BLOB_READ_WRITE_TOKEN is not set.")
  const raw = JSON.parse(await readFile(file, "utf8"))
  const items = Array.isArray(raw) ? raw : raw.entries
  if (!Array.isArray(items) || items.length === 0) fail("Apply file must be a non-empty JSON array.")
  const names = familyNames()
  const ready = []
  const errors = []
  for (const item of items) {
    const result = validate(item, names)
    errors.push(...result.errors)
    ready.push({ id: typeof item.id === "string" ? item.id : "", filed: result.filed })
  }
  if (errors.length) fail(errors.join("\n"))

  for (const item of ready) {
    const current = await readEntry(`${ENTRY_PREFIX}${item.id}.json`)
    if (!current) fail(`No blob entry for ${item.id}`)
    const next = {
      ...current,
      ...item.filed,
      id: current.id,
      filename: current.filename,
      checksum: current.checksum,
      createdAt: current.createdAt,
      status: "ready",
    }
    delete next.error
    await put(`${ENTRY_PREFIX}${current.id}.json`, JSON.stringify(next), {
      ...PRIVATE,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    })
    console.log(`Filed ${current.id} ${next.title} (${next.family})`)
  }
}

const args = process.argv.slice(2)
if (args.includes("--help")) {
  console.log(usage)
} else if (args[0] === "--apply") {
  if (!args[1]) fail("Pass the JSON file after --apply.")
  await applyFile(args[1])
} else if (args.length === 0) {
  await listPending()
} else {
  fail(usage)
}
