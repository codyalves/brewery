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
