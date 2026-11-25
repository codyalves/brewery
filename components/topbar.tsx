import Link from 'next/link';

/** Search is the first thing on every page: most visits start with a card name. */
export function Topbar({ query = '', current }: { query?: string; current?: 'decks' }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="wordmark">
          Brew<span>ery</span>
        </Link>
        <search className="search">
          <form action="/cards">
            <label htmlFor="q" className="visually-hidden">
              Search cards
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search cards, e.g. t:dragon c:r"
            />
            <button type="submit" className="button">
              Search
            </button>
          </form>
        </search>
        <nav className="nav" aria-label="Main">
          <Link href="/decks" aria-current={current === 'decks' ? 'page' : undefined}>
            Decks
          </Link>
        </nav>
      </div>
    </header>
  );
}
