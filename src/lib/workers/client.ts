import type { OptionValues, ProgressFn, ToolOutput } from '../../tools/types';
import type { WorkerRequest, WorkerResponse } from './protocol';

/** Run a tool's processing in the worker; resolves with the output files. */
export function runTool(
  slug: string,
  files: File[],
  options: OptionValues,
  onProgress: ProgressFn,
): Promise<ToolOutput[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    const finish = (fn: () => void) => {
      worker.terminate();
      fn();
    };
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === 'progress') onProgress(msg.percent);
      else if (msg.type === 'done') finish(() => resolve(msg.outputs));
      else finish(() => reject(new Error(msg.message)));
    };
    worker.onerror = (e) => finish(() => reject(new Error(e.message || 'Worker failed')));
    worker.postMessage({ slug, files, options } satisfies WorkerRequest);
  });
}
