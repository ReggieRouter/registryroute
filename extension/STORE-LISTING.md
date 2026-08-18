# Registry Route — Chrome Web Store listing kit

Everything below is copy/paste-ready for the [developer dashboard](https://chrome.google.com/webstore/devconsole). No drafting needed — just paste and upload.

## Package to upload

`extension/dist/registry-route-1.1.0.zip` — run `./build.sh` to produce it (it re-syncs `states.json` from `origin/main` first).

## Store listing tab

**Extension name**
```
Secretary of State Business Search — 51 States | Registry Route
```
⚠️ This is the SEO-optimized name from `STORE-LISTING-V2.md` §2, and it's what's actually packed into `manifest.json` — the brand-first name this file showed until now was stale. Keep the brand, it's just moved to the end so the keyword head wins cold search.

**Summary** (132 char max)
```
Type a name, pick a state, done. Official Secretary of State business entity search for all 50 states plus DC. Free, no account.
```
⚠️ Also pulled from `manifest.json`'s live `description` field — 128 characters. Paste this exactly rather than re-typing a paraphrase, so the store listing says the same thing as the package a reviewer actually opens.

**Description**
```
Stop hunting for the right Secretary of State website.

Type a company name. Pick a state. The official business entity search opens, ready to go.

That's the whole tool. Three seconds instead of three minutes.

────────────────────────

WHAT YOU GET

✓ All 50 states plus Washington DC — every official Secretary of State business entity search, verified and current.
✓ Right-click any business name on any page → look it up in any state. No copying, no pasting, no tab-hunting.
✓ Alt+Shift+R from anywhere. Type three letters of a state and hit enter.
✓ Pre-filled searches on supported states (Florida, Washington, Wisconsin today, more coming) — the name is already in the box when the page loads.
✓ Pin your default state. Your last three stay one click away.

────────────────────────

THE PART NOBODY ELSE HAS

Every state's reinstatement path is built in.

Found a suspended or administratively dissolved entity? The popup already shows you:
• How long reinstatement takes in that state
• Whether it can be done online or has to go by mail
• The actual step-by-step filing sequence

All 51 jurisdictions. No second tab. No calling the state.

────────────────────────

WHO USES IT

Underwriters verifying entity status before funding.
Brokers and ISOs checking good standing mid-call.
Collections and legal teams tracing corporate records.
Compliance and KYB teams running entity checks at volume.
Accountants and registered agents chasing filing status.
Anyone who has ever bookmarked a state portal and found it dead six months later.

────────────────────────

FREE. AND IT STAYS FREE.

No subscription. No plan to pick after install. No trial that expires.
No account, no email, no login.

────────────────────────

SENDS NOTHING, ANYWHERE

No analytics. No tracking. No network requests at all.
All 51 states ship inside the extension, so it works offline.
The only data it touches is what you type, and that never leaves your browser.

────────────────────────

COVERAGE

Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, District of Columbia, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming.

Also called: business entity search, corporation lookup, LLC lookup, company registration search, entity status check, good standing check, corporate records search, SOS search.

────────────────────────

Built by the team behind registryroute.com — a free routing directory used by lenders and brokers to verify business entities across all 50 states.

Broken link? hello@lendpaper.com — we fix them same week.
```
⚠️ This is `STORE-LISTING-V2.md` §4 — the keyword-dense version built to outrank the incumbents, not the shorter draft this file had until now. One correction on the way in: the source doc's closing line used `support@registryroute.com`, which the site retired site-wide in commit `996d9ad` for `hello@lendpaper.com`. Fixed here. (`privacy.html` on the live site still has the old address — separate issue, not part of this submission.)

**Category**: Productivity

**Language**: English (United States)

## Graphics

- **Icon**: already in the package (`icons/icon-128.png`) — uploads automatically with the zip.
- **Screenshots** (1280×800, PNG) — already rendered and committed in `extension/screenshots/`, upload in this order:
  1. `1-map-overview.png` — the map with a company name typed in.
  2. `2-state-detail.png` — hovering California, showing timeframe, portal type and reinstatement steps.
  3. `3-small-states.png` — the callout column for the states too small to click.
  4. `4-right-click-lookup-ILLUSTRATED.png` — the right-click menu (illustrated; native context menus can't be screen-captured).
  5. `5-page-detection.png` — the "on this page" suggestion chip.
- No promo tile or marquee image needed — those are optional and only matter for featured placement.

## Privacy practices tab

**Single purpose description**
```
Registry Route helps users quickly navigate to the correct state Secretary of State business search page, based on a company name and a selected state.
```

**Permission justifications**

| Permission | Justification |
|---|---|
| `contextMenus` | Adds a right-click menu item so users can look up a selected business name in a chosen state's SOS search without opening the popup first. |
| `storage` | Stores the user's default state, three most-recently-used states, and last search text locally, so repeat lookups don't require re-entering the same information. Never leaves the device. |
| `offscreen` | Used solely to copy the typed company name to the clipboard (via a background offscreen document, since service workers have no clipboard access) when the target state's portal can't accept the name directly in the URL. |
| `activeTab` | When the user opens the popup, the extension looks at that one tab for a business name (their text selection, a schema.org Organization name, or a heading carrying an entity suffix) and offers it as a dismissible suggestion. Access is granted only for the tab the user invoked the extension on, only for that invocation. |
| `scripting` | Runs that single extraction function in the active tab. No content scripts are registered, so nothing runs on any page the user has not explicitly invoked the extension on. |

**Are you using remote code?** No.

**Data usage** — for every category Chrome asks about (personally identifiable info, health info, financial info, authentication info, personal communications, location, web history, user activity, website content):
```
This item does not collect this type of data.
```

**Certify data usage compliance**: Yes — check the box.

⚠️ **Read this before ticking "does not collect".** As of v1.1.0 the extension *reads* the active tab (via `activeTab`) to suggest a business name. Chrome defines "collect" as **transmitting data off the user's device**, and this extension transmits nothing, anywhere — there is no server, no analytics and no network call at runtime. The only thing persisted is the user's own query, in `chrome.storage.local`, on their machine. So "does not collect" is accurate for every category. Do not skip the reviewer note below, though — reading a page and not collecting it is a distinction worth stating plainly rather than leaving a reviewer to infer.

**Privacy policy URL**
```
https://www.registryroute.com/privacy.html
```
Note: this page also covers registryroute.com's own analytics (GA4, website only). The extension itself collects nothing — the questionnaire answers above are the accurate statement for the *extension specifically*. If a reviewer asks, that's the explanation.

## Distribution tab

- **Visibility**: Public
- **Pricing**: Free
- **Regions**: All regions (or United States only, if you'd rather start narrow)

## Reviewer notes (optional field, if Chrome shows one)

```
This extension makes zero network requests at runtime. All data ships inside the package: states.json (~51 entries of public Secretary of State URLs and reinstatement instructions) and us-map.js (pre-computed US map geometry, so no mapping library is loaded).

Permissions: contextMenus (right-click menu), storage (local-only preferences), offscreen (clipboard write from the service worker, per Chrome's documented pattern — service workers have no DOM), and activeTab + scripting.

On activeTab/scripting: when the user opens the popup, one function runs in the active tab to look for a business name — the user's text selection, a schema.org Organization name, or a heading/title containing an entity suffix such as LLC or Inc. The result is shown as a dismissible suggestion chip and is never filled in automatically. There are no registered content scripts and no host permissions, so nothing runs on any page unless the user explicitly opens the popup there. Nothing read from the page is transmitted anywhere.
```

## After submit

Review is typically same-day to 3 business days for an extension with this permission footprint. No action needed while it's pending — Chrome emails when it's approved or if it needs changes.
