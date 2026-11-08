import { expect, test } from '@playwright/test';

test('bleeding data keeps populations and endpoints separate and sources reachable', async ({
  page,
}) => {
  await page.goto('./#/risk-guide/');
  await expect(page.locator('h1')).toContainText('概率');
  await expect(page.locator('[data-evidence]')).toHaveCount(5);
  await page.getByRole('button', { name: '辅助生殖研究', exact: true }).click();
  await expect(page.locator('[data-evidence]:visible')).toHaveCount(2);
  const fet = page.locator('#hrt-fet');
  await expect(fet).toContainText('149 / 320');
  await expect(fet).toContainText('46.6%');
  await expect(fet).toContainText('持续妊娠');
  await expect(fet).toContainText('不能');
  await fet.getByRole('link', { name: '查看文献记录' }).click();
  await expect(page).toHaveURL(/#\/references\/#dk-hrt-bleeding/);
  await expect(page.locator('#dk-hrt-bleeding .reference-url')).toHaveAttribute(
    'href',
    'https://pubmed.ncbi.nlm.nih.gov/37897214/',
  );
  await page.goBack();
  await page.getByRole('button', { name: '自然受孕研究', exact: true }).click();
  await expect(page.locator('[data-evidence]:visible')).toHaveCount(2);
  await expect(page.locator('#natural-2026')).toContainText('2000–2012');
  await expect(page.locator('#natural-2026')).toContainText('HR 0.89');
  await expect(page.locator('#natural-2026')).not.toContainText('89%');
  await page.reload();
  await expect(page.locator('[data-evidence]:visible')).toHaveCount(5);
});

test('urgent signs expose actions before statistics and preserve an emergency route', async ({
  page,
}) => {
  await page.goto('./#/emergency/');
  await expect(page.locator('[data-warning]')).toHaveCount(9);
  const clot = page.locator('#warning-thrombosis');
  await expect(clot).toContainText('120');
  await expect(clot).toContainText('胸痛');
  await page.getByRole('link', { name: '了解出血与受孕方式的数据' }).click();
  await expect(page.locator('[data-risk-emergency]')).toBeVisible();
  await expect(page.locator('[data-risk-emergency] a[href="tel:120"]')).toBeVisible();
  await page.getByRole('link', { name: '先查看紧急就医信号', exact: true }).click();
  await expect(page.locator('.emergency-intro')).toBeVisible();
});

test('check explanations distinguish purpose, limits and follow up', async ({ page }) => {
  await page.goto('./#/appointments/');
  const nipt = page.locator('#check-nipt');
  await nipt.getByText('检查怎么做，能了解什么？', { exact: false }).click();
  await expect(nipt.locator('[data-explanation]')).toBeVisible();
  await expect(nipt.locator('[data-explanation]')).toContainText('胎盘');
  await expect(nipt.locator('[data-explanation]')).toContainText('不能');
  await expect(nipt.locator('[data-explanation]')).toContainText('检测失败');
  await page.locator('#check-prenatal-diagnosis summary').filter({ hasText: '检查怎么做' }).click();
  await expect(page.locator('#check-prenatal-diagnosis [data-explanation]')).toContainText('有创');
  await page.locator('#check-nipt .appointment-sources a').first().click();
  await expect(page).toHaveURL(/#\/references\/#cn-nipt/);
  await expect(page.locator('#cn-nipt')).toBeVisible();
});

test('research references retain Chinese population and original English language', async ({
  page,
}) => {
  await page.goto('./#/references/');
  await page.getByRole('button', { name: '中国大陆', exact: true }).click();
  await expect(page.locator('#cn-sch-outcomes')).toBeVisible();
  await expect(page.locator('#cn-sch-outcomes .reference-english')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: '其他地区', exact: true }).click();
  await expect(page.locator('#dk-hrt-bleeding')).toBeVisible();
  await expect(page.locator('#cn-sch-outcomes')).toBeHidden();
});

test('palm or sole itching preserves the source instruction to contact maternity care immediately', async ({
  page,
}) => {
  await page.goto('./#/emergency/');
  const warning = page.locator('#warning-itching');
  await expect(warning.locator('.warning-action')).toContainText('立即联系产科');
  await warning.locator('.warning-refs a').click();
  await expect(page.locator('#nhs-itching .reference-url')).toHaveAttribute(
    'href',
    'https://www.nhs.uk/pregnancy/complications/itching-and-intrahepatic-cholestasis/',
  );
});

test('printed warning cards retain the new original source URLs', async ({ page }) => {
  await page.goto('./#/emergency/');
  await page.emulateMedia({ media: 'print' });
  for (const href of [
    'https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/',
    'https://www.nhs.uk/pregnancy/complications/itching-and-intrahepatic-cholestasis/',
    'https://www.nhs.uk/pregnancy/complications/severe-vomiting/',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC4315158/',
  ]) {
    const link = page
      .locator('.source-panel .source-item a')

      .and(page.locator(`a[href="${href}"]`));
    await expect(link).toBeVisible();
    expect(
      await link.evaluate((element) => getComputedStyle(element, '::after').content),
    ).toContain(href);
  }
});
