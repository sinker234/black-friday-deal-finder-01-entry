// HTML for the finder pages, built from the deal data. Every value is
// escaped before it goes into the page, so a product name can never break
// the markup.

import { discountPct, money, dealScore, verdictClass, compareGroups } from './score.js';

const escape = (s) => String(s).replace(/[&<>\"']/g, (c) => `&#${c.charCodeAt(0)};`);
const checkDay = (iso) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';

export function dealCard(d) {
  const pct = discountPct(d);
  return `<li class="deal">
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  <div class="meta">${escape(d.store)} &middot; ${escape(d.category)}</div>
  <div class="price-row"><span class="sale">${money(d.price)}</span><span class="was">${money(d.was)}</span><span class="off">-${pct}%</span></div>
  <div class="score-row"><span class="score">Score ${dealScore(d)}/100</span><span class="verdict ${verdictClass(d.verdict)}">${escape(d.verdict)}</span></div>
  <p class="evidence">${escape(d.evidence)}</p>
  <p class="checked">Checked ${checkDay(d.checked)} &middot; read in ${escape(d.source)}</p>
  <a class="store-link" href="${escape(d.url)}" rel="noopener">View at ${escape(d.store)} &rarr;</a>
</li>`;
}

function compareTable(groups) {
  if (groups.length === 0) return '';
  const rows = groups
    .map((g) => {
      const sorted = [...g].sort((a, b) => a.price - b.price);
      const best = sorted[0].price;
      const cells = sorted
        .map((d) => `<td class="${d.price === best ? 'best' : ''}">${escape(d.store)}: ${money(d.price)}</td>`)
        .join('');
      return `<tr><th scope="row">${escape(sorted[0].title)}</th>${cells}</tr>`;
    })
    .join('');
  return `<section class="compare" aria-label="Same product compared across stores">
  <h2>Same product, compared across stores</h2>
  <table><tbody>${rows}</tbody></table>
  <p class="checked">Lowest price in bold green. Each price was checked 27 Nov 2026 at the named store.</p>
</section>`;
}

export function listPage(deals, state, total) {
  const categories = [...new Set(deals.map((d) => d.category))].sort();
  const stores = [...new Set(deals.map((d) => d.store))].sort();
  const chips = ['All', ...categories]
    .map(
      (c) =>
        `<button type="button" class="chip" data-cat="${escape(c)}" aria-pressed="${state.cat === c || (c === 'All' && state.cat === 'All') ? 'true' : 'false'}">${escape(c)}</button>`,
    )
    .join('');
  const storeOptions = ['All stores', ...stores]
    .map((s) => `<option${state.store === s ? ' selected' : ''}>${escape(s)}</option>`)
    .join('');
  const shown = state.filtered;
  const groups = compareGroups(shown);
  return `<h1>Black Friday deals: ${total} checked prices</h1>
<p class="lede">Best deals first. Every price below was read at the named store or in a deals source naming the store, on 27 Nov 2026, with the source shown on each deal.</p>
<ul class="stats">
  <li><b>${total}</b> deals</li>
  <li><b>${stores.length}</b> stores</li>
  <li><b>${categories.length}</b> categories</li>
  <li><b>${shown.filter((d) => d.verdict === 'new low').length}</b> new lows in this view</li>
</ul>
<div class="toolbar">
  <div class="row">
    <label class="field">Search<input type="search" id="q" value="${escape(state.q)}" placeholder="Try &ldquo;headphones&rdquo; or &ldquo;TV&rdquo;" autocomplete="off"></label>
    <label class="field">Store<select id="store">${storeOptions}</select></label>
    <label class="field">Min. discount<select id="mind">
      ${[0, 20, 30, 40, 50].map((n) => `<option value="${n}"${state.min === n ? ' selected' : ''}>${n === 0 ? 'Any discount' : n + '% off or more'}</option>`).join('')}
    </select></label>
    <label class="field">Sort<select id="sort">
      <option value="score"${state.sort === 'score' ? ' selected' : ''}>Best deals first</option>
      <option value="discount"${state.sort === 'discount' ? ' selected' : ''}>Biggest discount</option>
      <option value="price"${state.sort === 'price' ? ' selected' : ''}>Lowest price</option>
      <option value="saving"${state.sort === 'saving' ? ' selected' : ''}>Biggest saving ($)</option>
    </select></label>
  </div>
  <div class="chips" role="group" aria-label="Category">${chips}</div>
</div>
<p class="count-line">Showing ${shown.length} of ${total} deals${state.q || state.cat !== 'All' || state.store !== 'All stores' || state.min > 0 ? ' for this search and filter' : ''}.</p>
${compareTable(groups)}
<ul class="deals">${shown.map(dealCard).join('') || '<li class="empty">No deal matches. Clear the search or loosen a filter.</li>'}</ul>`;
}

export function dealPage(d, siblings) {
  const pct = discountPct(d);
  const others = siblings.filter((x) => x.id !== d.id);
  const compare =
    others.length > 0
      ? `<h2>Same product elsewhere</h2><ul>${others
          .map(
            (x) =>
              `<li>${escape(x.store)}: ${money(x.price)} (${discountPct(x)}% off) &mdash; <a href="${escape(x.url)}" rel="noopener">view at ${escape(x.store)}</a></li>`,
          )
          .join('')}</ul>`
      : '';
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <h1>${escape(d.title)}</h1>
  <div class="score-row"><span class="score">Score ${dealScore(d)}/100</span><span class="verdict ${verdictClass(d.verdict)}">${escape(d.verdict)}</span><span class="off">-${pct}%</span></div>
  <dl>
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Category</dt><dd>${escape(d.category)}</dd>
    <dt>Sale price</dt><dd><b>${money(d.price)}</b></dd>
    <dt>Usual price</dt><dd>${money(d.was)}</dd>
    <dt>You save</dt><dd>${money(d.was - d.price)} (${pct}% off)</dd>
    <dt>Why this verdict</dt><dd>${escape(d.evidence)}</dd>
    ${d.note ? `<dt>To use it</dt><dd>${escape(d.note)}</dd>` : ''}
    <dt>Price checked</dt><dd>${checkDay(d.checked)}</dd>
    <dt>Read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p><a class="store-link" href="${escape(d.url)}" rel="noopener">View at ${escape(d.store)} &rarr;</a></p>
  ${compare}
</article>`;
}

export function missingPage() {
  return `<h1>Deal not found</h1><p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}
