import { expect, test } from '@playwright/test';
import { statSync } from 'node:fs';

/** Draw noisy content on a canvas in-page and feed it to the file input. */
async function addGeneratedPhoto(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = Math.random() * 255;
      img.data[i + 1] = Math.random() * 255;
      img.data[i + 2] = Math.random() * 255;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', 1));
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

test('compresses a photo to under the target KB', async ({ page }) => {
  await page.goto('/compress-image/');
  await addGeneratedPhoto(page);
  await expect(page.getByText('1 file', { exact: false })).toBeVisible();

  await page.getByLabel('Target size (optional)').fill('50');

  await page.getByRole('button', { name: 'Compress Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('photo-compressed.jpg')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('photo-compressed.jpg');
  expect(statSync((await download.path())!).size).toBeLessThanOrEqual(50 * 1024);
});
