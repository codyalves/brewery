import { scryfall } from '@/lib/cards';

/** A card's identity for adding it to a deck: GET /api/cards/named?name=… */
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name') ?? '';
  try {
    const card = name.trim() ? await scryfall().named(name) : null;
    if (!card) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({
      oracleId: card.oracleId,
      name: card.name,
      typeLine: card.typeLine,
      manaCost: card.manaCost || card.faces[0]?.manaCost || '',
      manaValue: card.manaValue,
      colorIdentity: card.colorIdentity,
      legalities: card.legalities,
    });
  } catch {
    return Response.json({ error: 'Unavailable' }, { status: 502 });
  }
}
