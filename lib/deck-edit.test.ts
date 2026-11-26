import { describe, expect, it } from 'vitest';
import { addCard, cardCount, changeQuantity, groupEntries, newDeck, typeGroup } from './deck';

const now = new Date('2026-01-01T00:00:00Z');
const bolt = { oracleId: 'b', name: 'Lightning Bolt', typeLine: 'Instant' };
const empty = newDeck('D', 'modern', now, 'd');

describe('deck editing', () => {
  it('AC-1: groups cards by type with counts, in order', () => {
    let d = addCard(empty, { oracleId: 'f', name: 'Forest', typeLine: 'Basic Land — Forest' }, now);
    d = addCard(d, bolt, now);
    d = addCard(d, bolt, now);
    d = addCard(d, { oracleId: 'x', name: 'Odd', typeLine: 'Battle — Siege' }, now);
    expect(groupEntries(d).map((g) => [g.group, g.count])).toEqual([
      ['Instants', 2],
      ['Lands', 1],
      ['Other', 1],
    ]);
    expect(typeGroup('Artifact Creature — Golem')).toBe('Creatures');
    expect(typeGroup('Creature — Human // Creature — Insect')).toBe('Creatures');
    expect(typeGroup(undefined)).toBe('Other');
  });

  it('AC-2: adding a card puts one copy in the main deck', () => {
    const d = addCard(empty, bolt, now);
    expect(d.entries).toEqual([{ ...bolt, quantity: 1, board: 'main' }]);
  });

  it('AC-3: adding an existing card raises its quantity', () => {
    const d = addCard(addCard(empty, bolt, now), bolt, now);
    expect(d.entries).toHaveLength(1);
    expect(d.entries[0]?.quantity).toBe(2);
  });

  it('AC-4: changes quantity and removes at zero', () => {
    const d = addCard(addCard(empty, bolt, now), bolt, now);
    expect(changeQuantity(d, 'b', -1, now).entries[0]?.quantity).toBe(1);
    expect(changeQuantity(d, 'b', 1, now).entries[0]?.quantity).toBe(3);
    expect(changeQuantity(changeQuantity(d, 'b', -1, now), 'b', -1, now).entries).toEqual([]);
  });

  it('AC-5: counts the cards in total', () => {
    expect(cardCount(addCard(addCard(empty, bolt, now), bolt, now))).toBe(2);
  });
});
