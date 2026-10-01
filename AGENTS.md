# Agent Notes (Sitebook)

## Project Snapshot

- Purpose: private localhost catalog of website inspiration screenshots. Drop images; the agent files each into a visual family and writes an Image Recipe.
- Stack: Next.js 16, React 19, Tailwind CSS 4, TypeScript.
- Local dev: `npm run dev` (bound to 127.0.0.1).
- Build/test: `npm run build`.
- Deploy: none. Local only.

## Rules

- Do not `import` `data/catalog.json` from `app/` or `components/`. Only `lib/catalog.ts` may read or write it via `fs`. Only API routes import that lib.
- Images: tracked fixtures in `data/images/fixtures/`. User drops in `data/images/user/` (gitignored). `Entry.filename` is relative to `data/images/`.
- Do not call OpenAI or any classify API. Ingest only saves the file as `pending`.
- When the user adds photos or asks to file plates, run `/classify`. Do not dump `catalog.json` or full-size images into context.
- Catalog writes are mutexed at runtime. When editing the JSON file directly, preserve fixtures and only change the entries you filed.
- v1 does not generate five sites, send to Higgsfield, export family packs, or convert HEIC.

## Next.js

This is not the Next.js most models know from training data. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.
