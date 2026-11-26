import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

async function createDeck(page: Page, name: string, format: string) {
  await page.goto('/decks');
  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await page.getByRole('combobox', { name: 'Format' }).selectOption({ label: format });
  await page.getByRole('button', { name: 'Create deck' }).click();
  await expect(page).toHaveURL(/\/decks\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

async function addCard(page: Page, typed: string, name: string) {
  await page.getByRole('textbox', { name: 'Add a card' }).fill(typed);
  await page.getByRole('button', { name, exact: true }).click();
}

test('AC-1: shows name, format and cards grouped by type with counts', async ({ page }) => {
  await createDeck(page, 'Grouped', 'Modern');
  await expect(page.getByText('Modern')).toBeVisible();
  await addCard(page, 'Light', 'Lightning Bolt');
  await expect(page.getByRole('heading', { level: 2, name: 'Instants (1)' })).toBeVisible();
  await addCard(page, 'Forest', 'Forest');
  await expect(page.getByRole('heading', { level: 2, name: 'Lands (1)' })).toBeVisible();
  await addCard(page, 'Llanowar', 'Llanowar Elves');
  await expect(page.getByRole('heading', { level: 2, name: 'Creatures (1)' })).toBeVisible();
});

test('AC-2: suggests up to 10 names from the autocomplete route and adds one copy', async ({ page }) => {
  await createDeck(page, 'Suggest', 'Modern');
  const response = page.waitForResponse((r) => r.url().includes('/api/cards/autocomplete?q='));
  await page.getByRole('textbox', { name: 'Add a card' }).fill('Co');
  expect((await (await response).json()).length).toBeLessThanOrEqual(10);
  await expect(page.getByRole('button', { name: 'Counterspell' })).toBeVisible();
  await page.getByRole('button', { name: 'Counterspell' }).click();
  await expect(page.getByTestId('qty-Counterspell')).toHaveText('1');
});

test('AC-3: adding a card already in the deck raises its quantity', async ({ page }) => {
  await createDeck(page, 'Twice', 'Modern');
  await addCard(page, 'Light', 'Lightning Bolt');
  await expect(page.getByTestId('qty-Lightning Bolt')).toHaveText('1');
  await addCard(page, 'Light', 'Lightning Bolt');
  await expect(page.getByTestId('qty-Lightning Bolt')).toHaveText('2');
  await expect(page.getByText('Lightning Bolt', { exact: true })).toHaveCount(1);
});

test('AC-4: buttons raise and lower quantity; zero removes the card', async ({ page }) => {
  await createDeck(page, 'Buttons', 'Modern');
  await addCard(page, 'Light', 'Lightning Bolt');
  await page.getByRole('button', { name: 'Raise quantity of Lightning Bolt' }).click();
  await expect(page.getByTestId('qty-Lightning Bolt')).toHaveText('2');
  await page.getByRole('button', { name: 'Lower quantity of Lightning Bolt' }).click();
  await page.getByRole('button', { name: 'Lower quantity of Lightning Bolt' }).click();
  await expect(page.getByTestId('qty-Lightning Bolt')).toHaveCount(0);
});

test('AC-5: shows the total card count at the top', async ({ page }) => {
  await createDeck(page, 'Total', 'Modern');
  await expect(page.getByText('0 cards')).toBeVisible();
  await addCard(page, 'Light', 'Lightning Bolt');
  await page.getByRole('button', { name: 'Raise quantity of Lightning Bolt' }).click();
  await expect(page.getByText('2 cards')).toBeVisible();
});

test('AC-6: changes are still there after a reload', async ({ page }) => {
  await createDeck(page, 'Saved', 'Modern');
  await addCard(page, 'Light', 'Lightning Bolt');
  await page.reload();
  await expect(page.getByTestId('qty-Lightning Bolt')).toHaveText('1');
  await expect(page.getByText('1 card', { exact: false }).first()).toBeVisible();
});

test('AC-7: an unknown deck id shows "Deck not found" with a link to /decks', async ({ page }) => {
  await page.goto('/decks/nope');
  await expect(page.getByText('Deck not found')).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'See your decks' })).toHaveAttribute(
    'href',
    '/decks',
  );
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`AC-8: the deck page has no serious accessibility problems in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await createDeck(page, 'Accessible', 'Commander');
    await addCard(page, 'Light', 'Lightning Bolt');
    await page.getByRole('textbox', { name: 'Add a card' }).fill('Co');
    await expect(page.getByRole('button', { name: 'Counterspell' })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id),
    ).toEqual([]);
  });
}
