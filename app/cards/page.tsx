import { CardResults } from '@/components/card-results';
import { Topbar } from '@/components/topbar';
import { scryfall } from '@/lib/cards';
import type { SearchResult } from '@/lib/scryfall';
import { searchCards } from '@/lib/search';

export const metadata = { title: 'Card search · Brewery' };

type Params = Promise<{ q?: string | string[]; page?: string | string[] }>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function CardsPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const query = first(params.q).trim();
  const page = Math.max(1, Number.parseInt(first(params.page), 10) || 1);
  let result: SearchResult = { cards: [], total: 0, hasMore: false };
  if (query) {
    try {
      result = await searchCards(scryfall(), query, page);
    } catch {
      // An invalid query or Scryfall being unavailable reads as no matches.
    }
  }
  return (
    <>
      <Topbar query={query} hint />
      <main className="page">
        <CardResults query={query} page={page} {...result} />
      </main>
    </>
  );
}
