# Agent Notes (Sitebook)

## Project Snapshot

- Purpose: Ethan's private catalog of website inspiration screenshots. Drop an image. The agent files it into an aesthetic family and writes an image recipe.
- Stack: Next.js 16, React 19, Tailwind CSS 4, TypeScript.
- Local dev: `npm run dev` (bound to 127.0.0.1).
- Build/test: `npm run build`.
- Deploy: a private Vercel app for Ethan. Do not treat it as a public product.

## Rules

- Do not `import` `data/catalog.json` from `app/` or `components/`. Only `lib/catalog.ts` may read or write it via `fs`. Only API routes import that lib.
- The 21 filed plates stay in `data/catalog.json`. Images for those plates are `data/images/user/` (gitignored). `Entry.filename` is relative to `data/images/` for filesystem plates.
- New uploads on Vercel go to a private Vercel Blob store, not the repo. They show up as unclassified cards. Do not copy Blob rows into `catalog.json`.
- Do not call OpenAI or any classify API. Ingest only saves a pending plate. You classify it.
- When the user adds photos or asks to file plates, run `/classify` and follow `.cursor/commands/classify.md`. Read `docs/design-styles.md` first. Do not dump `catalog.json` or full-size images into context. Look at one plate at a time.
- Families are aesthetic only. Each family in `catalog.json` has a definition, always, and never. There is no Product UI family and no page-type filter. Family names are ours. Blend lines and tags use style names from `docs/design-styles.md` when they match the picture.
- A recipe is a background image only: `[SUBJECT: ...]`, then material, a STRICT palette with bans, light, and empty space for type. No text and no interface. Put nav, type, and buttons in `uiNotes`.
- Catalog file writes are mutexed at runtime. When editing the JSON file directly, preserve ids, filenames, and checksums, and only change the entries you filed.
- Local dev without `BLOB_READ_WRITE_TOKEN` keeps using the filesystem. Do not create the Blob store or set env vars unless Ethan asks.
- v1 does not generate five sites, send to Higgsfield, export family packs, or convert HEIC.

## Next.js

This is not the Next.js most models know from training data. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
