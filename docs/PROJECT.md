# Registry Route — Project Doc

_Last updated: 2026-06-12 (housekeeping pass, LEN-339)._

## What it is

Registry Route (www.registryroute.com) routes anyone verifying a business entity to the right Secretary of State resource — and, as scrape coverage grows, surfaces verified entity data and documents directly so users never leave the page. Audience overlaps LendPaper's (funders, brokers, ISOs doing diligence) but it is a standalone product on its own domain.

## Architecture

| Piece | Detail |
| --- | --- |
| Hosting | Netlify, publishes repo root from `main` (`netlify.toml`, `_redirects`); domain `www.registryroute.com` via `CNAME` |
| App | Single-file `index.html`: D3 v7 + AlbersUsa projection SVG map, per-state click routing, mobile search-list fallback below the map |
| Data | `states.json` — per-state `{ name, sos, searchTemplate?, timeframe, isOnline }`; 1h CDN cache |
| Analytics | GA4 `G-T15G3SS8HL`, inline in `index.html` |
| CI | `.github/workflows/link-checker.yml` runs `check_links.py` over the SOS URLs |
| Local dev | `python3 serve.py` |
| Contact | `hello@lendpaper.com` (footer; replaced support@registryroute.com mailtos) |

## Map rendering — gotchas

- **Hover stroke:** `.state-hover-stroke` lives on a *layered SVG border* and must never have a CSS/SVG transform — `translateY` makes the outline weight flicker. Regressed and re-fixed twice (commits `5f2f7fe`, `a6b003e` on `seo-sandbox`).
- **MI label** has a hardcoded centering offset.
- **Territories:** `stateHref` guards against unmapped FIPS codes (`9580376`).
- **`_redirects` ordering:** JSON passthrough rules must precede the `/* → /index.html` catch-all.

## Current behavior vs. planned

Today, clicking a state opens the official SOS portal directly (modal was removed on `main`, `9de13cb`). The planned redesign (Linear **LEN-301**, project "Registry Route — RR") replaces that with:

- Two-tier map: **Instant** (green — verified data inline) / **State site** (blue — we open the portal), ⚡ marker for pre-fill-capable states.
- Company name / EIN input feeding a floating modal anchored to the clicked state's centroid.
- Documents section (Articles, Good Standing, etc.) from a monthly scrape schema (`canSurfaceInline`, `attachments[]`).
- Open design problem being iterated in `design/`: the company-add interaction (no side rails; dead-simple multi-company entry).

## Linear

- Project: **Registry Route — RR** (Lendpaper workspace)
- LEN-301 — SOS Routing UX redesign (mockup mode)
- LEN-339 — this housekeeping pass

## Repo hygiene

- `_local-archive/` (gitignored): pre-git code snapshots, multi-GB screen recordings, misplaced files — indexed in `_local-archive/ARCHIVE-INDEX.md`. Do not commit.
- Brand/social PNGs at the repo root (`Email header.png`, `linkedin-post.png`, `Linkedincover.png`, `sms-preview.png`, `email-header.png`) are tracked but unreferenced by the site; `og-image.png`, `twitter-card.png`, favicons, and `logo-wordmark-dark.svg` ARE referenced — left untouched on purpose. If a future pass wants to tidy them into `assets/`, update nothing else and verify no external hotlinks first.
