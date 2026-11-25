import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const BOLT = '8392823a-7dd1-5c3c-aa01-a13d8f536a3c';
const DELVER = '15e9fd35-e944-50d6-bf11-da7f10f752e2';

test('AC-1: shows the card image, name, cost, type, text, set, rarity and price', async ({ page }) => {
  await page.goto(`/cards/${BOLT}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Lightning Bolt' })).toBeVisible();
  await expect(page.getByAltText('Lightning Bolt')).toBeVisible();
  await expect(page.getByRole('main').getByRole('img', { name: /red/ })).toBeVisible();
  await expect(page.getByText('Instant').first()).toBeVisible();
  await expect(page.getByText(/3 damage/)).toBeVisible();
  await expect(page.getByText('Set', { exact: true })).toBeVisible();
  await expect(page.getByText('Rarity', { exact: true })).toBeVisible();
  await expect(page.getByText(/^\$\d/)).toBeVisible();
});

test('AC-2: shows both faces of a double-faced card', async ({ page }) => {
  await page.goto(`/cards/${DELVER}`);
  for (const name of ['Delver of Secrets', 'Insectile Aberration']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
    await expect(page.getByAltText(name)).toBeVisible();
  }
});

test('AC-3: lists legality in seven formats', async ({ page }) => {
  await page.goto(`/cards/${BOLT}`);
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(8);
  for (const f of ['Commander', 'Standard', 'Pioneer', 'Modern', 'Legacy', 'Vintage', 'Pauper']) {
    await expect(page.getByRole('row', { name: new RegExp(f) })).toContainText(
      /Legal|Not legal|Banned|Restricted/,
    );
  }
});

test('AC-4: links to the card on Scryfall', async ({ page }) => {
  await page.goto(`/cards/${BOLT}`);
  await expect(page.getByRole('link', { name: 'View on Scryfall' })).toHaveAttribute(
    'href',
    /^https:\/\/scryfall\.com\//,
  );
});

test('AC-5: an unknown id shows Card not found with status 404', async ({ page }) => {
  const response = await page.goto('/cards/00000000-0000-0000-0000-000000000000');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Card not found' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: /search/i })).toHaveAttribute(
    'href',
    '/cards',
  );
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`AC-6: the card page has no serious accessibility problems in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    for (const id of [BOLT, DELVER]) {
      await page.goto(`/cards/${id}`);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => v.id)).toEqual([]);
    }
  });
}
