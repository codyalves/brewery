import { describe, expect, it } from 'vitest';
import { isDeck, isDeckList, newDeck } from './deck';
import { fixtureFetch } from './fixtures';
import { describeManaCost, parseManaCost } from './mana';
import { createScryfall, ScryfallError, toCard } from './scryfall';
import { browserStore } from './storage';

const scryfall = createScryfall({ fetch: fixtureFetch });

describe('Scryfall client', () => {
  it('searches by name, type, Oracle text and color, and reads the fields Brewery uses', async () => {
    const result = await scryfall.search('t:instant c:u');

    expect(result.cards.map((c) => c.name)).toEqual(['Counterspell', 'Cyclonic Rift']);
    expect(result.cards[0]).toMatchObject({ manaCost: '{U}{U}', manaValue: 2, colors: ['U'] });
    expect(result.cards[0]?.legalities).toMatchObject({ commander: 'legal', standard: 'not_legal' });
  });

  it('treats "no cards match" as an empty result, not an error', async () => {
    expect(await scryfall.search('nothing-like-this')).toEqual({ cards: [], total: 0, hasMore: false });
    expect(await scryfall.search('   ')).toEqual({ cards: [], total: 0, hasMore: false });
  });

  it('keeps both faces of a double-faced card', async () => {
    const delver = await scryfall.named('Delver of Secrets // Insectile Aberration');

    expect(delver?.faces.map((f) => f.name)).toEqual(['Delver of Secrets', 'Insectile Aberration']);
    expect(delver?.imageUrl).toBe(delver?.faces[0]?.imageUrl);
  });

  it('finds a printing by id and offers names for type-ahead', async () => {
    const bolt = await scryfall.named('lightning bolt');

    expect((await scryfall.card(bolt?.id ?? ''))?.name).toBe('Lightning Bolt');
    expect(await scryfall.card('not-an-id')).toBeNull();
    expect(await scryfall.autocomplete('Co')).toEqual(['Command Tower', 'Counterspell']);
  });

  it('sends the headers Scryfall requires, and reports its errors', async () => {
    const seen: RequestInit[] = [];
    const failing = createScryfall({
      fetch: async (_url, init) => {
        seen.push(init ?? {});
        return new Response(JSON.stringify({ details: 'Too many requests' }), { status: 429 });
      },
    });

    await expect(failing.search('bolt')).rejects.toBeInstanceOf(ScryfallError);
    expect(seen[0]?.headers).toMatchObject({
      Accept: 'application/json',
      'User-Agent': expect.stringContaining('Brewery'),
    });
  });

  it('defaults anything missing rather than failing', () => {
    expect(toCard({ id: 'x' })).toMatchObject({ name: '', manaValue: 0, colors: [], priceUsd: null });
  });
});

describe('mana costs', () => {
  it('splits a cost into symbols, and says it in words', () => {
    expect(parseManaCost('{2}{U}{U}').map((s) => s.kind)).toEqual(['generic', 'color', 'color']);
    expect(parseManaCost('{W/U}{G/P}{C}')).toMatchObject([
      { kind: 'color', colors: ['W', 'U'] },
      { kind: 'color', colors: ['G'], phyrexian: true },
      { kind: 'colorless' },
    ]);
    expect(describeManaCost('{2}{U}{U}')).toBe('2 generic, blue, blue');
  });
});

describe('decks in browser storage', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    } as unknown as Storage;
  };

  it('saves and reads back decks, and ignores anything malformed', () => {
    const storage = memory();
    const store = browserStore('decks', [], isDeckList, () => storage);
    const deck = newDeck('  Kinnan  ', 'commander', new Date('2026-11-25T00:00:00Z'), 'd1');

    expect(store.write([deck])).toBe(true);
    expect(store.read()).toEqual([{ ...deck, name: 'Kinnan' }]);
    storage.setItem('decks', '{not json');
    expect(store.read()).toEqual([]);
    expect(isDeck({ ...deck, format: 'banana' })).toBe(false);
  });

  it('works without storage at all', () => {
    const store = browserStore('decks', [], isDeckList, () => undefined);

    expect(store.read()).toEqual([]);
    expect(store.write([])).toBe(false);
  });
});
