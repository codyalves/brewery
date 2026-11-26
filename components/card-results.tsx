import Link from 'next/link';
import { ManaCost } from '@/components/mana-cost';
import type { Card } from '@/lib/card';
import type { SortOptions } from '@/lib/scryfall';

type Sort = Required<SortOptions>;
const DEFAULT_SORT: Sort = { order: 'name', dir: 'asc', unique: 'cards' };

export const EXAMPLE_SEARCHES = [
  { query: 't:instant c:u', note: 'blue instants' },
  { query: 'o:draw', note: 'cards with "draw" in their text' },
  { query: 't:land', note: 'every land' },
] as const;

/** The URL of a results page. */
export function searchHref(query: string, page = 1, sort?: Sort): string {
  const params = new URLSearchParams({ q: query });
  if (sort) {
    for (const key of ['order', 'dir', 'unique'] as const) {
      if (sort[key] !== DEFAULT_SORT[key]) params.set(key, sort[key]);
    }
  }
  if (page > 1) params.set('page', String(page));
  return `/cards?${params.toString()}`;
}

function SortControls({ query, sort }: { query: string; sort: Sort }) {
  return (
    <form action="/cards" className="sort-controls">
      <input type="hidden" name="q" value={query} />
      <label>
        Sort by{' '}
        <select name="order" defaultValue={sort.order}>
          <option value="name">Name</option>
          <option value="cmc">Mana value</option>
          <option value="rarity">Rarity</option>
        </select>
      </label>{' '}
      <label>
        Direction{' '}
        <select name="dir" defaultValue={sort.dir}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>{' '}
      <label>
        Show{' '}
        <select name="unique" defaultValue={sort.unique}>
          <option value="cards">Cards</option>
          <option value="prints">Prints</option>
        </select>
      </label>{' '}
      <button type="submit" className="button">
        Apply
      </button>
    </form>
  );
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
  sort = DEFAULT_SORT,
}: {
  query: string;
  cards: readonly Card[];
  total: number;
  page: number;
  hasMore: boolean;
  sort?: Sort;
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
      <SortControls query={query} sort={sort} />
      <ul className="card-grid">
        {cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </ul>
      <nav className="pager" aria-label="Pages">
        {page > 1 ? (
          <Link href={searchHref(query, page - 1, sort)} className="button">
            Previous page
          </Link>
        ) : null}
        {hasMore ? (
          <Link href={searchHref(query, page + 1, sort)} className="button">
            Next page
          </Link>
        ) : null}
      </nav>
    </section>
  );
}
