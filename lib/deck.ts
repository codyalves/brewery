import { FORMATS, type Format } from './card';

/**
 * A deck as Brewery stores it. Entries name cards by Oracle id (the same
 * card in any printing) and keep the name for display and export. Decks
 * live in the browser (lib/storage.ts) until there are accounts.
 */
export const BOARDS = ['main', 'side', 'maybe'] as const;
export type Board = (typeof BOARDS)[number];

export interface DeckEntry {
  readonly oracleId: string;
  readonly name: string;
  /** The card's type line, for grouping; older entries may lack it. */
  readonly typeLine?: string;
  /** Mana cost and mana value, for stats; older entries may lack them. */
  readonly manaCost?: string;
  readonly manaValue?: number;
  readonly quantity: number;
  readonly board: Board;
}

export interface Deck {
  readonly id: string;
  readonly name: string;
  readonly format: Format;
  /** Oracle id of the commander, for Commander decks. */
  readonly commanderId: string | null;
  readonly entries: readonly DeckEntry[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const DECKS_KEY = 'brewery.decks.v1';

export function newDeck(name: string, format: Format, now: Date, id: string): Deck {
  const at = now.toISOString();
  return {
    id,
    name: name.trim() || 'Untitled deck',
    format,
    commanderId: null,
    entries: [],
    createdAt: at,
    updatedAt: at,
  };
}

function isEntry(value: unknown): value is DeckEntry {
  const e = value as DeckEntry;
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof e.oracleId === 'string' &&
    typeof e.name === 'string' &&
    Number.isInteger(e.quantity) &&
    e.quantity > 0 &&
    (BOARDS as readonly string[]).includes(e.board)
  );
}

export function isDeck(value: unknown): value is Deck {
  const d = value as Deck;
  return (
    typeof d === 'object' &&
    d !== null &&
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    (FORMATS as readonly string[]).includes(d.format) &&
    (d.commanderId === null || typeof d.commanderId === 'string') &&
    Array.isArray(d.entries) &&
    d.entries.every(isEntry) &&
    typeof d.createdAt === 'string' &&
    typeof d.updatedAt === 'string'
  );
}

export function isDeckList(value: unknown): value is Deck[] {
  return Array.isArray(value) && value.every(isDeck);
}

export const FORMAT_LABELS: Record<Format, string> = {
  commander: 'Commander',
  standard: 'Standard',
  pioneer: 'Pioneer',
  modern: 'Modern',
  legacy: 'Legacy',
  vintage: 'Vintage',
  pauper: 'Pauper',
};

/** Cards in the deck, main board and sideboard, not counting the maybeboard. */
export function cardCount(deck: Deck): number {
  return deck.entries.filter((e) => e.board !== 'maybe').reduce((sum, e) => sum + e.quantity, 0);
}

/** Decks with the most recently created first. */
export function newestFirst(decks: readonly Deck[]): Deck[] {
  return [...decks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const TYPE_GROUPS = [
  'Creatures',
  'Instants',
  'Sorceries',
  'Artifacts',
  'Enchantments',
  'Planeswalkers',
  'Lands',
  'Other',
] as const;
export type TypeGroup = (typeof TYPE_GROUPS)[number];

const GROUP_TYPES: readonly [string, TypeGroup][] = [
  ['Creature', 'Creatures'],
  ['Land', 'Lands'],
  ['Planeswalker', 'Planeswalkers'],
  ['Instant', 'Instants'],
  ['Sorcery', 'Sorceries'],
  ['Artifact', 'Artifacts'],
  ['Enchantment', 'Enchantments'],
];

/** The group a type line belongs to; the first matching type wins, in the order above. */
export function typeGroup(typeLine: string | undefined): TypeGroup {
  // Only the front face counts for double-faced cards, and only the types before the dash.
  const front = (typeLine ?? '').split('//')[0]?.split('—')[0] ?? '';
  return GROUP_TYPES.find(([type]) => front.includes(type))?.[1] ?? 'Other';
}

export interface EntryGroup {
  readonly group: TypeGroup;
  readonly entries: readonly DeckEntry[];
  readonly count: number;
}

/** Main-deck entries grouped by type, in TYPE_GROUPS order, empty groups left out. */
export function groupEntries(deck: Deck): EntryGroup[] {
  const main = deck.entries.filter((e) => e.board === 'main');
  return TYPE_GROUPS.map((group) => {
    const entries = main
      .filter((e) => typeGroup(e.typeLine) === group)
      .sort((a, b) => a.name.localeCompare(b.name));
    return { group, entries, count: entries.reduce((sum, e) => sum + e.quantity, 0) };
  }).filter((g) => g.entries.length > 0);
}

export interface CardRef {
  readonly oracleId: string;
  readonly name: string;
  readonly typeLine: string;
  readonly manaCost?: string;
  readonly manaValue?: number;
}

function touch(deck: Deck, entries: readonly DeckEntry[], now: Date): Deck {
  return { ...deck, entries, updatedAt: now.toISOString() };
}

/** Adds one copy to the main deck, raising the quantity if the card is already there. */
export function addCard(deck: Deck, card: CardRef, now: Date): Deck {
  const same = (e: DeckEntry) => e.oracleId === card.oracleId && e.board === 'main';
  const entries = deck.entries.some(same)
    ? deck.entries.map((e) => (same(e) ? { ...e, quantity: e.quantity + 1 } : e))
    : [
        ...deck.entries,
        {
          oracleId: card.oracleId,
          name: card.name,
          typeLine: card.typeLine,
          ...(card.manaCost !== undefined ? { manaCost: card.manaCost } : {}),
          ...(card.manaValue !== undefined ? { manaValue: card.manaValue } : {}),
          quantity: 1,
          board: 'main' as const,
        },
      ];
  return touch(deck, entries, now);
}

/** Changes a main-deck card's quantity by `delta`; at zero or below the card is removed. */
export function changeQuantity(deck: Deck, oracleId: string, delta: number, now: Date): Deck {
  const entries = deck.entries.flatMap((e) => {
    if (e.oracleId !== oracleId || e.board !== 'main') return [e];
    const quantity = e.quantity + delta;
    return quantity > 0 ? [{ ...e, quantity }] : [];
  });
  return touch(deck, entries, now);
}

export function withDeck(decks: readonly Deck[], deck: Deck): Deck[] {
  return [...decks.filter((d) => d.id !== deck.id), deck];
}

export function withoutDeck(decks: readonly Deck[], id: string): Deck[] {
  return decks.filter((d) => d.id !== id);
}
