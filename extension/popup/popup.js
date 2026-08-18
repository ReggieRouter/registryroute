// Registry Route popup — the interactive US map, offline.
//
// The map geometry is pre-computed at build time (tools/gen-map.html) and shipped
// as us-map.js, so there is no mapping library, no network call and no spinner
// here. Every lookup is a chrome.tabs.create against the state's own SOS URL.

const MAX_RECENT = 3;
const SVG_NS = 'http://www.w3.org/2000/svg';

// Small states are unhittable on the map at this size, so they get a callout
// column instead. Ordered north to south so the column reads geographically
// rather than by the raw size threshold that selected them.
const CALLOUT_ORDER = ['VT', 'NH', 'MA', 'CT', 'RI', 'NJ', 'DE', 'MD', 'DC'];

const els = {
  query: document.getElementById('query'),
  clear: document.getElementById('query-clear'),
  jump: document.getElementById('jump'),
  found: document.getElementById('found'),
  foundName: document.getElementById('found-name'),
  foundDismiss: document.getElementById('found-dismiss'),
  svg: document.getElementById('map-svg'),
  statesG: document.getElementById('states-g'),
  bordersG: document.getElementById('borders-g'),
  hoverG: document.getElementById('hover-g'),
  labelsG: document.getElementById('labels-g'),
  callouts: document.getElementById('callouts'),
  card: document.getElementById('card'),
  status: document.getElementById('foot-status'),
};

let STATES = {};
let MAP = window.RR_MAP || { paths: {}, labels: {}, callouts: [], width: 740, height: 433 };
let defaultState = null;
let recent = [];
let shown = null;      // state the hover card is describing
let cardSticky = false; // true while the pointer is inside the card

/* ------------------------------------------------------------------ helpers */

// Only states carrying a searchTemplate in states.json can take the company name
// in the URL (FL, WA, WI today). The rest get the portal landing page.
const canPrefill = (abbr) => Boolean(STATES[abbr]?.searchTemplate);

function urlFor(abbr, query) {
  const s = STATES[abbr];
  const q = (query || '').trim();
  return q && s.searchTemplate
    ? s.searchTemplate.replace('{query}', encodeURIComponent(q))
    : s.sos;
}

// Same buckets the site uses: same-day is good, days is a warning, weeks is bad.
function timeframeClass(timeframe = '') {
  if (timeframe.includes('Weeks')) return 'bad';
  if (timeframe.includes('Days')) return 'warn';
  return 'good';
}

/* -------------------------------------------------------------------- render */

function buildMap() {
  els.svg.setAttribute('viewBox', `0 0 ${MAP.width} ${MAP.height}`);

  const abbrs = Object.keys(MAP.paths).sort();

  for (const abbr of abbrs) {
    const s = STATES[abbr];
    if (!s) continue;

    // Fill layer — clickable, focusable, no stroke.
    const fill = document.createElementNS(SVG_NS, 'path');
    fill.setAttribute('d', MAP.paths[abbr]);
    fill.setAttribute('class', 'state-path');
    fill.setAttribute('id', 'path-' + abbr);
    fill.setAttribute('role', 'button');
    fill.setAttribute('tabindex', '0');
    fill.setAttribute('aria-label', `${s.name} — open Secretary of State search`);
    fill.addEventListener('mouseenter', (e) => showCard(abbr, e));
    fill.addEventListener('mouseleave', hideCardSoon);
    fill.addEventListener('focus', () => showCard(abbr, null));
    fill.addEventListener('blur', hideCardSoon);
    fill.addEventListener('click', () => open(abbr));
    fill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(abbr); }
    });
    els.statesG.appendChild(fill);

    // Border layer — stroke only, drawn above every fill.
    const border = document.createElementNS(SVG_NS, 'path');
    border.setAttribute('d', MAP.paths[abbr]);
    border.setAttribute('class', 'state-border');
    els.bordersG.appendChild(border);

    // Label — skipped for states that get a callout box, since there is no room.
    if (!MAP.callouts.includes(abbr) && MAP.labels[abbr]) {
      const [x, y] = MAP.labels[abbr];
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', y);
      label.setAttribute('id', 'label-' + abbr);
      label.setAttribute('class', 'state-label' + (canPrefill(abbr) ? ' state-prefill' : ''));
      label.textContent = abbr;
      els.labelsG.appendChild(label);
    }
  }
}

function buildCallouts() {
  const set = new Set(MAP.callouts);
  const ordered = CALLOUT_ORDER.filter((a) => set.has(a))
    .concat(MAP.callouts.filter((a) => !CALLOUT_ORDER.includes(a)));

  for (const abbr of ordered) {
    const s = STATES[abbr];
    if (!s) continue;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'callout' + (canPrefill(abbr) ? ' can-prefill' : '');
    btn.id = 'callout-' + abbr;
    btn.textContent = abbr;
    btn.setAttribute('aria-label', `${s.name} — open Secretary of State search`);
    btn.addEventListener('mouseenter', (e) => showCard(abbr, e));
    btn.addEventListener('mouseleave', hideCardSoon);
    btn.addEventListener('focus', () => showCard(abbr, null));
    btn.addEventListener('blur', hideCardSoon);
    btn.addEventListener('click', () => open(abbr));
    els.callouts.appendChild(btn);
  }
}

