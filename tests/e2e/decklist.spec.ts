import { expect, type Page, test } from '@playwright/test';

async function createDeck(page: Page, name: string) {
  await page.goto('/decks');
  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await page.getByRole('button', { name: 'Create deck' }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

async function importText(page: Page, text: string) {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.getByRole('textbox', { name: 'Decklist' }).fill(text);
  await page.getByRole('button', { name: 'Import cards' }).click();
}

test('AC-1: Import adds listed cards with quantities', async ({ page }) => {
  await createDeck(page, 'Imp');
  await importText(page, '4 Lightning Bolt\n2x Forest\nCounterspell');
  await expect(page.getByTestId('qty-Lightning Bolt')).toHaveText('4');
  await expect(page.getByTestId('qty-Forest')).toHaveText('2');
  await expect(page.getByTestId('qty-Counterspell')).toHaveText('1');
});

test('AC-4: lists unknown names as Not found and keeps the rest', async ({ page }) => {
  await createDeck(page, 'Missing');
  await importText(page, '1 Forest\n1 Zzzz Nothing');
  await expect(page.getByText('Not found: Zzzz Nothing')).toBeVisible();
  await expect(page.getByTestId('qty-Forest')).toHaveText('1');
});

test('AC-5: Export shows main, Sideboard and Maybeboard with a Copy button', async ({ page }) => {
  await createDeck(page, 'Exp');
  await importText(page, '2 Forest\nSideboard\n1 Counterspell\nMaybeboard\n1 Island');
  await page.getByRole('button', { name: 'Export' }).click();
  await expect(page.getByRole('textbox', { name: 'Deck as text' })).toHaveValue(
    '2 Forest\n\nSideboard\n1 Counterspell\n\nMaybeboard\n1 Island',
  );
  await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
});

test('AC-6: exported text imported into a new deck round-trips', async ({ page }) => {
  await createDeck(page, 'Src');
  await importText(page, '3 Forest\nSideboard\n1 Counterspell');
  await page.getByRole('button', { name: 'Export' }).click();
  const text = await page.getByRole('textbox', { name: 'Deck as text' }).inputValue();
  await createDeck(page, 'Dst');
  await importText(page, text);
  await page.getByRole('button', { name: 'Export' }).click();
  await expect(page.getByRole('textbox', { name: 'Deck as text' })).toHaveValue(text);
});
