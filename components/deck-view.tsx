'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { decksStore } from '@/components/decks';
import { cardCount, type Deck, FORMAT_LABELS } from '@/lib/deck';

/** One saved deck. Card lists come later; for now it names the deck. */
export function DeckView({ id }: { id: string }) {
  const [deck, setDeck] = useState<Deck | null | undefined>(undefined);

  useEffect(() => {
    setDeck(
      decksStore()
        .read()
        .find((d) => d.id === id) ?? null,
    );
  }, [id]);

  if (deck === undefined) return null;
  if (deck === null) {
    return (
      <section>
        <h1>Deck not found</h1>
        <p className="empty">
          This deck is not saved in this browser. <Link href="/decks">See your decks</Link>.
        </p>
      </section>
    );
  }
  const count = cardCount(deck);
  return (
    <section>
      <h1>{deck.name}</h1>
      <p className="muted">
        {FORMAT_LABELS[deck.format]} · <span className="num">{count}</span> {count === 1 ? 'card' : 'cards'}
      </p>
      <p>
        <Link href="/decks">All decks</Link>
      </p>
    </section>
  );
}
