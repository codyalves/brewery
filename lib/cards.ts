import { fixtureFetch } from './fixtures';
import { createScryfall } from './scryfall';

/**
 * The Scryfall client pages and routes use. Results are cached for a day,
 * as Scryfall asks; with SCRYFALL=fixtures (end-to-end tests) it answers from
 * recorded cards instead of the network.
 */
export function scryfall() {
  return process.env.SCRYFALL === 'fixtures'
    ? createScryfall({ fetch: fixtureFetch })
    : createScryfall({ init: { next: { revalidate: 86_400 } } });
}
