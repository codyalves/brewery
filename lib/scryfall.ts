import { type Card, type CardFace, FORMATS, type Format, isColor, type Legality } from './card';

/**
 * Brewery's only source of card data: the Scryfall API
 * (https://scryfall.com/docs/api). Scryfall asks every client to send a
 * User-Agent and an Accept header, to keep to 10 requests a second, and to
 * cache what it can; callers in Next pass `cache` options for the last part.
 *
 * Tests never call Scryfall: they pass a fake `fetch`, or set SCRYFALL=fixtures
 * so the app answers from recorded cards in fixtures/scryfall (lib/fixtures.ts).
 */
export const SCRYFALL_API = 'https://api.scryfall.com';
const HEADERS = {
  'User-Agent': 'Brewery/0.1 (+https://github.com/codyalves/brewery)',
  Accept: 'application/json',
};

export interface SearchResult {
  readonly cards: readonly Card[];
  /** How many cards match in all, across pages. */
  readonly total: number;
  readonly hasMore: boolean;
}

export const ORDERS = ['name', 'cmc', 'rarity'] as const;
export const DIRS = ['asc', 'desc'] as const;
export const UNIQUES = ['cards', 'prints'] as const;

/** Scryfall's `order`, `dir` and `unique` search parameters. */
export interface SortOptions {
  readonly order?: (typeof ORDERS)[number];
  readonly dir?: (typeof DIRS)[number];
  readonly unique?: (typeof UNIQUES)[number];
}

export class ScryfallError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ScryfallError';
    this.status = status;
  }
}

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export interface ScryfallOptions {
  readonly fetch?: Fetch;
  /** Extra fetch options, such as Next's `{ next: { revalidate: 86400 } }`. */
  readonly init?: RequestInit & { next?: { revalidate?: number } };
}

export function createScryfall(options: ScryfallOptions = {}) {
  const fetchFn: Fetch = options.fetch ?? ((url, init) => globalThis.fetch(url, init));

  async function get(path: string): Promise<unknown | null> {
    const response = await fetchFn(`${SCRYFALL_API}${path}`, { ...options.init, headers: HEADERS });
    // Scryfall answers "no cards match" and "no such card" with 404.
    if (response.status === 404) return null;
    const body = (await response.json()) as { details?: string };
    if (!response.ok) {
      throw new ScryfallError(body.details ?? `Scryfall answered ${response.status}`, response.status);
    }
    return body;
  }

  return {
    /** Cards matching a Scryfall search query, one page (175 cards) at a time. */
    async search(query: string, page = 1, sort: SortOptions = {}): Promise<SearchResult> {
      const q = query.trim();
      if (!q) return { cards: [], total: 0, hasMore: false };
      let path = `/cards/search?q=${encodeURIComponent(q)}&page=${page}`;
      if (sort.order) path += `&order=${sort.order}`;
      if (sort.dir) path += `&dir=${sort.dir}`;
      if (sort.unique) path += `&unique=${sort.unique}`;
      const body = (await get(path)) as {
        data: unknown[];
        total_cards: number;
        has_more: boolean;
      } | null;
      if (!body) return { cards: [], total: 0, hasMore: false };
      return { cards: body.data.map(toCard), total: body.total_cards, hasMore: body.has_more };
    },

    /** One printing by Scryfall id, or null. */
    async card(id: string): Promise<Card | null> {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const body = await get(`/cards/${id}`);
      return body ? toCard(body) : null;
    },

    /** A card by its exact name, ignoring case, or null. */
    async named(name: string): Promise<Card | null> {
      const body = await get(`/cards/named?exact=${encodeURIComponent(name.trim())}`);
      return body ? toCard(body) : null;
    },

    /** Up to 20 card names that start like `partial`, for type-ahead. */
    async autocomplete(partial: string): Promise<string[]> {
      if (partial.trim().length < 2) return [];
      const body = (await get(`/cards/autocomplete?q=${encodeURIComponent(partial.trim())}`)) as {
        data: string[];
      } | null;
      return body?.data ?? [];
    },
  };
}

export type Scryfall = ReturnType<typeof createScryfall>;

interface RawFace {
  name?: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  image_uris?: { normal?: string };
}

interface RawCard extends RawFace {
  id: string;
  oracle_id?: string;
  cmc?: number;
  colors?: string[];
  color_identity?: string[];
  legalities?: Record<string, string>;
  card_faces?: RawFace[];
  set_name?: string;
  rarity?: string;
  prices?: { usd?: string | null };
  scryfall_uri?: string;
}

const LEGALITIES: readonly Legality[] = ['legal', 'not_legal', 'restricted', 'banned'];

/** Scryfall's card object, narrowed to what Brewery uses. */
export function toCard(value: unknown): Card {
  const raw = value as RawCard;
  const faces: CardFace[] = (raw.card_faces ?? []).map((f) => ({
    name: f.name ?? '',
    manaCost: f.mana_cost ?? '',
    typeLine: f.type_line ?? '',
    oracleText: f.oracle_text ?? '',
    imageUrl: f.image_uris?.normal ?? null,
  }));
  const legalities = Object.fromEntries(
    FORMATS.map((format) => {
      const value = raw.legalities?.[format];
      return [format, LEGALITIES.includes(value as Legality) ? (value as Legality) : 'not_legal'];
    }),
  ) as Record<Format, Legality>;

  return {
    id: raw.id,
    oracleId: raw.oracle_id ?? raw.id,
    name: raw.name ?? '',
    manaCost: raw.mana_cost ?? '',
    manaValue: raw.cmc ?? 0,
    typeLine: raw.type_line ?? faces.map((f) => f.typeLine).join(' // '),
    oracleText: raw.oracle_text ?? faces.map((f) => f.oracleText).join('\n//\n'),
    colors: (raw.colors ?? []).filter(isColor),
    colorIdentity: (raw.color_identity ?? []).filter(isColor),
    legalities,
    imageUrl: raw.image_uris?.normal ?? faces[0]?.imageUrl ?? null,
    faces,
    setName: raw.set_name ?? '',
    rarity: raw.rarity ?? '',
    priceUsd: raw.prices?.usd ?? null,
    scryfallUrl: raw.scryfall_uri ?? `https://scryfall.com/card/${raw.id}`,
  };
}
