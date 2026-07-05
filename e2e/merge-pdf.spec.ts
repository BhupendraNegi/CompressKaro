import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

async function makePdf(pages: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`Page ${i + 1}`, { x: 40, y: 350 });
  }
  return Buffer.from(await doc.save());
}

test('merges two PDFs into one download with all pages', async ({ page }) => {
  await page.goto('/merge-pdf/');

  await page.locator('input[type="file"]').setInputFiles([
    { name: 'first.pdf', mimeType: 'application/pdf', buffer: await makePdf(2) },
    { name: 'second.pdf', mimeType: 'application/pdf', buffer: await makePdf(3) },
  ]);

  await expect(page.getByText('2 files')).toBeVisible();

  await page.getByRole('button', { name: 'Merge Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('merged.pdf')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('merged.pdf');
  const path = (await download.path())!;
  const bytes = await import('node:fs/promises').then((fs) => fs.readFile(path));
  const merged = await PDFDocument.load(bytes);
  expect(merged.getPageCount()).toBe(5);
});

test('shows a friendly error for a corrupt PDF', async ({ page }) => {
  await page.goto('/merge-pdf/');
  await page.locator('input[type="file"]').setInputFiles([
    { name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('this is not a pdf at all') },
    { name: 'also-broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('nope') },
  ]);
  await page.getByRole('button', { name: 'Merge Karo →' }).click();
  await expect(page.getByText('Arre, kuch gadbad ho gayi.')).toBeVisible({ timeout: 15_000 });
});
