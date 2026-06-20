# Cyber Apparel Co — After-Dark Terminal Edition

Static, mobile-first GitHub Pages site for Cyber Apparel Co.

## Routes

- `index.html` — home / manifest
- `verify.html` — static verifier
- `drop-001.html` — product page / mockup gallery
- `about.html` — about
- `legal-marks.html` — legal / marks
- `404.html` — GitHub Pages fallback

## Artifact verification

Supported identifiers:

- `CA-AI-CHUNK-0001`
- `CY:\_AI_CHUNK_0001`
- `CY:\_001`

Static registry:

- `data/artifacts.json`
- `assets/proofs/CY-_AI_CHUNK_0001.metadata.json`

The verifier fetches `data/artifacts.json` when served over HTTP and falls back to embedded static data when opened directly through `file://`.

## Font

The stylesheet is wired for:

```text
assets/fonts/IBMPlexMono-ExtraLight.ttf
```

Place your licensed `IBMPlexMono-ExtraLight.ttf` file there to use the uploaded typeface in production. This package does not redistribute font files. Browser fallback is IBM Plex Mono / Courier New / monospace.

## Local testing

Open `index.html` directly, or run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

1. Push this folder to the root of a repository.
2. In GitHub, open **Settings → Pages**.
3. Select the main branch and root folder.
4. Publish.

The `.nojekyll` file is included.
