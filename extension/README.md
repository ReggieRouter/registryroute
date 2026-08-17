# Registry Route — Chrome extension

MV3 extension that puts Registry Route's Secretary of State routing in the Chrome
toolbar and on the right-click menu. Source of truth for LEN-2111.

## What it does

- **Toolbar popup** — type a company name (or EIN), click a state, and the state's
  official SOS business search opens in a new tab.
- **Pre-fill** where the state allows it. `states.json` carries a `searchTemplate`
  for FL, WA and WI today; those states get the company name straight in the URL
  and are marked with a green dot in the grid / a ⚡ badge on the card. Every other
  state opens its portal landing page and the company name goes to the clipboard,
  one paste away.
- **Right-click lookup** — select a business name on any page → *Registry Route* →
  pick a state. The default state and the last three used sit at the top of that
  menu; the full 51 (50 states + DC) are under *All states*.
- **Reinstatement steps** — each state's timeframe, online/mail-in status and
  reinstatement instructions, offline, from the same data the site uses.
- **Default state** — the ☆ button on the detail card pins one state; it leads the
  grid, the context menu and the Open button.
- **Keyboard** — `Alt+Shift+R` opens the popup, `Enter` in the name field runs the
  default state.

## Privacy / permissions

No host permissions, no content scripts, no analytics, no network calls. The state
data ships inside the package. Three permissions, all local:

| Permission | Why |
| --- | --- |
| `contextMenus` | the right-click *Registry Route* menu |
| `storage` | your default state, recent states, last query |
| `offscreen` | copying the company name to the clipboard from the service worker (Chrome's documented path — a worker has no DOM) |

## Load it locally

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this `extension/` folder.

## Package for the Chrome Web Store

```bash
./build.sh
```

Writes `dist/registry-route-<version>.zip`, refreshing `states.json` from the repo
root first so the extension never ships stale SOS URLs.

## Keeping data in sync

`extension/states.json` is a copy of the site's `states.json`. `build.sh` re-copies
it on every package. If you edit the root file (new SOS URL, new `searchTemplate`),
re-run `build.sh` — or copy it by hand — before shipping.
