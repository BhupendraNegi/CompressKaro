/** Human-readable file size, matching the design prototype's formatting. */
export function formatSize(bytes: number): string {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

/** Filename without its extension: "report.v2.pdf" → "report.v2". */
export function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}
