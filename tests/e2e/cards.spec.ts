import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('AC-1: lists matching cards with image, name and link', async ({ page }) => {
  await page.goto('/cards?q=t:instant c:u');
  await expect(page.getByRole('link', { name: /Counterspell/ })).toHaveAttribute('href', /^\/cards\/[0-9a-f-]{36}$/);
  await expect(page.getByAltText('Cyclonic Rift')).toBeVisible();
});

test('AC-2: says how many cards match', async ({ page }) => {
  await page.goto('/cards?q=t:instant c:u');
  await expect(page.getByText('2 cards')).toBeVisible();
});

test('AC-3: says when no cards match and repeats the query', async ({ page }) => {
  await page.goto('/cards?q=zzzzqx');
  await expect(page.getByText('No cards match')).toBeVisible();
  await expect(page.getByRole('main').getByText('zzzzqx')).toBeVisible();
});

test('AC-4: explains the syntax with example searches that run', async ({ page }) => {
  await page.goto('/cards');
  const examples = page.getByRole('main').getByRole('link');
  await expect(examples).toHaveCount(3);
  await examples.first().click();
  await expect(page).toHaveURL(/\/cards\?q=t%3Ainstant\+c%3Au/);
  await expect(page.getByText('2 cards')).toBeVisible();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`AC-7: the results page has no serious accessibility problems in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/cards?q=t:instant c:u');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
}
