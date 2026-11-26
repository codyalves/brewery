// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type Deck, type DeckEntry, newDeck } from '@/lib/deck';
import { averageManaValue, colorSymbols, manaCurve, typeCounts } from '@/lib/deck-stats';
import { DeckStats } from './deck-stats';

afterEach(cleanup);

const e = (
  name: string,
  typeLine: string,
  manaCost: string,
  manaValue: number,
  quantity: number,
): DeckEntry => ({
  oracleId: name,
  name,
  typeLine,
  manaCost,
  manaValue,
  quantity,
  board: 'main',
});

const deck: Deck = {
  ...newDeck('D', 'modern', new Date('2026-01-01T00:00:00Z'), 'd'),
  entries: [
    e('Counterspell', 'Instant', '{U}{U}', 2, 4),
    e('Island', 'Basic Land — Island', '', 0, 20),
    e('Big', 'Creature — Eldrazi', '{7}{R}', 8, 1),
    e('Huge', 'Creature — Eldrazi', '{9}', 9, 1),
    e('Bolt', 'Instant', '{R}', 1, 3),
    { ...e('Side', 'Instant', '{G}', 1, 5), board: 'side' },
  ],
};

describe('deck stats', () => {
  it('AC-1: curve counts nonland cards at 0 to 6 and groups 7 and more', () => {
    expect(manaCurve(deck).map((b) => [b.label, b.count])).toEqual([
      ['0', 0],
      ['1', 3],
      ['2', 4],
      ['3', 0],
      ['4', 0],
      ['5', 0],
      ['6', 0],
      ['7+', 2],
    ]);
  });

  it('AC-2: counts mana symbols per color', () => {
    const counts = Object.fromEntries(colorSymbols(deck).map((c) => [c.name, c.count]));
    expect(counts).toEqual({ White: 0, Blue: 8, Black: 0, Red: 4, Green: 0 });
  });

  it('AC-3: counts cards per type in the main deck', () => {
    expect(typeCounts(deck)).toEqual([
      { group: 'Creatures', count: 2 },
      { group: 'Instants', count: 7 },
      { group: 'Lands', count: 20 },
    ]);
  });

  it('AC-4: averages nonland mana value to two decimals', () => {
    // (4*2 + 8 + 9 + 3*1) / 9 = 28/9
    expect(averageManaValue(deck)).toBe('3.11');
    expect(averageManaValue(newDeck('E', 'modern', new Date(), 'e'))).toBe('0.00');
  });

  it('AC-5: charts have screen reader text', () => {
    render(<DeckStats deck={deck} />);
    const curve = within(screen.getByRole('list', { name: 'Mana curve' }));
    expect(curve.getByText('Mana value 2: 4 cards')).toBeTruthy();
    expect(curve.getByText('Mana value 1: 3 cards')).toBeTruthy();
    expect(curve.getByText('Mana value 7+: 2 cards')).toBeTruthy();
    expect(screen.getByText('Blue 8')).toBeTruthy();
    expect(screen.getByText('Instants 7')).toBeTruthy();
    expect(screen.getByText('3.11')).toBeTruthy();
  });
});
