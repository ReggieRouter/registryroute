# RR design mockups — LEN-301

## registry-route-ux-v4.html ← current

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
