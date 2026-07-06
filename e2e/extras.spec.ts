import { expect, test, type Page } from '@playwright/test';
import { waitForIsland } from './helpers';

async function addGeneratedImage(page: Page, name: string, size = 512) {
  await waitForIsland(page);
  await page.evaluate(
    async ({ fileName, px }) => {
      const canvas = document.createElement('canvas');
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#d9532f';
      ctx.fillRect(0, 0, px, px);
      const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/png'));
      const dt = new DataTransfer();
      dt.items.add(new File([blob], fileName, { type: 'image/png' }));
      const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { fileName: name, px: size },
  );
}

test('favicon-generator produces the zip pack', async ({ page }) => {
  await page.goto('/favicon-generator/');
  await addGeneratedImage(page, 'logo.png');
  await page.getByRole('button', { name: 'Generate Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 20_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('favicons.zip');
});

test('bulk-image zips the processed batch', async ({ page }) => {
  await page.goto('/bulk-image/');
  await addGeneratedImage(page, 'a.png', 2400);
  await page.getByLabel('Max width (optional)').fill('800');
  await page.getByRole('button', { name: 'Process Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 20_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('1-images.zip');
});
