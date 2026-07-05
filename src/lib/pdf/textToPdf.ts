import { PDFDocument, StandardFonts, type PDFFont } from 'pdf-lib';

const SIZES: Record<string, [number, number]> = { A4: [595.28, 841.89], Letter: [612, 792] };
const MARGIN = 54;
const FONT_SIZE = 12;
const LINE_HEIGHT = FONT_SIZE * 1.45;

/** Greedy word-wrap against real glyph widths; hard-splits over-long words. */
export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = word;
      while (font.widthOfTextAtSize(line, size) > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > maxWidth) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Build a paginated PDF from plain text. */
export async function buildTextPdf(text: string, title: string, pageSize: string): Promise<Uint8Array> {
  const [w, h] = SIZES[pageSize] ?? SIZES.A4;
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const lines = wrapText(text, font, FONT_SIZE, w - MARGIN * 2);

  const perPage = Math.floor((h - MARGIN * 2) / LINE_HEIGHT);
  for (let start = 0; start < Math.max(lines.length, 1); start += perPage) {
    const page = doc.addPage([w, h]);
    lines.slice(start, start + perPage).forEach((line, i) => {
      if (line) page.drawText(line, { x: MARGIN, y: h - MARGIN - (i + 1) * LINE_HEIGHT, size: FONT_SIZE, font });
    });
  }
  return doc.save();
}
