import Link from 'next/link';
import type { Card } from '@/lib/card';
import { ManaCost } from './mana-cost';

export const EXAMPLE_SEARCHES = ['t:instant c:u', 'o:draw c:g', 'lightning bolt'] as const;

const href = (q: string, page = 1) => `/cards?q=${encodeURIComponent(q)}${page > 1 ? `&page=${page}` : ''}`;

function CardTile({ card }: { card: Card }) {
  return (
    <li className="card-tile">
      <Link href={`/cards/${card.id}`} className="card-link">
        {card.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: Scryfall serves the images
          <img src={card.imageUrl} alt={card.name} width={488} height={680} loading="lazy" />
        ) : (
          <span className="card-box">
            <strong>{card.name}</strong>
            <span>{card.typeLine}</span>
            <span className="card-text">{card.oracleText}</span>
          </span>
        )}
        <span className="card-caption">
          <span className="card-name">{card.name}</span>
          <ManaCost cost={card.manaCost} />
        </span>
      </Link>
    </li>
  );
}

export function CardResults({
  query,
  page = 1,
  cards,
  total,
  hasMore,
}: {
  query: string;
  page?: number;
  cards: readonly Card[];
  total: number;
  hasMore: boolean;
}) {
  if (!query.trim()) {
    return (
      <section>
        <h1>Search cards</h1>
        <p className="lede">
          Type words to match card names. Add filters like <code>t:</code> for type, <code>o:</code> for
          Oracle text and <code>c:</code> for color, and combine them with spaces.
        </p>
        <h2>Try one of these</h2>
        <ul className="examples">
          {EXAMPLE_SEARCHES.map((q) => (
            <li key={q}>
              <Link href={href(q)}>{q}</Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (cards.length === 0) {
    return (
      <section className="empty">
        <h1>No cards match</h1>
        <p>
          Nothing found for <q>{query}</q>. Check the spelling or try fewer filters.
        </p>
      </section>
    );
  }
  return (
    <section>
      <h1>
        <span className="num">{total}</span> {total === 1 ? 'card' : 'cards'}
      </h1>
      <p className="muted">
        Results for <q>{query}</q>
      </p>
      <ul className="card-grid">
        {cards.map((c) => (
          <CardTile key={c.id} card={c} />
        ))}
      </ul>
      <nav className="pager" aria-label="Pages">
        {page > 1 && <Link href={href(query, page - 1)}>Previous page</Link>}
        {hasMore && <Link href={href(query, page + 1)}>Next page</Link>}
      </nav>
    </section>
  );
}
