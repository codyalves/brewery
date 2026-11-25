import recorded from '@/fixtures/scryfall/cards.json';
import { SCRYFALL_API } from './scryfall';

/**
 * A stand-in for the Scryfall API, answering from fixtures/scryfall/cards.json.
 * Unit tests pass it as `fetch`; end-to-end tests run the app with
 * SCRYFALL=fixtures so pages use it too. It understands a small part of
 * Scryfall's search syntax, enough for tests:
 *
 *   word      name contains the word
 *   t:word    type line contains the word
 *   o:word    Oracle text contains the word
 *   c:wubrg   colors include every one of these letters
 *
 * Terms combine with AND. Anything else in real Scryfall syntax is not supported.
 */
type RawCard = (typeof recorded.cards)[number];

const lower = (s: string | undefined) => (s ?? '').toLowerCase();

function oracleText(card: RawCard): string {
  return 'card_faces' in card && card.card_faces
    ? card.card_faces.map((f) => f.oracle_text).join('\n')
    : lower((card as { oracle_text?: string }).oracle_text);
}

function matches(card: RawCard, term: string): boolean {
  const [key, ...rest] = term.split(':');
  const value = lower(rest.join(':'));
  if (rest.length === 0) return lower(card.name).includes(lower(term));
  switch (lower(key)) {
    case 't':
      return lower(card.type_line).includes(value);
    case 'o':
      return lower(oracleText(card)).includes(value);
    case 'c':
      return [...value.toUpperCase()].every((c) => card.colors.includes(c));
    default:
      return false;
  }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const notFound = () => json(404, { object: 'error', status: 404, details: 'Not found' });

export async function fixtureFetch(url: string): Promise<Response> {
  const parsed = new URL(url);
  if (!url.startsWith(SCRYFALL_API)) return notFound();
  const cards = recorded.cards;

  if (parsed.pathname === '/cards/search') {
    const terms = (parsed.searchParams.get('q') ?? '').split(/\s+/).filter(Boolean);
    const found = cards.filter((c) => terms.every((t) => matches(c, t)));
    return found.length === 0
      ? notFound()
      : json(200, { object: 'list', total_cards: found.length, has_more: false, data: found });
  }
  if (parsed.pathname === '/cards/named') {
    const exact = lower(parsed.searchParams.get('exact') ?? '');
    const card = cards.find((c) => lower(c.name) === exact);
    return card ? json(200, card) : notFound();
  }
  if (parsed.pathname === '/cards/autocomplete') {
    const q = lower(parsed.searchParams.get('q') ?? '');
    return json(200, {
      object: 'catalog',
      data: cards.filter((c) => lower(c.name).startsWith(q)).map((c) => c.name),
    });
  }
  const id = /^\/cards\/([0-9a-f-]{36})$/.exec(parsed.pathname)?.[1];
  const card = id ? cards.find((c) => c.id === id) : undefined;
  return card ? json(200, card) : notFound();
}
