import { notFound } from 'next/navigation';
import { ManaCost } from '@/components/mana-cost';
import { Topbar } from '@/components/topbar';
import { type Card, FORMATS, type Format, type Legality } from '@/lib/card';
import { scryfall } from '@/lib/cards';

const LEGALITY_LABEL: Record<Legality, string> = {
  legal: 'Legal',
  not_legal: 'Not legal',
  banned: 'Banned',
  restricted: 'Restricted',
};
const FORMAT_LABEL: Record<Format, string> = {
  commander: 'Commander',
  standard: 'Standard',
  pioneer: 'Pioneer',
  modern: 'Modern',
  legacy: 'Legacy',
  vintage: 'Vintage',
  pauper: 'Pauper',
};

type Params = Promise<{ id: string }>;

async function load(id: string): Promise<Card | null> {
  try {
    return await scryfall().card(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }) {
  const card = await load((await params).id);
  return { title: `${card ? card.name : 'Card not found'} · Brewery` };
}

function Image({ url, name }: { url: string | null; name: string }) {
  return url ? (
    // biome-ignore lint/performance/noImgElement: Scryfall serves card images as they are
    <img src={url} alt={name} width={488} height={680} className="detail-image" />
  ) : null;
}

function Text({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static lines of text
        <p key={i}>{line}</p>
      ))}
    </>
  );
}

export default async function CardPage({ params }: { params: Params }) {
  const card = await load((await params).id);
  if (!card) notFound();
  const faces = card.faces.length > 0 ? card.faces : null;
  return (
    <>
      <Topbar query="" />
      <main className="page">
        <h1>{card.name}</h1>
        <div className="detail">
          <div className="detail-faces">
            {faces ? (
              faces.map((face) => (
                <section key={face.name} className="panel" aria-label={face.name}>
                  <Image url={face.imageUrl} name={face.name} />
                  <h2>{face.name}</h2>
                  <p>
                    <ManaCost cost={face.manaCost} />
                  </p>
                  <p className="muted">{face.typeLine}</p>
                  <Text text={face.oracleText} />
                </section>
              ))
            ) : (
              <section className="panel" aria-label="Card">
                <Image url={card.imageUrl} name={card.name} />
                <p>
                  <ManaCost cost={card.manaCost} />
                </p>
                <p className="muted">{card.typeLine}</p>
                <Text text={card.oracleText} />
              </section>
            )}
          </div>
          <div className="detail-info">
            <dl className="facts">
              <dt>Set</dt>
              <dd>{card.setName}</dd>
              <dt>Rarity</dt>
              <dd style={{ textTransform: 'capitalize' }}>{card.rarity}</dd>
              <dt>Price</dt>
              <dd className="num">{card.priceUsd ? `$${card.priceUsd}` : 'No price'}</dd>
            </dl>
            <h2>Legality</h2>
            <table className="legality">
              <thead>
                <tr>
                  <th scope="col">Format</th>
                  <th scope="col">Legality</th>
                </tr>
              </thead>
              <tbody>
                {FORMATS.map((format) => (
                  <tr key={format}>
                    <th scope="row">{FORMAT_LABEL[format]}</th>
                    <td>{LEGALITY_LABEL[card.legalities[format]]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              <a href={card.scryfallUrl} className="button" target="_blank" rel="noreferrer">
                View on Scryfall
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
