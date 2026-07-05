/** Map raw processing errors to friendly, actionable copy (spec: friendly error states). */
export function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('encrypted') || m.includes('password')) {
    return 'This PDF is password-protected. Remove the password with the Unlock PDF tool first.';
  }
  if (m.includes('parse') || m.includes('invalid pdf') || m.includes('no pdf header') || m.includes('corrupt')) {
    return 'This file appears to be damaged or isn’t a valid file of the expected type. Try re-exporting it.';
  }
  if (m.includes('memory') || m.includes('allocation')) {
    return 'This file is too large for your device’s memory. Try a smaller file or a device with more RAM.';
  }
  if (m.includes('decode') || m.includes('image')) {
    return 'This image couldn’t be read. Make sure it’s a valid JPG, PNG or WebP file.';
  }
  return `Something went wrong while processing: ${message}`;
}
