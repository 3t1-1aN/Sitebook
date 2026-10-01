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
- A recipe is a background image only. It starts with `[SUBJECT: ...]`, then says what the picture is and what it is not. It includes a `STRICT palette` of 4 to 7 named hex colors, lighting direction and quality, a camera or lens (or a flat-illustration note), texture or grain, composition with the subject and the empty type area as percentages of the frame, a `Mood:` line, and an `Avoid:` list. The avoid list names the likely wrong turns: wrong medium, wrong palette, wrong composition, plus purple, neon, text, logos, and interface. No nav, buttons, headlines, or prices. Put those in `uiNotes`.
- Tested shape, from the EOSAI plate. Match this, and do not shorten it back to a one-line palette:

```
[SUBJECT: a lone figure standing at the base of a monumental arch] rendered as a surreal photoreal CGI matte painting, clean and polished, soft fine film grain. The arch is a smooth, featureless modern monolith (a tall rectangular slab of polished pale stone with an arched cutout), not ruins. A huge pale moon sits partly behind it, a thin dark orbital ring curves across the frame, two small floating spheres hang in the air, and soft cumulus clouds drift through the arch. STRICT palette: slate dusk blue #3B4A63, misty blue-grey #8A97AD, pale peach glow #F2D1B3, cream highlight #FBEFE1, muted gold #D9B47A on rim edges only. Cool overall, warm only as a soft glow behind the arch. Lighting: low sun behind the arch, backlit, soft diffuse glow, long reflections. Camera: 35mm wide, eye level just above the water. Composition: arch and moon in the right half, figure small at the arch base, mirror-still reflective water and a thin dark walkway in the lower quarter, left 45% of the frame calm hazy sky kept empty for typography. Mood: calm, quiet, dreamlike. Avoid: orange sunset, saturated sky, ancient or crumbling stone, rocks, centered symmetry, purple, neon, lens flare, stars, text, logos, interface.
```
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
