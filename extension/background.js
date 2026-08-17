// LEN-2111 — Registry Route (MV3).
//
// The whole extension is packaged static pages plus this worker. There are no
// host permissions, no content scripts and no network calls: states.json ships
// inside the package. The worker exists to (a) build the right-click menu of
// states and (b) open the chosen SOS portal in a new tab.

const STATES_URL = chrome.runtime.getURL('states.json');
const MENU_ROOT = 'rr-root';
const MENU_ALL = 'rr-all';
const ITEM_PREFIX = 'rr-state:';
const MAX_RECENT = 3;

let statesPromise = null;

function loadStates() {
  if (!statesPromise) {
    statesPromise = fetch(STATES_URL)
      .then((res) => res.json())
      .catch((err) => {
        console.error('[RR] states.json failed to load', err);
        statesPromise = null;
        return {};
      });
  }
  return statesPromise;
}

async function getPrefs() {
  const { defaultState = null, recent = [] } = await chrome.storage.sync.get({
    defaultState: null,
    recent: [],
  });
  return { defaultState, recent };
}

// A state can pre-fill only when states.json carries a searchTemplate for it
// (FL, WA, WI today). Everywhere else we open the portal landing page and put
// the company name on the clipboard so it is one paste away.
function buildUrl(state, query) {
  const q = (query || '').trim();
  if (q && state.searchTemplate) {
    return state.searchTemplate.replace('{query}', encodeURIComponent(q));
  }
  return state.sos;
}

async function rememberState(abbr) {
  const { recent } = await getPrefs();
  const next = [abbr, ...recent.filter((a) => a !== abbr)].slice(0, MAX_RECENT);
  await chrome.storage.sync.set({ recent: next });
}

/* ---------------------------------------------------------------- clipboard */
// Service workers have no DOM, so clipboard writes go through an offscreen
// document — Chrome's documented path for exactly this.
let creatingOffscreen = null;

async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });
  if (existing.length > 0) return;

  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Copy the selected company name so it can be pasted into the state portal.',
    });
  }
  await creatingOffscreen;
  creatingOffscreen = null;
}

async function copyToClipboard(text) {
  if (!text) return;
  try {
    await ensureOffscreen();
    await chrome.runtime.sendMessage({ target: 'offscreen', type: 'copy', text });
  } catch (err) {
    // Never let a clipboard failure stop the lookup itself.
    console.warn('[RR] clipboard copy failed', err);
  }
}

/* -------------------------------------------------------------- context menu */
async function rebuildMenus() {
  const [states, prefs] = await Promise.all([loadStates(), getPrefs()]);
  const abbrs = Object.keys(states).sort((a, b) => states[a].name.localeCompare(states[b].name));
  if (abbrs.length === 0) return;

  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: MENU_ROOT,
    title: 'Registry Route',
    contexts: ['selection'],
  });

  const label = (abbr) => {
    const s = states[abbr];
    const bolt = s.searchTemplate ? ' ⚡' : '';
    // %s is replaced by Chrome with the selected text.
    return `Look up "%s" in ${s.name}${bolt}`;
  };

  // Shortcuts first: the default state, then whatever was used recently.
  const shortcuts = [];
  if (prefs.defaultState && states[prefs.defaultState]) shortcuts.push(prefs.defaultState);
  for (const abbr of prefs.recent) {
    if (states[abbr] && !shortcuts.includes(abbr)) shortcuts.push(abbr);
  }

  for (const abbr of shortcuts.slice(0, MAX_RECENT + 1)) {
    chrome.contextMenus.create({
      id: `${ITEM_PREFIX}${abbr}`,
      parentId: MENU_ROOT,
      title: label(abbr),
      contexts: ['selection'],
    });
  }

  if (shortcuts.length > 0) {
    chrome.contextMenus.create({
      id: 'rr-sep',
      parentId: MENU_ROOT,
      type: 'separator',
      contexts: ['selection'],
    });
  }

  chrome.contextMenus.create({
    id: MENU_ALL,
    parentId: MENU_ROOT,
    title: 'All states',
    contexts: ['selection'],
  });

  for (const abbr of abbrs) {
    chrome.contextMenus.create({
      // Distinct id namespace so a state can appear both as a shortcut and in
      // the full list without colliding.
      id: `${ITEM_PREFIX}all:${abbr}`,
      parentId: MENU_ALL,
      title: `${states[abbr].name}${states[abbr].searchTemplate ? ' ⚡' : ''}`,
      contexts: ['selection'],
    });
  }
}

chrome.runtime.onInstalled.addListener(() => { rebuildMenus(); });
chrome.runtime.onStartup.addListener(() => { rebuildMenus(); });

// Keep the shortcut rows in step with the popup's default/recent choices.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.defaultState || changes.recent)) rebuildMenus();
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (!info.menuItemId.startsWith(ITEM_PREFIX)) return;

  const abbr = info.menuItemId.slice(ITEM_PREFIX.length).replace(/^all:/, '');
  const states = await loadStates();
  const state = states[abbr];
  if (!state || !state.sos) return;

  const query = (info.selectionText || '').trim();
  const url = buildUrl(state, query);

  // Hand the name off to the clipboard whenever we could not pre-fill it.
  if (query && !state.searchTemplate) await copyToClipboard(query);

  // Carry the selection into the popup so a follow-up lookup needs no retyping.
  await chrome.storage.local.set({ lastQuery: query });
  await rememberState(abbr);
  await chrome.tabs.create({ url });
});
