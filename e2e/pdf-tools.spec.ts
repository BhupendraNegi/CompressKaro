import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'node:fs/promises';

async function makePdf(pages: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`Page ${i + 1}`, { x: 40, y: 350 });
  }
  return Buffer.from(await doc.save());
}

test('split-pdf produces a zip download', async ({ page }) => {
  await page.goto('/split-pdf/');
  await page.locator('input[type="file"]').setInputFiles([{ name: 'report.pdf', mimeType: 'application/pdf', buffer: await makePdf(5) }]);
  await page.getByLabel('Page ranges').fill('1-2, 4');

  await page.getByRole('button', { name: 'Split Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('report-split.zip');
});

test('compress-pdf outputs a valid PDF with the same page count', async ({ page }) => {
  await page.goto('/compress-pdf/');
  await page.locator('input[type="file"]').setInputFiles([{ name: 'doc.pdf', mimeType: 'application/pdf', buffer: await makePdf(3) }]);

  await page.getByRole('button', { name: 'Compress Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 30_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('doc-compressed.pdf');
  const out = await PDFDocument.load(await readFile((await download.path())!));
  expect(out.getPageCount()).toBe(3);
});

test('reorder-pdf renders thumbnails and applies a typed order', async ({ page }) => {
  await page.goto('/reorder-pdf/');
  await page.locator('input[type="file"]').setInputFiles([{ name: 'in.pdf', mimeType: 'application/pdf', buffer: await makePdf(3) }]);

  await expect(page.getByAltText('Page 1')).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('New page order').fill('3, 1, 2');

  await page.getByRole('button', { name: 'Reorder Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('in-reordered.pdf');
});

test('images-to-pdf combines two generated images', async ({ page }) => {
  await page.goto('/images-to-pdf/');
  await page.evaluate(async () => {
    const makeFile = async (name: string): Promise<File> => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#c33';
      ctx.fillRect(0, 0, 640, 480);
      const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', 0.9));
      return new File([blob], name, { type: 'image/jpeg' });
    };
    const dt = new DataTransfer();
    dt.items.add(await makeFile('one.jpg'));
    dt.items.add(await makeFile('two.jpg'));
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await page.getByRole('button', { name: 'Convert Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('images.pdf');
  const out = await PDFDocument.load(await readFile((await download.path())!));
  expect(out.getPageCount()).toBe(2);
});
