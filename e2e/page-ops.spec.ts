import { expect, test } from '@playwright/test';
import { PDFDocument, degrees } from 'pdf-lib';
import { readFile } from 'node:fs/promises';

async function makePdf(pages: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([300, 400]);
  return Buffer.from(await doc.save());
}

test('rotate-pdf: clicking a thumbnail rotates only that page', async ({ page }) => {
  await page.goto('/rotate-pdf/');
  await page.locator('input[type="file"]').setInputFiles([{ name: 'doc.pdf', mimeType: 'application/pdf', buffer: await makePdf(3) }]);

  // Select page 2 via its thumbnail; the bound text option reflects it.
  await page.getByRole('button', { name: 'Page 2', exact: true }).click({ timeout: 15_000 });
  await expect(page.getByLabel('Pages (optional)')).toHaveValue('2');

  await page.getByRole('button', { name: 'Rotate Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  const download = await downloadPromise;
  const doc = await PDFDocument.load(await readFile((await download.path())!));
  expect(doc.getPage(0).getRotation()).toEqual(degrees(0));
  expect(doc.getPage(1).getRotation()).toEqual(degrees(90));
});

test('delete-pdf: typed selection removes pages', async ({ page }) => {
  await page.goto('/delete-pdf/');
  await page.locator('input[type="file"]').setInputFiles([{ name: 'doc.pdf', mimeType: 'application/pdf', buffer: await makePdf(4) }]);
  await page.getByLabel('Pages to delete').fill('2, 4');

  await page.getByRole('button', { name: 'Delete Karo →' }).click();
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  const doc = await PDFDocument.load(await readFile((await (await downloadPromise).path())!));
  expect(doc.getPageCount()).toBe(2);
});
