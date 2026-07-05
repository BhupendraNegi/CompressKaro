import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// PAGES=true is set only by the GitHub Pages deploy workflow — the site is
// served from the /CompressKaro subpath there. Local dev stays path-free.
export default defineConfig({
  output: 'static',
  site: 'https://bhupendranegi.github.io',
  base: process.env.PAGES ? '/CompressKaro' : '/',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
