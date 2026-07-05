import { buildIco } from '../../lib/image/ico';
import { zipBlob } from '../../lib/zip';
import type { ProcessFn } from '../types';

const MANIFEST = {
  name: '',
  short_name: '',
  icons: [
    { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#ffffff',
  background_color: '#ffffff',
  display: 'standalone',
};

const README = `CompressKaro favicon pack
=========================

Drop these files into your site's root, then add to <head>:

<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
`;

/** One square-ish image → every standard favicon size + webmanifest, zipped. */
export const process: ProcessFn = async (files, _options, onProgress) => {
  const bitmap = await createImageBitmap(files[0]);

  const renderPng = async (size: number): Promise<Uint8Array> => {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d')!;
    // Center-crop to square, then scale.
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return new Uint8Array(await blob.arrayBuffer());
  };

  const sizes = [16, 32, 48, 180, 192, 512];
  const pngs: Record<number, Uint8Array> = {};
  for (let i = 0; i < sizes.length; i++) {
    pngs[sizes[i]] = await renderPng(sizes[i]);
    onProgress(Math.round(((i + 1) / (sizes.length + 1)) * 100));
  }
  bitmap.close();

  const blob = zipBlob({
    'favicon.ico': buildIco([16, 32, 48].map((size) => ({ size, bytes: pngs[size] }))),
    'favicon-16x16.png': pngs[16],
    'favicon-32x32.png': pngs[32],
    'favicon-48x48.png': pngs[48],
    'apple-touch-icon.png': pngs[180],
    'android-chrome-192x192.png': pngs[192],
    'android-chrome-512x512.png': pngs[512],
    'site.webmanifest': new TextEncoder().encode(JSON.stringify(MANIFEST, null, 2)),
    'README.txt': new TextEncoder().encode(README),
  });
  onProgress(100);
  return [{ name: 'favicons.zip', blob }];
};
