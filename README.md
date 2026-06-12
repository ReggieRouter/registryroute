# Registry Route

Verified entity data from every Secretary of State — an interactive US map that routes users to (and increasingly does the work of) each state's SOS business search. Live at **https://www.registryroute.com** (Netlify, deploys from `main`).

Registry Route is its own product on its own domain. It is **not** part of the LendPaper site; the only tie is the "Powered by LendPaper" footer credit and shared ownership.

## How it works

- `index.html` — the entire app: D3 + AlbersUsa SVG state map, hover/selection styling, SOS routing, GA4 analytics. Single-file by design.
- `states.json` — per-state data (SOS URLs, search templates, timeframes). Served with a 1h cache (`netlify.toml`).
- `about.html` — about page. `privacy.html` exists on `main`.
- `_redirects` — Netlify SPA routing (JSON passthrough first, then everything → `index.html`).
- `serve.py` — local dev server: `python3 serve.py` then open the printed URL.
- `check_links.py` + `.github/workflows/link-checker.yml` — CI link checking for the SOS URLs.

## Branches

- `main` — deploys to production. Has privacy page + direct-open-on-click behavior.
- `seo-sandbox` — working branch; carries the layered SVG border / hover-outline fix (`a6b003e`).

## Hard-won rules (do not regress)

- `.state-hover-stroke` must **never** carry a CSS/SVG transform — translateY causes outline-weight flicker on hover. The hover outline lives on a separate layered SVG border. (Fixed twice; see commits `5f2f7fe`, `a6b003e`.)
- Keep the `_redirects` JSON passthrough rules above the SPA catch-all or `states.json` 404s.

## Roadmap

The next major iteration is the **SOS Routing UX redesign** — two-tier Instant / State Site map with a floating per-state modal and a dead-simple company-add interaction. Spec + status: Linear **LEN-301**; interactive mockup in `design/` (see `design/README.md`).

## docs/ & housekeeping

- `docs/` — project docs (start with `docs/PROJECT.md`).
- `_local-archive/` — gitignored local archive of historical code snapshots and large screen recordings (see its `ARCHIVE-INDEX.md`). Never commit this folder; it contains multi-GB media.
