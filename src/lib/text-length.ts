/**
 * Counting text for an LED board.
 *
 * `maxLength` on a TextInput counts UTF-16 code units, so a family emoji reads
 * as 11 of the 60 allowed while looking like one character, and a cut can land
 * between the halves of a surrogate pair and produce broken text.
 *
 * The firmware input carries maxlength="60". A browser reads that as 60 UTF-16
 * units, but the board behind it is an ESP with a fixed buffer, so the limit
 * that can actually hurt is bytes. This counts both and clamps on bytes.
 */

export const TEXT_BYTE_LIMIT = 60;

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

/** What a person would call one character, including a ZWJ emoji sequence. */
export function graphemes(text: string): string[] {
  if (segmenter) return Array.from(segmenter.segment(text), (s) => s.segment);
  // Hermes without full Intl still splits surrogate pairs correctly this way.
  return Array.from(text);
}

export function countGraphemes(text: string): number {
  return graphemes(text).length;
}

export function utf8Bytes(text: string): number {
  let n = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0;
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c < 0x10000) n += 3;
    else n += 4;
  }
  return n;
}

export function isPlainAscii(text: string): boolean {
  return utf8Bytes(text) === text.length;
}

/** Trims to the byte limit without ever splitting a character. */
export function clampToBytes(text: string, limit = TEXT_BYTE_LIMIT): string {
  if (utf8Bytes(text) <= limit) return text;
  let out = '';
  let used = 0;
  for (const g of graphemes(text)) {
    const size = utf8Bytes(g);
    if (used + size > limit) break;
    out += g;
    used += size;
  }
  return out;
}
