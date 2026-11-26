import { describe, expect, it } from 'vitest';
import type { Format } from './card';
import { type Deck, type DeckEntry, newDeck } from './deck';
import { cardProblems, commanderEntry, hasNoProblems, setCommander, sizeCheck } from './deck-rules';

const NOW = new Date('2026-01-01T00:00:00Z');

const entry = (name: string, over: Partial<DeckEntry> = {}): DeckEntry => ({
  oracleId: name,
  name,
  typeLine: 'Instant',
  quantity: 1,
  board: 'main',
  ...over,
});

const deckOf = (format: Format, entries: readonly DeckEntry[], commanderId: string | null = null): Deck => ({
  ...newDeck('D', format, NOW, 'd'),
  commanderId,
  entries,
});

const reasons = (deck: Deck) => cardProblems(deck).map((p) => `${p.name}: ${p.reason}`);

describe('deck rules', () => {
  it('AC-1: marks banned and not legal cards with the reason', () => {
    const deck = deckOf('commander', [
      entry('Sol Ring', { legalities: { commander: 'banned' } }),
      entry('Old Card', { legalities: { commander: 'not_legal' } }),
      entry('Fine', { legalities: { commander: 'legal' } }),
    ]);
    expect(reasons(deck)).toEqual(['Sol Ring: Banned in Commander', 'Old Card: Not legal in Commander']);
  });

  it('AC-2: sets a legendary creature as commander and refuses other cards', () => {
    const deck = deckOf('commander', [
      entry('Atraxa', { typeLine: 'Legendary Creature — Phyrexian Angel' }),
      entry('Shock'),
    ]);
    const set = setCommander(deck, 'Atraxa', NOW);
    expect(commanderEntry(set)?.name).toBe('Atraxa');
    expect(setCommander(deck, 'Shock', NOW).commanderId).toBeNull();
    expect(setCommander(deckOf('modern', deck.entries), 'Atraxa', NOW).commanderId).toBeNull();
  });

  it("AC-3: marks cards outside the commander's colors", () => {
    const deck = deckOf(
      'commander',
      [
        entry('Boss', { typeLine: 'Legendary Creature', colorIdentity: ['U'] }),
        entry('Counterspell', { colorIdentity: ['U'] }),
        entry('Bolt', { colorIdentity: ['R'] }),
        entry('Wastes', { colorIdentity: [] }),
      ],
      'Boss',
    );
    expect(reasons(deck)).toEqual(["Bolt: Outside the commander's colors"]);
  });

  it('AC-4: marks non-basic cards with more than one copy in Commander', () => {
    const entries = [
      entry('Bolt', { quantity: 2 }),
      entry('Island', { typeLine: 'Basic Land — Island', quantity: 30 }),
    ];
    expect(reasons(deckOf('commander', entries))).toEqual(['Bolt: Commander decks allow one copy']);
    expect(reasons(deckOf('modern', entries))).toEqual([]);
  });

  it('AC-5: size messages state the requirement without clashing with the card count', () => {
    const commander = sizeCheck(deckOf('commander', [entry('A', { quantity: 3 })])).message;
    const modern = sizeCheck(deckOf('modern', [entry('A', { quantity: 1 })])).message;
    expect(commander).toContain('exactly 100');
    expect(commander).toContain('including the commander');
    expect(modern).toContain('at least 60');
    expect(commander).not.toMatch(/\d cards?/);
    expect(modern).not.toMatch(/\d cards?/);
  });

  it('AC-5: checks deck size per format', () => {
    expect(sizeCheck(deckOf('commander', [entry('A', { quantity: 100 })])).ok).toBe(true);
    expect(sizeCheck(deckOf('commander', [entry('A', { quantity: 101 })])).ok).toBe(false);
    expect(sizeCheck(deckOf('modern', [entry('A', { quantity: 60 })])).ok).toBe(true);
    expect(
      sizeCheck(deckOf('modern', [entry('A', { quantity: 59 }), entry('B', { board: 'side' })])).ok,
    ).toBe(false);
  });

  it('AC-6: a deck with no problems has none to report', () => {
    expect(hasNoProblems(deckOf('modern', [entry('Island', { typeLine: 'Basic Land', quantity: 60 })]))).toBe(
      true,
    );
    expect(hasNoProblems(deckOf('modern', []))).toBe(false);
  });
});
