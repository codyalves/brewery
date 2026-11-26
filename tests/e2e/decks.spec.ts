import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

async function createDeck(page: Page, name: string, format: string) {
  await page.goto('/decks');
  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await page.getByRole('combobox', { name: 'Format' }).selectOption({ label: format });
  await page.getByRole('button', { name: 'Create deck' }).click();
  await expect(page).toHaveURL(/\/decks\/[0-9a-f-]{36}$/);
}

test('AC-1: the top bar links to Decks, marked as the current page there', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' });
  await expect(link).toHaveAttribute('href', '/decks');
  await expect(link).not.toHaveAttribute('aria-current', 'page');
  await link.click();
  await expect(page).toHaveURL(/\/decks$/);
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('AC-2: lists saved decks with format and card count, newest first', async ({ page }) => {
  await createDeck(page, 'First brew', 'Modern');
  await createDeck(page, 'Second brew', 'Pauper');
  await page.goto('/decks');
  const items = page.getByRole('main').getByRole('listitem');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('Second brew');
  await expect(items.nth(0)).toContainText('Pauper');
  await expect(items.nth(0)).toContainText('0 cards');
  await expect(items.nth(1)).toContainText('First brew');
  await expect(items.nth(1)).toContainText('Modern');
});

test('AC-3: with no decks, says "No decks yet" and offers the form', async ({ page }) => {
  await page.goto('/decks');
  await expect(page.getByText('No decks yet')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create deck' })).toBeVisible();
});

test('AC-4: creating a deck saves it and opens /decks/{id}', async ({ page }) => {
  await createDeck(page, 'Elves', 'Legacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Elves' })).toBeVisible();
  await page.goto('/decks');
  await expect(page.getByRole('link', { name: 'Elves' })).toBeVisible();
});

test('AC-5: Delete asks for confirmation before removing a deck', async ({ page }) => {
  await createDeck(page, 'Doomed', 'Vintage');
  await page.goto('/decks');
  await page.getByRole('button', { name: 'Delete Doomed' }).click();
  await expect(page.getByText('Delete Doomed?')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('link', { name: 'Doomed' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Doomed' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(page.getByText('No decks yet')).toBeVisible();
  await page.reload();
  await expect(page.getByText('No decks yet')).toBeVisible();
});

test('AC-6: decks are still listed after a reload', async ({ page }) => {
  await createDeck(page, 'Keeper', 'Standard');
  await page.goto('/decks');
  await expect(page.getByRole('link', { name: 'Keeper' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Keeper' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('listitem')).toContainText('Standard');
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`AC-7: the decks page has no serious accessibility problems in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/decks');
    await expect(page.getByText('No decks yet')).toBeVisible();
    const empty = await new AxeBuilder({ page }).analyze();
    expect(
      empty.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id),
    ).toEqual([]);

    await createDeck(page, 'Accessible', 'Commander');
    await page.goto('/decks');
    await page.getByRole('button', { name: 'Delete Accessible' }).click();
    await expect(page.getByRole('button', { name: 'Yes, delete' })).toBeVisible();
    const listed = await new AxeBuilder({ page }).analyze();
    expect(
      listed.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id),
    ).toEqual([]);
  });
}
