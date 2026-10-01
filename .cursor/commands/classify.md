---
description: File pending Sitebook plates into aesthetic families
---

File pending Sitebook plates. You do the looking and the writing. Do not call OpenAI or any other classify API.

Before you write, read `docs/design-styles.md`. The source article is https://uxplanet.org/50-design-styles-every-designer-should-know-for-better-prompting-56c09d55db62. Use its style names and keywords in the blend line and the tags when they match the screenshot. Do not copy the article. Do not force a style that is not in the picture.

## Where the plates are

Filesystem plates live in `data/catalog.json`, with images under `data/images/`. Edit only the rows you file. Keep `id`, `filename`, `checksum`, and `createdAt`.

Blob plates are new uploads from the deployed site. They are not in `catalog.json`. Run `npm run classify:pending` (needs `BLOB_READ_WRITE_TOKEN`). It lists pending plates and downloads each image to `data/.classify-cache/`. Look at every image. Write a JSON array and run `npm run classify:pending -- --apply <file>`. Do not copy Blob rows into `catalog.json`.

If the script says the token is not set, there is nothing in Blob to file.

## What to write

Look at the screenshot first. Family names are the aesthetic names already in `catalog.json`. Do not invent a family, and do not use a page type (no Product UI, no waitlist, no app-UI family). Read that family's definition, always, and never. If nothing fits, stop and say so.

- `title`: a short plate name.
- `vibe`: a blend, like `surrealism x tenebrism` or `cottagecore x japandi`. Use style names from `docs/design-styles.md`.
- `description`: one line on what the design is, not a tour of the screenshot.
- `tags`: design vocabulary from the style list and from what you see. Not prices, names in the nav, or labels copied off the page. At least three.
- `recipe`: background image only. Start with `[SUBJECT: a swappable subject]`, then the style only: material or medium, a `STRICT palette` with explicit bans, lighting, and empty space for type. End with `no text, no interface.` No nav, buttons, headlines, or prices.
- `uiNotes`: nav, type, buttons, and layout. This feeds the brief. It stays out of the recipe.

Set `status` to `ready` on filesystem rows. The apply script does that for Blob.

## Writing rules

Plain words. No em dashes. No invented facts. Do not load the sample plates Stillpage, SPADE, or Stillness.

Apply JSON:

```json
[
  {
    "id": "uuid",
    "title": "Plate name",
    "vibe": "style x style",
    "description": "One line on what the design is.",
    "family": "Vast Quiet Cinematic",
    "tags": ["surreal scale", "tenebrist dusk", "empty sky"],
    "recipe": "[SUBJECT: a swappable subject] rendered as ..., STRICT palette: ..., no purple, no neon, ... empty space for typography, no text, no interface.",
    "uiNotes": "Thin navigation. One quiet button. Type stays small."
  }
]
```
