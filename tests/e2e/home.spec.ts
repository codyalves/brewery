import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the home page offers card search and carries the Fan Content notice', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Search cards' })).toBeVisible();
  await expect(
    page.getByText('Brewery is unofficial Fan Content permitted under the Fan Content Policy.'),
  ).toBeVisible();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the home page has no serious accessibility problems in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
}
