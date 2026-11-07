export const MAX_ENTRIES = 200;

/** Unbiased secure random integer in [0, max) */
export function randomInt(max: number): number {
  const range = 0x100000000;
  const limit = range - (range % max);
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

export function randomFloat(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x100000000;
}

/** One entry per non-empty line, capped. */
export function parseEntries(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, MAX_ENTRIES);
}

/** Remove the n-th NON-EMPTY line from the textarea text. */
export function removeEntryAt(text: string, index: number): string {
  let seen = -1;
  return text
    .split(/\r?\n/)
    .filter((line) => {
      if (!line.trim()) return true;
      seen += 1;
      return seen !== index;
    })
    .join("\n");
}

/**
 * Segment i occupies [i*seg, (i+1)*seg] degrees clockwise from 12 o'clock
 * (in the wheel's own frame). The pointer is fixed at 12 o'clock, so after
 * rotating the wheel clockwise by R, the angle under the pointer is (-R mod 360).
 * We need  -R ≡ centerOfWinner  (mod 360).
 */
export function spinTarget(
  currentDeg: number,
  winnerIndex: number,
  count: number,
  extraSpins: number,
): number {
  const seg = 360 / count;
  const jitter = (randomFloat() - 0.5) * seg * 0.7; // stay well inside the slice
  const wanted = winnerIndex * seg + seg / 2 + jitter;
  const delta = (((-wanted - currentDeg) % 360) + 360) % 360;
  return currentDeg + extraSpins * 360 + delta;
}

/** Which segment is under the pointer for a given rotation (used for self-check). */
export function segmentAtPointer(rotationDeg: number, count: number): number {
  const angle = (((-rotationDeg) % 360) + 360) % 360;
  return Math.floor(angle / (360 / count)) % count;
}
