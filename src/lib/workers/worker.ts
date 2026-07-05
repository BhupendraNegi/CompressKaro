/// <reference lib="webworker" />
import type { ProcessFn } from '../../tools/types';
import type { WorkerRequest, WorkerResponse } from './protocol';

/**
 * The processing worker. Each live tool registers its process fn here; the
 * static import map lets Vite code-split so a tool's engine only loads when
 * that tool runs.
 */
const processors: Record<string, () => Promise<{ process: ProcessFn }>> = {
  'merge-pdf': () => import('../../tools/merge-pdf/process'),
  'compress-image': () => import('../../tools/compress-image/process'),
  'split-pdf': () => import('../../tools/split-pdf/process'),
  'reorder-pdf': () => import('../../tools/reorder-pdf/process'),
  'compress-pdf': () => import('../../tools/compress-pdf/process'),
  'images-to-pdf': () => import('../../tools/images-to-pdf/process'),
  'rotate-pdf': () => import('../../tools/rotate-pdf/process'),
  'delete-pdf': () => import('../../tools/delete-pdf/process'),
  'extract-pdf': () => import('../../tools/extract-pdf/process'),
  'crop-pdf': () => import('../../tools/crop-pdf/process'),
  'pdf-to-images': () => import('../../tools/pdf-to-images/process'),
  'pdf-to-text': () => import('../../tools/pdf-to-text/process'),
  'create-pdf': () => import('../../tools/create-pdf/process'),
  'convert-image': () => import('../../tools/convert-image/process'),
  'convert-webp': () => import('../../tools/convert-webp/process'),
  'resize-image': () => import('../../tools/resize-image/process'),
  'crop-image': () => import('../../tools/crop-image/process'),
  'rotate-flip-image': () => import('../../tools/rotate-flip-image/process'),
  'strip-exif': () => import('../../tools/strip-exif/process'),
  'sign-pdf': () => import('../../tools/sign-pdf/process'),
  'watermark-pdf': () => import('../../tools/watermark-pdf/process'),
  'page-numbers-pdf': () => import('../../tools/page-numbers-pdf/process'),
  'header-footer-pdf': () => import('../../tools/header-footer-pdf/process'),
  'watermark-image': () => import('../../tools/watermark-image/process'),
  'annotate-pdf': () => import('../../tools/annotate-pdf/process'),
  'protect-pdf': () => import('../../tools/protect-pdf/process'),
  'unlock-pdf': () => import('../../tools/unlock-pdf/process'),
  'pdf-metadata': () => import('../../tools/pdf-metadata/process'),
  'favicon-generator': () => import('../../tools/favicon-generator/process'),
  'bulk-image': () => import('../../tools/bulk-image/process'),
};

const reply = (msg: WorkerResponse) => self.postMessage(msg);

// Failures inside library-internal async chains (e.g. pdfjs's nested-worker
// setup) never reach the request try/catch — surface them instead of dying.
self.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  const reason = e.reason as Error | undefined;
  reply({ type: 'error', message: reason?.message || String(e.reason ?? 'Unhandled failure in processing') });
});
self.addEventListener('error', (e: ErrorEvent) => {
  reply({ type: 'error', message: e.message || 'Unexpected failure in processing' });
});

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { slug, files, options } = e.data;
  try {
    const loader = processors[slug];
    if (!loader) throw new Error(`No processor registered for "${slug}"`);
    const { process } = await loader();
    const outputs = await process(files, options, (percent) => reply({ type: 'progress', percent }));
    reply({ type: 'done', outputs });
  } catch (err) {
    const message = err instanceof Error ? err.message || `${err.name}: ${err.stack?.split('\n')[1]?.trim() ?? 'no detail'}` : String(err);
    reply({ type: 'error', message });
  }
};
