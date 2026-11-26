import type { Board, Deck, DeckEntry } from './deck';

/** Plain-text decklists ("1 Sol Ring", one card per line), as other sites read and write them. */
export interface ListLine {
  readonly name: string;
  readonly quantity: number;
  readonly board: Board;
}

const HEADINGS: Record<string, Board> = {
  deck: 'main',
  mainboard: 'main',
  main: 'main',
  sideboard: 'side',
  side: 'side',
  maybeboard: 'maybe',
  maybe: 'maybe',
};

/** Parses pasted text; the same card on the same board is merged. */
export function parseDecklist(text: string): ListLine[] {
  const lines: ListLine[] = [];
  let board: Board = 'main';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('//') || line.startsWith('#')) continue;
    const heading = HEADINGS[line.replace(/:$/, '').trim().toLowerCase()];
    if (heading) {
      board = heading;
      continue;
    }
    const match = /^(\d+)\s*x?\s+(.+)$/i.exec(line);
    const quantity = match ? Number(match[1]) : 1;
    const name = (match ? (match[2] ?? '') : line).replace(/\s*\(.*$/, '').trim();
    if (!name || quantity < 1) continue;
    const same = lines.findIndex((l) => l.name.toLowerCase() === name.toLowerCase() && l.board === board);
    const found = lines[same];
    if (found) lines[same] = { ...found, quantity: found.quantity + quantity };
    else lines.push({ name, quantity, board });
  }
  return lines;
}

/** Prints a deck: main deck first, then "Sideboard" and "Maybeboard" sections when not empty. */
export function formatDecklist(deck: Pick<Deck, 'entries'>): string {
  const section = (board: Board) =>
    deck.entries.filter((e) => e.board === board).map((e) => `${e.quantity} ${e.name}`);
  const main = section('main');
  const side = section('side');
  const maybe = section('maybe');
  const blocks: string[] = [];
  if (main.length) blocks.push(main.join('\n'));
  if (side.length) blocks.push(['Sideboard', ...side].join('\n'));
  if (maybe.length) blocks.push(['Maybeboard', ...maybe].join('\n'));
  return blocks.join('\n\n');
}

export interface ResolvedCard {
  readonly oracleId: string;
  readonly name: string;
  readonly typeLine: string;
}

/** Adds resolved cards to a deck, raising quantities of cards already on the same board. */
export function addEntries(
  deck: Deck,
  items: readonly { card: ResolvedCard; quantity: number; board: Board }[],
  now: Date,
): Deck {
  let entries: DeckEntry[] = [...deck.entries];
  for (const { card, quantity, board } of items) {
    const i = entries.findIndex((e) => e.oracleId === card.oracleId && e.board === board);
    if (entries[i])
      entries = entries.map((e, j) => (j === i ? { ...e, quantity: e.quantity + quantity } : e));
    else entries.push({ oracleId: card.oracleId, name: card.name, typeLine: card.typeLine, quantity, board });
  }
  return { ...deck, entries, updatedAt: now.toISOString() };
}
