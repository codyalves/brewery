import { describe, expect, it } from 'vitest';
import { FORMATS } from './card';
import { cardCount, type Deck, FORMAT_LABELS, newDeck, newestFirst, withDeck, withoutDeck } from './deck';

const at = (iso: string) => new Date(iso);

describe('deck list', () => {
  it('AC-2: orders decks newest first and counts their cards', () => {
    const older = newDeck('Older', 'modern', at('2026-01-01T00:00:00Z'), 'a');
    const newer = newDeck('Newer', 'pauper', at('2026-02-01T00:00:00Z'), 'b');
    expect(newestFirst([older, newer]).map((d) => d.name)).toEqual(['Newer', 'Older']);

    const deck: Deck = {
      ...older,
      entries: [
        { oracleId: 'x', name: 'Island', quantity: 20, board: 'main' },
        { oracleId: 'y', name: 'Counterspell', quantity: 4, board: 'side' },
        { oracleId: 'z', name: 'Opt', quantity: 3, board: 'maybe' },
      ],
    };
    expect(cardCount(deck)).toBe(24);
    expect(cardCount(newer)).toBe(0);
  });

  it('AC-4: names every format for the new-deck form', () => {
    expect(FORMATS.map((f) => FORMAT_LABELS[f])).toEqual([
      'Commander',
      'Standard',
      'Pioneer',
      'Modern',
      'Legacy',
      'Vintage',
      'Pauper',
    ]);
  });

  it('AC-5: adds and removes decks by id', () => {
    const a = newDeck('A', 'legacy', at('2026-01-01T00:00:00Z'), 'a');
    const b = newDeck('B', 'vintage', at('2026-01-02T00:00:00Z'), 'b');
    const both = withDeck(withDeck([], a), b);
    expect(both.map((d) => d.id)).toEqual(['a', 'b']);
    expect(withoutDeck(both, 'a').map((d) => d.id)).toEqual(['b']);
  });
});
