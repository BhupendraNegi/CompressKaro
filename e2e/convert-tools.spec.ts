import { expect, test, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'node:fs/promises';

async function addGeneratedImage(page: Page, name: string) {
  await page.evaluate(async (fileName) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#3366cc';
    ctx.fillRect(0, 0, 800, 600);
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/png'));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], fileName, { type: 'image/png' }));
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, name);
}

async function downloadAfterDone(page: Page) {
  await expect(page.getByText('Ho gaya!')).toBeVisible({ timeout: 20_000 });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  return downloadPromise;
}

test('convert-webp produces a .webp file', async ({ page }) => {
  await page.goto('/convert-webp/');
  await addGeneratedImage(page, 'shot.png');
  await page.getByRole('button', { name: 'Convert Karo →' }).click();
  expect((await downloadAfterDone(page)).suggestedFilename()).toBe('shot.webp');
});

test('resize-image keeps aspect ratio from a single dimension', async ({ page }) => {
  await page.goto('/resize-image/');
  await addGeneratedImage(page, 'photo.png');
  await page.getByLabel('Width').fill('400');
  await page.getByRole('button', { name: 'Resize Karo →' }).click();
  const download = await downloadAfterDone(page);
  expect(download.suggestedFilename()).toBe('photo-resized.png');
});

test('pdf-to-text extracts the drawn text', async ({ page }) => {
  const doc = await PDFDocument.create();
  doc.addPage([300, 400]).drawText('Namaste CompressKaro', { x: 40, y: 350 });
  await page.goto('/pdf-to-text/');
  await page.locator('input[type="file"]').setInputFiles([{ name: 'note.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) }]);
  await page.getByRole('button', { name: 'Extract Karo →' }).click();
  const download = await downloadAfterDone(page);
  expect(download.suggestedFilename()).toBe('note.txt');
  const text = await readFile((await download.path())!, 'utf8');
  expect(text).toContain('Namaste CompressKaro');
});

test('create-pdf works without any file', async ({ page }) => {
  await page.goto('/create-pdf/');
  await page.getByRole('button', { name: /start typing instead/ }).click();
  await page.getByLabel('Your text').fill('Pehla PDF, seedha browser se.');
  await page.getByLabel('Document title').fill('Test Doc');
  await page.getByRole('button', { name: 'Create Karo →' }).click();
  const download = await downloadAfterDone(page);
  expect(download.suggestedFilename()).toBe('Test Doc.pdf');
});
