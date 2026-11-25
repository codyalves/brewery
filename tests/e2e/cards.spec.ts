import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const search = '/cards?q=t:instant c:u';

test('AC-1: lists matching cards with image, name, mana cost and a link', async ({ page }) => {
  await page.goto(search);
  const link = page.getByRole('link', { name: /Counterspell/ });
  await expect(link).toHaveAttribute('href', /^\/cards\/[0-9a-f-]{36}$/);
  await expect(link.getByRole('img', { name: 'Counterspell' })).toBeVisible();
  await expect(link.getByRole('img', { name: /blue, blue/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Cyclonic Rift/ })).toBeVisible();
});

test('AC-2: says how many cards match', async ({ page }) => {
  await page.goto(search);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 cards');
});

test('AC-3: no matches says so and repeats the query', async ({ page }) => {
  await page.goto('/cards?q=zzzznothing');
  await expect(page.getByText('No cards match')).toBeVisible();
  await expect(page.getByRole('main').getByText('zzzznothing')).toBeVisible();
});

test('AC-4: an empty query explains syntax with three example links', async ({ page }) => {
  await page.goto('/cards');
  const links = page.getByRole('main').getByRole('link');
  await expect(links).toHaveCount(3);
  await links.first().click();
  await expect(page).toHaveURL(/\/cards\?q=/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/cards?$/);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`AC-7: results page has no serious accessibility problems in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto(search);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
}