function markDefault() {
  document.querySelectorAll('.state-default').forEach((el) => el.classList.remove('state-default'));
  document.querySelectorAll('.callout.is-default').forEach((el) => el.classList.remove('is-default'));
  if (!defaultState) return;
  document.getElementById('path-' + defaultState)?.classList.add('state-default');
  document.getElementById('callout-' + defaultState)?.classList.add('is-default');
}

/* ---------------------------------------------------------------- hover card */

function highlight(abbr) {
  document.querySelectorAll('.state-hovered').forEach((el) => el.classList.remove('state-hovered'));
  document.querySelectorAll('.label-hovered').forEach((el) => el.classList.remove('label-hovered'));
  els.hoverG.textContent = '';
  if (!abbr) return;

  document.getElementById('path-' + abbr)?.classList.add('state-hovered');
  document.getElementById('label-' + abbr)?.classList.add('label-hovered');

  // Outline goes in its own layer above fills and borders so nothing clips it.
  // Do NOT add a transform here or in CSS — see the note in popup.css.
  if (MAP.paths[abbr]) {
    const outline = document.createElementNS(SVG_NS, 'path');
    outline.setAttribute('d', MAP.paths[abbr]);
    outline.setAttribute('class', 'state-hover-stroke');
    els.hoverG.appendChild(outline);
  }
}

