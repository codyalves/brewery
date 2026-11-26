// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { newDeck } from '@/lib/deck';
import { DeckRules } from './deck-rules';

afterEach(cleanup);

const base = newDeck('D', 'modern', new Date('2026-01-01T00:00:00Z'), 'd');

describe('DeckRules', () => {
  it('AC-6: shows "No rule problems found" for a clean deck, with the size check (AC-5)', () => {
    const deck = {
      ...base,
      entries: [
        { oracleId: 'i', name: 'Island', typeLine: 'Basic Land', quantity: 60, board: 'main' as const },
      ],
    };
    render(<DeckRules deck={deck} />);
    expect(screen.getByText('No rule problems found')).toBeTruthy();
    expect(screen.getByTestId('size-check').textContent).toContain('60');
  });

  it('AC-1: lists the reason for a banned card', () => {
    const deck = {
      ...base,
      entries: [
        {
          oracleId: 'x',
          name: 'Bad',
          quantity: 60,
          board: 'main' as const,
          legalities: { modern: 'banned' as const },
        },
      ],
    };
    render(<DeckRules deck={deck} />);
    expect(screen.getByText('Bad: Banned in Modern')).toBeTruthy();
    expect(screen.queryByText('No rule problems found')).toBeNull();
  });
});
