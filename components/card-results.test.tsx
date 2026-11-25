// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { toCard } from '@/lib/scryfall';
import { CardResults } from './card-results';

const raw = (id: string, extra: object = {}) =>
  toCard({
    id,
    name: `Card ${id}`,
    mana_cost: '{U}',
    type_line: 'Instant',
    oracle_text: 'Do a thing.',
    ...extra,
  });

describe('card results', () => {
  it('AC-5: links to the next page, and page 2 links back', () => {
    const cards = [raw('a')];
    const { unmount } = render(<CardResults query="t:instant c:u" cards={cards} total={300} hasMore />);
    expect(screen.getByRole('link', { name: 'Next page' }).getAttribute('href')).toBe(
      '/cards?q=t%3Ainstant%20c%3Au&page=2',
    );
    expect(screen.queryByRole('link', { name: 'Previous page' })).toBeNull();
    unmount();

    render(<CardResults query="x" page={2} cards={cards} total={300} hasMore={false} />);
    expect(screen.getByRole('link', { name: 'Previous page' }).getAttribute('href')).toBe('/cards?q=x');
    expect(screen.queryByRole('link', { name: 'Next page' })).toBeNull();
  });

  it('AC-6: a card without an image shows name, type line and Oracle text in a box', () => {
    const { container } = render(<CardResults query="x" cards={[raw('b')]} total={1} hasMore={false} />);
    const box = container.querySelector('.card-box');
    expect(box?.textContent).toContain('Card b');
    expect(box?.textContent).toContain('Instant');
    expect(box?.textContent).toContain('Do a thing.');
    expect(container.querySelector('img')).toBeNull();
  });
});
