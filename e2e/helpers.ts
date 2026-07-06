import type { Page } from '@playwright/test';

/**
 * Wait until the ToolShell island has hydrated — Astro removes the `ssr`
 * attribute when hydration completes. Synthetic events dispatched before that
 * hit a DOM with no React listeners.
 */
export async function waitForIsland(page: Page): Promise<void> {
  await page.waitForSelector('astro-island:not([ssr])');
}
