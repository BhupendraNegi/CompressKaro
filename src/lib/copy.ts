/**
 * Centralized UI voice (docs/Design-System.md §1). Hinglish is the brand
 * default; keeping every string here makes an English-only switch cheap.
 */
export const copy = {
  dropTitleMulti: 'Drop your files here',
  dropTitleSingle: 'Drop your file here',
  browseHint: 'or tap to browse',
  addMore: '+ Add more',
  skipFile: 'No file? Just start typing instead →',
  reorderHint: 'Drag to reorder — files merge top to bottom.',
  optionsLabel: 'Options',
  actionSuffix: 'Karo',
  processing: 'Ho raha hai…',
  processingNote: 'Working locally on your device — nothing is uploaded.',
  done: 'Ho gaya!',
  doneNoteSingle: 'Your file is ready — entirely on your device.',
  doneNoteMulti: (n: number) => `${n} files processed — entirely on your device.`,
  download: '↓ Download',
  downloadAll: '↓ Download all',
  startOver: 'Start over',
  privacyFootnote: 'Your file was processed locally. Nothing was uploaded.',
  errorTitle: 'Arre, kuch gadbad ho gayi.',
  tryAgain: 'Try again',
};

export const acceptHint = (accept: string): string => {
  if (accept.includes('image')) return 'JPG, PNG, WebP';
  if (accept === '.pdf') return 'PDF files';
  return 'PDF, text or images';
};
