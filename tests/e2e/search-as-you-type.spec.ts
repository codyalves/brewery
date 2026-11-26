import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('AC-1: typing lightning updates the results without pressing Enter', async ({ page }) => {
  await page.goto('/cards');
  await page.getByLabel('Search cards').pressSequentially('lightning');
  await expect(page).toHaveURL(/q=lightning/);
  await expect(page.getByAltText('Lightning Bolt')).toBeVisible();
});

test('AC-2: two characters show a list of card names under the box', async ({ page }) => {
  await page.goto('/cards');
  await page.getByLabel('Search cards').pressSequentially('li');
  await expect(page.getByRole('option', { name: 'Lightning Bolt' })).toBeVisible();
});

test('AC-3: clicking a suggestion searches that exact name; Enter does too', async ({ page }) => {
  await page.goto('/cards');
  const box = page.getByLabel('Search cards');
  await box.pressSequentially('lightn');
  await page.getByRole('option', { name: 'Lightning Bolt' }).click();
  await expect(page).toHaveURL(/q=Lightning\+Bolt/);
  await expect(box).toHaveValue('Lightning Bolt');
  await box.fill('');
  await box.pressSequentially('counters');
  await expect(page.getByRole('option', { name: 'Counterspell' })).toBeVisible();
  await box.press('ArrowDown');
  await box.press('Enter');
  await expect(page).toHaveURL(/q=Counterspell/);
});

test('AC-4: arrow keys move the highlight and Escape closes the list', async ({ page }) => {
  await page.goto('/cards');
  const box = page.getByLabel('Search cards');
  await box.pressSequentially('co');
  const options = page.getByRole('option');
  await expect(options.first()).toBeVisible();
  await box.press('ArrowDown');
  await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  if ((await options.count()) > 1) {
    await box.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    await box.press('ArrowUp');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  }
  await box.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('AC-5: the browser only requests data from this site', async ({ page }) => {
  const hosts = new Set<string>();
  page.on('request', (r) => {
    if (['fetch', 'xhr', 'document'].includes(r.resourceType())) hosts.add(new URL(r.url()).hostname);
  });
  await page.goto('/cards');
  await page.getByLabel('Search cards').pressSequentially('lightning');
  await expect(page.getByRole('option').first()).toBeVisible();
  expect([...hosts]).toEqual(['localhost']);
});

test('AC-6: the input is a combobox and the suggestions a listbox', async ({ page }) => {
  await page.goto('/cards');
  const box = page.getByRole('combobox', { name: 'Search cards' });
  await box.pressSequentially('li');
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(box).toHaveAttribute('aria-expanded', 'true');
});

test('AC-7: the search page with suggestions open has no serious axe violations', async ({ page }) => {
  await page.goto('/cards');
  await page.getByLabel('Search cards').pressSequentially('li');
  await expect(page.getByRole('listbox')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => v.id)).toEqual([]);
});
