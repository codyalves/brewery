# CLAUDE.md

Brewery: find Magic: The Gathering cards and build decks, in one site. It will
grow into a deck builder, collection tracker, playtester and deck analyst.
This repository is changed by an automated software factory; the owner reviews
only what the factory holds as high risk.

## Commands

```bash
pnpm install
pnpm lint        # Biome
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest
pnpm build       # next build
pnpm test:e2e    # Playwright, against the built app (run pnpm build first)
pnpm dev         # local development, live Scryfall
SCRYFALL=fixtures pnpm dev   # local development on recorded cards, offline
```

All five checks must pass; the factory runs them as quality gates.

## Card data

- Scryfall is the only source of card data, through `lib/scryfall.ts` (via
  `scryfall()` in `lib/cards.ts` in pages and routes). Do not call Scryfall
  from the browser or add another card source.
- Tests never call Scryfall. Unit tests pass `fixtureFetch` from
  `lib/fixtures.ts`; end-to-end tests run with `SCRYFALL=fixtures`, which the
  Playwright config sets. When a test needs a card that is not in
  `fixtures/scryfall/cards.json`, add it there in Scryfall's shape.
- Show card images as Scryfall serves them (`cards.scryfall.io`): never crop
  or cover the artist credit or copyright line. Link a card to its Scryfall
  page where its details are shown.
- Every page keeps the footer's Fan Content Policy notice word for word.

## Layout

- `DESIGN.md`: how the site looks. UI changes follow it and use the tokens in
  `app/globals.css`; no new colors, fonts or decorative elements.
- `lib/`: plain TypeScript, unit-tested (`*.test.ts` next to the code):
  `card.ts` (the card model), `scryfall.ts` (the API client), `deck.ts` (the
  deck model), `storage.ts` (browser storage), `mana.ts` (mana costs).
- `components/`: shared UI (`Topbar`, `Footer`, `ManaCost`).
- `app/`: Next.js App Router pages and route handlers.
- `tests/e2e/`: Playwright end-to-end tests (`*.spec.ts`).
- `tests/regressions/`: regression tests filed by the factory's tester, each
  with its issue. Protected: never edit one to make it pass; fix the app.

## Conventions

- Put logic in `lib/` as small pure functions and test it there; keep
  components thin.
- Decks and other user data live in the browser for now (`lib/storage.ts`),
  read and written only in client components. There are no accounts yet.
- Component tests (`*.test.tsx`) start with `// @vitest-environment jsdom`
  and use `@testing-library/react`.
- Name tests after the acceptance criterion they cover:
  `it('AC-1: shows each card's mana cost as pips', ...)`.
- Import with the `@/` alias from the repository root.
- No new dependencies without a person: `package.json` and the lockfile are
  protected, as are CI and tool configuration.
