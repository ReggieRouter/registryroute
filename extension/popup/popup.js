// Registry Route popup — company name + filterable state list over the bundled
// states.json. No network, no host permissions: every lookup is just a
// chrome.tabs.create against the state's own SOS URL.

const MAX_RECENT = 3;

const els = {
  query: document.getElementById('query'),
  clear: document.getElementById('query-clear'),
  filter: document.getElementById('filter'),
  list: document.getElementById('list'),
  empty: document.getElementById('empty'),
};

let STATES = {};
let defaultState = null;
let recent = [];

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

// Default first, then most-recent, then alphabetical — so the states you
// actually use sit at the top of the list instead of wherever the alphabet
// happens to put them.
function ordered() {
  const pinned = [];
  if (defaultState && STATES[defaultState]) pinned.push(defaultState);
  for (const a of recent) if (STATES[a] && !pinned.includes(a)) pinned.push(a);

  const rest = Object.keys(STATES)
    .filter((a) => !pinned.includes(a))
    .sort((a, b) => STATES[a].name.localeCompare(STATES[b].name));

  return pinned.concat(rest);
}

/* -------------------------------------------------------------------- render */

function render() {
  const q = els.filter.value.trim().toLowerCase();
  const matches = ordered().filter((abbr) =>
    !q || STATES[abbr].name.toLowerCase().includes(q) || abbr.toLowerCase().includes(q)
  );

  els.list.textContent = '';
  els.empty.hidden = matches.length > 0;

  for (const abbr of matches) {
    els.list.appendChild(cardFor(abbr));
  }
}

function cardFor(abbr) {
  const s = STATES[abbr];

  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card' + (abbr === defaultState ? ' is-default' : '');
  card.setAttribute('role', 'listitem');

  const top = document.createElement('div');
  top.className = 'card-top';

  const name = document.createElement('span');
  name.className = 'card-name';
  name.textContent = s.name;
  if (canPrefill(abbr)) {
    const bolt = document.createElement('span');
    bolt.className = 'bolt';
    bolt.textContent = '⚡ Pre-fill';
    bolt.title = 'The company name goes straight into this state’s search';
    name.appendChild(bolt);
  }

  const abbrEl = document.createElement('span');
  abbrEl.className = 'card-abbr';
  abbrEl.textContent = abbr;

  top.append(name, abbrEl);

  const bottom = document.createElement('div');
  bottom.className = 'card-bottom';

  const view = document.createElement('span');
  view.className = 'view-sos';
  view.textContent = '➜ View SOS';

  const meta = document.createElement('div');
  meta.className = 'meta';

  const time = document.createElement('span');
  time.className = 'tag ' + timeframeClass(s.timeframe);
  time.textContent = s.timeframe;
  time.title = 'Typical reinstatement turnaround';

  const method = document.createElement('span');
  method.className = 'tag ' + (s.isOnline ? 'good' : 'bad');
  method.textContent = s.isOnline ? 'Online' : 'Mail-in';

  const pin = document.createElement('span');
  pin.className = 'pin' + (abbr === defaultState ? ' on' : '');
  pin.textContent = abbr === defaultState ? '★' : '☆';
  pin.title = abbr === defaultState ? 'Remove as default state' : 'Make this the default state';
  pin.setAttribute('role', 'button');
  pin.tabIndex = 0;

  const togglePin = async (e) => {
    // The pin lives inside the card, so stop the click opening the portal.
    e.stopPropagation();
    e.preventDefault();
    defaultState = defaultState === abbr ? null : abbr;
    await chrome.storage.sync.set({ defaultState });
    render();
  };
  pin.addEventListener('click', togglePin);
  pin.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') togglePin(e);
  });

  // Reinstatement instructions live behind a disclosure so the card stays a
  // one-line decision, but the detail is one click away and still offline.
  const more = document.createElement('span');
  more.className = 'more';
  more.textContent = '⌄';
  more.title = 'Reinstatement steps';
  more.setAttribute('role', 'button');
  more.tabIndex = 0;

  const steps = document.createElement('div');
  steps.className = 'steps';
  steps.hidden = true;
  const stepsTitle = document.createElement('span');
  stepsTitle.className = 'steps-title';
  stepsTitle.textContent = "If it's not in good standing";
  const stepsBody = document.createElement('span');
  stepsBody.textContent = s.instructions || 'No reinstatement steps on file.';
  steps.append(stepsTitle, stepsBody);

  const toggleSteps = (e) => {
    e.stopPropagation();
    e.preventDefault();
    steps.hidden = !steps.hidden;
    more.textContent = steps.hidden ? '⌄' : '⌃';
    more.classList.toggle('on', !steps.hidden);
  };
  more.addEventListener('click', toggleSteps);
  more.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') toggleSteps(e);
  });

  meta.append(time, method, pin, more);
  bottom.append(view, meta);
  card.append(top, bottom, steps);

  card.addEventListener('click', () => open(abbr));
  return card;
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

function openFirstVisible() {
  const first = els.list.querySelector('.card');
  if (first) first.click();
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

  render();
  els.query.focus();
  els.query.select();
}

els.query.addEventListener('input', () => {
  els.clear.classList.toggle('show', Boolean(els.query.value));
});
els.query.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') openFirstVisible();
});

els.clear.addEventListener('click', () => {
  els.query.value = '';
  els.clear.classList.remove('show');
  els.query.focus();
});

els.filter.addEventListener('input', render);
els.filter.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') openFirstVisible();
});

init().catch((err) => {
  console.error('[RR] popup init failed', err);
  els.empty.hidden = false;
  els.empty.textContent = 'Could not load state data.';
});
