# Registry Route — Chrome extension

MV3 extension that puts Registry Route's Secretary of State routing in the Chrome
toolbar and on the right-click menu.

## What it does

- **Interactive US map** — the same map the site is built around, in the popup.
  Hover a state for its reinstatement timeframe, online/mail-in status and steps;
  click to open that state's official SOS business search.
- **Small states get callout boxes.** At popup width, DC renders about 3px across
  and Rhode Island about 11px — unclickable. Those seven (VT, NH, CT, RI, NJ, DE,
  DC) are broken out into a labelled column with identical behaviour.
- **Pre-fill** where the state allows it. `states.json` carries a `searchTemplate`
  for FL, WA and WI today; those get the company name straight in the URL and are
  tinted on the map. Every other state opens its portal landing page and the
  company name goes to the clipboard, one paste away.
- **Reads the page you're on** — when you open the popup it looks at the active
  tab for a business name (your selection, then schema.org `Organization`, then a
  heading or title carrying an entity suffix) and offers it as a dismissible chip.
  It is never filled in silently: detection is a guess, and a wrong name typed
  into a state registry is worse than no name.
- **Right-click lookup** — select a business name on any page → *Registry Route* →
  pick a state. Default and recent states lead that menu; all 51 sit under
  *All states*.
- **Default state** — the ☆ on the hover card pins one state; it then leads both
  the map and the right-click menu.
- **Keyboard** — `Alt+Shift+R` opens the popup. Tab reaches every state on the
  map; Enter opens it. The "Jump to a state" field matches names and
  abbreviations and highlights the match on the map.

## Privacy / permissions

No analytics, no tracking, no network calls at runtime. The state data and the
map geometry both ship inside the package.

| Permission | Why |
| --- | --- |
| `contextMenus` | the right-click *Registry Route* menu |
| `storage` | your default state, recent states and last query, all local |
| `offscreen` | clipboard write from the service worker (a worker has no DOM — this is Chrome's documented path) |
| `activeTab` | read the current tab **only when you open the popup**, to find a business name on it |
| `scripting` | run that one extraction function in the tab |

`activeTab` is deliberately used instead of host permissions or a content script:
it grants access only to the tab you invoked the extension on, only for that
invocation. The extension cannot read anything in the background, and cannot read
a page you never opened it on.

## Load it locally

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this `extension/` folder.

## Package for the Chrome Web Store

```bash
./build.sh
```

Writes `dist/registry-route-<version>.zip`, syncing `states.json` from
`origin/main` first so a stale local checkout can't ship reverted SOS URLs.

## Regenerating the map

`popup/us-map.js` is generated, not hand-written — pre-computed so the extension
ships no mapping library and makes no network call. To rebuild it (only needed if
you change the map width or simplification tolerance):

```bash
python3 -m http.server 8794 --directory .    # from the repo root
```

Then open `http://localhost:8794/tools/gen-map.html` and copy the emitted
`window.RR_MAP = …` block into `extension/popup/us-map.js`.

The generator fetches `us-atlas` and runs d3 + topojson **at build time only**. It
projects with `d3.geoAlbersUsa().fitWidth(740)`, simplifies each ring with
Douglas-Peucker, and also emits the callout list — the states whose smallest
projected dimension falls under a 24px click target.
