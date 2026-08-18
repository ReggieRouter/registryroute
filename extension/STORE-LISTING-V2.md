# Registry Route — Chrome Web Store listing v2 (poach build)

Purpose: outrank and out-convert **Proof of Good Standing** and **Secretary of State Tools** in Chrome Web Store search, and convert their churned users on the website.

Everything in a fenced block is copy/paste-ready.

---

## 1. Why the incumbents are beatable

| Incumbent | Search weakness | Copy weakness |
|---|---|---|
| Proof of Good Standing | Name contains **zero** of the words people type. Unfindable by search — it lives on paid/referral traffic. | Subscription. "Install first, then choose your plan." |
| Secretary of State Tools | Gets "secretary of state" but misses *business search, entity, lookup, LLC, UCC, 50 states*. | "Designed for teams avoiding costly APIs/custom development" is a procurement sentence, not a pain sentence. "This niche tool solves one key problem effectively" is self-deprecating. |
| Both | Map-click only. No keyboard, no right-click, no pre-fill, no page detection. | Describe the *interface*, never the *minute saved*. |

Registry Route's current listing loses on one thing only: **the name is brand-first.** "Registry Route — Secretary of State Lookup" puts an unknown brand in the highest-weighted field. With near-zero installs, brand-first is the wrong order.

---

> ⚠️ **Name and Summary are NOT editable in the dashboard.** Chrome reads them from `manifest.json` and shows them as "Title from package" / "Summary from package" (greyed out). Changing them means editing the manifest, bumping the version, rebuilding, and uploading a new package. **Only the Description field is pasted in the dashboard.**
>
> Already done: manifest updated to v1.0.1, package built at `dist/registry-route-1.0.1.zip`.

## 2. Extension name (highest-weighted ranking field) — set in `manifest.json`

**Recommended** — 63 chars, and the first 40 (what tiles show) are all keyword:

```
Secretary of State Business Search — 51 States | Registry Route
```

Alternates:

```
Business Entity Search — Secretary of State Lookup, All 50 States
```

```
SOS Business Lookup — Entity Search for All 50 States + DC
```

> 🚨 **Keep the brand, move it last.** Google indexes the store page; "Registry Route" still resolves for anyone searching the brand, and the keyword head is what wins cold search.

---

## 3. Summary (132 char hard limit — this one is 128) — set in `manifest.json` as `description`

```
Type a name, pick a state, done. Official Secretary of State business entity search for all 50 states plus DC. Free, no account.
```

Backup (132 — exactly at the ceiling, do not edit it longer):

```
One shortcut to any state's official business entity search. 50 states plus DC, right-click lookup, pre-fill. Free, nothing tracked.
```

---

## 4. Description

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

Broken link? support@registryroute.com — we fix them same week.
```

---

## 5. What changed and why

| Incumbent line | Registry Route replacement | Why it converts better |
|---|---|---|
| "Easily verify if a business is in good standing" | "Stop hunting for the right Secretary of State website." | Names the friction, not the feature. Negative-state openers outperform benefit openers on distracted readers. |
| "Designed for teams avoiding costly APIs/custom development" | "Three seconds instead of three minutes." | A number beats an abstraction. Nobody feels "avoiding costly APIs". |
| "Users perform searches after clicking directly on the map" | "Type a company name. Pick a state. Done." | Second person, verb-first, one action per line. The map is *their* constraint sold as a feature. |
| "This niche tool solves one key problem effectively" | Cut entirely. | Self-deprecating and vague. Replaced with the reinstatement section they can't match. |
| "No more hunting for the right Secretary of State websites or dealing with broken links" | Kept the idea, moved to line 1, added "we fix them same week." | Their strongest line was buried last. Ours leads and adds a promise. |

**ADHD-legibility rules applied throughout:** one idea per line, no paragraph over two lines, checkmark scanning column, divider rules between blocks, concrete numbers instead of adjectives, the differentiator in its own titled section instead of a bullet.

---

## 6. Searchability: queries this listing now catches

| Query | Caught by |
|---|---|
| secretary of state business search | Name (exact) |
| business entity search | Name alt + description |
| [state] secretary of state search | Coverage block — 51 long-tail queries |
| good standing check | "Also called" line + description |
| LLC lookup / corporation lookup | "Also called" line |
| entity status check | Who-uses-it + "Also called" |
| reinstatement / administratively dissolved | Reinstatement section (zero competition) |
| KYB / underwriting entity verification | Who-uses-it block |

> 🚨 **Do not name competitors inside the store listing.** Chrome Web Store policy treats competitor comparisons and keyword-stuffed brand terms as grounds for takedown. The "X alternative" play belongs on registryroute.com only.

---

## 7. Poaching past users (website, not the store)

Three pages on registryroute.com, each targeting churn intent:

1. `/alternatives/proof-of-good-standing` — "Free alternative to Proof of Good Standing." Honest feature table. Lead with price and the reinstatement data.
2. `/alternatives/secretary-of-state-tools` — lead with right-click lookup, keyboard shortcut, and pre-fill. Their tool is map-only.
3. `/free-secretary-of-state-search` — catches the "is there a free one" query that every churning subscriber types.

Each page ends with the same CTA: install the extension. No email gate.

---

## 8. Honest-claim guardrails

⚠️ **Updated for v1.1.0.** The extension now has a map too, so "we have a map and they don't" was never the argument and still isn't. The differentiator is that the map is *not the only way in*: Registry Route also has keyboard access, right-click lookup, pre-fill and page detection. Positioning should read "everything their map does, plus the three routes their map can't offer" — not "our map is nicer".

Also new in v1.1.0: the extension reads the active tab (`activeTab`) to suggest a business name. Copy must not say "cannot read any page" any more. It can say, accurately: *reads nothing until you open it, sends nothing anywhere, ever.*

Do not write these until they are true:

- ❌ "Warns you which portals charge, need a login, or throw a CAPTCHA" — `states.json` has the data (6 paid, 2 auth, 6 CAPTCHA) but the popup does not render it. **Ship this and it becomes the second thing nobody else has.**
- ❌ "Pre-fills every state" — 3 of 51 today (FL, WA, WI). LEN-2116 tracks the rest. Copy says "supported states … more coming", which is accurate.
- ❌ "UCC search" — the incumbents both claim UCC coverage. `states.json` routes to entity search only. Either add UCC URLs or leave the claim out.
