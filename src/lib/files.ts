/** Human-readable file size, matching the design prototype's formatting. */
export function formatSize(bytes: number): string {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

/** Filename without its extension: "report.v2.pdf" → "report.v2". */
export function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

/**
 * Does a file satisfy an accept string like ".pdf", "image/*" or ".txt,.md"?
 * Drag-and-drop bypasses the input's accept filter, so we re-check ourselves.
 */
export function matchesAccept(file: File, accept: string): boolean {
  return accept.split(',').some((raw) => {
    const token = raw.trim().toLowerCase();
    if (!token) return false;
    if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
    if (token.endsWith('/*')) return file.type.toLowerCase().startsWith(token.slice(0, -1));
    return file.type.toLowerCase() === token;
  });
}

/** Soft memory guardrail — everything runs in browser RAM. */
export const SOFT_SIZE_LIMIT = 100 * 1024 * 1024;
