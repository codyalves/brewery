import Link from 'next/link';
import { Topbar } from '@/components/topbar';

export default function CardNotFound() {
  return (
    <>
      <Topbar query="" />
      <main className="page">
        <h1>Card not found</h1>
        <p className="empty">No card has this id. Search for the card you want instead.</p>
        <p>
          <Link href="/cards" className="button">
            Back to search
          </Link>
        </p>
      </main>
    </>
  );
}
