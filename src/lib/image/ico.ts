/**
 * Build a .ico container from PNG images (modern parsers accept PNG-encoded
 * entries). Little-endian: 6-byte header, one 16-byte directory entry per
 * image, then the PNG payloads.
 */
export function buildIco(images: { size: number; bytes: Uint8Array }[]): Uint8Array {
  const headerSize = 6 + images.length * 16;
  const total = headerSize + images.reduce((s, i) => s + i.bytes.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);

  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, images.length, true);

  let offset = headerSize;
  images.forEach((img, i) => {
    const entry = 6 + i * 16;
    out[entry] = img.size >= 256 ? 0 : img.size; // width (0 = 256)
    out[entry + 1] = img.size >= 256 ? 0 : img.size; // height
    out[entry + 2] = 0; // palette colors
    out[entry + 3] = 0; // reserved
    view.setUint16(entry + 4, 1, true); // planes
    view.setUint16(entry + 6, 32, true); // bits per pixel
    view.setUint32(entry + 8, img.bytes.length, true);
    view.setUint32(entry + 12, offset, true);
    out.set(img.bytes, offset);
    offset += img.bytes.length;
  });

  return out;
}
