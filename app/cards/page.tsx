import { CardResults } from '@/components/card-results';
import { Topbar } from '@/components/topbar';
import { scryfall } from '@/lib/cards';

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q) ?? '';
  const rawPage = Number(Array.isArray(params.page) ? params.page[0] : params.page);
  const page = Number.isInteger(rawPage) && rawPage > 1 ? rawPage : 1;
  const result = await scryfall().search(q, page);

  return (
    <>
      <Topbar query={q} />
      <main className="page">
        <CardResults query={q} page={page} {...result} />
      </main>
    </>
  );
}
