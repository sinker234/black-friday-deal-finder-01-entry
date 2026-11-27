// Deal scoring: one clear job — turn a deal's prices and verdict into the
// numbers the finder sorts and shows. The discount always comes from the two
// prices, never from a stored percentage, so a card can never show a
// discount that does not match its prices.

export function discountPct(deal) {
  if (!deal.was || deal.was <= deal.price) return 0;
  return Math.round((1 - deal.price / deal.was) * 100);
}

export function money(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

// Score out of 100: mostly the discount, with a bonus for a genuinely good
// price signal. A routine 20%-off sale scores in the 30s; a 50%-off new low
// scores in the 90s.
export function dealScore(deal) {
  const pct = discountPct(deal);
  const bonus = deal.verdict === 'new low' ? 15 : deal.verdict === 'strong price' ? 8 : 0;
  return Math.min(100, Math.round(pct * 1.4) + bonus);
}

export function verdictClass(verdict) {
  return verdict === 'new low' ? 'new-low' : verdict === 'strong price' ? 'strong' : 'routine';
}

// Products sold at more than one store, grouped so the finder can compare
// the same product across stores. Deals share a `group` key when they are
// the same product at different stores.
export function compareGroups(deals) {
  const byGroup = new Map();
  for (const d of deals) {
    if (!d.group) continue;
    if (!byGroup.has(d.group)) byGroup.set(d.group, []);
    byGroup.get(d.group).push(d);
  }
  return [...byGroup.values()].filter((g) => g.length > 1);
}
