import { Topbar } from '@/components/topbar';

export default function Home() {
  return (
    <>
      <Topbar />
      <main className="page">
        <section className="hero-search">
          <h1>Brew a deck</h1>
          <p className="lede">
            Search every Magic card by name, type, text or color, then build and tune decks right in your
            browser.
          </p>
        </section>
      </main>
    </>
  );
}
