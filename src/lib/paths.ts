/**
 * Base-aware URL prefix. Astro's BASE_URL is "/" locally but "/CompressKaro"
 * (no trailing slash) on the Pages subpath — normalize so `${base}${slug}/`
 * is always correct.
 */
const raw = import.meta.env.BASE_URL;
export const base = raw.endsWith('/') ? raw : `${raw}/`;
