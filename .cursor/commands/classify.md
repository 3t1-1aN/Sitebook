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
- `recipe`: background image only. Start with `[SUBJECT: a swappable subject]`. Then, in this order: the medium and what it is not; a `STRICT palette` of 4 to 7 named hex colors taken from the screenshot; `Lighting:` with direction and quality; a camera or lens, or a note that it is a flat illustration; texture or grain; `Composition:` with where the subject sits and where the empty type area is, as percentages of the frame; a `Mood:` line; an `Avoid:` list. The avoid list must name the likely wrong medium, the wrong palette, the wrong composition, and must include purple, neon, text, logos, and interface. No nav, buttons, headlines, or prices. Do not invent anything you cannot see in the screenshot.
- `uiNotes`: nav, type, buttons, and layout. This feeds the brief. It stays out of the recipe.

The recipe below is the tested EOSAI plate. Copy that shape. Do not shorten a new recipe to a one-line palette.

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
    "recipe": "[SUBJECT: a lone figure standing at the base of a monumental arch] rendered as a surreal photoreal CGI matte painting, clean and polished, soft fine film grain. The arch is a smooth, featureless modern monolith (a tall rectangular slab of polished pale stone with an arched cutout), not ruins. A huge pale moon sits partly behind it, a thin dark orbital ring curves across the frame, two small floating spheres hang in the air, and soft cumulus clouds drift through the arch. STRICT palette: slate dusk blue #3B4A63, misty blue-grey #8A97AD, pale peach glow #F2D1B3, cream highlight #FBEFE1, muted gold #D9B47A on rim edges only. Cool overall, warm only as a soft glow behind the arch. Lighting: low sun behind the arch, backlit, soft diffuse glow, long reflections. Camera: 35mm wide, eye level just above the water. Composition: arch and moon in the right half, figure small at the arch base, mirror-still reflective water and a thin dark walkway in the lower quarter, left 45% of the frame calm hazy sky kept empty for typography. Mood: calm, quiet, dreamlike. Avoid: orange sunset, saturated sky, ancient or crumbling stone, rocks, centered symmetry, purple, neon, lens flare, stars, text, logos, interface.",
    "uiNotes": "Thin navigation. One quiet button. Type stays small."
  }
]
```
