// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CardResults } from '@/components/card-results';
import recorded from '@/fixtures/scryfall/cards.json';
import { toCard } from '@/lib/scryfall';

afterEach(cleanup);

const cards = recorded.cards.filter((c) => c.type_line === 'Instant' && c.colors.includes('U')).map(toCard);
const base = { query: 't:instant c:u', cards, total: cards.length, page: 1, hasMore: false };

describe('CardResults', () => {
  it('AC-1: shows each card as a linked image with its name and mana cost', () => {
    render(<CardResults {...base} />);
    const link = screen.getByRole('link', { name: /Counterspell/ });
    expect(link.getAttribute('href')).toBe(`/cards/${cards[0]?.id}`);
    expect(screen.getByAltText('Counterspell').getAttribute('src')).toContain('cards.scryfall.io');
    expect(screen.getByRole('img', { name: 'blue, blue' })).toBeTruthy();
  });

  it('AC-2: says how many cards match', () => {
    render(<CardResults {...base} />);
    expect(screen.getByText(/2 cards/)).toBeTruthy();
  });

  it('AC-3: says no cards match and repeats the query', () => {
    render(<CardResults {...base} query="zzz" cards={[]} total={0} />);
    expect(screen.getByText('No cards match')).toBeTruthy();
    expect(screen.getByText('zzz')).toBeTruthy();
  });

  it('AC-4: explains the syntax with three example links for an empty query', () => {
    render(<CardResults {...base} query="" cards={[]} total={0} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]?.getAttribute('href')).toBe('/cards?q=t%3Ainstant+c%3Au');
  });

  it('AC-5: links to the next page, and page 2 links back', () => {
    const { unmount } = render(<CardResults {...base} hasMore />);
    expect(screen.getByRole('link', { name: 'Next page' }).getAttribute('href')).toBe(
      '/cards?q=t%3Ainstant+c%3Au&page=2',
    );
    expect(screen.queryByRole('link', { name: 'Previous page' })).toBeNull();
    unmount();
    render(<CardResults {...base} page={2} />);
    expect(screen.getByRole('link', { name: 'Previous page' }).getAttribute('href')).toBe(
      '/cards?q=t%3Ainstant+c%3Au',
    );
  });

  it('AC-6: shows name, type line and Oracle text when a card has no image', () => {
    const bare = { ...(cards[0] as (typeof cards)[number]), imageUrl: null };
    render(<CardResults {...base} cards={[bare]} total={1} />);
    expect(screen.getByText('Counterspell')).toBeTruthy();
    expect(screen.getByText('Instant')).toBeTruthy();
    expect(screen.getByText('Counter target spell.')).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Counterspell' })).toBeNull();
  });
});
