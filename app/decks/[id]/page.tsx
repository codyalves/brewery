import { DeckView } from '@/components/deck-view';
import { Topbar } from '@/components/topbar';

export const metadata = { title: 'Deck' };

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Topbar current="decks" />
      <main className="page">
        <DeckView id={id} />
      </main>
    </>
  );
}
