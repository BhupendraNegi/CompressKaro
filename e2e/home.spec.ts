import { expect, test } from '@playwright/test';

test('search filters the tool grid live', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-tool-card]')).toHaveCount(30);

  await page.getByLabel('Search tools').fill('merge');
  await expect(page.locator('[data-tool-card]:visible')).toHaveCount(1);
  await expect(page.locator('[data-tool-card]:visible')).toContainText('Merge PDF');

  await page.getByLabel('Search tools').fill('zzz-nothing');
  await expect(page.locator('#no-results')).toBeVisible();

  await page.getByLabel('Search tools').fill('');
  await expect(page.locator('[data-tool-card]:visible')).toHaveCount(30);
});

test('theme toggle persists across reloads', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'Switch theme' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('tool cards navigate to live tool pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Merge PDF/ }).first().click();
  await expect(page).toHaveURL(/merge-pdf/);
  await expect(page.locator('h1')).toHaveText('Merge PDF');
  await expect(page.getByText('Drop your files here')).toBeVisible();
});

test('footer links every tool', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer nav a')).toHaveCount(30);
});
