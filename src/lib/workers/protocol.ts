import type { OptionValues, ToolOutput } from '../../tools/types';

/** Typed postMessage protocol between ToolShell and the processing worker. */

export interface WorkerRequest {
  slug: string;
  files: File[];
  options: OptionValues;
}

export type WorkerResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; outputs: ToolOutput[] }
  | { type: 'error'; message: string };
