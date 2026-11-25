/**
 * A card as Brewery uses it: the fields the site shows and checks, taken
 * from Scryfall's card objects (lib/scryfall.ts). Card text and images belong
 * to Wizards of the Coast; see the Fan Content notice in the footer.
 */
export const FORMATS = ['commander', 'standard', 'pioneer', 'modern', 'legacy', 'vintage', 'pauper'] as const;
export type Format = (typeof FORMATS)[number];
export type Legality = 'legal' | 'not_legal' | 'restricted' | 'banned';

/** White, blue, black, red, green. */
export const COLORS = ['W', 'U', 'B', 'R', 'G'] as const;
export type Color = (typeof COLORS)[number];

export interface CardFace {
  readonly name: string;
  readonly manaCost: string;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly imageUrl: string | null;
}

export interface Card {
  /** Scryfall's id for this printing. */
  readonly id: string;
  /** The card's Oracle id, shared by every printing: what a deck refers to. */
  readonly oracleId: string;
  readonly name: string;
  /** e.g. "{2}{U}{U}"; empty for lands and for double-faced cards (see faces). */
  readonly manaCost: string;
  /** Mana value (converted mana cost). */
  readonly manaValue: number;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly colors: readonly Color[];
  readonly colorIdentity: readonly Color[];
  readonly legalities: Readonly<Record<Format, Legality>>;
  /** Scryfall's "normal" image; null when it has none, or per face (faces). */
  readonly imageUrl: string | null;
  /** Both faces of a double-faced card, front first; empty otherwise. */
  readonly faces: readonly CardFace[];
  readonly setName: string;
  readonly rarity: string;
  /** US dollars as a string, as Scryfall gives it; null when unknown. */
  readonly priceUsd: string | null;
  /** The card's page on Scryfall, for attribution and more detail. */
  readonly scryfallUrl: string;
}

export function isColor(value: string): value is Color {
  return (COLORS as readonly string[]).includes(value);
}
