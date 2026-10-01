# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Ethan. He collects website screenshots on his own machine and on his private deploy, then starts new sites from those visual families.

## Product Purpose

Sitebook is Ethan's private inspiration catalog. Drop a screenshot, file it into an aesthetic family, and copy a brief or an image recipe. Success is: find a family, copy the four-part brief or the background recipe, and start the next site from his own pile.

## Positioning

The unit is a named style plate (title, blend line, concept, tags, family, UI notes, `[SUBJECT: …]` recipe). It is not a public gallery and not a site generator.

## Operating Context

Local use is `npm run dev`. The 21 filed plates and their metadata stay in `data/catalog.json`. Their images stay under `data/images/`.

The private Vercel deploy cannot keep new files on disk. New uploads go to a private Vercel Blob store after a server-side passcode check (`SITEBOOK_PASSCODE`). Viewing stays open. Without `BLOB_READ_WRITE_TOKEN`, local drops still save to the filesystem.

Drop saves an unclassified plate. Run `/classify` to file the blend line, concept, tags, recipe, and UI notes. Style names come from `docs/design-styles.md`. Copy brief is four parts: aesthetic, reference, intent, and guardrails. Copy image prompt returns the recipe. Recipes name Higgsfield `gpt_image_2` @ 2K in the plate UI. v1 copies text. It does not send.

## Capabilities and Constraints

- Drop PNG / JPEG / WebP. No HEIC. No URL capture. No accounts. No public storage product. No OpenAI classify key.
- Families are a small list in `catalog.json`, each with a definition and always/never rules.
- Five-site generation, family pack export, and Higgsfield send are later.

## Brand Commitments

Name: Sitebook. The catalog UI is cream paper, a serif title, mono metadata, and a red family mark.

## Evidence on Hand

Twenty-one of Ethan's screenshots, filed by looking at each one. Do not invent testimonials or a public audience. Do not load the sample plates Stillpage, SPADE, or Stillness.

## Product Principles

- The screenshot is not the product. The plate (image, family, recipe, brief) is.
- Files stay files. Blob is only for new plates on the private deploy.
- Copy is the v1 payoff.
- Keep the later five-site hook in the record shape, not in the UI.
