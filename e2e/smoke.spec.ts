import { expect, test } from '@playwright/test';

test('homepage loads with the brand promise', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/CompressKaro/);
  await expect(page.locator('h1')).toContainText('Free PDF & Image tools.');
  await expect(page.getByText('files never leave your device')).toBeVisible();
});
