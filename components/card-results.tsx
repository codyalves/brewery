import Link from 'next/link';
import { ManaCost } from '@/components/mana-cost';
import type { Card } from '@/lib/card';

export const EXAMPLE_SEARCHES = [
  { query: 't:instant c:u', note: 'blue instants' },
  { query: 'o:draw', note: 'cards with "draw" in their text' },
  { query: 't:land', note: 'every land' },
] as const;

/** The URL of a results page. */
export function searchHref(query: string, page = 1): string {
  const params = new URLSearchParams({ q: query });
  if (page > 1) params.set('page', String(page));
  return `/cards?${params.toString()}`;
}

export function CardTile({ card }: { card: Card }) {
  const cost = card.manaCost || card.faces[0]?.manaCost || '';
  return (
    <li className="card-tile">
      <Link href={`/cards/${card.id}`} className="card-link">
        {card.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: Scryfall serves card images as they are
          <img src={card.imageUrl} alt={card.name} width={488} height={680} loading="lazy" />
        ) : (
          <span className="card-face">
            <span className="card-face-name">{card.name}</span>
            <span className="muted">{card.typeLine}</span>
            <span className="card-face-text">{card.oracleText}</span>
          </span>
        )}
        <span className="card-caption">
          {card.imageUrl ? <span>{card.name}</span> : null}
          <ManaCost cost={cost} />
        </span>
      </Link>
      <a href={card.scryfallUrl} className="muted" rel="noreferrer">
        Scryfall
      </a>
    </li>
  );
}

export function CardResults({
  query,
  cards,
  total,
  page,
  hasMore,
}: {
  query: string;
  cards: readonly Card[];
  total: number;
  page: number;
  hasMore: boolean;
}) {
  if (!query.trim()) {
    return (
      <section className="hero-search">
        <h1>Search cards</h1>
        <p className="lede">
          Type words to match card names. Add filters such as <span className="mono">t:</span> for type,{' '}
          <span className="mono">o:</span> for Oracle text and <span className="mono">c:</span> for color (w,
          u, b, r, g). Terms combine.
        </p>
        <h2>Try a search</h2>
        <ul>
          {EXAMPLE_SEARCHES.map((example) => (
            <li key={example.query}>
              <Link href={searchHref(example.query)} className="mono">
                {example.query}
              </Link>{' '}
              <span className="muted">{example.note}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section>
        <h1>No cards found</h1>
        <p className="empty">
          Nothing found for <span className="mono">{query}</span>. Check the spelling or try fewer filters.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>Cards</h1>
      <p className="num">
        {total} {total === 1 ? 'card' : 'cards'}
        <span className="muted"> match </span>
        <span className="mono">{query}</span>
      </p>
      <ul className="card-grid">
        {cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </ul>
      <nav className="pager" aria-label="Pages">
        {page > 1 ? (
          <Link href={searchHref(query, page - 1)} className="button">
            Previous page
          </Link>
        ) : null}
        {hasMore ? (
          <Link href={searchHref(query, page + 1)} className="button">
            Next page
          </Link>
        ) : null}
      </nav>
    </section>
  );
}
