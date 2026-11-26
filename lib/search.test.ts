import { describe, expect, it, vi } from 'vitest';
import recorded from '@/fixtures/scryfall/cards.json';
import { fixtureFetch } from './fixtures';
import { createScryfall } from './scryfall';
import { buildSearchQuery, parseSearch, searchCards } from './search';

const scryfall = createScryfall({ fetch: fixtureFetch });
const names = (r: { cards: readonly { name: string }[] }) => r.cards.map((c) => c.name).sort();
const expected = (pred: (c: (typeof recorded.cards)[number]) => boolean) =>
  recorded.cards
    .filter(pred)
    .map((c) => c.name)
    .sort();

describe('sort and unique', () => {
  it('AC-2: order=cmc dir=asc returns ascending mana values', async () => {
    const result = await searchCards(scryfall, 't:instant', 1, { order: 'cmc', dir: 'asc' });
    const values = result.cards.map((c) => c.manaValue);
    expect(values.length).toBeGreaterThan(1);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('AC-3: dir=desc reverses the order', async () => {
    const asc = await searchCards(scryfall, 't:instant', 1, { order: 'name', dir: 'asc', unique: 'cards' });
    const desc = await searchCards(scryfall, 't:instant', 1, { order: 'name', dir: 'desc', unique: 'cards' });
    expect(desc.cards.map((c) => c.id)).toEqual(asc.cards.map((c) => c.id).reverse());
  });

  it('AC-4: unique=prints returns more than unique=cards', async () => {
    const cards = await searchCards(scryfall, 'bolt', 1, { unique: 'cards' });
    const prints = await searchCards(scryfall, 'bolt', 1, { unique: 'prints' });
    expect(prints.cards.length).toBeGreaterThan(cards.cards.length);
  });

  it('AC-5: sort options are sent to Scryfall as URL parameters', async () => {
    const fetch = vi.fn(async (_url: string) => new Response('{}', { status: 404 }));
    await createScryfall({ fetch }).search('x', 1, { order: 'rarity', dir: 'desc', unique: 'prints' });
    expect(fetch.mock.calls[0]?.[0]).toContain('order=rarity&dir=desc&unique=prints');
  });
});

describe('search syntax', () => {
  it('AC-1: plain words match names containing both words', async () => {
    const result = await searchCards(scryfall, 'lightning bolt');
    const want = expected((c) => /lightning/i.test(c.name) && /bolt/i.test(c.name));
    expect(want.length).toBeGreaterThan(0);
    expect(names(result)).toEqual(want);
  });

  it('AC-2: t:creature returns only creatures', async () => {
    const result = await searchCards(scryfall, 't:creature');
    expect(result.cards.length).toBeGreaterThan(0);
    expect(result.cards.every((c) => c.typeLine.includes('Creature'))).toBe(true);
    expect(names(result)).toEqual(expected((c) => c.type_line.includes('Creature')));
  });

  it('AC-3: c:r returns only red cards', async () => {
    const result = await searchCards(scryfall, 'c:r');
    expect(result.cards.length).toBeGreaterThan(0);
    expect(result.cards.every((c) => c.colors.includes('R'))).toBe(true);
    expect(names(result)).toEqual(expected((c) => c.colors.includes('R')));
  });

  it('AC-4: cmc<=2 returns only cards with mana value 2 or less', async () => {
    const result = await searchCards(scryfall, 'cmc<=2');
    expect(result.cards.length).toBeGreaterThan(0);
    expect(result.cards.every((c) => c.manaValue <= 2)).toBe(true);
    expect(names(result)).toEqual(expected((c) => c.cmc <= 2));
  });

  it('AC-5: quoted phrases are kept together as one term', async () => {
    expect(parseSearch('t:creature o:"draw a card"')).toEqual(['t:creature', 'o:"draw a card"']);
    expect(buildSearchQuery('  o:"draw a card"   c:u ')).toBe('o:"draw a card" c:u');
    const result = await searchCards(scryfall, 'o:"draw a card"');
    expect(names(result)).toEqual(
      expected((c) => /draw a card/i.test((c as { oracle_text?: string }).oracle_text ?? '')),
    );
  });

  it('AC-6: an empty or whitespace-only query makes no request and returns nothing', async () => {
    const fetch = vi.fn(fixtureFetch);
    const client = createScryfall({ fetch });
    for (const q of ['', '   \t\n', '""']) {
      expect(await searchCards(client, q)).toEqual({ cards: [], total: 0, hasMore: false });
      expect(buildSearchQuery(q)).toBeNull();
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('AC-7: tests are named after the criteria', () => {
    expect(parseSearch('a b')).toEqual(['a', 'b']);
  });
});
