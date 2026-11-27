// DealHound's controller: one clear job — read the hash route, filter and
// sort the deals, and hand the pages to views.js. No network is used: the
// deals come from deals.js, and every control re-renders from that data.
//
// Routes:  #/                         the finder, filters in the query part
//          #/?q=headphones&cat=Audio  a filtered view (used by screenshots)
//          #/deal/<id>                one deal's page

import { deals } from './deals.js';
import { dealScore, discountPct } from './score.js';
import { listPage, dealPage, missingPage } from './views.js';

const app = document.getElementById('app');

function readState() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  const params = new URLSearchParams(query ?? '');
  return {
    path: path || '',
    q: params.get('q') ?? '',
    cat: params.get('cat') ?? 'All',
    store: params.get('store') ?? 'All stores',
    min: Number(params.get('min') ?? 0) || 0,
    sort: params.get('sort') ?? 'score',
  };
}

function applyFilters(state) {
  const q = state.q.trim().toLowerCase();
  let shown = deals.filter((d) => {
    if (q && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    if (state.cat !== 'All' && d.category !== state.cat) return false;
    if (state.store !== 'All stores' && d.store !== state.store) return false;
    if (discountPct(d) < state.min) return false;
    return true;
  });
  const by = {
    score: (a, b) => dealScore(b) - dealScore(a) || discountPct(b) - discountPct(a),
    discount: (a, b) => discountPct(b) - discountPct(a) || dealScore(b) - dealScore(a),
    price: (a, b) => a.price - b.price,
    saving: (a, b) => b.was - b.price - (a.was - a.price),
  };
  shown = [...shown].sort(by[state.sort] ?? by.score);
  return shown;
}

function writeHash(state) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.cat !== 'All') params.set('cat', state.cat);
  if (state.store !== 'All stores') params.set('store', state.store);
  if (state.min > 0) params.set('min', String(state.min));
  if (state.sort !== 'score') params.set('sort', state.sort);
  const qs = params.toString();
  history.replaceState(null, '', `#/${qs ? `?${qs}` : ''}`);
}

function render() {
  window.__shotReady = false;
  const state = readState();
  const dealMatch = state.path.match(/^deal\/([^/?]+)/);
  if (dealMatch) {
    const found = deals.find((d) => d.id === decodeURIComponent(dealMatch[1]));
    document.title = `${found ? found.title : 'Deal not found'} | DealHound`;
    if (!found) {
      app.innerHTML = missingPage();
    } else {
      const siblings = found.group ? deals.filter((d) => d.group === found.group) : [];
      app.innerHTML = dealPage(found, siblings);
    }
  } else {
    document.title = 'DealHound · Black Friday 2026 deal finder';
    const filtered = applyFilters(state);
    app.innerHTML = listPage(deals, { ...state, filtered }, deals.length);
    const search = app.querySelector('#q');
    const store = app.querySelector('#store');
    const mind = app.querySelector('#mind');
    const sort = app.querySelector('#sort');
    const rerender = () => {
      state.q = search.value;
      state.store = store.value;
      state.min = Number(mind.value);
      state.sort = sort.value;
      writeHash(state);
      render();
    };
    search.addEventListener('input', () => {
      state.q = search.value;
      writeHash(state);
      render();
      const again = app.querySelector('#q');
      again.focus();
      again.setSelectionRange(again.value.length, again.value.length);
    });
    store.addEventListener('change', rerender);
    mind.addEventListener('change', rerender);
    sort.addEventListener('change', rerender);
    app.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.cat = chip.dataset.cat;
        writeHash(state);
        render();
      });
    });
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();
