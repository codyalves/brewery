import { CardResults } from '@/components/card-results';
import { Topbar } from '@/components/topbar';
import { scryfall } from '@/lib/cards';
import { DIRS, ORDERS, type SearchResult, type SortOptions, UNIQUES } from '@/lib/scryfall';
import { searchCards } from '@/lib/search';

export const metadata = { title: 'Card search · Brewery' };

type Params = Promise<{
  q?: string | string[];
  page?: string | string[];
  order?: string | string[];
  dir?: string | string[];
  unique?: string | string[];
}>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function CardsPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const query = first(params.q).trim();
  const page = Math.max(1, Number.parseInt(first(params.page), 10) || 1);
  const pick = <T extends string>(values: readonly T[], v: string, fallback: T): T =>
    values.find((x) => x === v) ?? fallback;
  const sort = {
    order: pick(ORDERS, first(params.order), 'name'),
    dir: pick(DIRS, first(params.dir), 'asc'),
    unique: pick(UNIQUES, first(params.unique), 'cards'),
  } satisfies Required<SortOptions>;
  let result: SearchResult = { cards: [], total: 0, hasMore: false };
  if (query) {
    try {
      result = await searchCards(scryfall(), query, page, sort);
    } catch {
      // An invalid query or Scryfall being unavailable reads as no matches.
    }
  }
  return (
    <>
      <Topbar query={query} hint />
      <main className="page">
        <CardResults query={query} page={page} sort={sort} {...result} />
      </main>
    </>
  );
}
