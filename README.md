# Sitebook

Ethan's private catalog of website inspiration screenshots.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000. Drop a PNG, JPEG, or WebP. It saves on this machine as an unclassified plate. Then run `/classify` so the agent files the family, blend line, concept, tags, recipe, and UI notes.

Style names used in blend lines and tags are paraphrased in `docs/design-styles.md`.

Copy brief on a plate is a four-part site prompt: aesthetic, reference, intent, and guardrails. Copy image prompt returns the background recipe.

## Deployed uploads (one-time setup)

The deployed site does not keep new files on disk. New plates go to a private Vercel Blob store. Do this once in the Vercel project. Do not commit the secrets.

1. Create a Blob store and choose Private.
2. Connect that store to this project so Vercel sets `BLOB_READ_WRITE_TOKEN`.
3. Set `SITEBOOK_PASSCODE` to a passcode only Ethan knows.

Viewing the library stays open. Uploading asks for the passcode. Local dev without those env vars still saves to `data/images/user/` and `data/catalog.json`.

The 21 seed screenshots are gitignore exceptions under `data/images/user/`, so they ship with the repo, and any later drop in that folder stays ignored.

## How Ethan uses it

### Upload

1. Open the site.
2. If the passcode field is showing, type the passcode.
3. Drop a PNG, JPEG, or WebP.
4. A blank Unclassified card shows up right away.

### Classify

Ask the agent to run `/classify`. The agent looks at the picture. It does not call a paid classify API.

For plates saved on the deployed site:

1. Put `BLOB_READ_WRITE_TOKEN` in the shell (from the Vercel project).
2. Run `npm run classify:pending`.
3. The script lists pending plates and downloads each image to `data/.classify-cache/`.
4. The agent writes a JSON array after looking at each image.
5. Run `npm run classify:pending -- --apply path/to/filed.json`.

Filesystem plates are filed by editing `data/catalog.json`. Blob plates stay in Blob.

### Delete

Open a plate and choose Delete, then Yes. The request sends the same passcode already typed on the page.

A plate uploaded on the live site is removed from the private Blob store, image included. A seed plate stays in the repo. Its id is written to a private blob, `meta/hidden.json`, and the catalog skips hidden ids, so the card disappears with no redeploy. That file is read with the Blob cache turned off.

Without a Blob token, Delete removes the row from `data/catalog.json` and the image file on disk. A wrong passcode returns 401 `Wrong passcode.` If Blob is on and `SITEBOOK_PASSCODE` is missing, the response is 401 `Upload is off until SITEBOOK_PASSCODE is set.`

See `AGENTS.md` for agent rules.
