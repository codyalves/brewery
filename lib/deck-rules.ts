import type { Color, Format, Legality } from './card';
import { type Deck, type DeckEntry, FORMAT_LABELS } from './deck';

export interface RuleProblem {
  readonly oracleId: string;
  readonly name: string;
  readonly reason: string;
}

export interface SizeCheck {
  readonly count: number;
  readonly ok: boolean;
  readonly message: string;
}

function front(typeLine: string | undefined): string {
  return (typeLine ?? '').split('//')[0] ?? '';
}

export function isBasicLand(entry: Pick<DeckEntry, 'typeLine'>): boolean {
  const t = front(entry.typeLine);
  return t.includes('Basic') && t.includes('Land');
}

/** Whether a card may be a commander: a legendary creature. */
export function canBeCommander(entry: Pick<DeckEntry, 'typeLine'>): boolean {
  const t = front(entry.typeLine);
  return t.includes('Legendary') && t.includes('Creature');
}

/** The deck's commander entry, if one is set and still in the main deck. */
export function commanderEntry(deck: Deck): DeckEntry | null {
  if (deck.format !== 'commander' || deck.commanderId === null) return null;
  return deck.entries.find((e) => e.oracleId === deck.commanderId && e.board === 'main') ?? null;
}

/** Sets (or, with null, clears) the commander; ignored for cards that cannot lead a deck. */
export function setCommander(deck: Deck, oracleId: string | null, now: Date): Deck {
  if (oracleId !== null) {
    const entry = deck.entries.find((e) => e.oracleId === oracleId && e.board === 'main');
    if (deck.format !== 'commander' || !entry || !canBeCommander(entry)) return deck;
  }
  return { ...deck, commanderId: oracleId, updatedAt: now.toISOString() };
}

function legalityReason(legality: Legality | undefined, format: Format): string | null {
  const label = FORMAT_LABELS[format];
  if (legality === 'banned') return `Banned in ${label}`;
  if (legality === 'not_legal') return `Not legal in ${label}`;
  return null;
}

/** Main-deck and sideboard cards that are banned or not legal in the deck's format. */
export function legalityProblems(deck: Deck): RuleProblem[] {
  return deck.entries.flatMap((e) => {
    if (e.board === 'maybe') return [];
    const reason = legalityReason(e.legalities?.[deck.format], deck.format);
    return reason ? [{ oracleId: e.oracleId, name: e.name, reason }] : [];
  });
}

export function colorIdentityProblems(deck: Deck): RuleProblem[] {
  const commander = commanderEntry(deck);
  if (!commander?.colorIdentity) return [];
  const allowed: readonly Color[] = commander.colorIdentity;
  return deck.entries
    .filter((e) => e.board === 'main' && e.oracleId !== commander.oracleId && e.colorIdentity)
    .filter((e) => (e.colorIdentity ?? []).some((c) => !allowed.includes(c)))
    .map((e) => ({ oracleId: e.oracleId, name: e.name, reason: "Outside the commander's colors" }));
}

export function singletonProblems(deck: Deck): RuleProblem[] {
  if (deck.format !== 'commander') return [];
  return deck.entries
    .filter((e) => e.board === 'main' && e.quantity > 1 && !isBasicLand(e))
    .map((e) => ({ oracleId: e.oracleId, name: e.name, reason: 'Commander decks allow one copy' }));
}

/** Every card-level problem, one item per card and reason. */
export function cardProblems(deck: Deck): RuleProblem[] {
  return [...legalityProblems(deck), ...colorIdentityProblems(deck), ...singletonProblems(deck)];
}

export function problemsFor(problems: readonly RuleProblem[], oracleId: string): string[] {
  return problems.filter((p) => p.oracleId === oracleId).map((p) => p.reason);
}

/** Commander: exactly 100 in the main deck (commander included). Others: at least 60 in the main deck. */
export function sizeCheck(deck: Deck): SizeCheck {
  const count = deck.entries.filter((e) => e.board === 'main').reduce((n, e) => n + e.quantity, 0);
  if (deck.format === 'commander') {
    const ok = count === 100;
    return {
      count,
      ok,
      message: ok
        ? `${count} cards, as required (100)`
        : `${count} of 100 cards: Commander decks need exactly 100 cards including the commander`,
    };
  }
  const ok = count >= 60;
  return {
    count,
    ok,
    message: ok
      ? `${count} cards in the main deck (at least 60)`
      : `${count} of 60 cards: the main deck needs at least 60 cards`,
  };
}

/** True when the deck has no card problems and its size is right. */
export function hasNoProblems(deck: Deck): boolean {
  return cardProblems(deck).length === 0 && sizeCheck(deck).ok;
}
