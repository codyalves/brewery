import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('AC-1: lists matching cards with image, name and link', async ({ page }) => {
  await page.goto('/cards?q=t:instant c:u');
  await expect(page.getByRole('link', { name: /Counterspell/ })).toHaveAttribute(
    'href',
    /^\/cards\/[0-9a-f-]{36}$/,
  );
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

const RESULTS = '/cards?q=t:instant c:u';

test('AC-1: card images render at 488:680', async ({ page }) => {
  await page.goto(RESULTS);
  const boxes = await page.locator('.card-grid img').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }),
  );
  expect(boxes.length).toBeGreaterThan(0);
  for (const b of boxes) expect(Math.abs(b.w / b.h / (488 / 680) - 1)).toBeLessThan(0.01);
});

test('AC-2: card images are not cropped or covered', async ({ page }) => {
  await page.goto(RESULTS);
  const styles = await page.locator('.card-grid img').evaluateAll((els) =>
    els.map((e) => ({
      fit: getComputedStyle(e).objectFit,
      overflow: getComputedStyle(e).overflow,
      parent: getComputedStyle(e.parentElement as Element).overflow,
    })),
  );
  expect(styles.length).toBeGreaterThan(0);
  for (const s of styles) {
    expect(s.fit).not.toBe('cover');
    expect(s.overflow).toBe('visible');
    expect(s.parent).toBe('visible');
  }
});

test('AC-3: grid gaps are equal and cards do not overlap', async ({ page }) => {
  await page.goto(RESULTS);
  const gap = await page.locator('.card-grid').evaluate((e) => {
    const s = getComputedStyle(e);
    return { c: s.columnGap, r: s.rowGap };
  });
  expect(gap.c).toBe(gap.r);
  const rects = await page.locator('.card-grid img').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom };
    }),
  );
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      expect(a.r <= b.l + 0.5 || b.r <= a.l + 0.5 || a.b <= b.t + 0.5 || b.b <= a.t + 0.5).toBe(true);
    }
  }
});

test('AC-4: images load from cards.scryfall.io', async ({ page }) => {
  await page.goto(RESULTS);
  const srcs = await page
    .locator('.card-grid img')
    .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src));
  expect(srcs.length).toBeGreaterThan(0);
  for (const s of srcs) expect(new URL(s).hostname).toBe('cards.scryfall.io');
});

for (const width of [390, 1280]) {
  test(`AC-5: no card image overflows horizontally at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(RESULTS);
    const over = await page
      .locator('.card-grid img')
      .evaluateAll(
        (els, w) =>
          els.filter((e) => e.getBoundingClientRect().right > w || e.getBoundingClientRect().left < 0).length,
        width,
      );
    expect(over).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('AC-6: results page has no serious or critical axe violations', async ({ page }) => {
  await page.goto(RESULTS);
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => v.id)).toEqual([]);
});
