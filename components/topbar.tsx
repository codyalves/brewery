import Link from 'next/link';
import { SearchBox } from './search-box';

/** Search is the first thing on every page: most visits start with a card name. */
export function Topbar({ query = '', current, hint }: { query?: string; current?: 'decks'; hint?: boolean }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="wordmark">
          Brew<span>ery</span>
        </Link>
        <SearchBox query={query} hint={hint} />
        <nav className="nav" aria-label="Main">
          <Link href="/decks" aria-current={current === 'decks' ? 'page' : undefined}>
            Decks
          </Link>
        </nav>
      </div>
    </header>
  );
}
