import { expect, test } from '@playwright/test';

test('dropping a wrong file type shows a friendly notice, not a crash', async ({ page }) => {
  await page.goto('/merge-pdf/');
  // Astro drops the ssr attribute once the island hydrates — only then do the
  // React drop listeners exist.
  await page.waitForSelector('astro-island:not([ssr])');
  // Drag-and-drop bypasses the input accept filter — simulate via DataTransfer.
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['not a pdf'], 'notes.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    const dropzone = document.querySelector<HTMLElement>('[role="button"]')!;
    dropzone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await expect(page.getByRole('status')).toContainText('isn’t supported here');
  // Still on the empty phase, ready to accept a correct file.
  await expect(page.getByText('Drop your files here')).toBeVisible();
});

test('tool pages show the ad slot placeholder', async ({ page }) => {
  await page.goto('/compress-image/');
  await expect(page.getByLabel('Advertisement')).toBeVisible();
});
