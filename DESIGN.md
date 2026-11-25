# Design

How Brewery looks, and the rules every UI change follows. The tokens live in
`app/globals.css`; use them instead of new colors, sizes or fonts.

## The idea

A workbench for brewing decks: dense, calm, and quick to scan. The cards are
the color on the page; the interface stays neutral around them.

- **Search comes first.** The search box is in the top bar of every page.
- **Mana is data, not decoration.** The five mana colors appear only where
  they mean something: cost pips, color identity, curve and color charts.
- **Numbers line up.** Counts, costs, prices and totals use Recursive's
  monospace axis (`.num`), so a list reads like a decklist.
- **One accent.** Copper (`--accent`) marks actions and links, nothing else.

## Color

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--paper` | `#eef0f2` | `#111317` | Page background |
| `--surface` | `#ffffff` | `#191c21` | Top bar, panels, inputs |
| `--sunk` | `#e3e6ea` | `#0c0e11` | Wells behind card images and charts |
| `--ink` | `#15181d` | `#e7e9ec` | Text |
| `--muted` | `#565d69` | `#a1a8b3` | Secondary text |
| `--rule` | `#d3d8de` | `#2b3038` | Borders and dividers |
| `--accent` | `#8a4f0f` | `#e3a35c` | Buttons, links, focus |
| `--on-accent` | `#ffffff` | `#1d1205` | Text on accent |
| `--danger` | `#a3261c` | `#f08a80` | Destructive actions, errors |
| `--mana-w/u/b/r/g`, `--mana-c` | | | Mana only (see above) |

Every text pairing meets WCAG AA. Dark mode follows the visitor's system.

## Type

One family, Recursive (`public/fonts`, SIL Open Font License):

- Body `--step-0`, headings weight 720, `h1` `--step-3`
- Numbers, costs, counts and prices: `.num` (monospace axis, tabular figures)
- The wordmark alone uses the casual axis
- Sentence case everywhere; no all-caps labels

## Layout

- Page width `--page`, gutter `--space-3`; spacing from `--space-1` to `--space-5`.
- Corners: `--radius` for controls and panels; card images use
  `--radius-card`, the rounded corners of a real card.
- Card grids: images at their natural ratio (63 by 88), never cropped.
- Phones: the search moves under the wordmark at full width; nothing scrolls
  sideways at 375 pixels.

## Components

- `ManaCost`: costs as pips, announced in words (`2 generic, blue, blue`).
- Buttons: `.button` (accent). Destructive actions use `--danger` text with a
  confirmation step.
- Empty states say what to do next (`.empty`).
- Focus is always visible: a 2px accent outline.

## Checks

Every page has no serious or critical axe violations in light and dark mode,
and no horizontal scroll at 375 pixels wide.
