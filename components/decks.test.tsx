// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Deck, newDeck } from '@/lib/deck';
import type { Store } from '@/lib/storage';
import { DeckManager } from './decks';
import { Topbar } from './topbar';

function memoryStore(initial: Deck[] = []): Store<Deck[]> & { value: Deck[] } {
  return {
    value: initial,
    read() {
      return this.value;
    },
    write(value) {
      this.value = value;
      return true;
    },
  };
}

const older: Deck = {
  ...newDeck('Mono-blue tempo', 'pauper', new Date('2026-01-01T00:00:00Z'), 'older'),
  entries: [{ oracleId: 'o1', name: 'Counterspell', quantity: 4, board: 'main' }],
};
const newer = newDeck('Dragons', 'commander', new Date('2026-03-01T00:00:00Z'), 'newer');

afterEach(cleanup);

describe('Topbar', () => {
  it('AC-1: links to /decks as "Decks", marked current only on the decks page', () => {
    render(<Topbar current="decks" />);
    const link = screen.getByRole('link', { name: 'Decks' });
    expect(link.getAttribute('href')).toBe('/decks');
    expect(link.getAttribute('aria-current')).toBe('page');
    cleanup();

    render(<Topbar />);
    expect(screen.getByRole('link', { name: 'Decks' }).getAttribute('aria-current')).toBeNull();
  });
});

describe('DeckManager', () => {
  it('AC-2: lists saved decks by name with format and card count, newest first', async () => {
    render(<DeckManager store={memoryStore([older, newer])} open={() => {}} />);
    const items = await screen.findAllByRole('listitem');
    expect(items.map((li) => within(li).getByRole('link').textContent)).toEqual([
      'Dragons',
      'Mono-blue tempo',
    ]);
    expect(items[0]?.textContent).toContain('Commander');
    expect(items[0]?.textContent).toContain('0 cards');
    expect(items[1]?.textContent).toContain('Pauper');
    expect(items[1]?.textContent).toContain('4 cards');
  });

  it('AC-3: says "No decks yet" and offers the new-deck form when nothing is saved', async () => {
    render(<DeckManager store={memoryStore()} open={() => {}} />);
    expect(await screen.findByText(/No decks yet/)).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create deck' })).toBeTruthy();
  });

  it('AC-4: creates a deck with a name and format, saves it and opens it', async () => {
    const store = memoryStore();
    const open = vi.fn();
    render(<DeckManager store={store} open={open} makeId={() => 'abc'} />);
    const select = screen.getByRole('combobox', { name: 'Format' });
    expect(
      within(select)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Commander', 'Standard', 'Pioneer', 'Modern', 'Legacy', 'Vintage', 'Pauper']);
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Burn' } });
    fireEvent.change(select, { target: { value: 'modern' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create deck' }));
    expect(store.value).toMatchObject([{ id: 'abc', name: 'Burn', format: 'modern' }]);
    expect(open).toHaveBeenCalledWith('/decks/abc');
  });

  it('AC-5: asks for confirmation before deleting a deck', async () => {
    const store = memoryStore([older, newer]);
    render(<DeckManager store={store} open={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Dragons' }));
    expect(store.value).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(store.value).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Dragons' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(store.value.map((d) => d.id)).toEqual(['older']);
    expect(screen.queryByText('Dragons')).toBeNull();
  });
});
