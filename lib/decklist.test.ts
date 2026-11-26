import { describe, expect, it } from 'vitest';
import { newDeck } from './deck';
import { addEntries, formatDecklist, parseDecklist } from './decklist';

const card = (n: string) => ({ oracleId: `id-${n}`, name: n, typeLine: 'Instant' });
const empty = () => newDeck('d', 'modern', new Date(0), 'x');

describe('decklist', () => {
  it('AC-1: adds listed cards with their quantity to a deck', () => {
    const next = addEntries(empty(), [{ card: card('Bolt'), quantity: 4, board: 'main' }], new Date(1));
    expect(next.entries[0]?.quantity).toBe(4);
    const again = addEntries(next, [{ card: card('Bolt'), quantity: 2, board: 'main' }], new Date(2));
    expect(again.entries).toHaveLength(1);
    expect(again.entries[0]?.quantity).toBe(6);
  });

  it('AC-2: reads quantities, x, bare names and ignores set codes', () => {
    expect(parseDecklist('4 Lightning Bolt\n4x Lightning Bolt\nCounterspell\n1 Sol Ring (CMM) 400')).toEqual([
      { name: 'Lightning Bolt', quantity: 8, board: 'main' },
      { name: 'Counterspell', quantity: 1, board: 'main' },
      { name: 'Sol Ring', quantity: 1, board: 'main' },
    ]);
  });

  it('AC-3: puts lines under headings on the right board', () => {
    const lines = parseDecklist('1 A\n\nSideboard\n2 B\nMaybeboard\n3 C');
    expect(lines.map((l) => l.board)).toEqual(['main', 'side', 'maybe']);
  });

  it('AC-4: keeps every parsed line so unknown names can be reported', () => {
    expect(parseDecklist('1 Nonsense Card\n1 Forest').map((l) => l.name)).toEqual([
      'Nonsense Card',
      'Forest',
    ]);
  });

  it('AC-5: prints main deck first, then Sideboard and Maybeboard', () => {
    const deck = addEntries(
      empty(),
      [
        { card: card('C'), quantity: 1, board: 'maybe' },
        { card: card('B'), quantity: 2, board: 'side' },
        { card: card('A'), quantity: 4, board: 'main' },
      ],
      new Date(0),
    );
    expect(formatDecklist(deck)).toBe('4 A\n\nSideboard\n2 B\n\nMaybeboard\n1 C');
  });

  it('AC-6: parsing printed text gives back the same cards and quantities', () => {
    const text = '4 A\n1 Delver of Secrets // Insectile Aberration\n\nSideboard\n2 B\n\nMaybeboard\n1 C';
    const deck = addEntries(
      empty(),
      parseDecklist(text).map((l) => ({ card: card(l.name), quantity: l.quantity, board: l.board })),
      new Date(0),
    );
    expect(formatDecklist(deck)).toBe(text);
  });
});
