import { scryfall } from '@/lib/cards';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  try {
    const names = await scryfall().autocomplete(q);
    return Response.json(names.slice(0, 10));
  } catch {
    return Response.json([]);
  }
}
