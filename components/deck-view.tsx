'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { decksStore } from '@/components/decks';
import {
  addCard,
  type CardRef,
  cardCount,
  changeQuantity,
  type Deck,
  FORMAT_LABELS,
  groupEntries,
  withDeck,
} from '@/lib/deck';
import { addEntries, formatDecklist, parseDecklist, type ResolvedCard } from '@/lib/decklist';

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

  function currentDeck() {
    return (
      decksStore()
        .read()
        .find((d) => d.id === id) ?? null
    );
  }

  function save(next: Deck) {
    const store = decksStore();
    store.write(withDeck(store.read(), next));
    setDeck(next);
  }

  async function add(name: string) {
    try {
      const response = await fetch(`/api/cards/named?name=${encodeURIComponent(name)}`);
      if (!response.ok) return;
      const card = (await response.json()) as CardRef;
      const current = currentDeck();
      if (current) save(addCard(current, card, new Date()));
    } catch {
      // The card could not be looked up; nothing is added.
    }
  }

  async function importText(text: string): Promise<string[]> {
    const lines = parseDecklist(text);
    const resolved = new Map<string, ResolvedCard | null>();
    for (const name of new Set(lines.map((l) => l.name))) {
      try {
        const response = await fetch(`/api/cards/named?name=${encodeURIComponent(name)}`);
        resolved.set(name, response.ok ? ((await response.json()) as ResolvedCard) : null);
      } catch {
        resolved.set(name, null);
      }
    }
    const items = lines.flatMap((l) => {
      const card = resolved.get(l.name);
      return card ? [{ card, quantity: l.quantity, board: l.board }] : [];
    });
    const current = currentDeck();
    if (current && items.length > 0) save(addEntries(current, items, new Date()));
    return lines.filter((l) => !resolved.get(l.name)).map((l) => l.name);
  }

  function change(oracleId: string, delta: number) {
    const current = currentDeck();
    if (current) save(changeQuantity(current, oracleId, delta, new Date()));
  }

  return (
    <section className="decks">
      <div>
        <h1>{deck.name}</h1>
        <p className="muted">
          {FORMAT_LABELS[deck.format]} · <span className="num">{count}</span> {count === 1 ? 'card' : 'cards'}
        </p>
      </div>
      <AddCard onChoose={add} />
      <ImportExport deck={deck} onImport={importText} />
      {groupEntries(deck).map((g) => (
        <section key={g.group} className="deck-group" aria-labelledby={`group-${g.group}`}>
          <h2 id={`group-${g.group}`}>
            {g.group} (<span className="num">{g.count}</span>)
          </h2>
          <ul className="deck-list">
            {g.entries.map((e) => (
              <li key={e.oracleId} className="card-line">
                <span className="card-line-name">{e.name}</span>
                <button
                  type="button"
                  className="button-plain"
                  aria-label={`Lower quantity of ${e.name}`}
                  onClick={() => change(e.oracleId, -1)}
                >
                  −
                </button>
                <span className="num qty" data-testid={`qty-${e.name}`}>
                  {e.quantity}
                </span>
                <button
                  type="button"
                  className="button-plain"
                  aria-label={`Raise quantity of ${e.name}`}
                  onClick={() => change(e.oracleId, 1)}
                >
                  +
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p>
        <Link href="/decks">All decks</Link>
      </p>
    </section>
  );
}

function ImportExport({ deck, onImport }: { deck: Deck; onImport: (text: string) => Promise<string[]> }) {
  const [mode, setMode] = useState<'import' | 'export' | null>(null);
  const [text, setText] = useState('');
  const [missing, setMissing] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const notFound = await onImport(text);
    setBusy(false);
    setMissing(notFound);
    if (notFound.length === 0) {
      setText('');
      setMode(null);
    }
  }

  const exported = formatDecklist(deck);

  return (
    <div className="import-export">
      <p>
        <button type="button" className="button" onClick={() => setMode(mode === 'import' ? null : 'import')}>
          Import
        </button>{' '}
        <button
          type="button"
          className="button"
          onClick={() => {
            setCopied(false);
            setMode(mode === 'export' ? null : 'export');
          }}
        >
          Export
        </button>
      </p>
      {mode === 'import' && (
        <div>
          <label htmlFor="import-text">Decklist</label>
          <textarea id="import-text" rows={10} value={text} onChange={(e) => setText(e.target.value)} />
          <p>
            <button type="button" className="button" disabled={busy || !text.trim()} onClick={run}>
              Import cards
            </button>
          </p>
        </div>
      )}
      {missing.length > 0 && <p role="alert">Not found: {missing.join(', ')}</p>}
      {mode === 'export' && (
        <div>
          <label htmlFor="export-text">Deck as text</label>
          <textarea id="export-text" rows={10} readOnly value={exported} />
          <p>
            <button
              type="button"
              className="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exported);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              Copy
            </button>{' '}
            {copied && <span className="muted">Copied</span>}
          </p>
        </div>
      )}
    </div>
  );
}

/** Type-ahead box: names come from our own route handler, never from the browser to Scryfall. */
function AddCard({ onChoose }: { onChoose: (name: string) => void }) {
  const [text, setText] = useState('');
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    if (text.trim().length < 2) {
      setNames([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/cards/autocomplete?q=${encodeURIComponent(text.trim())}`, {
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        if (Array.isArray(body)) setNames(body.slice(0, 10).map(String));
      } catch {
        // Aborted or unavailable: keep the old suggestions.
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  return (
    <div className="add-card">
      <label htmlFor="add-card-input">Add a card</label>
      <input
        id="add-card-input"
        type="text"
        autoComplete="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {names.length > 0 && (
        <ul className="suggestions" aria-label="Card suggestions">
          {names.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => {
                  onChoose(name);
                  setText('');
                  setNames([]);
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
