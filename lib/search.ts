import type { Scryfall, SearchResult } from './scryfall';

/**
 * Scryfall-style search syntax ("t:creature c:r cmc<=3 o:\"draw a card\""),
 * normalized and validated here, then sent through lib/scryfall.ts.
 */
const EMPTY: SearchResult = { cards: [], total: 0, hasMore: false };

/** Splits a query on whitespace, keeping quoted phrases together as one term. */
export function parseSearch(input: string): string[] {
  const terms: string[] = [];
  let current = '';
  let quoted = false;
  for (const ch of input) {
    if (ch === '"') {
      quoted = !quoted;
      current += ch;
    } else if (/\s/.test(ch) && !quoted) {
      if (current) terms.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) terms.push(current);
  return terms;
}

/** The normalized query string, or null when there is nothing to search for. */
export function buildSearchQuery(input: string): string | null {
  const terms = parseSearch(input).filter((t) => t.replace(/"/g, '').length > 0);
  return terms.length > 0 ? terms.join(' ') : null;
}

/** Runs a search; an empty query makes no request. */
export async function searchCards(scryfall: Scryfall, input: string, page = 1): Promise<SearchResult> {
  const query = buildSearchQuery(input);
  return query ? scryfall.search(query, page) : EMPTY;
}