function showCard(abbr, event) {
  const s = STATES[abbr];
  if (!s) return;
  shown = abbr;
  highlight(abbr);

  const pinned = abbr === defaultState;
  const tags = [
    `<span class="tag ${timeframeClass(s.timeframe)}">${s.timeframe}</span>`,
    `<span class="tag ${s.isOnline ? 'good' : 'bad'}">${s.isOnline ? 'Online portal' : 'Mail-in'}</span>`,
  ];
  if (canPrefill(abbr)) tags.push('<span class="tag bolt">⚡ Pre-fill</span>');

  const hint = els.query.value.trim() && !canPrefill(abbr)
    ? '<div class="card-hint">Name gets copied — paste it into the portal</div>'
    : '';

  els.card.innerHTML = `
    <div class="card-head">
      <span class="card-name">${s.name}</span>
      <button class="card-pin${pinned ? ' on' : ''}" type="button"
              title="${pinned ? 'Remove as default state' : 'Make this the default state'}">
        ${pinned ? '★' : '☆'}
      </button>
    </div>
    <div class="card-tags">${tags.join('')}</div>
    ${hint}
    ${s.instructions ? `<div class="card-steps"><span class="card-steps-title">If it's not in good standing</span>${s.instructions}</div>` : ''}
  `;

  els.card.querySelector('.card-pin').addEventListener('click', async (e) => {
    e.stopPropagation();
    defaultState = defaultState === abbr ? null : abbr;
    await chrome.storage.sync.set({ defaultState });
    markDefault();
    showCard(abbr, event);
  });

  els.card.hidden = false;
  els.card.classList.add('interactive');
  positionCard(event);
}

// Keep the card inside the popup — it has nowhere to overflow to — and flip it
// away from the pointer's quadrant so it doesn't sit on top of the very state
// being pointed at.
function positionCard(event) {
  const stage = document.querySelector('.stage').getBoundingClientRect();
  const card = els.card.getBoundingClientRect();
  const GAP = 16;

  let x, y;
  if (event && event.clientX) {
    const px = event.clientX - stage.left;
    const py = event.clientY - stage.top;
    x = px > stage.width / 2 ? px - card.width - GAP : px + GAP;
    y = py > stage.height / 2 ? py - card.height - GAP : py + GAP;
  } else {
    // Keyboard or jump-input focus: park it bottom-left, clear of the map's
    // populated east side.
    x = 0;
    y = stage.height - card.height;
  }

  x = Math.max(0, Math.min(x, stage.width - card.width));
  y = Math.max(0, Math.min(y, stage.height - card.height));

  els.card.style.left = x + 'px';
  els.card.style.top = y + 'px';
}

let hideTimer = null;
function hideCardSoon() {
  clearTimeout(hideTimer);
  // Brief grace period so the pointer can travel into the card to click the pin
  // or scroll the steps without it vanishing underneath.
  hideTimer = setTimeout(() => {
    if (cardSticky) return;
    els.card.hidden = true;
    highlight(null);
    shown = null;
  }, 160);
}

els.card.addEventListener('mouseenter', () => { cardSticky = true; clearTimeout(hideTimer); });
els.card.addEventListener('mouseleave', () => { cardSticky = false; hideCardSoon(); });

/* -------------------------------------------------------------------- action */

async function open(abbr) {
  const s = STATES[abbr];
  if (!s || !s.sos) return;

  const query = els.query.value.trim();

  // Nothing can pre-fill this portal, so put the name one paste away instead.
  if (query && !canPrefill(abbr)) {
    try {
      await navigator.clipboard.writeText(query);
    } catch (err) {
      console.warn('[RR] clipboard write failed', err);
    }
  }

  recent = [abbr, ...recent.filter((a) => a !== abbr)].slice(0, MAX_RECENT);
  await Promise.all([
    chrome.storage.sync.set({ recent }),
    chrome.storage.local.set({ lastQuery: query }),
  ]);

  await chrome.tabs.create({ url: urlFor(abbr, query) });
  window.close();
}

/* ---------------------------------------------------------------- jump input */

function matchState(text) {
  const q = text.trim().toLowerCase();
  if (!q) return null;
  const abbrs = Object.keys(STATES);
  return abbrs.find((a) => a.toLowerCase() === q)
    || abbrs.find((a) => STATES[a].name.toLowerCase() === q)
    || abbrs.find((a) => STATES[a].name.toLowerCase().startsWith(q))
    || abbrs.find((a) => STATES[a].name.toLowerCase().includes(q))
    || null;
}

/* ------------------------------------------------------- page-name detection */

// Runs in the page via activeTab, only when the user opens the popup. Returns a
// best-guess business name or null. Deliberately conservative — the result is
// offered as a dismissible chip, never auto-filled.
function extractBusinessName() {
  const SUFFIX = /\b(LLC|L\.L\.C\.|Inc|Inc\.|Corp|Corp\.|Corporation|Company|Co\.|LP|L\.P\.|LLP|Ltd|Ltd\.|PLLC)\b/i;
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim().slice(0, 120);

  const sel = clean(window.getSelection()?.toString());
  if (sel && sel.length > 2 && sel.length < 120) return sel;

  for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const raw = JSON.parse(node.textContent);
      const items = Array.isArray(raw) ? raw : [raw, ...(raw['@graph'] || [])];
      for (const item of items) {
        const type = String(item?.['@type'] || '');
        if (/Organization|LocalBusiness|Corporation/i.test(type) && item.name) {
          return clean(item.name);
        }
      }
    } catch (e) { /* malformed JSON-LD is common; ignore */ }
  }

  for (const el of document.querySelectorAll('h1, h2')) {
    const t = clean(el.textContent);
    if (t && SUFFIX.test(t) && t.length < 120) return t;
  }

  const title = clean(document.title);
  if (title && SUFFIX.test(title)) return title;

  return null;
}

async function detectFromPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractBusinessName,
    });
    return result?.result || null;
  } catch (err) {
    // chrome:// pages, the Web Store, PDFs and other restricted surfaces reject
    // injection. That is expected, not an error worth surfacing.
    return null;
  }
}

function offerFound(name) {
  if (!name) return;
  if (els.query.value.trim().toLowerCase() === name.toLowerCase()) return;
  els.foundName.textContent = name;
  els.foundName.title = `Use “${name}”`;
  els.found.hidden = false;
}

/* ---------------------------------------------------------------------- init */

async function init() {
  const [states, sync, local] = await Promise.all([
    fetch(chrome.runtime.getURL('states.json')).then((r) => r.json()),
    chrome.storage.sync.get({ defaultState: null, recent: [] }),
    chrome.storage.local.get({ lastQuery: '' }),
  ]);

  STATES = states;
  defaultState = states[sync.defaultState] ? sync.defaultState : null;
  recent = (sync.recent || []).filter((a) => states[a]);

  // A right-click lookup stashes what was selected, so the popup opens ready to
  // run the same name against another state.
  els.query.value = local.lastQuery || '';
  els.clear.classList.toggle('show', Boolean(els.query.value));

  buildMap();
  buildCallouts();
  markDefault();

  if (defaultState) {
    els.status.textContent = `Runs offline · default ${STATES[defaultState].name}`;
  }

  els.query.focus();
  els.query.select();

  // Page detection is best-effort and must never delay the map appearing.
  detectFromPage().then(offerFound);
}

els.query.addEventListener('input', () => {
  els.clear.classList.toggle('show', Boolean(els.query.value));
  if (shown) showCard(shown, null);
});
els.query.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && defaultState) open(defaultState);
});

els.clear.addEventListener('click', () => {
  els.query.value = '';
  els.clear.classList.remove('show');
  els.query.focus();
});

els.jump.addEventListener('input', () => {
  const abbr = matchState(els.jump.value);
  els.jump.setAttribute('aria-expanded', abbr ? 'true' : 'false');
  if (abbr) showCard(abbr, null);
  else { els.card.hidden = true; highlight(null); shown = null; }
});
els.jump.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const abbr = matchState(els.jump.value);
  if (abbr) open(abbr);
});

els.foundName.addEventListener('click', () => {
  els.query.value = els.foundName.textContent;
  els.clear.classList.add('show');
  els.found.hidden = true;
  els.query.focus();
});
els.foundDismiss.addEventListener('click', () => { els.found.hidden = true; });

init().catch((err) => {
  console.error('[RR] popup init failed', err);
  els.status.textContent = 'Could not load state data.';
});
