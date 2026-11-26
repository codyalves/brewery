import { Decks } from '@/components/decks';
import { Topbar } from '@/components/topbar';

export const metadata = { title: 'Decks' };

export default function DecksPage() {
  return (
    <>
      <Topbar current="decks" />
      <main className="page">
        <Decks />
      </main>
    </>
  );
}
