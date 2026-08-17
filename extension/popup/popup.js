// Registry Route popup — company name + state picker over the bundled
// states.json. No network, no host permissions: every lookup is just a
// chrome.tabs.create against the state's own SOS URL.

const MAX_RECENT = 3;

const els = {
  query: document.getElementById('query'),
  clear: document.getElementById('query-clear'),
  recentRow: document.getElementById('recent-row'),
  recentChips: document.getElementById('recent-chips'),
  detailState: document.getElementById('detail-state'),
  detailBolt: document.getElementById('detail-bolt'),
  detailTags: document.getElementById('detail-tags'),
  setDefault: document.getElementById('set-default'),
  stepsToggle: document.getElementById('steps-toggle'),
  steps: document.getElementById('steps'),
  grid: document.getElementById('grid'),
  go: document.getElementById('go'),
};

let STATES = {};
let armed = null;        // the state the Open button and Enter key act on
let shown = null;        // the state the detail card is currently displaying
let defaultState = null;
let recent = [];
let stepsOpen = false;   // while open, hover stops re-writing the detail card

/* ------------------------------------------------------------------ helpers */

// Only states carrying a searchTemplate in states.json can take the company
// name in the URL (FL, WA, WI today). The rest get the portal landing page.
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

function renderDetail(abbr) {
  shown = STATES[abbr] ? abbr : null;

  if (!shown) {
    els.detailState.textContent = 'Pick a state';
    els.detailBolt.hidden = true;
    els.detailTags.innerHTML = '<span class="hint">Click any state to open its business search.</span>';
    els.setDefault.hidden = true;
    els.stepsToggle.hidden = true;
    return;
  }

  const s = STATES[shown];
  els.detailState.textContent = s.name;
  els.detailBolt.hidden = !canPrefill(shown);

  const tags = [
    `<span class="tag ${timeframeClass(s.timeframe)}">${s.timeframe}</span>`,
    `<span class="tag ${s.isOnline ? 'good' : 'bad'}">${s.isOnline ? 'Online Portal' : 'Mail-In Required'}</span>`,
  ];
  if (els.query.value.trim() && !canPrefill(shown)) {
    tags.push('<span class="hint">Name gets copied — paste it into the portal</span>');
  }
  els.detailTags.innerHTML = tags.join('');

  els.setDefault.hidden = false;
  els.setDefault.textContent = shown === defaultState ? '★ Default' : '☆ Default';
  els.setDefault.classList.toggle('on', shown === defaultState);

  els.stepsToggle.hidden = !s.instructions;
  if (stepsOpen && s.instructions) {
    els.steps.innerHTML = `<span class="steps-title">If it's not in good standing</span>${s.instructions}`;
    els.steps.hidden = false;
  } else {
    els.steps.hidden = true;
  }
}

function renderRecent() {
  const usable = recent.filter((a) => STATES[a]);
  els.recentRow.hidden = usable.length === 0;
  els.recentChips.textContent = '';

  for (const abbr of usable) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'recent-chip';
    chip.textContent = STATES[abbr].name;
    chip.title = `Open ${STATES[abbr].name} SOS search`;
    chip.addEventListener('click', () => open(abbr));
    chip.addEventListener('mouseenter', () => preview(abbr));
    chip.addEventListener('mouseleave', () => preview(armed));
    els.recentChips.appendChild(chip);
  }
}

function renderGrid() {
  els.grid.textContent = '';
  const abbrs = Object.keys(STATES).sort();

  for (const abbr of abbrs) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.textContent = abbr;
    cell.title = STATES[abbr].name + (canPrefill(abbr) ? ' — pre-fills the company name' : '');
    if (canPrefill(abbr)) cell.classList.add('can-prefill');
    if (abbr === defaultState) cell.classList.add('is-default');

    cell.addEventListener('click', () => open(abbr));
    cell.addEventListener('mouseenter', () => preview(abbr));
    cell.addEventListener('mouseleave', () => preview(armed));
    cell.addEventListener('focus', () => preview(abbr));
    els.grid.appendChild(cell);
  }
}

function renderGo() {
  const ready = Boolean(armed && STATES[armed]);
  els.go.disabled = !ready;
  els.go.textContent = ready
    ? `Open ${STATES[armed].name} SOS search`
    : 'Open SOS search';
}

// Hover shows a state without arming it; with the steps panel open the card
// stays put so reading isn't interrupted by stray mouse movement.
function preview(abbr) {
  if (stepsOpen) return;
  renderDetail(abbr || armed);
}

function arm(abbr) {
  armed = abbr;
  renderDetail(armed);
  renderGo();
}

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

  // A right-click lookup stashes what was selected, so the popup opens ready
  // to run the same name against another state.
  els.query.value = local.lastQuery || '';
  els.clear.classList.toggle('show', Boolean(els.query.value));

  renderGrid();
  renderRecent();
  arm(defaultState || recent[0] || null);

  els.query.focus();
  els.query.select();
}

els.query.addEventListener('input', () => {
  els.clear.classList.toggle('show', Boolean(els.query.value));
  renderDetail(armed);
});

els.query.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && armed) open(armed);
});

els.clear.addEventListener('click', () => {
  els.query.value = '';
  els.clear.classList.remove('show');
  renderDetail(armed);
  els.query.focus();
});

els.go.addEventListener('click', () => { if (armed) open(armed); });

els.setDefault.addEventListener('click', async () => {
  // The card may be previewing a hovered state, so act on what's shown.
  const target = shown;
  if (!target) return;

  defaultState = defaultState === target ? null : target;
  await chrome.storage.sync.set({ defaultState });
  renderGrid();
  arm(defaultState || target);
});

els.stepsToggle.addEventListener('click', () => {
  const target = shown;
  stepsOpen = !stepsOpen;
  els.stepsToggle.textContent = stepsOpen ? 'Steps ▴' : 'Steps ▾';
  els.stepsToggle.setAttribute('aria-expanded', String(stepsOpen));
  renderDetail(target || armed);
});

init().catch((err) => {
  console.error('[RR] popup init failed', err);
  els.detailTags.innerHTML = '<span class="hint">Could not load state data.</span>';
});
