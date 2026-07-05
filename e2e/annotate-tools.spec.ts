import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

async function makePdf(pages: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([400, 600]);
  return Buffer.from(await doc.save());
}

test('watermark-pdf stamps text across the document', async ({ page }) => {
  await page.goto('/watermark-pdf/');
  await page.locator('input[type="file"]').setInputFiles([{ name: 'doc.pdf', mimeType: 'application/pdf', buffer: await makePdf(2) }]);
  await page.getByLabel('Watermark text').fill('CONFIDENTIAL');
  await page.getByRole('button', { name: 'Watermark Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('doc-watermarked.pdf');
});

test('sign-pdf: draw, place by clicking the preview, download', async ({ page }) => {
  await page.goto('/sign-pdf/');
  await page.locator('input[type="file"]').setInputFiles([{ name: 'contract.pdf', mimeType: 'application/pdf', buffer: await makePdf(1) }]);

  // Draw a stroke on the signature pad.
  const pad = page.getByLabel('Signature pad — draw with your mouse or finger');
  await expect(pad).toBeVisible({ timeout: 15_000 });
  const box = (await pad.boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 90, { steps: 8 });
  await page.mouse.up();

  // Click the page preview to place it.
  const preview = page.getByAltText('Page 1 preview');
  await expect(preview).toBeVisible({ timeout: 15_000 });
  await preview.click({ position: { x: 200, y: 400 } });
  await expect(page.getByAltText('Signature placement')).toBeVisible();

  await page.getByRole('button', { name: 'Sign Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('contract-signed.pdf');
});
