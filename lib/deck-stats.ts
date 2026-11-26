import { COLORS } from './card';
import { type Deck, groupEntries, type TypeGroup, typeGroup } from './deck';
import { parseManaCost } from './mana';

export const COLOR_NAMES = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' } as const;

export interface CurveBucket {
  readonly label: string;
  readonly count: number;
}

function nonlandMain(deck: Deck) {
  return deck.entries.filter(
    (e) => e.board === 'main' && typeGroup(e.typeLine) !== 'Lands' && e.manaValue !== undefined,
  );
}

/** Nonland main-deck cards at mana value 0 to 6, and "7+". */
export function manaCurve(deck: Deck): CurveBucket[] {
  const counts = Array.from({ length: 8 }, () => 0);
  for (const e of nonlandMain(deck)) {
    const i = Math.min(7, Math.max(0, Math.floor(e.manaValue ?? 0)));
    counts[i] = (counts[i] ?? 0) + e.quantity;
  }
  return counts.map((count, i) => ({ label: i === 7 ? '7+' : String(i), count }));
}

export interface ColorCount {
  readonly color: (typeof COLORS)[number];
  readonly name: string;
  readonly count: number;
}

/** Mana symbols of each color in the main deck's costs; hybrid symbols count for each color. */
export function colorSymbols(deck: Deck): ColorCount[] {
  const totals: Record<string, number> = {};
  for (const e of deck.entries) {
    if (e.board !== 'main' || !e.manaCost) continue;
    for (const s of parseManaCost(e.manaCost)) {
      if (s.kind !== 'color') continue;
      for (const c of s.colors) totals[c] = (totals[c] ?? 0) + e.quantity;
    }
  }
  return COLORS.map((color) => ({ color, name: COLOR_NAMES[color], count: totals[color] ?? 0 }));
}

/** Cards of each type in the main deck, empty types left out. */
export function typeCounts(deck: Deck): { group: TypeGroup; count: number }[] {
  return groupEntries(deck).map((g) => ({ group: g.group, count: g.count }));
}

/** Average mana value of nonland main-deck cards, two decimals; 0.00 with none. */
export function averageManaValue(deck: Deck): string {
  const cards = nonlandMain(deck);
  const total = cards.reduce((n, e) => n + e.quantity, 0);
  if (total === 0) return '0.00';
  return (cards.reduce((n, e) => n + (e.manaValue ?? 0) * e.quantity, 0) / total).toFixed(2);
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
