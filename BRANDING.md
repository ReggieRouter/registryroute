# BRANDING.md — Registry Route Visual Identity & Document Standards

This document is the single source of truth for all visual and layout decisions
in Registry Route's user interfaces, web properties, and branding assets. When in conflict
with any other source, this file wins.

---

## 1. Brand Identity

### Trade Name
**Registry Route** — written as two words with capital R, capital R.
In shorthand/code contexts: **RegRoute** or lowercase `registryroute` is acceptable (e.g. for folder names, class names, or routes).

### Wordmark & Logo Lockup
The Registry Route wordmark is styled in modern high-contrast typography, co-branded with **LendPaper**.
- Co-branded lockup format: `Registry Route | BY lendpaper.` 
- Includes a 1px vertical divider (`rgba(255,255,255,0.2)`) between the Registry Route wordmark and the subordinate LendPaper brand signature.
- SVG assets: `logo-wordmark-dark.svg` (light text for dark backgrounds) and `logo-wordmark-light.svg` (dark text for light backgrounds).

### Tagline
"Secretary of State Routing" / "Open B2B SOS Routing Directory"

### RegRoute Fit
**Perfect.** Lean sales and underwriting desks are facing crushing transaction volumes. They are actively hunting for tools to eliminate manual calculation errors, speed up deal structuring, and maximize throughput per employee without adding W2 overhead.

---

## 2. Color System

Registry Route utilizes a sleek, immersive dark-themed interface built on modern translucent surfaces and custom HSL/RGB accents.

### Color Palette Tokens

| Token | CSS Variable | Hex / RGBA Value | Usage |
|---|---|---|---|
| Primary Background | `html / body` | `#020408` | Pitch-black core canvas background |
| Surface Background | `--bg` | `#0f1115` | Default dark box / card backgrounds |
| Translucent Surface | `--surf` | `rgba(24, 26, 31, 0.85)` | Glassmorphic dropdowns, state cards, and panels |
| Accent / Highlight | `--highlight` | `#3b82f6` | Primary action borders, active maps, and focus highlights |
| State Hover Accent | `--sos-hover` | `#f87171` | Interactive map hover overlays and red-tint warnings |
| Text Primary | `--text` | `#e2e8f0` | High-contrast body copy and data labels |
| Text Secondary / Muted| `--muted` | `#8b96a5` | Descriptive subtexts, placeholders, and tooltips |
| Border Color | `--border` | `rgba(46, 51, 61, 0.5)` | Premium hairline borders, division lines |

### Status Colors (Eligibility & Compliance Tiers)

| Status | Text Color Token | Background Color Token | Hex Code Equivalent |
|---|---|---|---|
| Good Standing / Active | `--good-text` | `--good-bg` | `#10b981` / `rgba(16, 185, 129, 0.15)` |
| Warning / Reinstatement | `--warn-text` | `--warn-bg` | `#f59e0b` / `rgba(245, 158, 11, 0.15)` |
| Inactive / Dissolved | `--bad-text` | `--bad-bg` | `#ef4444` / `rgba(239, 68, 68, 0.15)` |

---

## 3. Typography

### Font Stack
- Primary: `"Inter", system-ui, -apple-system, sans-serif`
- Character Rendering: High-fidelity legibility rules using `font-feature-settings: "cv05", "cv11", "ss01";`

### Typographic Rules
- Section headings use a bold weighting (700 or 800) with subtle letter-spacing reduction for a premium tech aesthetic.
- Form inputs and text fields display in pure Inter regular (`400` or `500` weight) in `--text`.

---

## 4. UI & Layout Principles

### 1. Glassmorphism & High-Fidelity Backgrounds
- A custom WebGL particle canvas background (`#c`) simulates liquid space-flow behind all interface pages, providing an extremely premium, living feel.
- Interactive elements utilize `backdrop-filter: blur(8px);` over translucent surfaces (`--surf`) to create depth.

### 2. State & Map Interactivity
- The US Map interface (`usmap.js`) highlights targeted states with high contrast. Hover states utilize transitions to `#f87171` to establish a direct visual response loop.
- Information panels slide smoothly and organize state search URLs and reinstatement details into distinct, highly crawlable, semantic sections.
