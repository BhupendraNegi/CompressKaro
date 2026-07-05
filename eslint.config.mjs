import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default tseslint.config(
  { ignores: ['dist/', '.astro/', 'node_modules/', 'playwright-report/'] },
  // Node-run config files at the repo root (astro.config.mjs, etc.)
  { files: ['*.mjs', '*.ts'], languageOptions: { globals: { process: 'readonly' } } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
);
