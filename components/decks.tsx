'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { FORMATS, type Format } from '@/lib/card';
import {
  cardCount,
  DECKS_KEY,
  type Deck,
  FORMAT_LABELS,
  isDeckList,
  newDeck,
  newestFirst,
  withDeck,
  withoutDeck,
} from '@/lib/deck';
import { browserStore, type Store } from '@/lib/storage';

export function decksStore(): Store<Deck[]> {
  return browserStore<Deck[]>(DECKS_KEY, [], isDeckList);
}

function NewDeckForm({ onCreate }: { onCreate: (name: string, format: Format) => void }) {
  const [name, setName] = useState('');
  const [format, setFormat] = useState<Format>('commander');

  function submit(event: FormEvent) {
    event.preventDefault();
    onCreate(name, format);
  }

  return (
    <form className="deck-form" aria-labelledby="new-deck" onSubmit={submit}>
      <h2 id="new-deck">New deck</h2>
      <div className="deck-form-fields">
        <label>
          Name
          <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Format
          <select name="format" value={format} onChange={(e) => setFormat(e.target.value as Format)}>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="button">
          Create deck
        </button>
      </div>
    </form>
  );
}

function DeckItem({ deck, onDelete }: { deck: Deck; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const count = cardCount(deck);
  return (
    <li className="deck-item">
      <div>
        <Link href={`/decks/${deck.id}`} className="deck-name">
          {deck.name}
        </Link>
        <p className="muted">
          {FORMAT_LABELS[deck.format]} · <span className="num">{count}</span> {count === 1 ? 'card' : 'cards'}
        </p>
      </div>
      {confirming ? (
        <div className="deck-confirm">
          <span>Delete {deck.name}?</span>
          <button type="button" className="button-danger" onClick={() => onDelete(deck.id)}>
            Yes, delete
          </button>
          <button type="button" className="button-plain" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="button-danger"
          aria-label={`Delete ${deck.name}`}
          onClick={() => setConfirming(true)}
        >
          Delete
        </button>
      )}
    </li>
  );
}

/** Lists, creates and deletes the decks saved in this browser. */
export function DeckManager({
  store,
  open,
  now = () => new Date(),
  makeId = () => crypto.randomUUID(),
}: {
  store: Store<Deck[]>;
  open: (href: string) => void;
  now?: () => Date;
  makeId?: () => string;
}) {
  const [decks, setDecks] = useState<Deck[] | null>(null);

  useEffect(() => {
    setDecks(store.read());
  }, [store]);

  function save(next: Deck[]) {
    store.write(next);
    setDecks(next);
  }

  function create(name: string, format: Format) {
    const deck = newDeck(name, format, now(), makeId());
    save(withDeck(store.read(), deck));
    open(`/decks/${deck.id}`);
  }

  function remove(id: string) {
    save(withoutDeck(store.read(), id));
  }

  return (
    <section className="decks">
      <h1>Decks</h1>
      {decks === null ? null : decks.length === 0 ? (
        <p className="empty">No decks yet. Name a deck and choose its format to start one.</p>
      ) : (
        <ul className="deck-list">
          {newestFirst(decks).map((deck) => (
            <DeckItem key={deck.id} deck={deck} onDelete={remove} />
          ))}
        </ul>
      )}
      <NewDeckForm onCreate={create} />
    </section>
  );
}

export function Decks() {
  const router = useRouter();
  const [store] = useState(decksStore);
  return <DeckManager store={store} open={(href) => router.push(href)} />;
}
