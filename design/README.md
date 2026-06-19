# RR design mockups — LEN-301

## registry-route-ux-v6.html ← CURRENT (prod map base · hover-only tiers · Option B)

Approved direction (6/19). Built on the **live `index.html` map rendering** (same `d3.geoAlbersUsa().scale(1200).translate([480,300])`, 960×600 viewBox, layered `states-g`/`borders-g`/`hover-g`/`labels-g`, white borders + white hover-stroke, `labelOffsets`), so the **rest state is identical to production** — uniform navy `#1e293b`, blue radial gradient, 2-letter labels.

Steve's directives folded in:
- **No color at rest.** Every state is the same navy until hovered/selected — calm starting map.
- **Tiers reveal on hover/selection only**, via fill color. **No lightning bolts.**
- **3 colors, labeled in the legend:** 🟢 Instant (`#10b981`) · 🟡 Pre-fill (`#f59e0b`) · 🔵 State site (`#3b82f6`). (Pre-fill became its own color since the bolts that used to signal it are gone.)
- **White state outlines kept** exactly as production.
- **§10 = Option B** unchanged: no global input bar; click a state → enter a company in the popover → it pins as a green pill and persists across state clicks (✕/change to reset). EIN auto-detect intact.

Build note: vendored `d3`, `topojson-client`, and `states-10m.json` live in `design/vendor/` so the mockup renders offline (the prod CDN is blocked in Steve's env). **Real bug found:** the earlier v4/v5 `d3.geoPath()` had no projection — `states-10m.json` is lon/lat, so states drew as a speck at the origin (blank map). Production `index.html` is fine (it sets the projection); any future build must too.

## registry-route-ux-v5.html ← superseded (Option B on a non-prod map)

v5 = v4's map/modal/tiers, but the §10 company-add is replaced:

- **No global input bar.** The map is the only affordance — there's only ever one thing to do: click a state.
- **Entry lives in the popover.** Click a state with no company set → the popover's first block is a `Company name or EIN` input (auto-focused). Press Enter → it routes/checks for that state.
- **The company pins.** Once entered it shows as a green pill above the map (`Checking [Acme ✕] · change`) and persists across state clicks — check Acme vs CA → TX → NY with no retyping. ✕ or "change" clears it.
- **EIN auto-detect** unchanged (EIN tag on the pill; manual-state copy switches to "search by entity ID").
- One company at a time (Option B is single-company by design). Multi-add was the chips model (Option A / v4) — not chosen.

Tradeoffs accepted (easiness over perfection): single company only, no localStorage persistence yet (one-liner later).

## registry-route-entry-options.html — the §10 decision aid

Three side-by-side entry flows (A chips / B click-first / C omnibox) against representative tiers CA·FL·TX. Built 6/18 to resolve §10; **Option B won**. Kept on file as the rationale record.

## registry-route-ux-v4.html ← superseded (§10 = company chips)

Open it in a browser (needs internet for the D3/us-atlas CDNs). Implements the locked LEN-301 direction — two-tier map (Instant green / State site blue, ⚡ pre-fill markers), floating modal anchored to the clicked state's centroid with per-tier content, documents section, small-NE-state flip, Escape/✕/background close — **plus a proposed answer to the §10 open problem**:

### §10 proposal — company chips (the thing to review)

- One input bar, same spot as §4. **Enter** turns what you typed into a **chip directly under the bar** — no side panel, no list view, nothing new to learn.
- **Paste a list** (commas or newlines) → it quietly splits into chips. That's the whole multi-add story.
- **One chip is active** (green); a state click checks *that* company. Click another chip to switch — the open modal live-swaps. This answers persistence: check "Acme" against CA → TX → NY without retyping.
- **EIN auto-detect** (`12-3456789`) → chip gets a small EIN tag; manual-state modal copy switches to "search by entity ID."
- ✕ on a chip removes it; CLEAR wipes input + chips + modal.

Tradeoffs accepted (easiness over perfection): no editing a chip (delete + retype), no per-chip results memory, no localStorage persistence yet (one-liner later if wanted).

### Tier sample data in the mock

Instant: CA, NY, TX, FL, DE. Pre-fill ⚡: WA, AZ, CO, GA, IL, MI, NC, VA. Everything else: manual. Entity records in Instant states are deterministic fakes generated from the company name — mockup only.

### Build notes for whoever implements

- Hover feedback is **fill-only**; selection uses stroke + `.raise()`. No transforms anywhere near state paths or hover strokes (see the repo rule — outline-flicker regression, fixed twice).
- Tier logic is exactly §9: `canSurfaceInline ? instant : site`, `hasPrefill = Boolean(searchTemplate)`, missing fields default to manual.
- The chips bar is ~60 lines of vanilla JS — portable straight into index.html.

## Older versions

v2 (three-tier) and v3 (two-tier, simplified) were referenced in LEN-301 but the files were lost before this folder existed; v4 was rebuilt from the LEN-301 spec and supersedes both.
