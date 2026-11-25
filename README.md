# Brewery

Find Magic: The Gathering cards and build decks. Built by
[software-factory](https://github.com/codyalves/software-factory): issues go
in, and tested, traced changes ship to production, each with its audit record.

Card data and images come from [Scryfall](https://scryfall.com). Brewery is
unofficial Fan Content permitted under the Fan Content Policy. Not
approved/endorsed by Wizards. Portions of the materials used are property of
Wizards of the Coast. ©Wizards of the Coast LLC.

```bash
pnpm install
SCRYFALL=fixtures pnpm dev   # offline, on recorded cards
pnpm dev                     # live Scryfall
```

See `CLAUDE.md` for how the code is organized and `DESIGN.md` for the design system.
