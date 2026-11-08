import { expect, test } from '@playwright/test';

test('suggested food mode combines filters, shows preparation conditions and resets', async ({
  page,
}) => {
  await page.goto('./#/food-guide/');
  await page.getByRole('button', { name: '建议食物', exact: true }).click();
  await expect(page.getByRole('button', { name: '建议食物', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('[data-food-card]:visible')).toHaveCount(18);
  await expect(page.locator('#recommended-food-note')).toBeVisible();
  await page.locator('#food-search').fill('三文鱼');
  const salmon = page.locator('[data-food-card]:visible');
  await expect(salmon).toHaveCount(1);
  await expect(salmon).toContainText('充分熟制');
  await expect(salmon).toContainText('油性鱼');
  await expect(salmon.locator('[data-general-copy]').first()).toBeHidden();
  await page.getByRole('button', { name: '建议避免', exact: true }).click();
  await expect(page.locator('#food-empty')).toBeVisible();
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(page.locator('[data-food-card]:visible')).toHaveCount(60);
  await expect(page.locator('#recommended-food-note')).toBeHidden();
  await expect(page.getByRole('button', { name: '全部速查', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('suggested foods preserve detail links, mobile layout and keyboard activation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./#/food-guide/');
  const button = page.getByRole('button', { name: '建议食物', exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-food-card]:visible')).toHaveCount(18);
  await page.getByRole('button', { name: '蛋奶豆类', exact: true }).click();
  await expect(page.locator('[data-food-card]:visible')).toHaveCount(4);
  await page.locator('#food-search').fill('水煮蛋');
  await expect(page.locator('[data-food-card]:visible')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('[data-food-card]:visible a').click();
  await expect(page).toHaveURL(/#\/food-guide\/eggs\//);
  await expect(page.locator('h1')).toHaveText('鸡蛋');
  await expect(page.locator('main')).toContainText('全熟蛋');
});
